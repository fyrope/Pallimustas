    function applyWeaponAfflictionEffects(character, item, selectedTargetId) {
      const effects = item.afflictionEffects || [];
      const invalidEffect = effects.find((effect) => !isValidWeaponAfflictionEffect(effect));
      if (invalidEffect) {
        console.error(`Invalid weapon affliction configured for ${item.name}.`, invalidEffect);
        notify(`${item.name} has an invalid affliction configuration. Check the code.`);
        return null;
      }
      if (effects.some((effect) => ["selected", "wielder-and-selected"].includes(effect.target)) &&
          !characterById(selectedTargetId)) {
        notify(`Choose a valid party target for ${item.name}.`);
        return null;
      }

      const appliedAfflictions = [];
      for (const effect of effects) {
        const recipients = effect.target === "wielder"
          ? [character.id]
          : effect.target === "selected"
            ? [selectedTargetId]
            : [...new Set([character.id, selectedTargetId])];
        for (const recipientId of recipients) {
          applyConfiguredAfflictionEffect(
            character,
            item,
            { ...effect, target: "self" },
            recipientId,
            effect.stacks || 1
          );
          appliedAfflictions.push(`${AFFLICTION_GLOSSARY[effect.afflictionId].name} → ${characterById(recipientId).name}`);
        }
      }
      return appliedAfflictions;
    }

    function attackWithEquipment(itemId, attackId, selectedTargetId = null) {
      const character = getSelectedCharacter();
      const item = (character.equipment || []).find((entry) => entry.id === itemId && entry.type === "weapon");
      if (!item || !state.characters[character.id].equippedEquipment?.includes(item.id)) return;
      const attack = equipmentAttacks(item).find((entry) => entry.id === attackId);
      const result = attack && equipmentAttackResult(character, item, attack);
      if (!attack || !isValidAttackConfiguration(character, item, attack) || !result) {
        console.error(`Invalid weapon attack configuration for ${character.name}'s ${item.name}.`, attack);
        notify(`${item.name} has an invalid attack stat, damage formula, or damage multiplier configuration. Check the code.`);
        return;
      }
      const afflictions = applyWeaponAfflictionEffects(character, item, selectedTargetId);
      if (afflictions === null) return;
      const damageSummary = equipmentAttackSummary(character, item, attack);
      state.equipmentAttackLog ??= [];
      state.equipmentAttackLog.push({
        characterId: character.id,
        equipmentId: item.id,
        attackId: attack.id,
        turn: state.turn,
        damageSummary
      });
      state.equipmentAttackLog = state.equipmentAttackLog.slice(-10);
      saveCampaign();
      render();
      notify(`${character.name} uses ${attack.name} with ${item.name} — ${damageSummary}.${afflictions.length ? ` ${afflictions.join("; ")}.` : ""}`);
    }

    function attackWithAbility(abilityId, attackId) {
      const character = getSelectedCharacter();
      const ability = allCharacterAbilities(character).find((entry) => entry.id === abilityId);
      if (!ability || !abilityHasAnyTag(ability, ["attack"])) return;
      const selectedAbility = selectedAbilityFor(character, ability);
      const attack = abilityAttacks(selectedAbility).find((entry) => entry.id === attackId);
      if (!attack || !isValidAttackConfiguration(character, selectedAbility, attack)) {
        console.error(`Invalid ability attack configuration for ${character.name}'s ${ability.name}.`, attack);
        notify(`${ability.name} has an invalid attack stat or damage formula. Check the code.`);
        return;
      }
      const damageSummary = equipmentAttackSummary(character, selectedAbility, attack);
      notify(`${character.name} attacks with ${ability.name} (${attack.name}) — ${damageSummary}.`);
    }

    function endTurn() {
      const activeOrder = getTurnOrder();
      if (!activeOrder.length) { notify("Mark at least one player as attending before starting the session."); return; }
      if (!activeOrder.every((player) => Number.isSafeInteger(state.initiativeScores?.[player.id]))) {
        notify("Enter an initiative roll for every attending player before ending turns."); return;
      }
      const character = getCurrentCharacter();
      const progress = state.characters[character.id];
      let manaTideEnded = false;
      // Recovery is capped at each character's configured maximum; no resource can overflow.
      progress.resources.mana = Math.min(character.resources.mana, progress.resources.mana + Math.round(effectiveRecovery(character, "manaRecovery")));
      progress.resources.stamina = Math.min(getResourceMaximum(character, "stamina"), progress.resources.stamina + effectiveRecovery(character, "staminaRecovery"));
      recoverFromAfflictions(character);
      const deactivatedAbilities = [];
      for (const ability of allCharacterAbilities(character)) {
        for (const configuration of [ability, ...(ability.variants || [])]) {
          if (configuration.activeMode !== "toggle") continue;
          const stateKey = abilityStateKey(ability, configuration === ability ? null : configuration);
          if (!progress.activeAbilities?.[stateKey]) continue;
          if (!isValidAbilityUpkeep(configuration)) {
            console.error(`Invalid upkeep configured for ${character.name}'s ${ability.name}.`, configuration.upkeep);
            progress.activeAbilities[stateKey] = false;
            deactivatedAbilities.push(`${ability.name} (invalid upkeep)`);
            continue;
          }
          const upkeepCosts = Object.entries(configuration.upkeep || {})
            .filter(([, amount]) => amount > 0)
            .map(([resource, amount]) => ({
              resource,
              ...getEffectiveAbilityUpkeep(character, resource, amount, {
                ...ability,
                ...configuration,
                tags: [...new Set([...(ability.tags || []), ...(configuration.tags || [])])]
              })
            }));
          const unaffordable = upkeepCosts.find((cost) => progress.resources[cost.resource] < cost.cost);
          if (unaffordable) {
            progress.activeAbilities[stateKey] = false;
            deactivatedAbilities.push(`${ability.name} (not enough ${unaffordable.resource})`);
            continue;
          }
          for (const cost of upkeepCosts) {
            progress.resources[cost.resource] -= cost.cost;
            if (cost.resource === "mana") recordManaSpent(character.id, cost.cost);
          }
        }
      }
      for (const ability of allCharacterAbilities(character)) {
        if (progress.crystals?.[ability.id]) {
          progress.crystals[ability.id] = progress.crystals[ability.id].map((crystal) => ({
            ...crystal,
            disabledTurns: Math.max(0, crystal.disabledTurns - 1)
          }));
        }
        const configurations = [ability, ...(ability.variants || [])];
        for (const configuration of configurations) {
          if (isPassiveConfiguration(configuration)) continue;
          const stateKey = abilityStateKey(ability, configuration === ability ? null : configuration);
          if (progress.chargeRecharges?.[stateKey]?.length) {
            progress.chargeRecharges[stateKey] = progress.chargeRecharges[stateKey]
              .map((turns) => turns - 1)
              .filter((turns) => turns > 0);
          }
          if (progress.activeTurns[stateKey] > 0) {
            progress.activeTurns[stateKey] -= 1;
            continue;
          }
          progress.cooldowns[stateKey] = Math.max(0, (progress.cooldowns[stateKey] || 0) - 1);
        }
      }
      progress.abilityUsesThisTurn = Object.fromEntries(
        allCharacterAbilities(character).map((ability) => [ability.id, 0])
      );
      progress.afflictionApplicationsThisTurn = {};
      state.activeStatEffects = state.activeStatEffects.flatMap((effect) => {
        if (effect.targetCharacterId !== character.id) return [effect];
        return effect.remainingTurns > 1
          ? [{ ...effect, remainingTurns: effect.remainingTurns - 1 }]
          : [];
      });
      state.activeAfflictions = state.activeAfflictions.flatMap((entry) => {
        if (entry.characterId !== character.id || entry.remainingTurns === null) return [entry];
        return entry.remainingTurns > 1
          ? [{ ...entry, remainingTurns: entry.remainingTurns - 1 }]
          : [];
      });
      state.turnIndex = (state.turnIndex + 1) % activeOrder.length;
      // Round counter advances only after every attending player has taken a turn.
      if (state.turnIndex === 0) {
        state.turn += 1;
        if (state.manaTide?.active) {
          const configured = manaTideAbility()?.ability.manaTide;
          if (!isValidManaTideConfiguration(configured) || state.manaTide.roundsElapsed + 1 >= configured.durationRounds) {
            state.manaTide.active = false;
            manaTideEnded = true;
          } else {
            state.manaTide.roundsElapsed += 1;
          }
        }
      }
      saveCampaign();
      render();
      notify(`${character.name}'s turn ended. Resources recovered and cooldowns reduced.${deactivatedAbilities.length ? ` Turned off: ${deactivatedAbilities.join(", ")}.` : ""}${manaTideEnded ? " Mana Tide has ended." : ""}`);
    }

    function equipmentAttacks(item) {
      if (Array.isArray(item.attacks) && item.attacks.length) {
        return item.attacks.filter((attack) => attack && typeof attack === "object").map((attack, index) => ({
          ...attack,
          id: typeof attack.id === "string" && attack.id ? attack.id : `attack-${index + 1}`,
          name: typeof attack.name === "string" && attack.name ? attack.name : `Attack ${index + 1}`,
          stats: attack.stats !== undefined
            ? attack.stats
            : [typeof attack.stat === "string" && attack.stat ? attack.stat : item.stat || "physicalAttack"],
          modifier: attack.modifier ?? item.modifier ?? ""
        }));
      }
      return [{
        id: "default",
        name: "Attack",
        stats: item.attackStats !== undefined
          ? item.attackStats
          : [typeof item.stat === "string" && item.stat ? item.stat : "physicalAttack"],
        modifier: item.modifier ?? item.attack ?? ""
      }];
    }

    function abilityAttacks(ability) {
      if (!abilityHasAnyTag(ability, ["attack"])) return [];
      return equipmentAttacks(ability);
    }

    function equipmentAttackResult(character, item, attack) {
      const multiplier = attack.damageMultiplier ?? item.damageMultiplier ?? 1;
      if (!Number.isFinite(multiplier) || multiplier <= 0) return null;
      const stats = attack.stats === undefined ? [attack.stat] : attack.stats;
      if (!Array.isArray(stats) || !stats.length || stats.some((stat) => typeof stat !== "string" || !Object.hasOwn(character.stats, stat))) return null;
      const statMode = attack.statMode ?? attack.statmode;
      if (statMode !== undefined && statMode !== "highest") return null;

      const configuredDieSides = attack.damageDieSides ?? item.damageDieSides;
      const transformDice = configuredDieSides !== undefined;
      const hasWeaponModifier = attack.modifier !== undefined && attack.modifier !== null && String(attack.modifier).trim() !== "";
      const rawWeaponFormula = hasWeaponModifier ? parseDiceFormula(attack.modifier) : { dice: new Map(), flat: 0 };
      if (!rawWeaponFormula) return null;
      const statFormulas = [];
      for (const stat of stats) {
        const rawStatFormula = parseDiceFormula(character.stats[stat]);
        const statFormula = rawStatFormula && transformDice
          ? changeDiceSides(rawStatFormula, configuredDieSides)
          : rawStatFormula;
        if (!statFormula) return null;
        const totalStatFormula = { dice: new Map(statFormula.dice), flat: statFormula.flat };
        for (const modifier of getStatModifiers(character, stat, false)) {
          const rawModifier = parseDiceFormula(modifier.bonus);
          const parsed = rawModifier && transformDice
            ? changeDiceSides(rawModifier, configuredDieSides)
            : rawModifier;
          if (!parsed) return null;
          for (const [sides, count] of parsed.dice) {
            totalStatFormula.dice.set(sides, (totalStatFormula.dice.get(sides) || 0) + count);
          }
          totalStatFormula.flat += parsed.flat;
        }
        statFormulas.push({ stat, formula: totalStatFormula });
      }
      const selectedStatFormulas = statMode === "highest"
        ? [statFormulas.reduce((highest, current) =>
          expectedDiceFormulaValue(current.formula) > expectedDiceFormulaValue(highest.formula)
            ? current
            : highest
        )]
        : statFormulas;
      const totalStatFormula = { dice: new Map(), flat: 0 };
      for (const { formula } of selectedStatFormulas) {
        for (const [sides, count] of formula.dice) {
          totalStatFormula.dice.set(sides, (totalStatFormula.dice.get(sides) || 0) + count);
        }
        totalStatFormula.flat += formula.flat;
      }
      const weaponFormula = transformDice ? changeDiceSides(rawWeaponFormula, configuredDieSides) : rawWeaponFormula;
      if (!weaponFormula) return null;
      const scaled = { dice: new Map(), flat: 0 };
      for (const [sides, count] of totalStatFormula.dice) {
        scaled.dice.set(sides, Math.ceil(count * multiplier - Number.EPSILON * Math.abs(count * multiplier) * 4));
      }
      scaled.flat = Math.ceil(totalStatFormula.flat * multiplier - Number.EPSILON * Math.abs(totalStatFormula.flat * multiplier) * 4);
      for (const [sides, count] of weaponFormula.dice) {
        scaled.dice.set(sides, (scaled.dice.get(sides) || 0) + count);
      }
      scaled.flat += weaponFormula.flat;

      return {
        amount: formatDiceFormula(scaled),
        weaponModifier: hasWeaponModifier ? formatDiceFormula(weaponFormula) : "",
        selectedStats: selectedStatFormulas.map(({ stat }) => stat)
      };
    }

    function statDisplayName(stat) {
      return stat.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)
        .replace(/^./, (letter) => letter.toUpperCase());
    }

    function equipmentAttackSummary(character, item, attack) {
      const result = equipmentAttackResult(character, item, attack);
      if (!result) return "Invalid damage formula";
      const highestStat = (attack.statMode ?? attack.statmode) === "highest"
        ? `highest stat: ${result.selectedStats.map(statDisplayName).join(", ")} · `
        : "";
      const modifier = result.weaponModifier
        ? ` (includes ${item.name} ${result.weaponModifier})`
        : "";
      return `${highestStat}${result.amount}${modifier}`;
    }
    function useAbility(abilityId, suppliedValues = {}) {
      const character = getSelectedCharacter();
      const progress = state.characters[character.id];
      const configuredAbility = allCharacterAbilities(character).find((entry) => entry.id === abilityId);
      if (!configuredAbility) return;
      const ability = selectedAbilityFor(character, configuredAbility);
      if (isPassiveConfiguration(ability) && !abilityHasAnyTag(ability, ["Summon", "Familiar"])) return;
      if (ability.crystalSummon && (
        !Number.isSafeInteger(ability.crystalSummon.max) ||
        ability.crystalSummon.max < 1 ||
        !Number.isSafeInteger(ability.crystalSummon.disableTurns) ||
        ability.crystalSummon.disableTurns < 1
      )) {
        console.error(`Invalid crystal summon configuration for ${character.name}'s ${ability.name}.`, ability.crystalSummon);
        notify(`${ability.name} has an invalid crystal configuration. Check the code.`);
        return;
      }
      if (hasUnlockedPotential(character) && hasNegativeCastingResource(character)) {
        notify("Too exhausted to cast: mana and stamina must be nonnegative.");
        return false;
      }
      if (ability.manaTide && state.manaTide?.active) return;
      if (ability.manaTide && !isValidManaTideConfiguration(ability.manaTide)) {
        console.error(`Invalid Mana Tide configuration for ${character.name}.`, ability.manaTide);
        notify("Mana Tide has an invalid configuration. Check the code.");
        return;
      }
      const toggleable = ability.activeMode === "toggle";
      const invalidEffect = (ability.statEffects || []).find((effect) => !isValidStatEffect(effect, character, toggleable));
      if (invalidEffect) {
        console.error(`Invalid stat effect configured for ${character.name}'s ${ability.name}.`, invalidEffect);
        notify(`${ability.name} has an invalid stat effect configuration. Check the code.`);
        return;
      }
      if (toggleable && !isValidAbilityUpkeep(ability)) {
        console.error(`Invalid upkeep configured for ${character.name}'s ${ability.name}.`, ability.upkeep);
        notify(`${ability.name} has an invalid upkeep configuration. Check the code.`);
        return;
      }
      const resourceEffects = ability.resourceEffects || [];
      const validResources = ["health", "mana", "stamina"];
      const invalidResourceEffect = resourceEffects.find((effect) =>
        !effect ||
        typeof effect.id !== "string" ||
        !effect.id.trim() ||
        !validResources.includes(effect.resource) ||
        !(isConfigurableAbilityValue(effect.amount) || Number.isSafeInteger(effect.amount)) ||
        !["self", "party", "others", "tagged", "self-and-tagged"].includes(effect.target) ||
        (["tagged", "self-and-tagged"].includes(effect.target) &&
          (!Array.isArray(effect.tags) || !effect.tags.length || !effect.tags.every((tag) => typeof tag === "string" && tag.trim())))
      );
      if (invalidResourceEffect) {
        console.error(`Invalid resource effect configured for ${character.name}'s ${ability.name}.`, invalidResourceEffect);
        notify(`${ability.name} has an invalid resource effect configuration. Check the code.`);
        return;
      }
      const invalidAfflictionEffect = (ability.afflictionEffects || []).find((effect) =>
        !isValidAfflictionEffect(effect) ||
        (effect.stacksFromInput && !(ability.inputFields || []).some((field) => field.id === effect.stacksFromInput.field)) ||
        (effect.trigger === "resourceChange" && !resourceEffects.some((resourceEffect) => resourceEffect.id === effect.resourceEffectId))
      );
      if (invalidAfflictionEffect) {
        console.error(`Invalid affliction effect configured for ${character.name}'s ${ability.name}.`, invalidAfflictionEffect);
        notify(`${ability.name} has an invalid affliction effect configuration. Check the code.`);
        return;
      };
      const isRacialGift = (character.racialGifts || []).some((gift) => gift.id === abilityId);
      const stateKey = abilityStateKey(configuredAbility, ability.id === configuredAbility.id ? null : ability);
      if (toggleable && progress.activeAbilities?.[stateKey]) return;
      const crystals = ability.crystalSummon ? progress.crystals?.[configuredAbility.id] || [] : [];
      if (ability.crystalSummon && crystals.length >= ability.crystalSummon.max) {
        notify(`You can have at most ${ability.crystalSummon.max} mana crystals at a time.`);
        return;
      }
      const chargeRecharges = progress.chargeRecharges?.[stateKey] || [];
      const hasCharges = Number.isInteger(ability.charges) && ability.charges > 0 &&
        Number.isInteger(ability.recharge) && ability.recharge > 0;
      const usesPerTurn = Number.isInteger(ability.usesPerTurn) && ability.usesPerTurn > 0
        ? ability.usesPerTurn
        : 1;
      if (
        (progress.abilityUsesThisTurn?.[abilityId] || 0) >= usesPerTurn ||
        (progress.cooldowns[stateKey] || 0) > 0 ||
        (progress.activeTurns[stateKey] || 0) > 0 ||
        (hasCharges && chargeRecharges.length >= ability.charges)
      ) return;
      const manaCost = ability.mana;
      const staminaCost = ability.stamina;
      const configurableFields = configurableAbilityFields(ability, isRacialGift);
      if (configurableFields.some((field) => !Object.hasOwn(suppliedValues, field))) {
        showAbilityCostForm(abilityId, ability.name, configurableFields, ability);
        return false;
      }
      const invalidPlayerSelection = (ability.afflictionEffects || []).find((effect) => {
        if (effect.selectPlayers !== true) return false;

        const selected = suppliedValues[`targetPlayers:${effect.id}`];

        return !Array.isArray(selected) ||
          selected.length === 0 ||
          selected.some((id) => !CHARACTERS.some((player) => player.id === id));
      });

      if (invalidPlayerSelection) {
        notify("Choose at least one valid player.");
        return false;
      }
      const invalidInput = (ability.inputFields || []).find((field) =>
        !field ||
        typeof field.id !== "string" ||
        !field.id.trim() ||
        typeof field.label !== "string" ||
        !field.label.trim() ||
        (field.min !== undefined && !Number.isSafeInteger(field.min)) ||
        !Number.isSafeInteger(suppliedValues[`input:${field.id}`]) ||
        suppliedValues[`input:${field.id}`] < (field.min ?? 0)
      );
      if (invalidInput) {
        console.error(`Invalid input field value configured for ${character.name}'s ${ability.name}.`, invalidInput);
        notify("Enter valid whole-number values for this ability.");
        return false;
      }
      const resolvedResourceEffects = resourceEffects.map((effect) => ({
        ...effect,
        amount: isConfigurableAbilityValue(effect.amount)
          ? suppliedValues[`resourceEffect:${effect.id}`]
          : effect.amount
      }));
      if (resolvedResourceEffects.some((effect) => !Number.isSafeInteger(effect.amount))) {
        notify("Resource changes must be whole numbers.");
        return false;
      }
      const baseCosts = {
        mana: isConfigurableAbilityValue(manaCost) ? suppliedValues.mana : manaCost ?? 0,
        stamina: isConfigurableAbilityValue(staminaCost) ? suppliedValues.stamina : staminaCost ?? 0
      };
      const resolvedValues = {
        mana: getEffectiveAbilityCost(character, "mana", baseCosts.mana, ability).cost,
        stamina: getEffectiveAbilityCost(character, "stamina", baseCosts.stamina, ability).cost,
        cooldown: getEnhancedAbilityCooldown(character, configuredAbility, ability, isConfigurableAbilityValue(ability.cooldown) ? suppliedValues.cooldown : ability.cooldown ?? 0)
      };
      if (Object.values(resolvedValues).some((value) => !Number.isSafeInteger(value) || value < 0)) {
        notify("Mana, stamina, and cooldown values must be whole numbers of zero or more.");
        return false;
      }
      if (!canPayAbilityResources(character, resolvedValues, resolvedResourceEffects)) {
        notify("Not enough mana or stamina for those configured costs.");
        return false;
      }

      progress.resources.mana -= resolvedValues.mana;
      progress.resources.stamina -= resolvedValues.stamina;
      recordManaSpent(character.id, resolvedValues.mana);
      progress.activeTurns[stateKey] = Math.max(0, ability.duration || 0);
      if (hasCharges) {
        progress.chargeRecharges ??= {};
        progress.chargeRecharges[stateKey] ??= [];
        const rechargeReduction = (ability.enhancements || []).reduce((total, enhancement) => total + ( Number.isSafeInteger(enhancement?.rechargeReduction) && enhancement.rechargeReduction > 0 ? enhancement.rechargeReduction : 0 ), 0 );
        progress.chargeRecharges[stateKey].push(Math.max(1, ability.recharge - rechargeReduction));
      }
      if (ability.crystalSummon) {
        progress.crystals ??= {};
        progress.crystals[configuredAbility.id] ??= [];
        state.crystalSequence += 1;
        progress.crystals[configuredAbility.id].push({
          id: `mana-crystal-${state.crystalSequence}`,
          disabledTurns: 0
        });
      }
      if (abilityHasAnyTag(ability, ["Summon"])) {
        progress.summons ??= [];
        const count = Number.isSafeInteger(ability.summonCount) && ability.summonCount > 0 ? ability.summonCount : 1;
        for (let index = 0; index < count; index += 1) {
          state.summonSequence = (state.summonSequence || 0) + 1;
          progress.summons.push({
            id: `summon-${state.summonSequence}`,
            abilityId: configuredAbility.id,
            name: count > 1 ? `${ability.name} ${index + 1}` : ability.name,
            health: 0,
            maxHealth: 0
          });
        }
      }
      if (ability.orbSummon) {
        progress.burningOrbs = Array.from({ length: ability.orbSummon.max }, (_, index) => ({ id: `burning-orb-${index + 1}` }));
      }
      if (ability.shieldTarget) {
        const targetId = ability.shieldTarget === "self" ? character.id : (suppliedValues.shieldTarget || character.id);
        if (!characterById(targetId)) { notify("Choose a valid character to receive the shield."); return false; }
        const targetProgress = state.characters[targetId];
        targetProgress.shields ??= [];
        targetProgress.shields = targetProgress.shields.filter((entry) => entry.abilityId !== configuredAbility.id);
        targetProgress.shields.push({ id: `shield-${character.id}-${configuredAbility.id}`, abilityId: configuredAbility.id, name: ability.name, targetCharacterId: targetId });
      }
      const resourceChanges = [];
      for (const effect of resolvedResourceEffects) {
        for (const targetCharacterId of statEffectTargets(effect, character)) {
          const targetCharacter = characterById(targetCharacterId);
          const targetResources = state.characters[targetCharacterId].resources;
          const previousAmount = targetResources[effect.resource];
          targetResources[effect.resource] = Math.max(
            minimumResourceValue(targetCharacter, effect.resource),
            Math.min(
              getResourceMaximum(targetCharacter, effect.resource),
              previousAmount + effect.amount
            )
          );
          const actualChange = targetResources[effect.resource] - previousAmount;
          resourceChanges.push({
            resourceEffectId: effect.id,
            resource: effect.resource,
            targetCharacterId,
            amount: actualChange
          });
          if (effect.resource === "mana" && targetResources.mana < previousAmount) {
            recordManaSpent(targetCharacterId, previousAmount - targetResources.mana);
          }
        }
      }
      for (const effect of ability.afflictionEffects || []) {
        const matchingChanges = effect.trigger === "resourceChange"
          ? resourceChanges.filter((change) =>
            change.resourceEffectId === effect.resourceEffectId &&
            (effect.condition === "increase" ? change.amount > 0 : change.amount < 0)
          )
          : [null];
        for (const change of matchingChanges) {
          let stacks = effect.stacks || 1;
          if (effect.stacksFromInput) {
            stacks = Math.floor(
              suppliedValues[`input:${effect.stacksFromInput.field}`] / effect.stacksFromInput.divisor
            );
          }
          if (change && effect.stacksFromPercentageOfMax) {
            const maximum = characterById(change.targetCharacterId).resources[change.resource];
            stacks = Math.max(1, Math.ceil(Math.abs(change.amount) / maximum * 100));
          }
          if (!Number.isSafeInteger(stacks) || stacks <= 0) continue;

          const selectedPlayers = effect.selectPlayers === true
            ? suppliedValues[`targetPlayers:${effect.id}`]
            : effect.characterIds;

          const targetEffect = effect.selectPlayers === true
            ? { ...effect, target: "selected", characterIds: selectedPlayers }
            : effect;

          for (const targetCharacterId of statEffectTargets(targetEffect, character)) {
            applyConfiguredAfflictionEffect(
              character,
              ability,
              effect,
              targetCharacterId,
              stacks
            );
          }
        }
      }
      if (ability.manaTide) {
        state.manaTide = {
          active: true,
          sourceCharacterId: character.id,
          roundsElapsed: 0,
          spentByCharacter: {}
        };
      }
      progress.abilityUsesThisTurn ??= {};
      progress.abilityUsesThisTurn[abilityId] = (progress.abilityUsesThisTurn[abilityId] || 0) + 1;
      if (ability.boostEnhancement) progress.boostUses = 2;
      progress.cooldowns[stateKey] = resolvedValues.cooldown;
      progress.activeTurns[stateKey] = Math.max(0, ability.duration || 0);
      console.error("COUNTERFEIT DEBUG", {
        ability: ability.name,
        stateKey,
        activeTurns: progress.activeTurns[stateKey],
        resourceEffects: ability.resourceEffects,
        staminaMaximum: getResourceMaximum(character, "stamina")
      });
      if (toggleable) {
        progress.activeAbilities ??= {};
        progress.activeAbilities[stateKey] = true;
      }
      const affectedCharacterIds = new Set([character.id, ...resourceChanges.map((change) => change.targetCharacterId)]);
      const deactivatedAbilities = [...new Set([...affectedCharacterIds].flatMap((characterId) =>
        deactivateToggleAbilitiesForExhaustedCharacter(characterById(characterId))
      ))];
      for (const effect of toggleable ? [] : ability.statEffects || []) {
        for (const targetCharacterId of statEffectTargets(effect, character)) {
          state.activeStatEffects.push({
            id: `${state.turn}:${character.id}:${ability.id}:${effect.id}:${targetCharacterId}`,
            sourceCharacterId: character.id,
            sourceAbilityId: configuredAbility.id,
            sourceConfigurationId: ability.id,
            effectId: effect.id,
            bonus: enhancedAbilityEffectBonus(character, configuredAbility, ability, effect.stat, effect.bonus),
            boosted: state.characters[character.id].boostUses > 0 && abilityHasAnyTag(configuredAbility, ["Boostable"], ability),
            targetCharacterId,
            remainingTurns: effect.duration
          });
        }
      }
      if (abilityHasAnyTag(ability, ["Boostable"]) && progress.boostUses > 0) progress.boostUses -= 1;
      saveCampaign();
      render();
      notify(`${ability.name} ${toggleable ? "activated" : "used"}${ability.duration && !toggleable ? ` for ${ability.duration} turns` : ""} — ${character.name}'s resources updated.${deactivatedAbilities.length ? ` Active abilities turned off: ${deactivatedAbilities.join(", ")}.` : ""}`);
      return true;
    }

    function toggleAbility(abilityId) {
      const character = getSelectedCharacter();
      const configuredAbility = allCharacterAbilities(character).find((entry) => entry.id === abilityId);
      if (!configuredAbility) return;
      const ability = selectedAbilityFor(character, configuredAbility);
      if (ability.activeMode !== "toggle") return;
      const stateKey = abilityStateKey(configuredAbility, ability.id === configuredAbility.id ? null : ability);
      const progress = state.characters[character.id];
      if (!progress.activeAbilities?.[stateKey]) {
        useAbility(abilityId);
        return;
      }
      progress.activeAbilities[stateKey] = false;
      saveCampaign();
      render();
      notify(`${ability.name} turned off.`);
    }

    function selectAbilityVariant(characterId, abilityId, variantId) {
      const character = characterById(characterId);
      const ability = allCharacterAbilities(character).find((entry) => entry.id === abilityId);
      if (!ability || (variantId && !(ability.variants || []).some((variant) => variant.id === variantId))) return;
      state.variantSelection[characterId] ??= {};
      if (variantId) state.variantSelection[characterId][abilityId] = variantId;
      else delete state.variantSelection[characterId][abilityId];
      saveCampaign();
      render();
    }

    function showAbilityCostForm(abilityId, abilityName, fields, ability) {
      const inputs = fields.map((field) => {
        if (field.startsWith("targetPlayers:")) {
          const effectId = field.slice("targetPlayers:".length);
          const effect = (ability.afflictionEffects || []).find(
            (entry) => entry.id === effectId
          );

          const options = CHARACTERS.map((player) => `
            <label class="ability-cost-input">
              <span>${escapeHtml(player.name)}</span>
              <input
                type="checkbox"
                name="${field}"
                value="${escapeHtml(player.id)}"
              >
            </label>
          `).join("");

          return `
            <fieldset class="ability-cost-input">
              <legend>
                Choose players to receive ${
                  escapeHtml(AFFLICTION_GLOSSARY[effect?.afflictionId]?.name || "this affliction")
                }
              </legend>
              <div class="ability-cost-inputs">${options}</div>
            </fieldset>
          `;
        }
        const inputId = field.startsWith("input:") ? field.slice("input:".length) : null;
        const inputConfig = ability.inputFields?.find((entry) => entry.id === inputId);
        const minimum = inputConfig?.min ?? (field.startsWith("resourceEffect:") ? "" : 0);
        return `<label class="ability-cost-input">
          <span>${escapeHtml(abilityCostLabel(field, ability))}</span>
          <input type="number" name="${field}" ${minimum === "" ? "" : `min="${escapeHtml(String(minimum))}"`} step="1" inputmode="numeric" required>
        </label>`;
      }).join("");
      const root = document.getElementById("modal-root");
      root.innerHTML = `<div class="modal-backdrop" data-dismiss-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="ability-cost-title">
          <h2 id="ability-cost-title">${escapeHtml(abilityName)} · Set values</h2>
          <p>Enter the requested values for this use. Active cost-reduction effects are applied before resources are spent.</p>
          <form data-configurable-ability="${escapeHtml(abilityId)}">
            <div class="ability-cost-inputs">${inputs}</div>
            <div class="modal-actions"><button class="button" type="button" data-action="cancel-ability-costs">Cancel</button><button class="button primary" type="submit">Use ability</button></div>
          </form>
        </section></div>`;
      root.querySelector("input")?.focus();
    }

    function disableCrystal(abilityId, crystalId) {
      const character = getSelectedCharacter();
      const ability = allCharacterAbilities(character).find((entry) => entry.id === abilityId);
      const crystal = state.characters[character.id].crystals?.[abilityId]?.find((entry) => entry.id === crystalId);
      if (!ability?.crystalSummon || !crystal || crystal.disabledTurns > 0) return;
      crystal.disabledTurns = ability.crystalSummon.disableTurns;
      saveCampaign();
      render();
      notify(`${character.name}'s crystal is disabled for ${crystal.disabledTurns} turns.`);
    }

    function dispelCrystal(abilityId, crystalId) {
      const character = getSelectedCharacter();
      const progress = state.characters[character.id];
      const crystals = progress.crystals?.[abilityId];
      const index = crystals?.findIndex((entry) => entry.id === crystalId) ?? -1;
      if (index < 0) return;
      crystals.splice(index, 1);
      progress.resources.mana = Math.min(character.resources.mana, progress.resources.mana + 50);
      saveCampaign();
      render();
      notify(`${character.name} dispels a mana crystal and restores 50 mana.`);
    }

    function findConfiguredStatEffect(sourceCharacterId, abilityId, configurationId, effectId) {
      const sourceCharacter = characterById(sourceCharacterId);
      const ability = sourceCharacter && allCharacterAbilities(sourceCharacter).find((entry) => entry.id === abilityId);
      if (!ability) return null;
      const configurations = [ability, ...(ability.variants || [])];
      const selectedConfiguration = configurations.find((entry) => entry.id === configurationId);
      return selectedConfiguration?.statEffects?.find((effect) => effect.id === effectId) ||
        ability.statEffects?.find((effect) => effect.id === effectId) ||
        null;
    }

    function statEffectTargets(effect, sourceCharacter) {
      if (effect.target === "self") return [sourceCharacter.id];
      if (effect.target === "others") return CHARACTERS.filter((character) => character.id !== sourceCharacter.id).map((character) => character.id);
      if (effect.target === "party") return CHARACTERS.map((character) => character.id);
      if (effect.target === "selected" && Array.isArray(effect.characterIds)) {
        const selectedIds = new Set(effect.characterIds);
        return CHARACTERS
          .filter((character) => selectedIds.has(character.id))
          .map((character) => character.id);
      }
      if (["tagged", "self-and-tagged"].includes(effect.target) && Array.isArray(effect.tags)) {
        const targetTags = effect.tags.map((tag) => tag.trim().toLowerCase());
        const taggedTargets = CHARACTERS.filter((character) =>
          allCharacterAbilities(character).some((ability) =>
            [...(ability.tags || []), ...(ability.variants || []).flatMap((variant) => variant.tags || [])]
              .some((tag) => typeof tag === "string" && targetTags.includes(tag.trim().toLowerCase()))
          )
        ).map((character) => character.id);
        return effect.target === "self-and-tagged"
          ? [...new Set([sourceCharacter.id, ...taggedTargets])]
          : taggedTargets;
      }
      return [];
    }

    function enhancedAbilityEffectBonus(character, ability, configuration, stat, bonus) {
      const base = parseDiceFormula(bonus);
      if (!base) return bonus;
      const enhanced = { dice: new Map(base.dice), flat: base.flat };
      const configuredEnhancements = configuration.enhancements || ability.enhancements || [];
      if (!Array.isArray(configuredEnhancements)) {
        console.error(`Invalid enhancements configured for ${ability.name}.`, configuredEnhancements);
        return bonus;
      }
      const additions = configuredEnhancements
        .filter((entry) => entry?.stat === stat)
        .map((entry) => parseDiceFormula(entry.bonus));
      if (additions.some((addition) => !addition)) {
        console.error(`Invalid enhancement bonus configured for ${ability.name}.`, configuredEnhancements);
        return bonus;
      }
      let isEnhanced = false;
      for (const enhancerCharacter of CHARACTERS) {
        if (!isCharacterAttending(enhancerCharacter)) continue;
        for (const enhancer of allCharacterAbilities(enhancerCharacter)) {
          for (const enhancerConfiguration of [enhancer, ...(enhancer.variants || [])]) {
            const rule = enhancerConfiguration.enhancement;
            if (
              !enhancerConfiguration.tags?.includes("enhancement") ||
              !isPassiveConfiguration(enhancerConfiguration)
            ) continue;
            const validRule = rule &&
              ["self", "others", "party", "tagged", "self-and-tagged"].includes(rule.target) &&
              Array.isArray(rule.targetTags) &&
              rule.targetTags.length > 0 &&
              rule.targetTags.every((tag) => typeof tag === "string" && tag.trim()) &&
              (!["tagged", "self-and-tagged"].includes(rule.target) ||
                (Array.isArray(rule.tags) && rule.tags.length > 0 && rule.tags.every((tag) => typeof tag === "string" && tag.trim())));
            if (!validRule) {
              console.error(`Invalid enhancement configuration for ${enhancer.name}.`, rule);
              continue;
            }
            if (
              !abilityHasAnyTag(ability, rule.targetTags, configuration) ||
              !statEffectTargets(rule, enhancerCharacter).includes(character.id)
            ) continue;
            isEnhanced = true;
          }
        }
      }
      if (state.characters[character.id]?.boostUses > 0 && abilityHasAnyTag(ability, ["Boostable"], configuration)) isEnhanced = true;
      if (!isEnhanced) return bonus;
      for (const addition of additions) {
        for (const [sides, count] of addition.dice) {
          enhanced.dice.set(sides, (enhanced.dice.get(sides) || 0) + count);
        }
        enhanced.flat += addition.flat;
      }
      return formatDiceFormula(enhanced);
    }

    function getAbilityCostModifiers(character, resource, targetAbility = null) {
      return CHARACTERS.flatMap((sourceCharacter) => {
        if (!isCharacterAttending(sourceCharacter)) return [];
        return allCharacterAbilities(sourceCharacter).flatMap((ability) =>
          [ability, ...(ability.variants || [])].flatMap((configuration) => {
            if (!isPassiveConfiguration(configuration)) return [];
            return (configuration.costEffects || [])
              .filter((effect) =>
                Number.isSafeInteger(effect[resource]) &&
                effect[resource] > 0 &&
                statEffectTargets(effect, sourceCharacter).includes(character.id) &&
                (!effect.abilityTags || (targetAbility && abilityHasAnyTag(targetAbility, effect.abilityTags)))
              )
              .map((effect) => ({ amount: effect[resource], source: ability.name }));
          })
        );
      });
    }


    function getEffectiveAbilityCost(character, resource, cost, ability = null) {
      const modifiers = getAbilityCostModifiers(character, resource, ability);
      const reduction = modifiers.reduce((total, modifier) => total + modifier.amount, 0);
      if (typeof cost !== "number" || !Number.isFinite(cost)) {
        return { cost, reduction, sources: [...new Set(modifiers.map((modifier) => modifier.source))] };
      }
      return {
        cost: Math.max(0, cost - reduction),
        reduction,
        sources: [...new Set(modifiers.map((modifier) => modifier.source))]
      };
    }

    function getEffectiveAbilityUpkeep(character, resource, cost, ability = null) {
      const modifiers = getAbilityCostModifiers(character, resource, ability);
      const reduction = modifiers.reduce((total, modifier) => total + modifier.amount / 10 * 6, 0);
      return {
        cost: Math.max(0, cost - reduction),
        reduction,
        sources: [...new Set(modifiers.map((modifier) => modifier.source))]
      };
    }

    function manaTideAbility() {
      for (const character of CHARACTERS) {
        const ability = character.abilities.find((entry) => entry.manaTide);
        if (ability) return { character, ability };
      }
      return null;
    }

    function manaTideRecoveryBonus(character) {
      const configured = manaTideAbility()?.ability.manaTide;
      if (!isValidManaTideConfiguration(configured) || !state.manaTide?.active) return 0;
      const duration = configured.durationRounds;
      const progress = Math.max(0, Math.min(duration - 1, state.manaTide.roundsElapsed));
      // Completed party rounds drive a quadratic ramp from zero to the configured maximum.
      const ramp = configured.maxRecovery * (progress / (duration - 1)) ** 2;
      const spent = character.id === "Pat" ? 0 : state.manaTide.spentByCharacter?.[character.id] || 0;
      return ramp + spent / configured.manaPerRecovery;
    }



    function effectiveRecovery(character, stat) {
      const bonus = getStatModifiers(character, stat).reduce((total, modifier) => {
        const parsed = parseDiceFormula(modifier.bonus);
        if (!parsed || parsed.dice.size) {
          console.error(`${statDisplayName(stat)} modifier from ${modifier.source} must be a flat numeric value to affect recovery.`, modifier);
          return total;
        }
        return total + parsed.flat;
      }, 0);
      return Math.max(0, character.stats[stat] + bonus);
    }



    function deactivateToggleAbilitiesForExhaustedCharacter(character) {
      if (!hasUnlockedPotential(character) || !hasNegativeCastingResource(character)) return [];
      const progress = state.characters[character.id];
      const deactivated = [];
      for (const ability of allCharacterAbilities(character)) {
        for (const configuration of [ability, ...(ability.variants || [])]) {
          if (configuration.activeMode !== "toggle") continue;
          const stateKey = abilityStateKey(ability, configuration === ability ? null : configuration);
          if (!progress.activeAbilities?.[stateKey]) continue;
          progress.activeAbilities[stateKey] = false;
          deactivated.push(ability.name);
        }
      }
      return deactivated;
    }
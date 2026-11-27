    function characterById(id) {
      return CHARACTERS.find((character) => character.id === id);
    }

    function isCharacterAttending(character) {
      return !(state.absentCharacterIds || []).includes(character.id);
    }

    function getTurnOrder() {
      const absent = new Set(state.absentCharacterIds || []);
      return CHARACTERS.filter((character) => !absent.has(character.id)).sort((a, b) => {
        const aScore = state.initiativeScores?.[a.id], bScore = state.initiativeScores?.[b.id];
        const aHasScore = Number.isSafeInteger(aScore), bHasScore = Number.isSafeInteger(bScore);
        if (aHasScore && bHasScore && aScore !== bScore) return bScore - aScore;
        if (aHasScore !== bHasScore) return aHasScore ? -1 : 1;
        return CHARACTERS.indexOf(a) - CHARACTERS.indexOf(b);
      });
    }

    function getCurrentCharacter() {
      const order = getTurnOrder();
      return order.length ? order[state.turnIndex % order.length] : CHARACTERS[0];
    }

    function getSelectedCharacter() {
      return characterById(state.selectedId);
    }

    function characterSummary(character) {
      return `${character.race} · ${character.magicspecialty} · ${character.rank}`;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[character]);
    }

    function avatarStyle(character, extraClass = "") {
      return `<div class="avatar ${extraClass}" style="--avatar-color:${character.color};--avatar-bg:${character.avatarBg};--avatar-border:${character.color}55" aria-hidden="true">${escapeHtml(character.initials)}</div>`;
    }

    function resourcePercent(character, resource) {
      const current = state.characters[character.id].resources[resource];
      const maximum = getResourceMaximum(character, resource);

      return Math.max(0, Math.min(100, (current / maximum) * 100));
    }

    function resourceBar(character, resource, label) {
      const current = state.characters[character.id].resources[resource];
      const maximum = getResourceMaximum(character, resource);
      return `<div class="bar-line">
        <span class="bar-name">${label}</span>
        <div class="bar-track" aria-label="${label} ${current} of ${maximum}"><div class="bar-fill ${resource}" style="width:${resourcePercent(character, resource)}%"></div></div>
        <span class="bar-value">${current} <span style="color:var(--faint)">/ ${maximum}</span></span>
      </div>`;
    }

    function getStatModifiers(character, stat, includeEquipment = true) {
      const activeModifiers = state.activeStatEffects.flatMap((activeEffect) => {
        if (activeEffect.targetCharacterId !== character.id) return [];
        const effect = findConfiguredStatEffect(
          activeEffect.sourceCharacterId,
          activeEffect.sourceAbilityId,
          activeEffect.sourceConfigurationId,
          activeEffect.effectId
        );
        if (!effect || effect.stat !== stat) return [];
        const source = characterById(activeEffect.sourceCharacterId);
        const ability = allCharacterAbilities(source).find((entry) => entry.id === activeEffect.sourceAbilityId);
        const configuration = [ability, ...(ability.variants || [])]
          .find((entry) => entry.id === activeEffect.sourceConfigurationId) || ability;
        return [{
          bonus: activeEffect.boosted ? activeEffect.bonus : enhancedAbilityEffectBonus(character, ability, configuration, stat, effect.bonus),
          source: ability.name,
          detail: `${activeEffect.remainingTurns} turn${activeEffect.remainingTurns === 1 ? "" : "s"} remaining`
        }];
      });
      const passiveModifiers = CHARACTERS.flatMap((sourceCharacter) => {
        if (!isCharacterAttending(sourceCharacter)) return [];
        return allCharacterAbilities(sourceCharacter).flatMap((ability) =>
          [ability, ...(ability.variants || [])].flatMap((configuration) => {
            if (!isPassiveConfiguration(configuration)) return [];
            return (configuration.statEffects || [])
              .filter((effect) => effect.stat === stat && statEffectTargets(effect, sourceCharacter).includes(character.id))
              .map((effect) => ({
                bonus: enhancedAbilityEffectBonus(sourceCharacter, ability, configuration, stat, effect.bonus),
                source: ability.name,
                detail: "Passive effect"
              }));
          })
        );
      });
      const activeToggleModifiers = CHARACTERS.flatMap((sourceCharacter) => {
        const progress = state.characters[sourceCharacter.id];
        return allCharacterAbilities(sourceCharacter).flatMap((ability) =>
          [ability, ...(ability.variants || [])].flatMap((configuration) => {
            const stateKey = abilityStateKey(ability, configuration === ability ? null : configuration);
            if (configuration.activeMode !== "toggle" || !progress.activeAbilities?.[stateKey]) return [];
            return (configuration.statEffects || [])
              .filter((effect) => effect.stat === stat && statEffectTargets(effect, sourceCharacter).includes(character.id))
              .map((effect) => ({
                bonus: enhancedAbilityEffectBonus(sourceCharacter, ability, configuration, stat, effect.bonus),
                source: ability.name,
                detail: "Active"
              }));
          })
        );
      });
      const darknessCharacter = CHARACTERS.find((entry) => entry.id === "Izaak");
      const darknessProgress = darknessCharacter && state.characters[darknessCharacter.id];
      const darknessStats = ["physicalAttack", "damageResistance", "magic", "magicResistance"];
      const darknessModifiers = character.id === "Izaak" && darknessProgress && darknessStats.includes(stat)
        ? [{ bonus: darknessProgress.adjacentAlly ? "-1D8" : "1D8", source: "Darkness Embrace", detail: darknessProgress.adjacentAlly ? "Ally adjacent" : "No ally adjacent" }]
        : [];
      const shadeCount = state.characters.Amarynth?.shadowShadeCount || 0;
      const fasterThanLightModifiers = character.id === "Amarynth" && shadeCount > 0 &&
        ["speed", "reflexes"].includes(stat)
        ? [{ bonus: String(shadeCount), source: "Faster than Light", detail: `${shadeCount} Shades in shadow` }]
        : [];
      const tideBonus = stat === "manaRecovery" ? manaTideRecoveryBonus(character) : 0;
      const manaTideModifiers = tideBonus > 0
        ? [{ bonus: String(Number(tideBonus.toFixed(4))), source: "Mana Tide", detail: "Active" }]
        : [];
      const equippedItemIds = new Set(state.characters[character.id].equippedEquipment || []);
      const equipmentModifiers = includeEquipment
        ? (character.equipment || [])
          .filter((item) => equippedItemIds.has(item.id))
          .flatMap((item) => (item.statEffects || [])
            .filter((effect) => effect.stat === stat && typeof effect.bonus === "string")
            .map((effect) => ({ bonus: effect.bonus, source: item.name, detail: "Equipped" })))
        : [];
      const afflictionModifiers = (state.activeAfflictions || [])
        .filter((entry) => entry.characterId === character.id)
        .flatMap((entry) => {
          const affliction = AFFLICTION_GLOSSARY[entry.afflictionId];
          return (affliction?.statEffects || []).flatMap((effect) => {
            if (effect.stat !== stat || typeof effect.bonus !== "string") return [];
            const bonus = effect.perStack === false ? effect.bonus : scaledDiceFormula(effect.bonus, entry.stacks);
            if (!bonus) {
              console.error(`Invalid stat effect on ${affliction.name}.`, effect);
              return [];
            }
            const duration = entry.remainingTurns === null ? "Does not expire" : `${entry.remainingTurns} turns remaining`;
            return [{
              bonus,
              source: affliction.name,
              detail: `${entry.stacks} stack${entry.stacks === 1 ? "" : "s"} · ${duration}`
            }];
          });
        });
      return [...activeModifiers, ...passiveModifiers, ...activeToggleModifiers, ...darknessModifiers, ...fasterThanLightModifiers, ...manaTideModifiers, ...equipmentModifiers, ...afflictionModifiers];
    }

    function renderStatValue(character, stat) {
      const modifiers = getStatModifiers(character, stat);
      const baseValue = escapeHtml(character.stats[stat]);
      if (!modifiers.length) return baseValue;
      const bonusText = modifiers.map((modifier) => {
        const bonus = modifier.bonus;
        const displayBonus = /^[+-]/.test(bonus) ? bonus : `+${bonus}`;
        return `<span class="stat-modifier" title="${escapeHtml(modifier.source)} · ${escapeHtml(modifier.detail)}">${escapeHtml(displayBonus)}</span>`;
      }).join("");
      return `${baseValue}${bonusText}`;
    }

    function recordManaSpent(characterId, amount) {
      if (!state.manaTide?.active || !Number.isFinite(amount) || amount <= 0) return;
      state.manaTide.spentByCharacter ??= {};
      const previous = characterId === "Pat" ? 0 : state.manaTide.spentByCharacter[characterId] || 0;
      state.manaTide.spentByCharacter[characterId] = Math.round((previous + amount) * 1e6) / 1e6;
    }
  
    function allCharacterAbilities(character) {
      return [...character.abilities, ...(character.racialGifts || [])];
    }

    // Variants retain independent cooldown/effect clocks while remaining one listed ability.
    function abilityConfigurationKeys(character) {
      return allCharacterAbilities(character).flatMap((ability) => [
        ability.id,
        ...(ability.variants || []).map((variant) => `${ability.id}::${variant.id}`)
      ]);
    }

    function abilityStateKey(ability, variant) {
      return variant ? `${ability.id}::${variant.id}` : ability.id;
    }

    function scaledDiceFormula(formula, multiplier) {
      const parsed = parseDiceFormula(formula);
      if (!parsed) return null;
      return formatDiceFormula({
        dice: new Map([...parsed.dice].map(([sides, count]) => [sides, count * multiplier])),
        flat: parsed.flat * multiplier
      });
    }

    function parseDiceFormula(formula) {
      if (typeof formula === "number") {
        return Number.isFinite(formula) ? { dice: new Map(), flat: formula } : null;
      }
      if (typeof formula !== "string" || !formula.trim()) return null;
      const expression = formula.replace(/\s+/g, "");
      const termPattern = /([+-]?)(\d+(?:\.\d+)?)(?:[dD](\d+))?/gy;
      const result = { dice: new Map(), flat: 0 };
      let position = 0;
      let firstTerm = true;
      while (position < expression.length) {
        termPattern.lastIndex = position;
        const match = termPattern.exec(expression);
        if (!match || (!firstTerm && !match[1])) return null;
        const sign = match[1] === "-" ? -1 : 1;
        const amount = Number(match[2]) * sign;
        if (match[3]) {
          const count = Math.abs(amount);
          const sides = Number(match[3]);
          if (!Number.isSafeInteger(count) || !Number.isSafeInteger(sides) || sides < 1) return null;
          result.dice.set(sides, (result.dice.get(sides) || 0) + sign * count);
        } else {
          result.flat += amount;
        }
        position = termPattern.lastIndex;
        firstTerm = false;
      }
      return firstTerm ? null : result;
    }

    function formatDiceFormula(formula) {
      const terms = [...formula.dice.entries()]
        .filter(([, count]) => count !== 0)
        .sort(([sidesA], [sidesB]) => sidesA - sidesB)
        .map(([sides, count]) => ({ value: `${Math.abs(count)}D${sides}`, sign: Math.sign(count) }));
      if (formula.flat !== 0) {
        terms.push({ value: String(Math.abs(formula.flat)), sign: Math.sign(formula.flat) });
      }
      if (!terms.length) return "0";
      return terms.map((term, index) =>
        index === 0
          ? `${term.sign < 0 ? "-" : ""}${term.value}`
          : ` ${term.sign < 0 ? "-" : "+"} ${term.value}`
      ).join("");
    }

    function changeDiceSides(formula, sides) {
      if (!Number.isSafeInteger(sides) || sides < 1) return null;
      return {
        dice: formula.dice.size
          ? new Map([[sides, [...formula.dice.values()].reduce((total, count) => total + count, 0)]])
          : new Map(),
        flat: formula.flat
      };
    }

    function expectedDiceFormulaValue(formula) {
      return formula.flat + [...formula.dice.entries()]
        .reduce((total, [sides, count]) => total + count * (sides + 1) / 2, 0);
    }

    function abilityHasAnyTag(ability, tags, configuration = null) {
      const expectedTags = new Set((tags || []).filter((tag) => typeof tag === "string").map((tag) => tag.toLowerCase()));
      return [...(ability.tags || []), ...(configuration?.tags || [])]
        .some((tag) => typeof tag === "string" && expectedTags.has(tag.toLowerCase()));
    }


function isAbilityEnhancedForCharacter(character, ability, configuration) {
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
            (Array.isArray(rule.tags) && rule.tags.length > 0 &&
              rule.tags.every((tag) => typeof tag === "string" && tag.trim())));

        if (!validRule) continue;

        // The enhancer must target the character whose ability is being enhanced.
        if (!statEffectTargets(rule, enhancerCharacter).includes(character.id)) continue;

        // The ability must have one of the tags the enhancer affects.
        if (!abilityHasAnyTag(ability, rule.targetTags, configuration)) continue;

        // Only the character who owns the enhancer receives its bonus.
        if (enhancerCharacter.id !== character.id) continue;

        return true;
      }
    }
  }

  return false;
}


function getResourceMaximum(character, resource) {
  let maximum = character.resources[resource];

  for (const sourceCharacter of CHARACTERS) {
    const sourceProgress = state.characters[sourceCharacter.id];

    for (const configuredAbility of allCharacterAbilities(sourceCharacter)) {
      const ability = selectedAbilityFor(sourceCharacter, configuredAbility);
      const stateKey = abilityStateKey(
        configuredAbility,
        ability.id === configuredAbility.id ? null : ability
      );

      const active =
        (sourceProgress.activeTurns?.[stateKey] || 0) > 0 ||
        Boolean(sourceProgress.activeAbilities?.[stateKey]);

      if (!active) continue;

      for (const effect of ability.resourceEffects || []) {
        if (
          effect.resource !== resource ||
          !Number.isSafeInteger(effect.maximumIncrease) ||
          effect.maximumIncrease <= 0 ||
          !statEffectTargets(effect, sourceCharacter).includes(character.id)
        ) continue;

        let increase = effect.maximumIncrease;

        if (isAbilityEnhancedForCharacter(sourceCharacter, configuredAbility, ability)) {
          const enhancements = ability.enhancements || [];

          increase += enhancements
            .filter((entry) => entry.resource === resource)
            .reduce((total, entry) =>
              total + (
                Number.isSafeInteger(entry.maximumIncrease)
                  ? entry.maximumIncrease
                  : 0
              ), 0);
        }

        maximum += increase;
      }
    }
  }
  console.log(
    `${character.name} ${resource} maximum:`,
    maximum,
    "Active turns:",
    state.characters[character.id].activeTurns
  );
  return maximum;
}
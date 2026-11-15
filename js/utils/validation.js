    function canPayAbilityResources(character, costs, effects) {
      if (hasUnlockedPotential(character) && hasNegativeCastingResource(character)) return false;
      const projected = new Map(CHARACTERS.map((entry) => [
        entry.id,
        { mana: state.characters[entry.id].resources.mana, stamina: state.characters[entry.id].resources.stamina }
      ]));
      const affectedCharacterIds = new Set([character.id]);
      const ownResources = projected.get(character.id);
      for (const resource of ["mana", "stamina"]) {
        if (!hasUnlockedPotential(character) && ownResources[resource] < costs[resource]) return false;
        ownResources[resource] -= costs[resource];
      }

      for (const effect of effects) {
        if (!["mana", "stamina"].includes(effect.resource)) continue;
        for (const targetId of statEffectTargets(effect, character)) {
          affectedCharacterIds.add(targetId);
          const target = characterById(targetId);
          const targetResources = projected.get(targetId);
          targetResources[effect.resource] = Math.max(
            minimumResourceValue(target, effect.resource),
            Math.min(
              target.resources[effect.resource],
              targetResources[effect.resource] + effect.amount
            )
          );
        }
      }

      return [...affectedCharacterIds].every((targetId) => {
        const target = characterById(targetId);
        return ["mana", "stamina"].every((resource) => {
          const value = projected.get(target.id)[resource];
          return value >= 0 || hasUnlockedPotential(target);
        });
      });
    }

    function hasUnlockedPotential(character) {
      return Array.isArray(character.tags) && character.tags.includes("unlocked-potential");
    }

    function minimumResourceValue(character, resource) {
      return hasUnlockedPotential(character) && ["mana", "stamina"].includes(resource)
        ? -Number.MAX_SAFE_INTEGER
        : 0;
    }

    function hasNegativeCastingResource(character) {
      const resources = state.characters[character.id].resources;
      return resources.mana < 0 || resources.stamina < 0;
    }

    function isConfigurableAbilityValue(value) {
      return typeof value === "string" && value.trim().toUpperCase() === "XX";
    }

    function isValidAfflictionEffect(effect) {
      const inputStackRule = effect?.stacksFromInput;
      return Boolean(
        effect &&
        typeof effect.id === "string" && effect.id.trim() &&
        Object.hasOwn(AFFLICTION_GLOSSARY, effect.afflictionId) &&
        (["self", "others", "party", "tagged", "self-and-tagged"].includes(effect.target) ||(effect.target === "selected" && effect.selectPlayers === true)) &&
      (effect.selectPlayers === undefined || typeof effect.selectPlayers === "boolean") &&
      (effect.selectPlayers !== true || effect.target === "selected") &&
        (effect.target !== "selected" || effect.selectPlayers === true) &&
        (effect.characterIds === undefined ||
          (Array.isArray(effect.characterIds) &&
          effect.characterIds.every((id) => CHARACTERS.some((character) => character.id === id)))) &&
        (effect.selectPlayers === undefined ||
          (effect.selectPlayers === true && effect.target === "selected")) &&
        (!["tagged", "self-and-tagged"].includes(effect.target) ||
          (Array.isArray(effect.tags) && effect.tags.length > 0 && effect.tags.every((tag) => typeof tag === "string" && tag.trim()))) &&
        (effect.stacks === undefined || (Number.isSafeInteger(effect.stacks) && effect.stacks > 0)) &&
        (inputStackRule === undefined || (
          inputStackRule &&
          typeof inputStackRule.field === "string" &&
          inputStackRule.field.trim() &&
          Number.isSafeInteger(inputStackRule.divisor) &&
          inputStackRule.divisor > 0
        )) &&
        (effect.stacksFromPercentageOfMax === undefined || typeof effect.stacksFromPercentageOfMax === "boolean") &&
        (effect.stacksFromPercentageOfMax !== true || effect.trigger === "resourceChange") &&
        (effect.duration === undefined || effect.duration === null || (Number.isSafeInteger(effect.duration) && effect.duration > 0)) &&
        (effect.maxStacksPerTurn === undefined || (Number.isSafeInteger(effect.maxStacksPerTurn) && effect.maxStacksPerTurn > 0)) &&
        (effect.maxTotalStacks === undefined || (Number.isSafeInteger(effect.maxTotalStacks) && effect.maxTotalStacks > 0)) &&
        (effect.trigger === undefined || effect.trigger === "onUse" || (
          effect.trigger === "resourceChange" &&
          typeof effect.resourceEffectId === "string" &&
          ["increase", "decrease"].includes(effect.condition)
        ))
      );
    }

    function isValidWeaponAfflictionEffect(effect) {
      return Boolean(
        effect &&
        typeof effect.id === "string" &&
        effect.id.trim() &&
        Object.hasOwn(AFFLICTION_GLOSSARY, effect.afflictionId) &&
        ["wielder", "selected", "wielder-and-selected"].includes(effect.target) &&
        (effect.stacks === undefined || (Number.isSafeInteger(effect.stacks) && effect.stacks > 0)) &&
        (effect.duration === undefined || effect.duration === null ||
          (Number.isSafeInteger(effect.duration) && effect.duration > 0)) &&
        (effect.maxStacksPerTurn === undefined ||
          (Number.isSafeInteger(effect.maxStacksPerTurn) && effect.maxStacksPerTurn > 0)) &&
        (effect.maxTotalStacks === undefined ||
          (Number.isSafeInteger(effect.maxTotalStacks) && effect.maxTotalStacks > 0))
      );
    }

    function isValidAttackConfiguration(character, item, attack) {
      const stats = attack.stats === undefined ? [attack.stat] : attack.stats;
      return Array.isArray(stats) && stats.length > 0 &&
        stats.every((stat) => typeof stat === "string" && Object.hasOwn(character.stats, stat)) &&
        equipmentAttackResult(character, item, attack) !== null;
    }

    function isValidStatEffect(effect, character, isToggleable = false) {
      return Boolean(
        effect &&
        typeof effect.id === "string" &&
        effect.id.trim() &&
        Object.hasOwn(character.stats, effect.stat) &&
        ((typeof effect.bonus === "string" && effect.bonus.trim()) ||
          (typeof effect.bonus === "number" && Number.isFinite(effect.bonus))) &&
        (isToggleable
          ? effect.duration === undefined || (Number.isInteger(effect.duration) && effect.duration > 0)
          : Number.isInteger(effect.duration) && effect.duration > 0) &&
        ["self", "others", "party", "tagged", "self-and-tagged"].includes(effect.target) &&
        (!["tagged", "self-and-tagged"].includes(effect.target) ||
          (Array.isArray(effect.tags) && effect.tags.length > 0 && effect.tags.every((tag) => typeof tag === "string" && tag.trim())))
      );
    }

    function isValidAbilityUpkeep(ability) {
      return ability.upkeep === undefined || (
        ability.upkeep &&
        typeof ability.upkeep === "object" &&
        !Array.isArray(ability.upkeep) &&
        Object.entries(ability.upkeep).every(([resource, amount]) =>
          ["mana", "stamina"].includes(resource) &&
          Number.isSafeInteger(amount) &&
          amount >= 0
        )
      );
    }

    function isValidManaTideConfiguration(configuration) {
      return Boolean(
        configuration &&
        Number.isSafeInteger(configuration.durationRounds) &&
        configuration.durationRounds > 1 &&
        Number.isFinite(configuration.maxRecovery) &&
        configuration.maxRecovery >= 0 &&
        Number.isFinite(configuration.manaPerRecovery) &&
        configuration.manaPerRecovery > 0 &&
        configuration.growth === "quadratic"
      );
    }

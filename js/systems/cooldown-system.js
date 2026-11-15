    function getEnhancedAbilityCooldown(character, ability, configuration, cooldown) {
      if (!Number.isSafeInteger(cooldown) || cooldown < 0) return cooldown;

      const enhancements = configuration.enhancements || ability.enhancements || [];
      if (!Array.isArray(enhancements)) {
        console.error(`Invalid enhancements configured for ${ability.name}.`, enhancements);
        return cooldown;
      }

      const reduction = enhancements.reduce((total, enhancement) => {
        const amount = enhancement?.cooldownReduction;
        return total + (Number.isSafeInteger(amount) && amount > 0 ? amount : 0);
      }, 0);

      if (reduction === 0) return cooldown;

      let isEnhanced = false;

      for (const enhancerCharacter of CHARACTERS) {
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

            if (!validRule) {
              console.error(`Invalid enhancement configuration for ${enhancer.name}.`, rule);
              continue;
            }

            if (
              abilityHasAnyTag(ability, rule.targetTags, configuration) &&
              statEffectTargets(rule, enhancerCharacter).includes(character.id)
            ) {
              isEnhanced = true;
            }
          }
        }
      } 

      return isEnhanced ? Math.max(0, cooldown - reduction) : cooldown;
    }

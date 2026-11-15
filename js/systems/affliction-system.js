    function addManualAffliction(characterId, afflictionId, stacks, duration) {
      if (!characterById(characterId) || !Object.hasOwn(AFFLICTION_GLOSSARY, afflictionId) ||
        !Number.isSafeInteger(stacks) || stacks < 1 || stacks > 999 ||
        !(duration === null || (Number.isSafeInteger(duration) && duration > 0 && duration <= 999))) {
        notify("Choose a character, affliction, positive stack count, and valid duration.");
        return;
      }
      applyAffliction(characterId, afflictionId, stacks, duration, "Manually added");
      saveCampaign();
      render();
      notify(`${AFFLICTION_GLOSSARY[afflictionId].name} applied to ${characterById(characterId).name}.`);
    }

    function removeAffliction(afflictionId, removeAll = false) {
      const entry = state.activeAfflictions.find((activeEntry) => activeEntry.id === afflictionId);
      if (!entry) return;
      if (removeAll || entry.stacks <= 1) {
        state.activeAfflictions = state.activeAfflictions.filter((activeEntry) => activeEntry.id !== afflictionId);
      } else {
        entry.stacks -= 1;
      }
      saveCampaign();
      render();
    }

    function recoverFromAfflictions(character) {
      const progress = state.characters[character.id];
      for (const entry of state.activeAfflictions.filter((activeEntry) => activeEntry.characterId === character.id)) {
        const affliction = AFFLICTION_GLOSSARY[entry.afflictionId];
        if (!affliction) {
          console.error(`Unknown affliction: ${entry.afflictionId}.`);
          continue;
        }
        for (const effect of affliction.resourceEffects || []) {
          if (
            !effect ||
            !["health", "mana", "stamina"].includes(effect.resource) ||
            !Number.isSafeInteger(effect.amountPerStack) ||
            effect.amountPerStack < 0
          ) {
            console.error(`Invalid resource effect configured for ${affliction.name}.`, effect);
            continue;
          }
          const amount = effect.amountPerStack * entry.stacks;
          progress.resources[effect.resource] = Math.min(
            character.resources[effect.resource],
            progress.resources[effect.resource] + amount
          );
        }
      }
    }

    function applyAffliction(characterId, afflictionId, stacks, duration, source) {
      if (!characterById(characterId) || !Object.hasOwn(AFFLICTION_GLOSSARY, afflictionId)) return;
      if (!Number.isSafeInteger(stacks) || stacks <= 0) return;
      state.afflictionSequence = (state.afflictionSequence || 0) + 1;
      state.activeAfflictions.push({
        id: `affliction-${state.afflictionSequence}`,
        characterId,
        afflictionId,
        stacks,
        remainingTurns: duration ?? null,
        source: String(source || "Manually added").slice(0, 160)
      });
    }

    function applyConfiguredAfflictionEffect(sourceCharacter, ability, effect, targetCharacterId, stackCount) {
      const sourceProgress = state.characters[sourceCharacter.id];
      sourceProgress.afflictionApplicationsThisTurn ??= {};
      const countKey = `${ability.id}::${effect.id}::${targetCharacterId}`;
      const alreadyApplied = sourceProgress.afflictionApplicationsThisTurn[countKey] || 0;
      const source = `${sourceCharacter.name} · ${ability.name}`;
      const existingStacks = state.activeAfflictions
        .filter((entry) =>
          entry.characterId === targetCharacterId &&
          entry.afflictionId === effect.afflictionId &&
          entry.source === source
        )
        .reduce((total, entry) => total + entry.stacks, 0);
      const perTurnAllowance = effect.maxStacksPerTurn
        ? Math.max(0, effect.maxStacksPerTurn - alreadyApplied)
        : stackCount;
      const totalAllowance = effect.maxTotalStacks
        ? Math.max(0, effect.maxTotalStacks - existingStacks)
        : stackCount;
      const stacks = Math.min(stackCount, perTurnAllowance, totalAllowance);
      if (stacks <= 0) return;
      applyAffliction(
        targetCharacterId,
        effect.afflictionId,
        stacks,
        effect.duration,
        source
      );
      sourceProgress.afflictionApplicationsThisTurn[countKey] = alreadyApplied + stacks;
    }
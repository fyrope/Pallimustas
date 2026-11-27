    function renderAbilities(character) {
      return `<section class="ability-section">
        <div class="ability-heading"><div><div class="section-title">Abilities by essence</div><div class="section-helper" style="margin-top:5px">Abilities are limited to one use per owner turn unless configured for more. Toggle abilities stay active until turned off; upkeep is charged at the end of each owner turn (6 seconds). Cost reductions apply normally on activation and at one-tenth strength per second to upkeep. Values marked “set on use” are entered when activated. Click afflictions for their glossary entry.</div></div><div class="section-helper">${character.abilities.length} personal abilities</div></div>
        <div class="essence-ability-groups">${character.essences.map((essence) => {
          const abilities = character.abilities.filter((ability) => essenceForAbility(character, ability) === essence);
          return `<div class="ability-group">
            <div class="ability-group-head"><span class="category-title">${escapeHtml(essence)}</span><span class="category-count">${abilities.length} abilities</span></div>
            <div class="ability-list">${abilities.length ? abilities.map((ability) => renderAbilityRow(character, ability)).join("") : '<div class="empty-note">No abilities assigned to this essence yet.</div>'}</div>
          </div>`;
        }).join("")}</div>
      </section>`;
    }

    function abilityCostLabel(field, ability) {
      if (field.startsWith("input:")) {
        const inputId = field.slice("input:".length);
        return ability.inputFields?.find((input) => input.id === inputId)?.label || inputId;
      }
      if (field.startsWith("resourceEffect:")) {
        const effectId = field.slice("resourceEffect:".length);
        const effect = (ability.resourceEffects || []).find((entry) => entry.id === effectId);
        const resource = effect?.resource;
        if (resource === "health") return "Health change (negative loses HP)";
        const label = resource ? resource[0].toUpperCase() + resource.slice(1) : "Resource";
        return `${label} change (negative spends)`;
      }
      return ({ mana: "Mana cost", stamina: "Stamina cost", cooldown: "Cooldown (turns)", summonMaxHealth: "Summon maximum health" })[field];
    }

    function renderAbilityRow(character, ability, isRacialGift = false) {
      const progress = state.characters[character.id];
      const selectedAbility = selectedAbilityFor(character, ability);
      const variantId = selectedAbility.id === ability.id ? null : selectedAbility.id;
      const stateKey = variantId ? `${ability.id}::${variantId}` : ability.id;
      const passive = isPassiveConfiguration(selectedAbility) && !abilityHasAnyTag(selectedAbility, ["Summon", "Familiar"]);
      const isManaTide = Boolean(selectedAbility.manaTide);
      const manaTideActive = isManaTide && state.manaTide?.active === true;
      const toggleable = selectedAbility.activeMode === "toggle";
      const toggleActive = toggleable && progress.activeAbilities?.[stateKey] === true;
      const invalidUpkeep = toggleable && !isValidAbilityUpkeep(selectedAbility);
      const manaCost = selectedAbility.mana;
      const staminaCost = selectedAbility.stamina;
      const manaEffect = getEffectiveAbilityCost(character, "mana", manaCost, selectedAbility);
      const staminaEffect = getEffectiveAbilityCost(character, "stamina", staminaCost, selectedAbility);
      const cooldown = progress.cooldowns[stateKey] || 0;
      const displayCooldown = isConfigurableAbilityValue(selectedAbility.cooldown) ? selectedAbility.cooldown : getEnhancedAbilityCooldown(character, ability, selectedAbility, selectedAbility.cooldown ?? 0);
      const activeTurns = progress.activeTurns[stateKey] || 0;
      const chargeRecharges = progress.chargeRecharges?.[stateKey] || [];
      const hasCharges = Number.isInteger(selectedAbility.charges) && selectedAbility.charges > 0 &&
        Number.isInteger(selectedAbility.recharge) && selectedAbility.recharge > 0;
      const availableCharges = hasCharges ? Math.max(0, selectedAbility.charges - chargeRecharges.length) : null;
      const crystalSummon = selectedAbility.crystalSummon;
      const effectiveCrystalLimit = crystalSummon
        ? getEnhancedAbilityQuantity(character, ability, selectedAbility, "crystalCount", crystalSummon.max)
        : 0;
      const crystals = crystalSummon ? progress.crystals?.[ability.id] || [] : [];
      const crystalLimitReached = Boolean(crystalSummon && crystals.length >= effectiveCrystalLimit);
      const usesPerTurn = Number.isInteger(selectedAbility.usesPerTurn) && selectedAbility.usesPerTurn > 0
        ? selectedAbility.usesPerTurn
        : 1;
      const usesThisTurn = progress.abilityUsesThisTurn?.[ability.id] || 0;
      const resourceExhausted = hasUnlockedPotential(character) && hasNegativeCastingResource(character);
      const configurableResourceEffects = (selectedAbility.resourceEffects || []).some((effect) =>
        isConfigurableAbilityValue(effect.amount)
      );
      const resourceCostsConfigurable = isConfigurableAbilityValue(manaCost) ||
        isConfigurableAbilityValue(staminaCost) ||
        configurableResourceEffects;
      const enoughResources = resourceCostsConfigurable || canPayAbilityResources(
        character,
        { mana: manaEffect.cost, stamina: staminaEffect.cost },
        selectedAbility.resourceEffects || []
      );
      const outOfCharges = hasCharges && availableCharges === 0;
      const nextChargeIn = outOfCharges ? Math.min(...chargeRecharges) : null;
      const turnUsesExhausted = usesThisTurn >= usesPerTurn;
      const disabled = passive || invalidUpkeep || (!toggleActive && (
        resourceExhausted || turnUsesExhausted || cooldown > 0 || activeTurns > 0 || outOfCharges || crystalLimitReached || !enoughResources ||
        (isManaTide && manaTideActive)
      ));
      const reason = isManaTide && manaTideActive
        ? `Affects the party · round ${state.manaTide.roundsElapsed + 1}/${selectedAbility.manaTide.durationRounds}`
        : invalidUpkeep ? "Invalid upkeep configuration" : passive || toggleActive ? "" : resourceExhausted ? "Too exhausted to cast: mana and stamina must be nonnegative" : turnUsesExhausted ? "Uses for this turn spent" : activeTurns > 0 ? `Active for ${activeTurns} more turn${activeTurns === 1 ? "" : "s"}` : cooldown > 0 ? `Ready in ${cooldown} turn${cooldown === 1 ? "" : "s"}` : crystalLimitReached ? `Maximum of ${effectiveCrystalLimit} crystals summoned` : outOfCharges ? `Next use in ${nextChargeIn} turn${nextChargeIn === 1 ? "" : "s"}` : !enoughResources ? "Not enough mana or stamina" : "";
      const manaTooltip = manaEffect.sources.length ? ` title="Reduced by ${escapeHtml(manaEffect.sources.join(", "))}"` : "";
      const staminaTooltip = staminaEffect.sources.length ? ` title="Reduced by ${escapeHtml(staminaEffect.sources.join(", "))}"` : "";
      const resourceEffectChips = (selectedAbility.resourceEffects || []).map((effect) => {
        const resource = effect.resource[0].toUpperCase() + effect.resource.slice(1);
        const amount = isConfigurableAbilityValue(effect.amount) ? "set on use" : `+${effect.amount}`;
        return `<span class="cost-chip active-chip">${escapeHtml(resource)} ${escapeHtml(amount)}</span>`;
      }).join("");
      const manaTideChip = isManaTide && manaTideActive
        ? `<span class="cost-chip active-chip">◉ Active · Tide round ${state.manaTide.roundsElapsed + 1}/${selectedAbility.manaTide.durationRounds} · your recovery +${Number(manaTideRecoveryBonus(character).toFixed(2))}/turn</span>`
        : "";
      const upkeepChips = toggleable && isValidAbilityUpkeep(selectedAbility)
        ? Object.entries(selectedAbility.upkeep || {}).filter(([, amount]) => amount > 0).map(([resource, amount]) => {
          const effect = getEffectiveAbilityUpkeep(character, resource, amount, selectedAbility);
          const label = resource[0].toUpperCase() + resource.slice(1);
          const tooltip = effect.sources.length ? ` title="Upkeep reduction: ${escapeHtml(effect.sources.join(", "))}"` : "";
          return `<span class="cost-chip active-chip"${tooltip}>◈ ${escapeHtml(String(effect.cost))} ${label}/turn${effect.reduction ? ` (was ${amount})` : ""}</span>`;
        }).join("")
        : invalidUpkeep ? '<span class="cost-chip cooldown">Invalid upkeep configuration</span>' : "";
      const costs = passive ? '<span class="cost-chip passive-chip">Passive</span>' : [
        isConfigurableAbilityValue(manaCost) ? `<span class="cost-chip"${manaTooltip}>◈ Mana: set on use${manaEffect.reduction ? ` (-${manaEffect.reduction})` : ""}</span>` : manaCost > 0 ? `<span class="cost-chip"${manaTooltip}>◈ ${manaEffect.cost} mana${manaEffect.reduction ? ` (was ${manaCost})` : ""}</span>` : "",
        isConfigurableAbilityValue(staminaCost) ? `<span class="cost-chip stamina"${staminaTooltip}>⌁ Stamina: set on use${staminaEffect.reduction ? ` (-${staminaEffect.reduction})` : ""}</span>` : staminaCost > 0 ? `<span class="cost-chip stamina"${staminaTooltip}>⌁ ${staminaEffect.cost} stamina${staminaEffect.reduction ? ` (was ${staminaCost})` : ""}</span>` : "",
        isConfigurableAbilityValue(displayCooldown) ? '<span class="cost-chip cooldown">↻ Cooldown: set on use</span>' : displayCooldown > 0 ? `<span class="cost-chip cooldown">↻ ${displayCooldown} turn${displayCooldown === 1 ? "" : "s"} CD</span>`: "",
        selectedAbility.duration > 0 ? `<span class="cost-chip active-chip">◉ ${selectedAbility.duration} turn${selectedAbility.duration === 1 ? "" : "s"} active</span>` : "",
        toggleActive ? '<span class="cost-chip active-chip">◉ Active until turned off</span>' : "",
        manaTideChip,
        upkeepChips,
        hasCharges ? `<span class="cost-chip cooldown">↻ ${availableCharges}/${selectedAbility.charges} uses${chargeRecharges.length ? ` · next in ${Math.min(...chargeRecharges)} turn${Math.min(...chargeRecharges) === 1 ? "" : "s"}` : ""}</span>` : "",
        crystalSummon ? `<span class="cost-chip active-chip">✧ ${crystals.length}/${crystalSummon.max} crystals</span>` : "",
        usesPerTurn > 1 ? `<span class="cost-chip cooldown">↻ ${usesPerTurn} uses per turn</span>` : "",
        resourceEffectChips,
        selectedAbility.boostEnhancement ? `<span class="cost-chip active-chip">Boost ready · ${progress.boostUses || 0}/2</span>` : "",
        (progress.boostedAbilityUses?.[selectedAbility.id] || 0) > 0 ? `<span class="cost-chip active-chip">Boost applied</span>` : ""
      ].filter(Boolean).join("");
      const orbControls = selectedAbility.orbSummon ? `<div class="orb-list">${(progress.burningOrbs || []).map((orb, index) => `<div class="orb-item"><span>Burning Orb ${index + 1}</span><button class="button subtle" data-burning-orb-attack="${escapeHtml(orb.id)}" ${orb.usedThisTurn ? "disabled" : ""}>${orb.usedThisTurn ? "Attacked this turn" : "Attack · 2D10 + Magic dice"}</button></div>`).join("") || '<span class="section-helper">Use Burning Orbs to summon three attack orbs.</span>'}</div>` : "";
      const shieldTargetControl = selectedAbility.shieldTarget === "any" ? `<label class="shield-target"><span class="section-helper">Shield target</span><select data-shield-target="${escapeHtml(ability.id)}">${CHARACTERS.map((target) => `<option value="${escapeHtml(target.id)}" ${target.id === character.id ? "selected" : ""}>${escapeHtml(target.name)}</option>`).join("")}</select></label>` : "";
      const darknessControl = selectedAbility.proximityToggle ? `<div class="darkness-control"><span class="section-helper">Ally adjacent: ${state.characters[character.id].adjacentAlly ? "Yes (−1D8)" : "No (+1D8)"}</span><button class="button subtle" data-proximity-toggle>${state.characters[character.id].adjacentAlly ? "Set no ally adjacent" : "Set ally adjacent"}</button></div>` : "";
      const shieldRemoveControls = (progress.shields || []).filter((entry) => entry.abilityId === ability.id).map((entry) => `<button class="button subtle" data-remove-shield="${escapeHtml(entry.id)}">Remove shield from ${escapeHtml(characterById(entry.targetCharacterId)?.name || "target")}</button>`).join("");
      const crystalControls = crystalSummon ? `<div class="crystal-list">${crystals.map((crystal, index) =>
        `<div class="crystal-item"><span>Crystal ${index + 1} · ${crystal.disabledTurns > 0 ? `disabled (${crystal.disabledTurns} turn${crystal.disabledTurns === 1 ? "" : "s"} left)` : "active"}</span><div class="crystal-actions">${crystal.disabledTurns > 0
          ? ""
          : `<button class="button subtle" data-disable-crystal="${escapeHtml(crystal.id)}" data-crystal-ability="${escapeHtml(ability.id)}">Disable for ${crystalSummon.disableTurns} turns</button>`
        }<button class="button subtle" data-dispel-crystal="${escapeHtml(crystal.id)}" data-crystal-ability="${escapeHtml(ability.id)}">Dispel (+50 mana)</button></div></div>`
      ).join("")}</div>` : "";
      const tags = (selectedAbility.tags || []).filter((tag) => tag !== "passive" && !tag.startsWith("variant:"))
        .map((tag) => `<span class="ability-tag">#${escapeHtml(tag)}</span>`).join("");
      const variants = ability.variants || [];
      const chosenVariantId = state.variantSelection[character.id]?.[ability.id] || "";
      const variantControl = variants.length ? `<label><span class="section-helper">Variant </span><select class="variant-select" data-variant-character="${escapeHtml(character.id)}" data-variant-ability="${escapeHtml(ability.id)}" aria-label="${escapeHtml(ability.name)} variant"><option value="">Standard</option>${variants.map((variant) => `<option value="${escapeHtml(variant.id)}" ${variant.id === chosenVariantId ? "selected" : ""}>${escapeHtml(variant.name)}</option>`).join("")}</select></label>` : "";
      const abilityButton = toggleable
        ? `<button class="button ${toggleActive || !disabled ? "primary" : ""}" data-toggle-ability="${escapeHtml(ability.id)}" ${disabled ? "disabled" : ""}>${toggleActive ? "Turn off" : "Activate"}</button>`
        : isManaTide
          ? `<button class="button ${disabled ? "" : "primary"}" data-use-ability="${escapeHtml(ability.id)}" ${disabled ? "disabled" : ""}>${manaTideActive ? "Mana Tide active" : "Begin Mana Tide"}</button>`
        : `<button class="button ${disabled ? "" : "primary"}" data-use-ability="${escapeHtml(ability.id)}" ${disabled ? "disabled" : ""}>${turnUsesExhausted ? "Uses spent this turn" : usesThisTurn > 0 ? `Use again (${usesThisTurn}/${usesPerTurn})` : activeTurns > 0 ? "Active" : cooldown > 0 ? "Cooling down" : isRacialGift ? "Use gift" : "Use ability"}</button>`;
      const attackButtons = abilityAttacks(selectedAbility).map((attack) => {
        const validConfiguration = isValidAttackConfiguration(character, selectedAbility, attack);
        const stats = Array.isArray(attack.stats) ? attack.stats.map(statDisplayName).join(" + ") : "Invalid stats";
        return `<button class="button subtle" title="${escapeHtml(stats)}" data-ability-attack="${escapeHtml(ability.id)}" data-ability-attack-id="${escapeHtml(attack.id)}" ${validConfiguration ? "" : "disabled"}>${escapeHtml(attack.name)}</button>`;
      }).join("");
      return `<div class="ability-row">
        <div>${variantControl}<div class="ability-name">${escapeHtml(ability.name)}</div>${renderAbilityDescription(selectedAbility)}<div class="ability-costs">${costs}</div><div class="ability-tags">${tags}</div>${crystalControls}${orbControls}${shieldTargetControl}${darknessControl}${shieldRemoveControls}</div>
        <div class="ability-action">${attackButtons}${passive ? '<span class="passive-label">PASSIVE</span>' : `${abilityButton}${reason ? `<span class="disabled-reason">${reason}</span>` : ""}`}</div>
      </div>`;
    }

    function renderRacialGifts(character) {
      const gifts = character.racialGifts || [];
      if (!gifts.length) return "";
      return `<section class="ability-section racial-gifts-section">
        <div class="ability-heading"><div><div class="section-title">Racial gifts</div><div class="section-helper" style="margin-top:5px">Innate abilities cost no mana or stamina; tag a gift “passive” to apply it continuously without a use button.</div></div><div class="section-helper">${gifts.length} configured</div></div>
        <div class="ability-group"><div class="ability-list">${gifts.map((gift) => renderAbilityRow(character, gift, true)).join("")}</div></div>
      </section>`;
    }

    // A configured summary wins; otherwise the first sentence (capped for the compact view) is used.
    function abilitySummary(ability) {
      if (ability.summary) return ability.summary;
      const firstSentence = String(ability.description || "").split(/(?<=[.!?])\s+/)[0];
      return firstSentence.length > 140 ? `${firstSentence.slice(0, 137).trimEnd()}...` : firstSentence;
    }

    function renderDescriptionWithAfflictions(description) {
      const text = String(description || "");
      const tokenPattern = /\[([^\]]+)\]/g;
      let output = "";
      let previousIndex = 0;
      for (const match of text.matchAll(tokenPattern)) {
        output += escapeHtml(text.slice(previousIndex, match.index));
        const term = match[1].trim();
        const key = term.toLowerCase();
        output += `<button class="affliction-link" data-glossary="${escapeHtml(key)}" type="button">[${escapeHtml(term)}]</button>`;
        previousIndex = match.index + match[0].length;
      }
      return output + escapeHtml(text.slice(previousIndex));
    }

    function renderAbilityDescription(ability) {
      const description = String(ability.description || "");
      return `<details class="ability-description-details">
        <summary><span class="ability-summary">${escapeHtml(abilitySummary(ability))}</span><span class="description-cue" aria-label="Toggle full description"></span></summary>
        <p class="ability-full-description">${renderDescriptionWithAfflictions(description)}</p>
      </details>`;
    }

    // Keep supporting legacy category names while new ability data uses the character's essences.
    function essenceForAbility(character, ability) {
      if (character.essences.includes(ability.category)) return ability.category;
      const legacyCategoryIndex = CATEGORIES.indexOf(ability.category);
      return legacyCategoryIndex >= 0 ? character.essences[legacyCategoryIndex] : null;
    }

    function selectedAbilityFor(character, ability) {
      const selectedId = state.variantSelection[character.id]?.[ability.id];
      const variant = (ability.variants || []).find((entry) => entry.id === selectedId);
      if (!variant) return ability;
      return {
        ...ability,
        ...variant,
        ...(variant.activeVersion ? {
          statEffects: variant.statEffects || [],
          resourceEffects: variant.resourceEffects || [],
          afflictionEffects: variant.afflictionEffects || [],
          manaTide: variant.manaTide
        } : {}),
        tags: [...new Set([...(ability.tags || []), ...(variant.tags || [])])]
      };
    }

    function isPassiveConfiguration(ability) {
      return ability.tags?.includes("passive") && ability.activeVersion !== true;
    }

    function configurableAbilityFields(ability, isRacialGift) {
      return [
        ...(isConfigurableAbilityValue(ability.mana) ? ["mana"] : []),
        ...(isConfigurableAbilityValue(ability.stamina) ? ["stamina"] : []),
        ...(isConfigurableAbilityValue(ability.cooldown) ? ["cooldown"] : []),
        ...(ability.inputFields || []).map((field) => `input:${field.id}`),
        ...(ability.resourceEffects || [])
          .filter((effect) => isConfigurableAbilityValue(effect.amount))
          .map((effect) => `resourceEffect:${effect.id}`),
        ...(ability.afflictionEffects || [])
          .filter((effect) => effect.selectPlayers === true)
          .map((effect) => `targetPlayers:${effect.id}`),
        ...(ability.healingEffect?.selectTarget === true ? ["healingTarget"] : []),
        ...(abilityHasAnyTag(ability, ["Summon", "Familiar"]) ? ["summonMaxHealth"] : [])
      ];
    }
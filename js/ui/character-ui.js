    function renderRoster() {
      document.getElementById("roster-count").textContent = CHARACTERS.length;
      document.getElementById("roster").innerHTML = CHARACTERS.map((character) => {
        const isCurrent = getCurrentCharacter().id === character.id;
        return `<button class="nav-button ${state.selectedId === character.id && state.view === "sheet" ? "active" : ""}" data-character="${character.id}">
          ${avatarStyle(character)}
          <span class="roster-person"><span class="roster-name">${escapeHtml(character.name)}</span><span class="roster-class">${escapeHtml(characterSummary(character))}</span></span>
          ${isCurrent ? '<span class="turn-indicator">Turn</span>' : ""}
        </button>`;
      }).join("");
    }

    function renderSummary() {
      const allResources = CHARACTERS.flatMap((character) => {
        const current = state.characters[character.id].resources;
        return Object.keys(character.resources).map((resource) => current[resource] / character.resources[resource]);
      });
      const average = Math.round((allResources.reduce((sum, value) => sum + value, 0) / allResources.length) * 100);
      const totalAbilities = CHARACTERS.reduce((total, character) => total + allCharacterAbilities(character).length, 0);
      const current = getCurrentCharacter();
      return `<div class="summary-grid">
        <article class="summary-card"><div class="summary-top"><span class="summary-label">Party members</span><span class="summary-icon">♙</span></div><div class="summary-value">${CHARACTERS.length}</div><div class="summary-foot">Adventurers in the party</div></article>
        <article class="summary-card"><div class="summary-top"><span class="summary-label">Party rotation</span><span class="summary-icon">◷</span></div><div class="summary-value">${state.turn}</div><div class="summary-foot">Advances after everyone takes a turn</div></article>
        <article class="summary-card"><div class="summary-top"><span class="summary-label">Next in order</span><span class="summary-icon">➜</span></div><div class="summary-value" style="font-size:20px">${escapeHtml(current.name.split(" ")[0])}</div><div class="summary-foot">${escapeHtml(characterSummary(current))}</div></article>
        <article class="summary-card"><div class="summary-top"><span class="summary-label">Party resources</span><span class="summary-icon">◈</span></div><div class="summary-value">${average}<span style="font:12px system-ui;color:var(--muted)">%</span></div><div class="summary-foot">${totalAbilities} abilities ready to track</div></article>
      </div>`;
    }

    function renderPlayerCard(character) {
      const current = getCurrentCharacter().id === character.id;
      return `<article class="player-card ${current ? "current-turn" : ""}" data-open-character="${character.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(character.name)}'s character sheet">
        <div class="player-card-head">
          ${avatarStyle(character)}
          <div class="player-card-info"><div class="player-card-name">${escapeHtml(character.name)}</div><div class="player-card-class">${escapeHtml(characterSummary(character))}</div></div>
          ${current ? '<span class="turn-tag">CURRENT TURN</span>' : ""}
        </div>
        <div class="card-bars">
          ${resourceBar(character, "health", "Health")}
          ${resourceBar(character, "mana", "Mana")}
          ${resourceBar(character, "stamina", "Stamina")}
        </div>
        <div class="essence-list card-essences" aria-label="Essences">${character.essences.map((essence) => `<span class="essence-chip">${escapeHtml(essence)}</span>`).join("")}</div>
        <div class="quick-stats">
          <div class="quick-stat"><b>${renderStatValue(character, "physicalAttack")}</b><span>Phys. atk</span></div>
          <div class="quick-stat"><b>${renderStatValue(character, "magic")}</b><span>Magic</span></div>
          <div class="quick-stat"><b>${renderStatValue(character, "speed")}</b><span>Speed</span></div>
        </div>
      </article>`;
    }

    function renderOverview() {
      return `<div class="page-head"><div><div class="eyebrow">Campaign dashboard</div><h1>The party at a glance</h1><p class="subtitle">A clear view of your adventurers, their resources, and what comes next.</p></div><button class="button" data-action="confirm-reset">↻ <span>Reset session</span></button></div>
        ${turnBanner()}
        ${renderSummary()}
        <section>
          <div class="section-head"><div class="section-title">Adventuring party</div><div class="section-helper">Select a character to open their full sheet</div></div>
          <div class="player-grid">${CHARACTERS.map(renderPlayerCard).join("")}</div>
        </section>`;
    }

   // Keep the requested stat pairings together as columns, not row-major grid cells.
    function renderCoreStats(character) {
      const columns = [
        [["manaRecovery", "Mana recovery / turn"], ["staminaRecovery", "Stamina recovery / turn"]],
        [["physicalAttack", "Physical attack"], ["damageResistance", "Damage resistance"]],
        [["magic", "Magic"], ["magicResistance", "Magic resistance"]],
        [["reflexes", "Reflexes"], ["speed", "Speed"]]
      ];
      return `<div class="stat-columns">${columns.map((column) =>
        `<div class="stat-column">${column.map(([stat, label]) => statTile(character, stat, label)).join("")}</div>`
      ).join("")}</div>`;
    }

    function renderCharacterCollection(character, field, title) {
      const entries = Array.isArray(character[field]) ? character[field] : [];
      const rows = entries
        .filter((entry) => entry && typeof entry.name === "string")
        .map((entry) => `<div class="ability-row equipment-row">
          <div><div class="ability-name">${escapeHtml(entry.name)}</div>${entry.description ? `<div class="ability-description">${escapeHtml(entry.description)}</div>` : ""}</div>
        </div>`)
        .join("");
      return `<section class="ability-section">
        <div class="ability-heading"><div class="section-title">${escapeHtml(title)}</div><div class="section-helper">${entries.length} configured</div></div>
        <div class="ability-group"><div class="ability-list">${rows || `<div class="empty-note">No ${escapeHtml(title.toLowerCase())} configured for this character yet.</div>`}</div></div>
      </section>`;
    }

    function renderSheet() {
      const character = getSelectedCharacter();
      const next = CHARACTERS[(state.turnIndex + 1) % CHARACTERS.length];
      return `<div class="page-head"><div><div class="eyebrow">Character sheet · ${escapeHtml(character.rank)}</div><h1>${escapeHtml(character.name)}</h1><p class="subtitle">${escapeHtml(characterSummary(character))}</p></div><button class="button" data-action="confirm-reset">↻ <span>Reset session</span></button></div>
        <div class="sheet-layout">
          <div class="sheet-main">
            <div class="identity-card">
              ${avatarStyle(character, "identity-avatar")}
              <div class="identity-info"><div class="identity-name">${escapeHtml(character.name)}</div><div class="identity-sub">${escapeHtml(characterSummary(character))}</div><div class="essence-list">${character.essences.map((essence) => `<span class="essence-chip">${escapeHtml(essence)}</span>`).join("")}</div></div>
              ${getCurrentCharacter().id === character.id ? '<span class="turn-tag">CURRENT TURN</span>' : ""}
            </div>
            <section class="panel resource-panel">
              <div class="section-head" style="margin:0"><div class="section-title">Resources</div><label class="resource-adjustment">Adjust by <input type="number" min="1" step="1" inputmode="numeric" value="${escapeHtml(resourceAdjustmentAmount)}" data-resource-adjustment aria-label="Resource adjustment amount"></label></div>
              <div class="resource-list">
                ${resourceControl(character, "health", "Health")}
                ${resourceControl(character, "mana", "Mana")}
                ${resourceControl(character, "stamina", "Stamina")}
              </div>
            </section>
            <section class="panel stats-panel">
              <div class="section-head" style="margin:0"><div class="section-title">Core stats</div><div class="section-helper">Configured stats</div></div>
              <div class="core-stats">
                ${renderCoreStats(character)}
              </div>
            </section>
          </div>
          <aside class="sheet-aside">
            <section class="panel aside-panel">
              <div class="aside-heading">Turn order</div>
              <div class="next-turn">${avatarStyle(getCurrentCharacter())}<div><div class="next-name">${escapeHtml(getCurrentCharacter().name)}</div><div class="next-label">Current · Round ${state.turn}</div></div></div>
              <div class="next-turn" style="margin-top:12px">${avatarStyle(next)}<div><div class="next-name">${escapeHtml(next.name)}</div><div class="next-label">Up next</div></div></div>
              <div class="turn-actions"><button class="button primary" data-action="end-turn">End ${escapeHtml(character.name.split(" ")[0])}'s turn →</button><button class="button subtle" data-action="confirm-reset">↻ Reset session</button></div>
              <div class="regen-note">Ending the current turn restores mana and stamina, then reduces that character’s cooldowns. Active durations count down on the owner’s turns; cooldowns pause until an effect expires.</div>
            </section>
            <section class="panel aside-panel">
              <div class="aside-heading">Session</div>
              <div class="next-turn"><div class="turn-symbol" style="width:32px;height:32px">◷</div><div><div class="next-name">Round ${state.turn}</div><div class="next-label">Full party rotation counter</div></div></div>
              <div class="regen-note">Progress is saved in this browser automatically. Reset restores the party’s configured starting resources.</div>
            </section>
          </aside>
        </div>
        ${renderRacialGifts(character)}
        ${renderAbilities(character)}
        ${renderEquipment(character)}
        ${renderCharacterCollection(character, "titles", "Titles")}
        ${renderCharacterCollection(character, "inventory", "Inventory")}`;
    }

    function turnBanner() {
      const current = getCurrentCharacter();
      return `<div class="turn-banner">
        <div class="turn-left"><div class="turn-symbol" aria-hidden="true">◷</div><div>
          <div class="turn-label">It is their turn</div><div class="turn-player">${escapeHtml(current.name)} <span class="turn-meta">· ${escapeHtml(characterSummary(current))}</span></div>
        </div></div>
        <button class="button primary" data-action="end-turn">End turn <span aria-hidden="true">→</span></button>
      </div>`;
    }



    function resourceControl(character, key, label) {
      const current = state.characters[character.id].resources[key];
      const maximum = getResourceMaximum(character, key);
      return `<div class="resource-row">
        <div class="resource-title">${label}<small>Max ${maximum}</small></div>
        <div class="resource-track" aria-label="${label} ${current} of ${maximum}"><div class="resource-fill ${key}" style="width:${resourcePercent(character, key)}%"></div></div>
        <div class="resource-controls">
          <button class="mini-button" data-resource="${key}" data-delta="-1" aria-label="Decrease ${label} by adjustment amount">−</button>
          <span class="resource-number">${current} / ${maximum}</span>
          <button class="mini-button" data-resource="${key}" data-delta="1" aria-label="Increase ${label} by adjustment amount">+</button>
        </div>
      </div>`;
    }

    function statTile(character, stat, label) {
      return `<div class="stat-tile"><div class="stat-value">${renderStatValue(character, stat)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`;
    }

    function renderEquipment(character) {
      const equipment = character.equipment || [];
      const equippedIds = new Set(state.characters[character.id].equippedEquipment || []);
      const rows = equipment.length ? equipment.map((item) => {
        const equipped = equippedIds.has(item.id);
        const effects = (item.statEffects || []).map((effect) => {
          const label = effect.stat.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
          const bonus = /^[+-]/.test(effect.bonus) ? effect.bonus : `+${effect.bonus}`;
          return `<span class="cost-chip active-chip">${escapeHtml(label)} ${escapeHtml(bonus)}</span>`;
        }).join("");
        const attacks = item.type === "weapon" ? equipmentAttacks(item) : [];
        const needsPartyTarget = (item.afflictionEffects || []).some((effect) =>
          ["selected", "wielder-and-selected"].includes(effect.target)
        );
        const targetPicker = needsPartyTarget
          ? `<label class="section-helper">Target <select class="variant-select" data-equipment-target="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} target">${CHARACTERS.filter((target) => target.id !== character.id).map((target) =>
            `<option value="${escapeHtml(target.id)}">${escapeHtml(target.name)}</option>`
          ).join("")}</select></label>`
          : "";
        const attackOptions = attacks.map((attack) => {
          const validConfiguration = isValidAttackConfiguration(character, item, attack) &&
            (item.afflictionEffects || []).every(isValidWeaponAfflictionEffect);
          return `<div class="equipment-attack-option"><span class="section-helper">${escapeHtml(equipmentAttackSummary(character, item, attack))}</span>${equipped ? `${targetPicker}<button class="button primary" data-equipment-attack="${escapeHtml(item.id)}" data-equipment-attack-id="${escapeHtml(attack.id)}" ${validConfiguration ? "" : "disabled"}>${escapeHtml(attack.name)}</button>` : ""}</div>`;
        }).join("");
        const description = item.description
          ? renderAbilityDescription(item)
          : item.summary ? `<div class="ability-description">${escapeHtml(item.summary)}</div>` : "";
        return `<div class="ability-row equipment-row">
          <div><div class="equipment-title"><span class="ability-name">${escapeHtml(item.name)}</span>${item.type ? `<span class="equipment-type">${escapeHtml(item.type)}</span>` : ""}${equipped ? '<span class="equipment-status">Equipped</span>' : ""}</div>${description}<div class="ability-costs">${effects}</div></div>
          <div class="equipment-actions"><button class="button ${equipped ? "" : "primary"}" data-equipment-toggle="${escapeHtml(item.id)}" aria-pressed="${equipped}">${equipped ? "Unequip" : "Equip"}</button>${equipped ? attackOptions : ""}</div>
        </div>`;
      }).join("") : '<div class="empty-note">No equipment configured for this character yet.</div>';
      const recentAttacks = (state.equipmentAttackLog || []).slice(-5).reverse().map((entry) => {
        const owner = characterById(entry.characterId);
        const item = owner?.equipment?.find((configuredItem) => configuredItem.id === entry.equipmentId);
        const attack = item && equipmentAttacks(item).find((configuredAttack) =>
          configuredAttack.id === (entry.attackId || "default")
        );
        return owner && item && attack
          ? `<div class="equipment-attack-entry">Round ${entry.turn}: ${escapeHtml(owner.name)} uses ${escapeHtml(attack.name)} with ${escapeHtml(item.name)} — ${escapeHtml(entry.damageSummary || equipmentAttackSummary(owner, item, attack))}.</div>`
          : "";
      }).join("");
      return `<section class="ability-section equipment-section">
        <div class="ability-heading"><div><div class="section-title">Equipment</div><div class="section-helper" style="margin-top:5px">Equip items independently. Equipped stat bonuses are applied to this sheet; weapon attacks use the selected stat and modifier and are recorded without damage tracking.</div></div><div class="section-helper">${equipment.length} configured</div></div>
        <div class="ability-group"><div class="ability-list">${rows}</div>${recentAttacks ? `<div class="equipment-attack-log" aria-live="polite">${recentAttacks}</div>` : ""}</div>
      </section>`;
    }



    function renderBuffs() {
      const characterOptions = CHARACTERS.map((character) =>
        `<option value="${escapeHtml(character.id)}" ${character.id === state.selectedId ? "selected" : ""}>${escapeHtml(character.name)}</option>`
      ).join("");
      const afflictionOptions = Object.entries(AFFLICTION_GLOSSARY).map(([id, entry]) =>
        `<option value="${escapeHtml(id)}">${escapeHtml(entry.name)}</option>`
      ).join("");
      const characterSections = CHARACTERS.map((character) => {
        const entries = state.activeAfflictions.filter((entry) => entry.characterId === character.id);
        const rows = entries.map((entry) => {
          const affliction = AFFLICTION_GLOSSARY[entry.afflictionId] || {
            name: entry.afflictionId,
            description: "Unknown affliction."
          };
          const duration = entry.remainingTurns === null ? "No expiry" : `${entry.remainingTurns} turn${entry.remainingTurns === 1 ? "" : "s"} remaining`;
          const source = entry.source ? ` · ${entry.source}` : "";
          return `<div class="affliction-entry">
            <div><div class="affliction-entry-name">${escapeHtml(affliction.name)} <span class="section-helper">×${entry.stacks}</span></div><div class="affliction-entry-detail">${escapeHtml(affliction.description)}<br>${escapeHtml(duration + source)}</div></div>
            <div class="affliction-entry-actions"><button class="mini-button" data-affliction-remove="${escapeHtml(entry.id)}" aria-label="Remove one ${escapeHtml(affliction.name)} stack from ${escapeHtml(character.name)}">−</button><span class="affliction-count">${entry.stacks} stack${entry.stacks === 1 ? "" : "s"}</span><button class="button subtle" data-affliction-clear="${escapeHtml(entry.id)}">Remove</button></div>
          </div>`;
        }).join("");
        return `<section class="affliction-player">
          <div class="affliction-player-head">${avatarStyle(character)}<div class="section-title">${escapeHtml(character.name)}</div><span class="section-helper">${entries.reduce((total, entry) => total + entry.stacks, 0)} active stacks</span></div>
          ${rows || '<div class="empty-note">No active buffs or afflictions.</div>'}
        </section>`;
      }).join("");
      return `<div class="page-head"><div><div class="eyebrow">Campaign effects</div><h1>Buffs &amp; Afflictions</h1><p class="subtitle">Track effects for the whole party. Durations decrease at the end of each affected character’s turn; entries without a duration remain until removed.</p></div></div>
        <section class="ability-section">
          <div class="ability-heading"><div><div class="section-title">Apply an affliction</div><div class="section-helper" style="margin-top:5px">Add or remove stacks for any player. Leave duration blank for a permanent effect.</div></div></div>
          <form class="affliction-form" data-add-affliction>
            <label>Character<select name="characterId">${characterOptions}</select></label>
            <label>Buff or affliction<select name="afflictionId">${afflictionOptions}</select></label>
            <label>Stacks<input type="number" name="stacks" min="1" max="999" step="1" value="1" required></label>
            <label>Duration (turns)<input type="number" name="duration" min="1" max="999" step="1" placeholder="No expiry"></label>
            <button class="button primary" type="submit">Apply</button>
          </form>
        </section>
        <section class="ability-section">
          <div class="ability-heading"><div><div class="section-title">Party effects</div><div class="section-helper" style="margin-top:5px">Stat effects configured on afflictions are reflected on character sheets and the DM overview.</div></div></div>
          ${characterSections}
        </section>`;
    }
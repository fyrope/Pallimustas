    function showResetConfirmation() {
      const root = document.getElementById("modal-root");
      root.innerHTML = `<div class="modal-backdrop" data-dismiss-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <h2 id="reset-title">Reset this session?</h2>
          <p>All players’ resources, ability uses, cooldowns, toggle abilities, active stat effects, buffs, afflictions, and Mana Tide progress will return to their starting values. The turn counter will also reset. This cannot be undone.</p>
          <div class="modal-actions"><button class="button" data-action="cancel-reset">Keep playing</button><button class="button primary" data-action="reset">Reset session</button></div>
        </section></div>`;
      root.querySelector("[data-action='cancel-reset']").focus();
    }

    function showAfflictionGlossary(key) {
      const entry = AFFLICTION_GLOSSARY[key];
      const title = entry?.name || key;
      const description = entry?.description || "No glossary description has been configured for this affliction yet.";
      const root = document.getElementById("modal-root");
      root.innerHTML = `<div class="modal-backdrop" data-dismiss-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="glossary-title">
          <button class="modal-close" data-action="close-glossary" aria-label="Close glossary">×</button>
          <h2 id="glossary-title">${escapeHtml(title)}</h2>
          <p>${escapeHtml(description)}</p>
        </section></div>`;
      root.querySelector("[data-action='close-glossary']").focus();
    }

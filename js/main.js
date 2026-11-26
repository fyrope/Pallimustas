    // Firebase web app config is public. Realtime Database also needs its databaseURL.
    // Copy that URL from Firebase Console > Realtime Database; it is not the Hosting URL.
    const STORAGE_KEY = "pallimustas-campaign-v1";
    const FIREBASE_CONFIG = {
      apiKey: "AIzaSyDzpQXX4IoMuPD_Ka04gslAdYJ23wpj22A",
      authDomain: "pallimustas.firebaseapp.com",
      databaseURL: "https://pallimustas-default-rtdb.asia-southeast1.firebasedatabase.app/",
      projectId: "pallimustas",
      storageBucket: "pallimustas.firebasestorage.app",
      messagingSenderId: "954075035758",
      appId: "1:954075035758:web:15926921cb89ba85ad8e7f",
      measurementId: "G-4SD6H7LF9F"
    };
    // Keep this path identical on every device. Anyone who can access a public app using
    // anonymous sign-in can access its campaign, so don't store private player information.
    const FIREBASE_CAMPAIGN_PATH = "campaigns/pallimustas-main";

    // Build clean defaults from the code-configured roster and each character's own abilities.
    function createInitialCampaign() {
      return {
        turn: 1,
        turnIndex: 0,
        initiativeScores: Object.fromEntries(CHARACTERS.map((character) => [character.id, null])),
        absentCharacterIds: [],
        selectedId: CHARACTERS[0].id,
        view: "overview",
        variantSelection: {},
        activeStatEffects: [],
        activeAfflictions: [],
        afflictionSequence: 0,
        crystalSequence: 0,
        summonSequence: 0,
        equipmentAttackLog: [],
        manaTide: { active: false, roundsElapsed: 0, spentByCharacter: {} },
        characters: Object.fromEntries(CHARACTERS.map((character) => [
          character.id,
          {
            resources: { ...character.resources },
            cooldowns: Object.fromEntries(abilityConfigurationKeys(character).map((key) => [key, 0])),
            activeTurns: Object.fromEntries(abilityConfigurationKeys(character).map((key) => [key, 0])),
            activeAbilities: Object.fromEntries(allCharacterAbilities(character).flatMap((ability) =>
              [ability, ...(ability.variants || [])]
                .filter((configuration) => configuration.activeMode === "toggle")
                .map((configuration) => [abilityStateKey(ability, configuration === ability ? null : configuration), false])
            )),
            chargeRecharges: Object.fromEntries(abilityConfigurationKeys(character).map((key) => [key, []])),
            crystals: Object.fromEntries(allCharacterAbilities(character)
              .filter((ability) => ability.crystalSummon)
              .map((ability) => [ability.id, []])),
            summons: [],
            burningOrbs: [],
            shields: [],
            boostUses: 0,
            boostedAbilityUses: {},
            adjacentAlly: false,
            abilityUsesThisTurn: Object.fromEntries(allCharacterAbilities(character).map((ability) => [ability.id, 0])),
            afflictionApplicationsThisTurn: {},
            equippedEquipment: []
          }
        ]))
      };
    }

    // Merge configured campaign progress and reject effects that no longer match the code setup.
    function mergeCampaignProgress(parsed) {
      const initial = createInitialCampaign();
      if (!parsed || typeof parsed !== "object") return initial;
      // Merge saved progress with today's character/ability setup, ignoring removed entries.
      for (const character of CHARACTERS) {
        const savedCharacter = parsed.characters?.[character.id];
        if (savedCharacter?.resources) {
          for (const key of Object.keys(character.resources)) {
            if (Number.isFinite(savedCharacter.resources[key])) {
              initial.characters[character.id].resources[key] = Math.max(
                minimumResourceValue(character, key),
                Math.min(character.resources[key], savedCharacter.resources[key])
              );
            }
          }
        }
        if (Array.isArray(savedCharacter?.equippedEquipment)) {
          const configuredItemIds = new Set((character.equipment || []).map((item) => item.id));
          initial.characters[character.id].equippedEquipment = [...new Set(
            savedCharacter.equippedEquipment.filter((itemId) => configuredItemIds.has(itemId))
          )];
        }
        if (savedCharacter?.cooldowns) {
          for (const key of abilityConfigurationKeys(character)) {
            const cooldown = savedCharacter.cooldowns[key];
            if (Number.isFinite(cooldown)) {
              initial.characters[character.id].cooldowns[key] = Math.max(0, cooldown);
            }
          }
        }
        if (savedCharacter?.activeTurns) {
          for (const key of abilityConfigurationKeys(character)) {
            const activeTurns = savedCharacter.activeTurns[key];
            if (Number.isFinite(activeTurns)) {
              initial.characters[character.id].activeTurns[key] = Math.max(0, activeTurns);
            }
          }
        }
        if (savedCharacter?.activeAbilities && typeof savedCharacter.activeAbilities === "object") {
          for (const ability of allCharacterAbilities(character)) {
            for (const configuration of [ability, ...(ability.variants || [])]) {
              if (configuration.activeMode !== "toggle") continue;
              const key = abilityStateKey(ability, configuration === ability ? null : configuration);
              initial.characters[character.id].activeAbilities[key] = savedCharacter.activeAbilities[key] === true;
            }
          }
        }
        if (savedCharacter?.chargeRecharges) {
          for (const ability of allCharacterAbilities(character)) {
            for (const configuration of [ability, ...(ability.variants || [])]) {
              const key = abilityStateKey(ability, configuration === ability ? null : configuration);
              const recharges = savedCharacter.chargeRecharges[key];
              if (!Array.isArray(recharges) || !Number.isInteger(configuration.charges) || !Number.isInteger(configuration.recharge)) continue;
              initial.characters[character.id].chargeRecharges[key] = recharges
                .filter((turns) => Number.isInteger(turns) && turns > 0 && turns <= configuration.recharge)
                .slice(0, configuration.charges);
            }
          }
        }
        if (savedCharacter?.abilityUsesThisTurn || savedCharacter?.usedAbilities) {
          for (const ability of allCharacterAbilities(character)) {
            const savedUseCount = savedCharacter.abilityUsesThisTurn?.[ability.id];
            initial.characters[character.id].abilityUsesThisTurn[ability.id] = Number.isInteger(savedUseCount) && savedUseCount >= 0
              ? savedUseCount
              : savedCharacter.usedAbilities?.[ability.id] === true ? 1 : 0;
          }
        }
        if (savedCharacter?.afflictionApplicationsThisTurn && typeof savedCharacter.afflictionApplicationsThisTurn === "object") {
          initial.characters[character.id].afflictionApplicationsThisTurn = Object.fromEntries(
            Object.entries(savedCharacter.afflictionApplicationsThisTurn)
              .filter(([key, count]) => typeof key === "string" && Number.isSafeInteger(count) && count > 0)
          );
        }
      }
      if (Array.isArray(parsed.activeStatEffects)) {
        for (const activeEffect of parsed.activeStatEffects) {
          if (!activeEffect || typeof activeEffect !== "object") continue;
          const targetCharacter = characterById(activeEffect.targetCharacterId);
          const sourceCharacter = characterById(activeEffect.sourceCharacterId);
          const ability = sourceCharacter && allCharacterAbilities(sourceCharacter)
            .find((entry) => entry.id === activeEffect.sourceAbilityId);
          const effect = findConfiguredStatEffect(
            activeEffect.sourceCharacterId,
            activeEffect.sourceAbilityId,
            activeEffect.sourceConfigurationId,
            activeEffect.effectId
          );
          if (
            !targetCharacter || !sourceCharacter || !ability || !effect ||
            !Object.hasOwn(targetCharacter.stats, effect.stat) ||
            typeof effect.bonus !== "string" ||
            !Number.isInteger(effect.duration) ||
            effect.duration < 1 ||
            !statEffectTargets(effect, sourceCharacter).includes(targetCharacter.id) ||
            !Number.isInteger(activeEffect.remainingTurns) ||
            activeEffect.remainingTurns < 1 ||
            activeEffect.remainingTurns > effect.duration
          ) continue;
          initial.activeStatEffects.push({
            id: String(activeEffect.id || ""),
            sourceCharacterId: sourceCharacter.id,
            sourceAbilityId: ability.id,
            sourceConfigurationId: String(activeEffect.sourceConfigurationId || ability.id),
            effectId: effect.id,
            targetCharacterId: targetCharacter.id,
            remainingTurns: activeEffect.remainingTurns
          });
        }
      }
      if (Array.isArray(parsed.activeAfflictions)) {
        initial.activeAfflictions = parsed.activeAfflictions.flatMap((entry) => {
          if (
            !entry || typeof entry !== "object" ||
            !characterById(entry.characterId) ||
            !Object.hasOwn(AFFLICTION_GLOSSARY, entry.afflictionId) ||
            !Number.isSafeInteger(entry.stacks) || entry.stacks < 1 ||
            !(entry.remainingTurns === null || (Number.isSafeInteger(entry.remainingTurns) && entry.remainingTurns > 0))
          ) return [];
          return [{
            id: typeof entry.id === "string" && entry.id ? entry.id : `affliction-${initial.activeAfflictions.length + 1}`,
            characterId: entry.characterId,
            afflictionId: entry.afflictionId,
            stacks: entry.stacks,
            remainingTurns: entry.remainingTurns,
            source: typeof entry.source === "string" ? entry.source.slice(0, 160) : "Unknown source"
          }];
        });
      }
      const highestAfflictionSequence = initial.activeAfflictions.reduce((highest, entry) => {
        const match = /^affliction-(\d+)$/.exec(entry.id);
        return match ? Math.max(highest, Number(match[1])) : highest;
      }, 0);
      initial.afflictionSequence = Math.max(
        Number.isSafeInteger(parsed.afflictionSequence) && parsed.afflictionSequence >= 0 ? parsed.afflictionSequence : 0,
        highestAfflictionSequence,
        initial.activeAfflictions.length
      );
      if (Number.isSafeInteger(parsed.crystalSequence) && parsed.crystalSequence >= 0) {
        initial.crystalSequence = parsed.crystalSequence;
      }
      if (Number.isSafeInteger(parsed.summonSequence) && parsed.summonSequence >= 0) initial.summonSequence = parsed.summonSequence;
      for (const character of CHARACTERS) {
        const savedCharacter = parsed.characters?.[character.id];
        if (!savedCharacter?.crystals || typeof savedCharacter.crystals !== "object") continue;
        for (const ability of allCharacterAbilities(character)) {
          const configuration = ability.crystalSummon;
          const savedCrystals = savedCharacter.crystals[ability.id];
          if (
            !configuration ||
            !Number.isSafeInteger(configuration.max) ||
            configuration.max < 1 ||
            !Number.isSafeInteger(configuration.disableTurns) ||
            configuration.disableTurns < 1 ||
            !Array.isArray(savedCrystals)
          ) continue;
          initial.characters[character.id].crystals[ability.id] = savedCrystals
            .filter((crystal) =>
              crystal &&
              typeof crystal.id === "string" &&
              Number.isInteger(crystal.disabledTurns) &&
              crystal.disabledTurns >= 0 &&
              crystal.disabledTurns <= configuration.disableTurns
            )
            .slice(0, configuration.max)
            .map((crystal) => ({ id: crystal.id, disabledTurns: crystal.disabledTurns }));
          for (const crystal of initial.characters[character.id].crystals[ability.id]) {
            const match = /^mana-crystal-(\d+)$/.exec(crystal.id);
            if (match) initial.crystalSequence = Math.max(initial.crystalSequence, Number(match[1]));
          }
        }
      }
      for (const character of CHARACTERS) {
        const saved = parsed.characters?.[character.id];
        const progress = initial.characters[character.id];
        if (!saved) continue;
        progress.summons = Array.isArray(saved.summons) ? saved.summons.filter((entry) =>
          entry && typeof entry.id === "string" && typeof entry.name === "string" &&
          typeof entry.abilityId === "string" && allCharacterAbilities(character).some((ability) => ability.id === entry.abilityId && abilityHasAnyTag(ability, ["Summon", "Familiar"])) &&
          Number.isFinite(entry.health) && entry.health >= 0 && Number.isFinite(entry.maxHealth) && entry.maxHealth >= 0
        ).map((entry) => ({ id: entry.id, abilityId: entry.abilityId, name: entry.name.slice(0, 100), health: Math.min(entry.health, entry.maxHealth), maxHealth: entry.maxHealth })) : [];
        for (const summon of progress.summons) {
          const match = /^summon-(\d+)$/.exec(summon.id);
          if (match) initial.summonSequence = Math.max(initial.summonSequence, Number(match[1]));
        }
        progress.burningOrbs = Array.isArray(saved.burningOrbs) ? saved.burningOrbs.filter((entry) => entry && typeof entry.id === "string").slice(0, 3).map((entry) => ({ id: entry.id, usedThisTurn: entry.usedThisTurn === true })) : [];
        progress.shields = Array.isArray(saved.shields) ? saved.shields.filter((entry) =>
          entry && typeof entry.id === "string" && typeof entry.name === "string" &&
          CHARACTERS.some((source) => allCharacterAbilities(source).some((ability) => ability.id === entry.abilityId && ability.shieldTarget)) &&
          CHARACTERS.some((target) => target.id === entry.targetCharacterId)
        ).map((entry) => ({ id: entry.id, abilityId: entry.abilityId, name: entry.name.slice(0, 100), targetCharacterId: entry.targetCharacterId })) : [];
        progress.boostUses = Number.isSafeInteger(saved.boostUses) ? Math.max(0, Math.min(2, saved.boostUses)) : 0;
        progress.boostedAbilityUses = saved.boostedAbilityUses && typeof saved.boostedAbilityUses === "object" ? Object.fromEntries(Object.entries(saved.boostedAbilityUses).filter(([id, count]) => allCharacterAbilities(character).some((ability) => ability.id === id && abilityHasAnyTag(ability, ["Boostable"])) && Number.isSafeInteger(count) && count > 0).map(([id, count]) => [id, Math.min(count, 2)])) : {};
        progress.adjacentAlly = saved.adjacentAlly === true;
      }
      const savedManaTide = parsed.manaTide;
      const configuredManaTide = manaTideAbility();
      if (
        savedManaTide?.active === true &&
        configuredManaTide &&
        isValidManaTideConfiguration(configuredManaTide.ability.manaTide) &&
        characterById(savedManaTide.sourceCharacterId) &&
        Number.isInteger(savedManaTide.roundsElapsed) &&
        savedManaTide.roundsElapsed >= 0 &&
        savedManaTide.roundsElapsed < configuredManaTide.ability.manaTide.durationRounds
      ) {
        initial.manaTide = {
          active: true,
          sourceCharacterId: savedManaTide.sourceCharacterId,
          roundsElapsed: savedManaTide.roundsElapsed,
          spentByCharacter: Object.fromEntries(CHARACTERS.flatMap((character) => {
            const spent = savedManaTide.spentByCharacter?.[character.id];
            return Number.isFinite(spent) && spent >= 0 && spent < Number.MAX_SAFE_INTEGER
              ? [[character.id, Math.round(spent * 1e6) / 1e6]]
              : [];
          }))
        };
      }
      if (Array.isArray(parsed.equipmentAttackLog)) {
        initial.equipmentAttackLog = parsed.equipmentAttackLog.flatMap((entry) => {
          const character = characterById(entry?.characterId);
          const item = character?.equipment?.find((equipment) =>
            equipment.id === entry?.equipmentId && equipment.type === "weapon"
          );
          const attack = item && equipmentAttacks(item).find((configuredAttack) =>
            configuredAttack.id === (entry?.attackId || "default")
          );
          return attack && Number.isInteger(entry.turn) && entry.turn > 0
            ? [{
              characterId: character.id,
              equipmentId: item.id,
              attackId: attack.id,
              turn: entry.turn,
              ...(typeof entry.damageSummary === "string" ? { damageSummary: entry.damageSummary.slice(0, 500) } : {})
            }]
            : [];
        }).slice(-10);
      }
      initial.turn = Number.isInteger(parsed.turn) && parsed.turn > 0 ? parsed.turn : 1;
      if (parsed.initiativeScores && typeof parsed.initiativeScores === "object") {
        for (const character of CHARACTERS) {
          const score = parsed.initiativeScores[character.id];
          if (Number.isSafeInteger(score) && score >= -999 && score <= 999) initial.initiativeScores[character.id] = score;
        }
      }
      initial.absentCharacterIds = Array.isArray(parsed.absentCharacterIds)
        ? [...new Set(parsed.absentCharacterIds.filter((id) => CHARACTERS.some((character) => character.id === id)))]
        : [];
      const activeCount = CHARACTERS.filter((character) => !initial.absentCharacterIds.includes(character.id)).length;
      initial.turnIndex = Number.isInteger(parsed.turnIndex) ? Math.max(0, parsed.turnIndex) % Math.max(1, activeCount) : 0;
      initial.selectedId = CHARACTERS.some((character) => character.id === parsed.selectedId) ? parsed.selectedId : CHARACTERS[0].id;
      initial.view = ["sheet", "buffs"].includes(parsed.view) ? parsed.view : "overview";
      if (parsed.variantSelection && typeof parsed.variantSelection === "object") {
        for (const character of CHARACTERS) {
          for (const ability of allCharacterAbilities(character)) {
            const selectedVariantId = parsed.variantSelection[character.id]?.[ability.id];
            if ((ability.variants || []).some((variant) => variant.id === selectedVariantId)) {
              initial.variantSelection[character.id] ??= {};
              initial.variantSelection[character.id][ability.id] = selectedVariantId;
            }
          }
        }
      }
      return initial;
    }

    // Session state remains usable on a local file; Firebase sync is enabled after config is added.
    function loadCampaign() {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return createInitialCampaign();

      try {
        return mergeCampaignProgress(JSON.parse(saved));
      } catch (error) {
        console.error("Could not load saved campaign:", error);
        return createInitialCampaign();
      }
    }

    let state = loadCampaign();
    let toastTimer;
    let resourceAdjustmentAmount = "1";
    let remoteCampaignRef = null;
    let remoteSet = null;
    let applyingRemoteState = false;
    let remoteWriteQueue = Promise.resolve();

    function saveCampaign() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (remoteCampaignRef && !applyingRemoteState) queueRemoteSave();
    }

    /*
     * GitHub Pages serves this file but has no database of its own. Add the public
     * Firebase web config above, enable Anonymous Authentication, and create Realtime
     * Database. Before sharing a public page, restrict database rules to your players'
     * Firebase Auth UIDs; a broad "auth != null" rule lets any site visitor write.
     * Firebase web config is public; never put an Admin SDK key or service secret here.
     */
    async function startFirebaseSync() {
      // Browsers restrict Firebase's remote ES modules and auth origins on file:// URLs.
      if (location.protocol === "file:") {
        setSyncStatus("Open via HTTPS to sync");
        return;
      }

      const requiredConfig = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
      const missingConfig = requiredConfig.filter((key) =>
        !FIREBASE_CONFIG[key] || FIREBASE_CONFIG[key].startsWith("YOUR_")
      );
      if (missingConfig.length) {
        setSyncStatus(missingConfig.includes("databaseURL") ? "Add database URL" : "Firebase config incomplete");
        return;
      }
      if (!/^https:\/\/[^/]+/.test(FIREBASE_CONFIG.databaseURL)) {
        setSyncStatus("Invalid database URL", true);
        console.error("Firebase Realtime Database URL must be an https URL.");
        return;
      }

      setSyncStatus("Connecting");
      try {
        const [appSdk, authSdk, databaseSdk] = await Promise.all([
          import("https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js"),
          import("https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js"),
          import("https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js")
        ]);
        const app = appSdk.initializeApp(FIREBASE_CONFIG);
        const auth = authSdk.getAuth(app);
        await authSdk.signInAnonymously(auth);
        const database = databaseSdk.getDatabase(app);
        remoteCampaignRef = databaseSdk.ref(database, FIREBASE_CAMPAIGN_PATH);
        remoteSet = databaseSdk.set;
        setSyncStatus("Connecting");
        databaseSdk.onValue(remoteCampaignRef, (snapshot) => {
          if (!snapshot.exists()) {
            queueRemoteSave();
            return;
          }
          const localView = state.view;
          const localSelection = state.selectedId;
          const localVariants = state.variantSelection;
          applyingRemoteState = true;
          state = {
            ...mergeCampaignProgress(snapshot.val()),
            view: localView,
            selectedId: localSelection,
            variantSelection: localVariants
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          applyingRemoteState = false;
          render();
          setSyncStatus("Synced");
        }, (error) => {
          console.error("Firebase campaign listener failed:", error);
          setSyncStatus("Sync error", true);
          notify(firebaseErrorMessage(error));
        });
      } catch (error) {
        console.error("Firebase campaign sync could not start:", error);
        remoteCampaignRef = null;
        remoteSet = null;
        setSyncStatus("Sync error", true);
        notify(`${firebaseErrorMessage(error)} Local saving is still available.`);
      }
    }

    // Re-render all surfaces together so the roster, dashboard, sheet, and turn badge stay in sync.
    function render() {
      document.getElementById("top-turn").textContent = `Round ${state.turn}`;
      document.getElementById("breadcrumb-current").textContent = ({ overview: "DM Overview", sheet: "Character Sheet", buffs: "Buffs & Afflictions" })[state.view];
      document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === state.view);
      });
      document.getElementById("app").innerHTML = ({
        overview: renderOverview,
        sheet: renderSheet,
        buffs: renderBuffs
      })[state.view]();
      renderRoster();
    }



function updateSummonHealth(summonId, field, rawValue) {
  const character = getSelectedCharacter();
  const summon = state.characters[character.id].summons.find((entry) => entry.id === summonId);
  const value = Number(rawValue);
  if (!summon || !["health", "maxHealth"].includes(field) || !Number.isSafeInteger(value) || value < 0) return;
  if (field === "maxHealth") {
    summon.maxHealth = value;
    summon.health = Math.min(summon.health, value);
  } else summon.health = Math.min(value, summon.maxHealth);
  saveCampaign(); render();
}
function removeSummonInstance(summonId) {
  const progress = state.characters[getSelectedCharacter().id];
  progress.summons = (progress.summons || []).filter((entry) => entry.id !== summonId);
  saveCampaign(); render();
}
function removeShield(shieldId) {
  const progress = state.characters[getSelectedCharacter().id];
  progress.shields = (progress.shields || []).filter((entry) => entry.id !== shieldId);
  saveCampaign(); render();
}
function toggleDarknessEmbrace() {
  const progress = state.characters["Izaak"];
  if (!progress) return;
  progress.adjacentAlly = !progress.adjacentAlly;
  saveCampaign(); render();
  notify(progress.adjacentAlly ? "Darkness Embrace: ally adjacent (−1D8)." : "Darkness Embrace: no ally adjacent (+1D8).");
}
function attackWithBurningOrb(orbId) {
  const character = getSelectedCharacter();
  const progress = state.characters[character.id];
  const orb = progress.burningOrbs?.find((entry) => entry.id === orbId);
  if (!orb || orb.usedThisTurn) return;
  const magic = parseDiceFormula(character.stats.magic);
  if (!magic || [...magic.dice.values()].some((count) => count < 0)) { notify("Magic stat has an invalid dice formula."); return; }
  let diceCount = [...magic.dice.values()].reduce((total, count) => total + count, 0);
  for (const modifier of getStatModifiers(character, "magic", false)) {
    const parsed = parseDiceFormula(modifier.bonus);
    if (!parsed || [...parsed.dice.values()].some((count) => count < 0)) continue;
    diceCount += [...parsed.dice.values()].reduce((total, count) => total + count, 0);
  }
  orb.usedThisTurn = true;
  saveCampaign(); render();
  notify(`${character.name} attacks with ${orbId.replace("burning-orb-", "Burning Orb ")} — 2D10 + ${diceCount} damage.`);
}

    function setResource(characterId, key, delta) {
  const character = characterById(characterId);
  const resources = state.characters[characterId].resources;
  const maximum = getResourceMaximum(character, key);

  const nextValue = Math.max(
    0,
    Math.min(maximum, resources[key] + delta)
  );

  if (nextValue === resources[key]) return;

  resources[key] = nextValue;
  saveCampaign();
  render();
}

    function resetInitiativeSession() {
      state.initiativeScores = Object.fromEntries(CHARACTERS.map((character) => [character.id, null]));
      state.absentCharacterIds = [];
      state.turn = 1;
      state.turnIndex = 0;
      saveCampaign();
      render();
      notify("New session ready. Enter initiative rolls and mark anyone who is absent.");
    }

    function resetCampaign() {
      // Restore initial resources and clear turn, ability, and Mana Tide progress.
      for (const character of CHARACTERS) {
        state.characters[character.id] = {
          resources: { ...character.resources },
          cooldowns: Object.fromEntries(abilityConfigurationKeys(character).map((key) => [key, 0])),
          activeTurns: Object.fromEntries(abilityConfigurationKeys(character).map((key) => [key, 0])),
          activeAbilities: Object.fromEntries(allCharacterAbilities(character).flatMap((ability) =>
            [ability, ...(ability.variants || [])]
              .filter((configuration) => configuration.activeMode === "toggle")
              .map((configuration) => [abilityStateKey(ability, configuration === ability ? null : configuration), false])
          )),
          chargeRecharges: Object.fromEntries(abilityConfigurationKeys(character).map((key) => [key, []])),
          crystals: Object.fromEntries(allCharacterAbilities(character)
            .filter((ability) => ability.crystalSummon)
            .map((ability) => [ability.id, []])),
          abilityUsesThisTurn: Object.fromEntries(allCharacterAbilities(character).map((ability) => [ability.id, 0])),
          afflictionApplicationsThisTurn: {},
          equippedEquipment: [...(state.characters[character.id].equippedEquipment || [])],
          summons: [], burningOrbs: [], shields: [], boostUses: 0, boostedAbilityUses: {}, adjacentAlly: false
        };
      }
      state.activeStatEffects = [];
      state.activeAfflictions = [];
      state.afflictionSequence = 0;
      state.crystalSequence = 0;
      state.summonSequence = 0;
      state.equipmentAttackLog = [];
      state.manaTide = { active: false, roundsElapsed: 0, spentByCharacter: {} };
      state.variantSelection = {};
      state.turn = 1;
      state.turnIndex = 0;
      state.initiativeScores = Object.fromEntries(CHARACTERS.map((character) => [character.id, null]));
      state.absentCharacterIds = [];
      saveCampaign();
      render();
      notify("Session reset. Resources, ability uses, active abilities, stat effects, afflictions, Mana Tide, and turn order are back at their defaults.");
    }

    function setSyncStatus(message, isError = false) {
      document.getElementById("sync-status").textContent = message;
      document.getElementById("top-sync-status").textContent = message;
      for (const id of ["sync-dot", "top-sync-dot"]) {
        const dot = document.getElementById(id);
        dot.style.background = isError ? "var(--red)" : message === "Synced" ? "var(--green)" : "var(--gold)";
      }
    }

    // Translate common Firebase setup errors into actions visible to the campaign owner.
    function firebaseErrorMessage(error) {
      switch (error?.code) {
        case "auth/configuration-not-found":
          return "Enable Anonymous sign-in in Firebase Authentication.";
        case "auth/unauthorized-domain":
          return "Add this site to Firebase Authentication's authorized domains.";
        case "PERMISSION_DENIED":
        case "database/permission-denied":
          return "Firebase Database rules denied access. Check authenticated read/write rules.";
        default:
          if (error instanceof TypeError && /fetch|module/i.test(error.message)) {
            return "Firebase SDK could not load. Open the app on GitHub Pages (HTTPS) or localhost, not as a file.";
          }
          return "Firebase sync could not connect. Check the browser console for details.";
      }
    }

    // View and selected character are device-local; game progress and resources are shared.
    function sharedCampaignSnapshot() {
      return {
        turn: state.turn,
        turnIndex: state.turnIndex,
        initiativeScores: state.initiativeScores,
        absentCharacterIds: state.absentCharacterIds,
        activeStatEffects: state.activeStatEffects,
        activeAfflictions: state.activeAfflictions,
        afflictionSequence: state.afflictionSequence,
        equipmentAttackLog: state.equipmentAttackLog,
        summonSequence: state.summonSequence,
        manaTide: state.manaTide,
        characters: state.characters
      };
    }

    function queueRemoteSave() {
      if (!remoteCampaignRef || !remoteSet) return;
      const payload = sharedCampaignSnapshot();
      remoteWriteQueue = remoteWriteQueue
        .then(() => remoteSet(remoteCampaignRef, payload))
        .then(() => setSyncStatus("Synced"))
        .catch((error) => {
          console.error("Could not save campaign to Firebase:", error);
          setSyncStatus("Sync error", true);
          notify(`${firebaseErrorMessage(error)} Local changes are still saved.`);
        });
    }

    // One delegated handler keeps controls working after every render.
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const viewButton = target.closest("[data-view]");
      if (viewButton) {
        state.view = viewButton.dataset.view;
        saveCampaign();
        render();
        return;
      }

      const rosterButton = target.closest("[data-character]");
      if (rosterButton) {
        state.selectedId = rosterButton.dataset.character;
        state.view = "sheet";
        saveCampaign();
        render();
        return;
      }

      const card = target.closest("[data-open-character]");
      if (card) {
        state.selectedId = card.dataset.openCharacter;
        state.view = "sheet";
        saveCampaign();
        render();
        return;
      }

      const resourceButton = target.closest("[data-resource]");
      if (resourceButton) {
        const amount = Number(document.querySelector("[data-resource-adjustment]")?.value);
        if (!Number.isSafeInteger(amount) || amount < 1) {
          notify("Enter a whole number greater than zero for the resource adjustment.");
          document.querySelector("[data-resource-adjustment]")?.focus();
          return;
        }
        setResource(state.selectedId, resourceButton.dataset.resource, Number(resourceButton.dataset.delta) * amount);
        return;
      }

      const glossaryButton = target.closest("[data-glossary]");
      if (glossaryButton) {
        showAfflictionGlossary(glossaryButton.dataset.glossary);
        return;
      }

      const abilityButton = target.closest("[data-use-ability]");
      if (abilityButton) {
        const targetId = abilityButton.closest(".ability-row")?.querySelector("[data-shield-target]")?.value;
        useAbility(abilityButton.dataset.useAbility, targetId ? { shieldTarget: targetId } : {});
        return;
      }

      const abilityAttack = target.closest("[data-ability-attack]");
      if (abilityAttack) {
        attackWithAbility(abilityAttack.dataset.abilityAttack, abilityAttack.dataset.abilityAttackId);
        return;
      }

      const abilityToggle = target.closest("[data-toggle-ability]");
      if (abilityToggle) {
        toggleAbility(abilityToggle.dataset.toggleAbility);
        return;
      }

      const crystalDisable = target.closest("[data-disable-crystal]");
      if (crystalDisable) {
        disableCrystal(crystalDisable.dataset.crystalAbility, crystalDisable.dataset.disableCrystal);
        return;
      }

      const crystalDispel = target.closest("[data-dispel-crystal]");
      if (crystalDispel) {
        dispelCrystal(crystalDispel.dataset.crystalAbility, crystalDispel.dataset.dispelCrystal);
        return;
      }

      const summonHealth = target.closest("[data-summon-health]");
      if (summonHealth) {
        const card = summonHealth.closest(".summon-card");
        const value = card?.querySelector(`[data-summon-value="${summonHealth.dataset.field}"]`)?.value;
        updateSummonHealth(summonHealth.dataset.summonHealth, summonHealth.dataset.field, value);
        return;
      }
      const removeSummon = target.closest("[data-remove-summon]");
      if (removeSummon) { removeSummonInstance(removeSummon.dataset.removeSummon); return; }
      const orbAttack = target.closest("[data-burning-orb-attack]");
      if (orbAttack) { attackWithBurningOrb(orbAttack.dataset.burningOrbAttack); return; }
      const shieldRemove = target.closest("[data-remove-shield]");
      if (shieldRemove) { removeShield(shieldRemove.dataset.removeShield); return; }
      const proximityToggle = target.closest("[data-proximity-toggle]");
      if (proximityToggle) { toggleDarknessEmbrace(); return; }

      const equipmentToggle = target.closest("[data-equipment-toggle]");
      if (equipmentToggle) {
        toggleEquipment(equipmentToggle.dataset.equipmentToggle);
        return;
      }

      const equipmentAttack = target.closest("[data-equipment-attack]");
      if (equipmentAttack) {
        const targetPicker = equipmentAttack.closest(".equipment-attack-option")?.querySelector("[data-equipment-target]");
        attackWithEquipment(
          equipmentAttack.dataset.equipmentAttack,
          equipmentAttack.dataset.equipmentAttackId,
          targetPicker?.value || null
        );
        return;
      }

      const afflictionRemove = target.closest("[data-affliction-remove]");
      if (afflictionRemove) {
        removeAffliction(afflictionRemove.dataset.afflictionRemove);
        return;
      }
      const afflictionClear = target.closest("[data-affliction-clear]");
      if (afflictionClear) {
        removeAffliction(afflictionClear.dataset.afflictionClear, true);
        return;
      }

      const action = target.closest("[data-action]")?.dataset.action;
      if (action === "end-turn") endTurn();
      if (action === "new-initiative-session") resetInitiativeSession();
      if (action === "confirm-reset") showResetConfirmation();
      if (action === "cancel-reset") document.getElementById("modal-root").innerHTML = "";
      if (action === "close-glossary") document.getElementById("modal-root").innerHTML = "";
      if (action === "cancel-ability-costs") document.getElementById("modal-root").innerHTML = "";
      if (action === "reset") {
        document.getElementById("modal-root").innerHTML = "";
        resetCampaign();
      }
      if (target.matches("[data-dismiss-modal]")) document.getElementById("modal-root").innerHTML = "";
    });

    document.addEventListener("submit", (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      event.preventDefault();
      if (form.matches("[data-add-affliction]")) {
        const values = new FormData(form);
        const durationValue = String(values.get("duration") || "").trim();
        addManualAffliction(
          String(values.get("characterId") || ""),
          String(values.get("afflictionId") || ""),
          Number(values.get("stacks")),
          durationValue ? Number(durationValue) : null
        );
        return;
      }
      if (!form.matches("[data-configurable-ability]")) return;

      const formData = new FormData(form);
      const values = Object.fromEntries(formData.entries());

      const playerSelectionFields = [
        ...new Set(
          [...form.querySelectorAll('input[type="checkbox"][name^="targetPlayers:"]')]
            .map((checkbox) => checkbox.name)
        )
      ];

      for (const field of playerSelectionFields) {
        values[field] = formData.getAll(field);
      }

      for (const [field, value] of Object.entries(values)) {
        if (!field.startsWith("targetPlayers:")) {
          values[field] = Number(value);
        }
      }

      if (useAbility(form.dataset.configurableAbility, values)) {
        document.getElementById("modal-root").innerHTML = "";
      }
    });

    // Variant selection changes only this device's sheet preference; game state remains shared.
    document.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches("[data-resource-adjustment]")) {
        resourceAdjustmentAmount = target.value;
        return;
      }
      if (target instanceof HTMLInputElement && target.matches("[data-initiative]")) {
        const currentId = getCurrentCharacter()?.id;
        const rawValue = target.value.trim();
        const score = rawValue === "" ? null : Number(rawValue);
        if (score !== null && (!Number.isSafeInteger(score) || score < -999 || score > 999)) return;
        state.initiativeScores[target.dataset.initiative] = score;
        const nextOrder = getTurnOrder();
        const currentIndex = nextOrder.findIndex((character) => character.id === currentId);
        state.turnIndex = currentIndex >= 0 ? currentIndex : 0;
        saveCampaign(); render(); return;
      }
      if (target instanceof HTMLInputElement && target.matches("[data-attendance]")) {
        const currentId = getCurrentCharacter()?.id;
        const characterId = target.dataset.attendance;
        state.absentCharacterIds = target.checked ? state.absentCharacterIds.filter((id) => id !== characterId) : [...new Set([...state.absentCharacterIds, characterId])];
        const nextOrder = getTurnOrder();
        const currentIndex = nextOrder.findIndex((character) => character.id === currentId);
        state.turnIndex = currentIndex >= 0 ? currentIndex : 0;
        saveCampaign(); render(); return;
      }
      if (!(target instanceof HTMLSelectElement) || !target.matches("[data-variant-character]")) return;
      selectAbilityVariant(target.dataset.variantCharacter, target.dataset.variantAbility, target.value);
    });

    document.addEventListener("input", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches("[data-resource-adjustment]")) {
        resourceAdjustmentAmount = target.value;
      }
    });

    // Allow keyboard activation on overview character cards, in addition to mouse/touch.
    document.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && event.target instanceof Element) {
        const card = event.target.closest("[data-open-character]");
        if (card) {
          event.preventDefault();
          card.click();
        }
      }
      if (event.key === "Escape") document.getElementById("modal-root").innerHTML = "";
    });

    render();
    startFirebaseSync();
    /*
     * CAMPAIGN SETUP
     * Stats may be numbers or dice-formula strings; base recovery stats must stay numeric.
     * Add statEffects to an ability or racial gift to apply a source-labeled stat bonus. Numeric bonuses and flat strings such as "+6" or "6" are valid; recovery modifiers must be flat numeric bonuses, not dice.
     * Effects stack and render separately; active effects need duration, while "passive" effects apply continuously.
     * Add costEffects to a passive to reduce mana/stamina costs for selected targets; abilityTags can limit which abilities are affected.
     * Add enhancements: [{ stat, bonus }] to an ability to configure its Avatar of Speed bonus. The matching passive's enhancement rule controls which tagged abilities receive it. Prose-only effects must be represented as statEffects before they can be enhanced.
     * A variant of a passive ability can set activeVersion: true to expose its own costs, cooldown, inputs, and effects as a usable action while keeping the parent passive.
     * Add inputFields: [{ id, label, min }] to request a whole-number value on use. Affliction effects can convert it to stacks with stacksFromInput: { field, divisor }.
     * Add afflictionEffects to abilities to apply glossary statuses: { id, afflictionId, target, stacks, duration, maxStacksPerTurn }.
     * Add "unlocked-potential" to a character's tags to allow mana/stamina ability spending below zero. While either is negative, they cannot activate any abilities until both are nonnegative.
     * Use trigger: "resourceChange" with resourceEffectId and condition: "increase" or "decrease" for conditional applications.
     * Set stacksFromPercentageOfMax: true to apply one stack per 1% of the actual resource change, rounded up.
     * maxStacksPerTurn is counted per ability effect and target, then resets when its source character ends their turn.
     * A missing duration or duration: null means permanent; timed effects decrease on the affected character's turns.
     * Use maxTotalStacks to cap an ability's stacks from that source; maxStacksPerTurn caps its additions per source turn.
     * Example: afflictionEffects: [{ id: "equilibrium-ward", afflictionId: "impervious", target: "self", stacks: 1, duration: null, maxStacksPerTurn: 2, maxTotalStacks: 10 }].
     * Glossary entries may define statEffects: [{ stat, bonus, perStack }]; perStack defaults to true. Use null duration for a status that does not expire.
     * Glossary resourceEffects use { resource, amountPerStack } and restore that resource on each affected character's turn.
     * Toggle abilities use activeMode: "toggle" and may define upkeep costs per owner turn. Cost reductions apply normally on activation; for upkeep, each normal reduction is divided by 10 per second and multiplied by the 6-second turn length.
     * Toggle statEffects stay active until the ability is turned off and do not require a duration.
     * Cost effect targets can also use "others" to affect everyone except the source.
     * Mana Tide uses { durationRounds, maxRecovery, manaPerRecovery, growth }.
     * Mana spent after cost reductions while it is active adds the matching recovery bonus to the character who paid it.
     * Crystal summon abilities can use { crystalSummon: { max, disableTurns } } to track a limited number of crystals with independent owner-turn disable timers.

     * Each effect uses { id, resource, amount, target }; set amount to "XX" to ask on use.
     * Resource effect amounts may be negative to spend a resource, or positive to restore it.
     * Targets can be "self", "others", "party", "tagged", or "self-and-tagged" (characters with abilities carrying one configured tag, matched case-insensitively).
     * Durations count down on each affected character's turn.
     * Example: statEffects: [{ id: "focus-magic", stat: "magic", bonus: "1D8", duration: 1, target: "self" }]. For tagged targets, add tags: ["Melee"].
     *
     * Shared ability tags are ordinary tags such as "movement" and "blood".
     * Use "passive" to remove costs, cooldowns, and the use button.
     * Ability variants are separate configurations nested on the ability, not separate category entries.
     * Variant fields override the base ability fields; set duration to keep a cooldown paused while the effect is active. \
     * Racial gifts are free to use and may have cooldown and duration fields.
     * Configure equipment as [{ id, name, type, summary, description, statEffects }].
     * Optional summary and description text is shown below the equipment name.
     * Configure character titles and inventory as [{ name, description }].
     * Weapons use attacks: [{ id, name, stat, modifier }]; attack amounts include matching active/passive ability and racial-gift statEffects.
     * Tag an ability with "attack" to show its attack buttons. Configure attacks: [{ id, name, stats: ["physicalAttack", "magic"], modifier }] to add those stats together; statMode: "highest" uses only the stat with the highest average formula. A tagged ability without attacks defaults to physicalAttack.
     * Ability attacks use the same formula options as weapons (damageMultiplier and damageDieSides), but do not spend the ability's resources or trigger its cooldown.
     * Set damageMultiplier on a weapon (for example 0.75) to scale the selected stat and its bonuses, rounding up after the roll, before adding the weapon modifier.
     * Set damageDieSides on a weapon to convert every die in its attack stat, stat bonuses, and weapon modifier to that die size before damage scaling. Flat bonuses are unchanged.
     * A weapon without attacks gets a default Attack using item.stat (or physicalAttack) and item.modifier.
     * Weapon afflictionEffects use { id, afflictionId, target, stacks, duration }; target is "wielder", "selected", or "wielder-and-selected".
     * Example: { id: "spectres-blade", name: "Spectre's Blade", type: "weapon", attacks: [
     *   { id: "standard", name: "Standard Attack", stat: "physicalAttack", modifier: "1D8" },
     *   { id: "sneak", name: "Sneak Attack", stat: "physicalAttack", modifier: "2D8" }
     * ] }.
     * Equipped statEffects use { id, stat, bonus }.
     * Active abilities default to one use per owner turn.
     * Set usesPerTurn above 1 for an ability that can be used multiple times on its owner's turn.
     * Abilities may define charges and recharge; each spent charge restores after that many owner turns.
     * Set mana, stamina, or cooldown to "XX" to ask for that value when the ability is used.
     * Example: { mana: "XX", stamina: 10, cooldown: "XX" } asks for mana and cooldown.
     */
    const CHARACTERS = [
      {
        id: "Jamez", name: "Bob Smith", race: "Smoulder", magicspecialty: "Astral",
        rank: "Bronze", initials: "BS", color: "#d4cece", avatarBg: "#454340",
        resources: { health: 50, mana: 300, stamina: 300 },
        stats: { manaRecovery: 12, staminaRecovery: 64, physicalAttack: "2D8-2", damageResistance: "2D8", magic: "3D8+2.01", magicResistance: "3D8", speed: 32, reflexes: 5 },
        essences: ["Magic", "Mirror", "Flesh", "Doppelganger"],
        abilities: [
          { id: "bob-teleport", name: "Teleport", category: "Magic", summary: "Teleport to a point within sight.", description: "Teleports the user to a point within sight, with a maximum limit of 100 km, and You can also teleport essence users of Bronze rank and below with you for a cost of +5 per person; Iron rankers and below don\'t have a mana cost to teleport", mana: 40, stamina: 0, cooldown: 10, tags: ["Special Ability", "Magic", "Teleport"] },
          { id: "bob-spirit-reaper", name: "Spirit Reaper", category: "Magic", summary: "+1D8 disruptive force damage; can stun incorporeal foes.", description: "Inflicts additional disruptive force damage (+1D8) and drains mana equal to damage. Doubles mana drain and inflicts [stunned] on incorporeal and semi-incorporeal entities.", mana: 10, stamina: 10, cooldown: 0, tags: ["Melee", "Dimension", "Drain"], statEffects: [
            { id: "spirit-reaper-magic", stat: "magic", bonus: "1D8", duration: 1, target: "self" },
            { id: "spirit-reaper-attack", stat: "physicalAttack", bonus: "1D8", duration: 1, target: "self" }
          ], enhancements: [
            { stat: "magic", bonus: "+1" },
            { stat: "physicalAttack", bonus: "+1" }
          ] },
          { id: "bob-juxtapose", name: "Juxtapose", category: "Magic", summary: "Swap the location of two entities.", description: "Swap the location of two allies and/or enemies. You must be able to see both subjects. If an ally resists or prevents it, it is negated.Enemies affected by this ability take +10% from all sources for 1 turn.", mana: 40, stamina: 0, cooldown: 10, tags: ["Special Ability", "Magic", "Teleport"] },
          { id: "bob-power-lock", name: "Power Lock", category: "Magic", summary: "When the target uses an ability, a second one goes on cooldown.", description: "When the target uses an ability, a random other ability goes on cooldown and uses mana, as if it has been used, if the ability had no mana cost, the target suffers disruptive-force damage commensurate with the strength of the ability. If the target has no other abilities, the ability it used has doubled cooldown, or if the ability has no cooldown, it becomes unavailable for a brief period.", mana: 40, stamina: 0, cooldown: 10, tags: ["Special Ability", "Curse", "Magic"] },
          { id: "bob-strong-soul", name: "Strong Soul", category: "Magic", summary: "Resistances increased and you can physically interact with incorporeal entities.", description: "Disruptive force damage is reduced by a large amount, other damage is reduced by a small amount, increased curse, magic and unholy resistance. You can physically interact with incorporeal entities", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Abiity", "Dimension", "Magic", "passive", "Attribute-Increasing"], statEffects: [
            { id: "strong-soul-damage-resistance", stat: "damageResistance", bonus: "1D8", target: "self" },
            { id: "strong-soul-magic-resistance", stat: "magicResistance", bonus: "1D8", target: "self" }
          ], enhancements: [
            { stat: "damageResistance", bonus: "+1" },
            { stat: "magicResistance", bonus: "+1" }
          ] },
          { id: "bob-mirror-magic", name: "Mirror Magic", category: "Mirror", summary: "Copy an ability an ally has used within the last turn", description: "Copy an ability an ally has used within the last turn. This ability has the same cost and cooldown as the original spell. Using this spell can increase or decrease the rank of the original spell to the rank of this spell, including gaining or losing effects. This also has a reduced cooldown and cost if the rank has been increased.", mana: "XX", stamina: "XX", cooldown: "XX", tags: ["Special Ability", "Magic", "Copy"] },
          { id: "bob-vengeance-Mirror", name: "Vengeance Mirror", category: "Mirror", summary: "Copy an ability an enemy has used once or twice.", description: "Copy an ability an enemy has used once or twice, Cost and cooldown are the same as the original. You may still use this if the original was negated.", mana: "XX", stamina: "XX", cooldown: "XX", tags: ["Special Attack", "Copy", "Retributive"] },
          { id: "bob-reflective-stance", name: "Reflective Stance", category: "Mirror", summary: "Increased damage resistance, if damage is fully blocked, it is reflected.", description: "The user braces for oncoming damage and receives an extra 1d8 of damage resistance until the user/'s next turn. If the user is hit by damage before the start of the user\'s next turn, the damage is reflected.", mana: 40, stamina: 40, cooldown: 0, tags: ["Special Ability", "Retributive"], variants: [
            { id: "always-ready", name: "Always Ready", summary: "Bonus action", description: "Use Reflective Stance as a bonus action but inflict a 2 turn cooldown with an increased cost.", mana: 50, stamina: 50, cooldown: 2}
          ] },
          { id: "bob-enter-reflections", name: "Enter Reflections", category: "Mirror", summary: "Use reflections as a portal.", description: "Use reflections as a portal to another reflection you can see or is within your aura. Can be used as a bonus action.", mana: 10, stamina: 10, cooldown: 0, usesPerTurn: 2, tags: ["Special Ability", "Teleport", "Illusion"], variants: [
            { id: "morph-reflections", name: "Morph Reflections", summary: "Morph the shape of Refections you can see", description: "Morph the shape of Refections you can see for an increased cost with a cooldown.", mana: 20, stamina: 20, cooldown: 1}
          ] },
          { id: "bob-self-actualisation", name: "Self Actualisation", category: "Mirror", summary: "Reduce stamina and mana costs.", description: "You have uncovered your flaws and resolved them; ALL stamina and mana costs reduced by 15. Your confidence has inspired your allies, their stamina and mana costs decrease by 5", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Buff", "passive"], costEffects: [
            { id: "self-actualisation-self", mana: 15, stamina: 15, target: "self" },
            { id: "self-actualisation-allies", mana: 5, stamina: 5, target: "others" }
          ] },
          { id: "bob-blood-harvest", name: "Blood Harvest", category: "Flesh", summary: "Drain dead bodies for resources.", description: "Drain the remnant life force of any bodies within your aura, replenishing health, stamina and mana. Only affects targets with blood and can't overcharge.", mana: 10, stamina: 0, cooldown: 0, tags: ["Spell", "Drain", "Buff"], resourceEffects: [
            { id: "blood-harvest-health", resource: "health", amount: "XX", target: "self" },
            { id: "blood-harvest-mana", resource: "mana", amount: "XX", target: "self" },
            { id: "blood-harvest-stamina", resource: "stamina", amount: "XX", target: "self" }
          ] },
          { id: "bob-blood-magic", name: "Blood Magic", category: "Flesh", summary: "Consume your own life force to gain mana.", description: "Consume your own life force to gain mana. You can allso expend life force to enhance rituals, including essence abilities.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Drain", "Blood"], resourceEffects: [
            { id: "blood-magic-health", resource: "health", amount: "XX", target: "self" },
            { id: "blood-magic-mana", resource: "mana", amount: "XX", target: "self" }
          ] },
          { id: "bob-feast-of-blood", name: "Feast of Blood", category: "Flesh", summary: "Drain health and stamina from bleeding enemies.", description: "Drain health and stamina from bleeding enemies. Drains additional health and stamina. for each disease or curse on the target. \"Incantation: Your blood is not yours to keep but mine on which to feast\"", mana: 20, stamina: 0, cooldown: 5, tags: ["Spell", "Drain", "Blood"], resourceEffects: [
            { id: "feast-of-blood-health", resource: "health", amount: "XX", target: "self" },
            { id: "feast-of-blood-stamina", resource: "stamina", amount: "XX", target: "self" }
          ] },
          { id: "bob-flesh-mould", name: "Flesh Mould", category: "Flesh", summary: "You have more control over your body and can change how you look.", description: "You can change how you look at a long rest, you can also switch physical stats but you must stay humanoid.", mana: 80, stamina: 80, cooldown: 99, tags: ["Special Ability", "Shapeshift"] },
          { id: "bob-sanguine-horror", name: "John(Sanguine Horror)", category: "Flesh", summary: "A Leech swarm familiar with a bandaged human form. ", description: "A Leech swarm familiar with a bandaged human form. Bites from leeches or ranged grips from bandages inflict [Bleeding], [Leech Toxin] and [Necrotoxin]. Leech attacks aso drain HP and Stamina. \"Using\" this ability means John is subsumed within you and will heal 1 Hp per turn and 6 stamina per turn.", mana: 0, stamina: 0, cooldown: 0, tags: ["Summon", "Ritual", "Familiar"], resourceEffects: [
            { id: "sanguine-horror-health", resource: "health", amount: 1, target: "self" },
            { id: "sanguine-horror-stamina", resource: "stamina", amount: 6, target: "self" }
          ] },
          { id: "bob-mirage-step", name: "Mirage Step", category: "Doppelganger", summary: "Move instantly to a nearby location, leaving an afterimage.", description: "Move instantly to a nearby location, leaving an afterimage. Can be used twice, with one use regained every 6 turns after it is spent. When enemies attack an afterimage, they are trapped in a short lived illusion.", mana: 10, stamina: 10, cooldown: 0, charges: 2, recharge: 6, tags: ["Special Ability", "Dimension", "illusion", "movement"], enhancements: [
            { rechargeReduction: 1 }
          ] },
          { id: "bob-counterfeit-combatant", name: "Counterfeit Combatant", category: "Doppelganger", summary: "damage increases by 2d10s", description: "Grow to a large form(2x2) and gain temporary proficiency with armour and melee weapons. Your maximum stamina increases by 50, your damage is increased by 2d10s, your damage resistance is increased by 1D10 and gain an extra +6 to stamina recovery.", mana: 60, stamina: 0, cooldown: 3600, duration: 10, tags: ["Special Ability", "Shapeshift", "Buff", "Attribute-Increasing"], statEffects: [
            { id: "counterfeit-attack", stat: "physicalAttack", bonus: "2D10", duration: 10, target: "self" },
            { id: "counterfeit-resistance", stat: "damageResistance", bonus: "1D10", duration: 10, target: "self" },
            { id: "counterfeit-stamina", stat: "staminaRecovery", bonus: "+6", duration: 10, target: "self" } ], resourceEffects: [
            { id: "counterfeit-stamina-max", resource: "stamina", amount: 50, maximumIncrease: 50, target: "self" },
          ], enhancements: [
            { stat: "physicalAttack", bonus: "1D6" },
            { stat: "damageResistance", bonus: "1D6" },
            { stat: "staminaRecovery", bonus: "+1" },
            { resource: "stamina", maximumIncrease: 25 }
          ] },
          { id: "bob-unexpected-allies", name: "Unexpected Allies", category: "Doppelganger", summary: "Switch positions of all enemies and allies.", description: "You and your allies take an illusionary form of nearby enemies for a minute but you can all still recognise each other, everyone is randomly switch teleported. Also create illusions of your allies", mana: 60, stamina: 0, cooldown: 100, tags: ["Special Ability", "Dimension", "illusion", "Teleport"] },
          { id: "bob-echo-spirit", name: "Echo Spirit", category: "Doppelganger", summary: "An Incorporeal entity that can mimic the form of allies and enemies.", description: "An incorporeal entity that can mimic the form of allies and enemies as well as switch teleport with mimicked allies as well as mirroring ally's movements and attacks but can't inflict damage. While subsumed into the summoners aura, the summoner can manipulate it into projecting false traits, mimicking others auras or can be used to lift objects lighter than 10kg", mana: 0, stamina: 0, cooldown: 0, tags: ["Ritual", "Familiar", "passive"] },
          { id: "bob-seeing-double", name: "Seeing Double", category: "Doppelganger", summary: "Decrease perception of enemies within your aura.", description: "Decrease perception of enemies within your aura and you can see through illusions upto bronze rank.", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Perception", "Illusion", "passive"] }
        ],
        equipment: [
          { id: "spectres-blade", name: "Spectre's Blade", type: "weapon", summary: "A Blade that any assassin would approve of", description: "Spectre's Blade does damage equal to 0.75 of the user's magic damage. Inficts [Phantom\'s Curse] on enemies and [Ectoplasm] on user. Imbued with Bloodroot Sap and applies [Subjugating Toxin] on hit.", damageMultiplier: 0.75, attacks: [
            { id: "standard", name: "Standard Attack", stat: "magic", modifier: "+1" },
            { id: "sneak", name: "Sneak Attack", stat: "magic", modifier: "2D8" }
          ], afflictionEffects: [
            { id: "ectoplasm", afflictionId: "ectoplasm", target: "wielder", stacks: 1, duration: null } ] },
          { id: "cloak-of-the-spectre", name: "Cloak of the Spectre", summary: "A cloak blessed by the Spectre", description: "While equipped, become intangible(take 0.75 damage from physical but 1.5 from disruptive force(you must do the math yourself)), you can do sneak attacks if an ally is within one space of your target for an extra 2D8 and you may disengage/dash as a bonus action" },
          { id: "bramble-crown", name: "Bramble Crown", summary: "While equipped, afflictions can be applied to plants.", description: "While equipped, you make plants and other organic entities more vulnerable, allowing afflictions to be more easily applied, this includes afflictions that they may have an intrinsic immunity too such as [Bleeding] or curses." },
          { id: "amulet-of-elemental-protection", name: "Amulet of Elemental Protection", summary: "While equipped, protection from weather events.", description: "While equipped, you are protected from the effects of weather events such as rain, hail, and snow bouncing off an invisible shield, harsh sunlight being toned down and sandstorms blowing around you." }
        ],
        titles: [
        { id: "bob-godless-prophet", name: "Godless Prophet", description: "Your aura has been damaged by the direct, concerted focus of multiple transcendant level entities. This has increased the strength of your aura, including it's suppressive force and resistance to suppression. An echo of transcendant power if your aura is examined by a power or when projecting it" },
        { id: "bob-spirit-warrior", name: "Spirit Warrior", description: "Fighting off a concerted attack on your soul by a transcendant entity  has refined your ability to use it as a weapon. Your repressive force and resistance to suppression is increased, you can use this to resist forms of magical suppression beyond just aura suppression. After fully suppressing the aura of others, you may use your aura to attack their soul. Your unyielding nature in the face of even the greatest power can be detected if your aura is examined by a power or when projecting it." }
        ],
        inventory: [
        { id: "sin-essence", name: "Sin Essence", description: "An essence that gives an active ability and 4 inactive abilities related to transgression. Only usable if an eligible race has less than 4 essences"},
        { id: "lesser-miracle-potion", name: "Lesser Miracle Potion", description: "A potion that completely restores health, mana and stamina. Only works on iron rankers and below."},
        { id: "padded-leather-armor", name: "Padded Leather Armor", description: "A light armor that provides basic protection."},
        { id: "rain-awakening-stone", name: "Rain Awakening Stone", description: "An awakening stone that activates an inactive ability related to rain. Only usable if an eligible race has less than 20 awakened abilities."},
        { id: "ritual-magic-skill-book", name: "Ritual Magic Skill Book", description: "A book that teaches the fundementals of ritual magic. Can be used during a long rest." },
        { id: "bob-money", name: "Money", description: "500 Gold spirit coints, can eat one to temporarily increase power levels for one turn but has debilitating effects on next turn." }
        ],
        racialGifts: [
          { id: "bob-strengthened-flesh", name: "Strengthened Flesh", summary: "Increased damage resistance.", description: "Your Smoulder ancestry and flesh powers have mutated you into a combination of both; you have increased damage resistance.", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Elemental", "Buff", "passive"], statEffects: [
            { id: "strengthened-flesh-resistance", stat: "damageResistance", bonus: "1D8", target: "self" }
          ] },
          { id: "bob-spellborn", name: "Spellborn", summary: "Your spells have increased effect.", description: "Your spells damage is increased by 1D8.", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive"], statEffects: [
            { id: "spellborn-effect", stat: "magic", bonus: "1D8", target: "self" }
          ] },
          { id: "bob-earthborn", name: "Earthborn", summary: "Increased damage resistance.", description: "Increased damage resistance by 1D8.", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Elemental", "Buff", "passive"], statEffects: [
            { id: "earthborn-resistance", stat: "damageResistance", bonus: "1D8", target: "self" }
          ] },
          { id: "bob-life-fire", name: "Life Fire", summary: "health and stamina recovery from heat.", description: "Increases health and stamina recovery when near heat.", stamina: 0, mana: 0, cooldown: 3, duration: 2, tags: ["Racial Gift", "Elemental", "Buff", "passive"] },
          { id: "bob-heart-of-the-earth", name: "Heart of the Earth", summary: "Increase stamina and mana recovery after meditation.", description: "Increase stamina and mana recovery by 6 for 10 turns after meditating.", stamina: 0, mana: 0, cooldown: 0, duration: 10, tags: ["Racial Gift", "Elemental", "Buff"], statEffects: [
            { id: "heart-of-the-earth-stamina", stat: "staminaRecovery", bonus: "6", duration: 10, target: "self" },
            { id: "heart-of-the-earth-mana", stat: "manaRecovery", bonus: "6", duration: 10, target: "self"}
          ] },
          { id: "bob-backup-plan", name: "The Backup Plan", summary: "Make an object explode in relation to it's size.", description: "Make an object explode in relation to it's size. Must be holdable", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Elemental"] },
        ]
      },
      {
        id: "Pat", name: "Nero Everett", race: "Leonid", magicspecialty: "Improv",
        rank: "Bronze", initials: "NE", color: "#b1bdc8", avatarBg: "#283039",
        resources: { health: 76, mana: 200, stamina: 400 },
        stats: { manaRecovery: 12, staminaRecovery: 102, physicalAttack: "2D8", damageResistance: "2D8", magic: "2D8", magicResistance: "1D8", speed: 51, reflexes: 6 },
        tags: ["unlocked-potential"],
        essences: ["Bat", "Balance", "Cage", "Vessel"],
        abilities: [
          { id: "nero-flying-leap", name: "Flying Leap", category: "Bat", summary: "Powerful leap that can be combined with special attacks", description: "Swift and powerful leap with limited air control that can be combined with normal or special melee attacks, increasing all damage regardless of damage type by +1D8. Can be specially combined with Dive Bomb and another Special Attack for even more damage", mana: 0, stamina: 10, cooldown: 2, tags: ["Special Ability", "Combination", "Movement", "Wind"], enhancements: [
            { stat: "physicalAttack", bonus: "1D8" } ], statEffects: [
            { id: "flying-leap-attack", stat: "physicalAttack", bonus: "1D8", duration: 1, target: "self" } ] },
          { id: "nero-dive-bomb", name: "Dive Bomb", category: "Bat", summary: "Dive at an enemy from above to deal extra damage", description: "Accelerate down to attack from above; can be combined with normal or special melee attacks. Physical damage is increased by +1D8 and a resonating force shockwave is produced from the impact point to produce knockback but not damage. No falling damage is suffered from this ability, even if it misses. Can be specially combined with Flying Leap and another Special Attack for even more damage", mana: 0, stamina: 40, cooldown: 3, tags: ["Special Ability", "Movement", "Combination"], enhancements: [
            { stat: "physicalAttack", bonus: "1D8" } ], statEffects: [
            { id: "dive-bomb-attack", stat: "physicalAttack", bonus: "1D8", duration: 1, target: "self" } ] },
          { id: "nero-leech-bite", name: "Leech Bite", category: "Bat", summary: "Inflicts [Bleeding] and [Leech Toxin]", description: "Special attack that can be combined with a melee strike to inflict or refresh [Bleeding] and [Leech Toxin]. Drains 1D8 of health and stamina when refreshing the bleeding condition", mana: 10, stamina: 10, cooldown: 0, tags: ["Special Attack", "Melee", "Drain", "Wounding", "Blood"] },
          { id: "nero-sanguine-transformation", name: "Sanguine Transformation", category: "Bat", summary: "Transform your body to enhance your combat abilities.", description: "You grow a set of crimson bat wings and fangs, the wings allow you to fly, soar and glide at 1.5 times your normal movement speed and your fangs can bite people to siphon mana and stamina equal to 1D8 multiplied by 10.", mana: 18, stamina: 0, cooldown: 2, activeMode: "toggle", upkeep: { mana: 18 }, tags: ["Conjuration", "Movement", "Drain", "Active"] },
          { id: "nero-vampire-intimidation", name: "Vampire\'s Intimidation", category: "Bat", summary: "Ignore rank disparity and see miridian movements.", description: "Enemies of a higher rank recognise your strength and you can ignore rank disparity. You are also able to see blood and mana flow through the body on bronze rank or lower creatures.", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Perception", "Blood", "passive"] },
          { id: "nero-lifeforce-imbalance", name: "Lifeforce Imbalance", category: "Balance", summary: "Adjust your health and gain an affliction based on the change.", description: "Enter a signed health change. Losing health applies [Dark Descent] stacks equal to the percentage of your maximum health lost (rounded up); gaining health applies one [Impervious]. Use the Buffs page to track afflictions on other characters.", mana: 60, stamina: 0, cooldown: 999, tags: ["Special Ability", "Recovery", "Counter-Execute"], resourceEffects: [
            { id: "lifeforce-health-change", resource: "health", amount: "XX", target: "self" }
          ], afflictionEffects: [
            { id: "lifeforce-dark-descent", afflictionId: "dark descent", target: "self", trigger: "resourceChange", resourceEffectId: "lifeforce-health-change", condition: "decrease", stacksFromPercentageOfMax: true },
            { id: "lifeforce-impervious", afflictionId: "impervious", target: "self", trigger: "resourceChange", resourceEffectId: "lifeforce-health-change", condition: "increase", stacks: 1 }
          ] },
          { id: "nero-mana-tide", name: "Mana Tide", category: "Balance", summary: "Draw mana from the astral to replenish allies.", description: "All party members gain an accelerating mana-recovery bonus over 300 rounds, reaching +40 mana recovery per turn on round 300. While Mana Tide is active, each 10 mana an ally actually spends on abilities adds 1/6 mana recovery per turn to that ally; every 60 mana spent adds +1 recovery per turn.", mana: 60, stamina: 0, cooldown: 999, manaTide: { durationRounds: 300, maxRecovery: 40, manaPerRecovery: 60, growth: "quadratic" }, tags: ["Special Ability", "Recovery", "Counter-Execute"] },
          { id: "nero-juxtapose", name: "Juxtapose", category: "Balance", summary: "Swap the location of two entities.", description: "Swap the location of two allies and/or enemies. You must be able to see both subjects. If an ally resists or prevents it, it is negated. Enemies affected by this ability take +10% from all sources for 1 turn.", mana: 40, stamina: 0, cooldown: 10, tags: ["Special Ability", "Magic", "Teleport"] },
          { id: "nero-instant-karma", name: "Instant Karma", category: "Balance", summary: "Target takes the damage it just dealt", description: "The target suffers damage of the same amount and type. This is considered retributive damage. Reducing or negating the original damage does not reduce or negate the retributive damage. (Only affects entities with a motive spirit).", mana: 10, stamina: 0, cooldown: 0, tags: ["Spell", "Retributive", "Holy"] },
          { id: "nero-equillibrium", name: "Equilibrium", category: "Balance", summary: "Meditate to accrue instances of [Integrity] and [Resistant].", description: "Meditate to accrue 6 instances of [Integrity] and 12 instances of [Resistant] per turn up to a maximum of 20 Integrity and 40 Resistant. Beacon of Hope increases stacks to 9 and 18 gained respectively", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Buff", "Recovery"], afflictionEffects: [
            { id: "equilibrium-integrity", afflictionId: "integrity", target: "self", stacks: 9, duration: 1, maxStacksPerTurn: 9, maxTotalStacks: 20 },
            { id: "equilibrium-resistant", afflictionId: "resistant", target: "self", stacks: 18, duration: null, maxStacksPerTurn: 18, maxTotalStacks: 40 }
          ]},
          { id: "nero-power-lock", name: "Power Lock", category: "Cage", summary: "When the target uses an ability, a second one goes on cooldown.", description: "When the target uses an ability, a random other ability goes on cooldown and uses mana, as if it has been used, if the ability had no mana cost, the target suffers disruptive-force damage commensurate with the strength of the ability. If the target has no other abilities, the ability it used has doubled cooldown, or if the ability has no cooldown, it becomes unavailable for a brief period.", mana: 40, stamina: 0, cooldown: 10, tags: ["Special Ability", "Curse", "Magic"] },
          { id: "nero-verdant-cage", name: "Verdant Cage", category: "Cage", summary: "Grow vines to restrain a target.", description: "Grow vines to restrain a target. More effective in areas already containing pant life. Binding plants have damaging thorns that do 1D8 damage per turn.", mana: 0, stamina: 0, cooldown: 0, tags: ["Spell", "Conjuration", "Poison"] },
          { id: "nero-lotus-redoubt", name: "Lotus Redoubt", category: "Cage", summary: "Creates a Lotus around you and your allies to recover resources.", description: "Creates a Lotus around you and your allies, where recovery of health, mana and stamina is increased. You are unable to do anything inside of the lotus and it has a health pool of 300. Lotus\'s wear off after 3 turns", mana: 20, stamina: 0, cooldown: 99, tags: ["Spell", "Recovery", "Elemental"], afflictionEffects: [
            { id: "lotus-redoubt-recovery", afflictionId: "lotus redoubt", target: "party", stacks: 1, duration: 3, maxStacksPerTurn: 1, maxTotalStacks: 1}
          ]},
          { id: "nero-large-pockets", name: "Large Pockets", category: "Cage", summary: "You have a dimensional storage space accessible through your pockets", description: "You have a dimensional storage space accessible through your pockets. The entry can be stretched as big as you need but anything with a motive spirit cannot enter", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Dimension", "passive"] },
          { id: "nero-unlocked-potential", name: "Unlocked Potential", category: "Cage", summary: "Overcharge mana and stamina; negative resources prevent further ability use.", description: "You can push yourself further than you could before, spending mana or stamina below zero. While either resource is negative, you cannot activate any abilities until both return to zero or higher.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "passive"] },
          { id: "nero-counterfeit-combatant", name: "Counterfeit Combatant", category: "Vessel", summary: "damage increases by 2d10s", description: "Grow to a large form(2x2) and gain temporary proficiency with armour and melee weapons. Your maximum stamina increases by 50, your damage is increased by 2d10s, your damage resistance is increased by 1D10 and gain an extra +6 to stamina recovery. Beacon of Hope increases stat gain to +3D10 and +2D10, +9 and +75 to damage, damage resistance, stamina recovery and stamina respectively", mana: 60, stamina: 0, cooldown: 3600, duration: 10, tags: ["Special Ability", "Shapeshift", "Buff", "Attribute-Increasing"], enhancements: [
            { stat: "physicalAttack", bonus: "1D6" }, { stat: "damageResistance", bonus: "1D6" }, { stat: "staminaRecovery", bonus: "+1" }, { resource: "stamina", maximumIncrease: 25 } ], statEffects: [
            { id: "counterfeit-attack", stat: "physicalAttack", bonus: "2D10", duration: 10, target: "self" },
            { id: "counterfeit-resistance", stat: "damageResistance", bonus: "1D10", duration: 10, target: "self" },
            { id: "counterfeit-stamina", stat: "staminaRecovery", bonus: "+6", duration: 10, target: "self" } ], resourceEffects: [
            { id: "counterfeit-stamina-max", resource: "stamina", amount: 50, maximumIncrease: 50, target: "self" },
          ] },
          { id: "nero-projection", name: "Projection", category: "Vessel", summary: "Summon a small drone to project your senses into.", description: "Project your senses into a small flying drone that is normal rank and can move around. The drone cannot attack but your aura can be projected into it with little control.", mana: 10, stamina: 0, cooldown: 10, tags: ["Special Ability", "Conjuration"] },
          { id: "nero-free-runner", name: "Free Runner", category: "Vessel", summary: "Increased speed, reflexes, balance and spatial sense.", description: "Increase your speed, reflexes, balance and spatial sense.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Movement", "passive"], enhancements: [
            { stat: "speed", bonus: 6 },
            { stat: "reflexes", bonus: 1 } ], statEffects: [
            { id: "free-runner-speed", stat: "speed", bonus: 6, target: "self" },
            { id: "free-runner-reflexes", stat: "reflexes", bonus: 1, target: "self" } ], variants: [
            { id: "free-runner-balance", name: "Wall/Water Run", description: "Low mana cost to run on walls or water. Momentum must be maintained on walls or water to prevent falling", mana: 6, stamina: 6, cooldown: 0, activeVersion: true, tags: ["Movement"] }]},
          { id: "nero-avatar-of-speed", name: "Avatar of Speed", category: "Vessel", summary: "Enhances your Movement-tagged ability effects and reduces their costs.", description: "Your Movement-tagged ability effects are enhanced, and their mana and stamina costs are reduced by 5. Select the momentum action to enter spaces moved; gain one instance of [Momentum] per 10 spaces.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Movement", "Buff", "passive", "enhancement"], enhancement: { target: "self", targetTags: ["Movement"] }, costEffects: [
            { id: "avatar-of-speed-costs", mana: 5, stamina: 5, target: "self", abilityTags: ["Movement"] }
          ], variants: [
            { id: "avatar-speed-momentum", name: "Gain Momentum", description: "Enter the number of spaces you moved. Gain one [Momentum] for every 10 spaces.", mana: 0, stamina: 0, cooldown: 0, activeVersion: true, inputFields: [
              { id: "spacesMoved", label: "Spaces moved", min: 0 }
            ], afflictionEffects: [
              { id: "avatar-speed-momentum-stacks", afflictionId: "momentum", target: "self", stacksFromInput: { field: "spacesMoved", divisor: 10 }, duration: 1, maxStacksPerTurn: 999, maxTotalStacks: 999}
            ] }
          ] },
          { id: "nero-complete-unification", name: "Complete Unification", category: "Vessel", summary: "You are a gestalt entity and you are stronger because of it.", description: "Your body and soul are one. Your aura is greatly strengthened, and you have a greater resistance to astral forces or effects that utilise the soul-body disconnect. Your resistance to hostile dimension effects is increased and dimension effects, disruptive force damage and transcendent damage you deal is increased. Physicall reallity around you is more stable and you are able to sense nearby astral space aperatures and proto-spaces coterminous to your location. You can enter them even if they\'re closed or sealed. If you can enter the astral, you can create a small zone of physical reality around you. When suffering lethal damage, instead of dying. Your new body wil undergo a nirvanic rebirth, returning to a state of full integrity. This effect can only be triggered again after you rank up from the last time it was used.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Dimension", "passive"] }
        ],
        equipment: [
          { id: "nero-gladiator-sword", name: "Gladiator's Sword", type: "weapon", summary: "The sword of a mighty gladiator", description: "Strikes with this weapon inflict [Gladiator's Honour] and [The Crowd Cheers] on both target and wielder. All melee attacks with this weapon deal D10 damage and attacks made double momentum stacks. Imbued with Bloodroot Sap and applies [Subjugating Toxin] on hit.", damageDieSides: 10, attacks: [
            { id: "standard", name: "Standard Attack", stat: "physicalAttack" } ], afflictionEffects: [
            { id: "gladiators-honour", afflictionId: "gladiator's honour", target: "wielder", stacks: 1, duration: null },
            { id: "crowd-cheers", afflictionId: "the crowd cheers", target: "wielder", stacks: 1, duration: null } ] },
          { id: "nero-gladiator-scabbard", name: "Gladiator's Scabbard", type: "weapon", summary: "The trusty Scabbard that keeps a mighty sword", description: "when \"Gladiator's Sword\" is sheathed inside, any instances of [Gladiator's Honour] and [The Crowd Cheers] are removed from everyone. Strike enemies with the sheathed sword to inflict [Gladiator's Mercy] and [The Crowd Boos] on the target.", damageDieSides: 10, attacks: [
            { id: "standard", name: "Sheathed Strike", stat: "physicalAttack" } ] },
          { id: "nero-frying-pan", name: "Frying Pan", type: "weapon", summary: "A improvised frying pan", description: "An improvised frying pan that has been attached to a long bendy stick... for some reason. Imbued with Bloodroot Sap and applies [Subjugating Toxin] on hit.", attacks: [
            { id: "standard", name: "Standard Attack", stat: "physicalAttack", modifier: "-1D8" } ] },
          { id: "nero-glider-suit", name: "Glider Suit", summary: "A suit that allows you to glide and soar", description: "A suit that allows you to glide and soar. It is resistant to Drag, Rain, with slight air manipulation for mobility. Flaps are stored in a small dimensional space." }
        ],
        titles: [
          { id: "nero-resolute", name: "Resolute", description: "The damage you suffered in your stand against a much more powerfu enemy has marked your soul. Your resistance to higher-ranked auras is increased, Your unfincching resolve can be detected if your aura is examined by a power or when projecting it." }
        ],
        inventory: [
          { id: "nero-mana-potion", name: "Mana Potion", description: "A potion that restores 50 mana." },
          { id: "nero-lessor-miracle-potion", name: "Lesser Miracle Potion", description: "A potion that completely restores health, mana and stamina. Only works on iron rankers and below."},
          { id: "nero-bloodroot-whetstone", name: "Bloodroot Whetstone", description: "A whetstone that can be used to imbue weapons with Bloodroot Sap, those weapons then inflict [Subjugating Toxin] on hit"},
          { id: "nero-snake-essence", name: "Snake Essence", description: "An essence that gives 1 active ability and 4 inactive abilities related to snakes. Only usable if an eligible race has less than 4 essences"},
          { id: "nero-duck-essence", name: "Duck Essence", description: "An essence that gives 1 active ability and 4 inactive abilities related to ducks. Only usable if an eligible race has less than 4 essences"},
          { id: "nero-blood-essence", name: "Blood Essence", description: "An essence that gives 1 active ability and 4 inactive abilities related to blood. Only usable if an eligible race has less than 4 essences"},
          { id: "nero-flesh-essence", name: "Flesh Essence", description: "An essence that gives 1 active ability and 4 inactive abilities related to flesh. Only usable if an eligible race has less than 4 essences. This one belongs to Lizzie but is on loan to Nero."},
          { id: "nero-plant-essence", name: "Plant Essence", description: "An essence that gives 1 active ability and 4 inactive abilities related to plants. Only usable if an eligible race has less than 4 essences. This one used to belong to Hamish but he's dead now so it belongs to Nero."},
          { id: "nero-adept-essence", name: "Adept Essence", description: "An essence that gives 1 active ability and 4 inactive abilities related to proficiency. Only usable if an eligible race has less than 4 essences"},
          { id: "nero-mud-awakening-stone", name: "Mud Awakening Stone", description: "An awakening stone that activates an inactive ability related to mud. Only usable if an eligible race has less than 20 awakened abilities."},
          { id: "nero-money", name: "Money", description: "500 Gold spirit coints and 164 silver spirit coints, these can be eaten to temporarily increase power levels for one turn but has debilitating effects on next turn. 5 bronze spirit coints, this can increase the power level of an iron ranker or below but satiates bronze rankers magic levels. 1 Lesser spirit coin." },
          { id: "spell-lance-of-the-magister", name: "Spell Lance of the Magister", description: "The staff of an ancient sorcerer, this weapon primes enemies for a potent magical assault. Basic attack: Focused Disruptive force bolt (extra 1d8 magic) inflicts [Spell Impotence] and [Mana Siphon]. Basic attack: Disruptive force beam. Consumes 1/s mana; sustaining the beam on the target periodically inflicts [Spell Impotence] and [Mana Siphon]. Effect: Increases mana consumption when casting a spell to increase the effect. The effect is further increased if wielding both Spell Lance of the Magister and Magister's Tithe. Instances of [Spell Impotence] are inflicted at a faster rate" },
          { id: "magisters-tithe", name: "Magister's Tithe", description: "The tithe of an ancient sorcerer, used to sustain combat effectiveness. Basic attack: Disruptive force beam (extra 1D8), Inflicts [Mana Siphon] and [Spell Impotence]. Basic attack: Mana-draining beam; this effect is increased if you are wielding both Spell Lance of the Magister and Magister's Tithe."},
          { id: "kywraght-notebook", name: "Kywraght's Notebook", description: "This was all that was written in it when he died: Niell Divone, Jory Tilmin - big guy with potions, Keen, Jason, Sophie, Shade - British ghost we meet and follows us, Ahmid Ah Hebeer - wants a scythe for 1 awakening stones per person, gets hired by diamond rankers for things, Constance - Gerry Birad\'he\'s righthand woman, Reaper - great Astral being, death is being finality, guides souls into the Astral, astral beings don't have first names, Astral beings give awakening stones to people who venerate them as a gift, Cannot take it away, it is just a give, Gives us a ability based of essence but also linked to the Reaper and death, Order of Reaper is an order of assassins, who kill kings and queens, Ragged starry cloak, Nightmare hag?, Big tower that creates trials, In rainforest, Reptiles, Puma, Panther, Big snake, Big dog, Hydel horse lizard"}

        ],
        racialGifts: [
          { id: "nero-thighs-of-steel", name: "Thighs of Steel", summary: "Increased Strength, Speed and Reflexes.", description: "Increased Strength by 1D8, Speed by 6 and Reflexes by 1.", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive"], statEffects: [
            { id: "thighs-of-steel-strength", stat: "physicalAttack", bonus: "1D8", target: "self" },
            { id: "thighs-of-steel-speed", stat: "speed", bonus: 6, target: "self" },
            { id: "thighs-of-steel-reflexes", stat: "reflexes", bonus: 1, target: "self" }
          ]},
          { id: "nero-ancestral-swiftness", name: "Ancestral Swiftness", summary: "Increased Speed and Reflexes.", description: "Increased Speed by 6 and Reflexes by 1.", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive"], statEffects: [
            { id: "ancestral-swiftness-speed", stat: "speed", bonus: 6, target: "self" },
            { id: "ancestral-swiftness-reflexes", stat: "reflexes", bonus: 1, target: "self" }
          ] },
          { id: "nero-beacon-of-hope", name: "Beacon of Hope", summary: "Buffing abilities have increased effect.", description: "Buffing abilities have increased effect and are greatly enhanced if targeting allies", cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive", "enhancement"], enhancement: { target: "self", targetTags: ["Buff"] } },
          { id: "nero-Tireless", name: "Tireless", summary: "less stamina usage", description: "Resistant to stamina drain, Essence abilities consume less stamina to use", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive"], costEffects: [
            { id: "nero-tireless-self", stamina: 10, target: "self" } ] },
          { id: "nero-sprint", name: "Sprint", summary: "You can dash", description: "Do your movement speed again for 135 stamina(this does not cost an action)", stamina: 135, mana: 0, cooldown: 0, duration: 0, usesPerTurn: 99, tags: ["Racial Gift", "Movement"] },
          { id: "nero-echolocation", name: "Echolocation", summary: "You can pulse your aura to sense the area around you", description: "You can pulse your aura to sense the area around you and feel physical objects. Your aura is also stronger", stamina: 0, mana: 0, cooldown: 0, duration: 0, tags: ["Racial Gift", "Perception", "passive"], variants: [
            { id: "nero-echo-roar", name: "Echo Roar", summary: "Roar to increase stats of allies", description: "Roar to increase Allies' Power, Speed and Spirit attributes for 3 turns", stamina: 0, mana: 0, cooldown: 10, duration: 0, activeVersion: true, tags: ["Racial Gift", "Buff"], afflictionEffects: [
              { id: "nero-echo-roar-buff", afflictionId: "echo-roar", target: "others", stacks: 1, duration: 3, maxStacksPerTurn: 1, maxTotalStacks: 1 }
            ] } ] }

        ]
      },
      {
        id: "Sam", name: "Giorn the Bald Pigeon ™ the Third ™ ™ .™", race: "Draconian", magicspecialty: "Artificing and Ritual",
        rank: "Bronze", initials: "GBP", color: "#831010", avatarBg: "#ca2525",
        resources: { health: 53, mana: 340, stamina: 340 },
        stats: { manaRecovery: 12, staminaRecovery: 32, physicalAttack: "2D8", damageResistance: "2D8", magic: "3D8+1", magicResistance: "2D8+1", speed: 16, reflexes: 3 },
        essences: ["Magic", "Dimension", "Wing", "Dragon"],
        abilities: [
          { id: "giorn-mirror-magic", name: "Mirror Magic", category: "Magic", summary: "Copy an ability an ally has used within the last turn", description: "Copy an ability an ally has used within the last turn. This ability has the same cost and cooldown as the original spell. Using this spell can increase or decrease the rank of the original spell to the rank of this spell, including gaining or losing effects. This also has a reduced cooldown and cost if the rank has been increased.", mana: "XX", stamina: "XX", cooldown: "XX", tags: ["Special Ability", "Magic", "Copy"] },
          { id: "giorn-crystalize-mana", name: "Crystalize Mana", category: "Magic", summary: "Create up to three crystals that accelerate mana recovery.", description: "Create a crystal that floats around you, accelerating mana recovery. The crystal is impervious to damage, but vulnerable to dispel effects and can intercept projectiles, negating the effect then it becomes inactive for 3 turns. If dispelled, crystals grant an immediate burst of 50 mana. You can have up to three mana crystals at a time.", mana: 10, stamina: 0, cooldown: 0, charges: 3, recharge: 3, crystalSummon: { max: 3, disableTurns: 3 }, tags: ["Conjuration", "Restoration", "Buff"] },
          { id: "giorn-astral-lantern", name: "Astral Lantern", category: "Magic", summary: "Familiar that resembles a small floating lantern.", description: "Reveals nearby, hidden enemies. Makes ranged attacks with bolts of disruptive force. Can intercept and negate magical projectiles. Negating powerful projectiles means the Astral lantern needs to recharge. The summoner can use mana to help Astral lantern recharge faster. Familiar can be subsumed into the caster's eyes. When it has done so, the summoner can see hidden enemies and consume mana to make disruptive-force beam attacks from their eyes. Enemies revealed by the Astral lantern take 6 transcendent damage per turn.", mana: 0, stamina: 0, cooldown: 2, tags: ["Familiar", "Summon", "Transcendent"] },
          { id: "giorn-teleport", name: "Teleport", category: "Magic", summary: "Teleport to a point within sight.", description: "Teleports the user to a point within sight, with a maximum limit of 100 km, and You can also teleport essence users of Bronze rank and below with you for a cost of +5 per person; Iron rankers and below don\'t have a mana cost to teleport", mana: 40, stamina: 0, cooldown: 10, tags: ["Special Ability", "Magic", "Teleport"] },
          { id: "giorn-magically-refined", name: "Magically Refined", category: "Magic", summary: "Magic around you is refined and stabilised.", description: "The ambient magic around you is stablised and you are able to perform rituals up to one rank higher than your own without changing the environment. The side effects of consuming spirit coins higher then your own rank are also reduced", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Magic", "passive"] },
          { id: "giorn-god-striking-fist", name: "God Striking Fist", category: "Dimension", summary: "Make a hard fast punch extremely powerful punch.", description: "Make a hard, fast punch. Time and space manipulation will not function in the vicinity while the punch is being swung. Damage for this ability is double your attack and magic attack combined. Cooldown is reduced based on the condition of the enemy after the attack. More resilient enemies result in a shorter cooldown time. An amount of stamina and mana is refunded based on the condition of the enemy. A sufficiently resilient enemy may trigger a refund of stamina and mana greater than the initial cost.", mana: "XX", stamina: "XX", cooldown: 6666, tags: ["Dimension", "Special Attack", "attack"],
            attacks: [{ id: "god-striking-fist-punch", name: "Punch", stats: ["physicalAttack", "magic"] }]
          },
          { id: "giorn-dimensional-blade", name: "Dimensional Blade", category: "Dimension", summary: "Summon a dimensional sword that adds 2D8 to your higher attack stat.", description: "Summon a sword made of black lightning lined in silver; it can cut through almost anything. Its slash uses whichever is higher, Physical Attack or Magic, and adds 2D8.", mana: 20, stamina: 0, cooldown: 0, tags: ["Dimension", "conjuration", "attack"],
          attacks: [{ id: "dimensional-blade-slash", name: "Dimensional Slash", stats: ["physicalAttack", "magic"], statMode: "highest", modifier: "2D8" }]
          },
          { id: "giorn-dimensional-transfiguration", name: "Dimensional Transfiguration ", category: "Dimension", summary: "You may switch your physical and magical attributes during a long rest.", description: "You may switch your physical and magical attributes during a long rest and get a temporary 1 hour 1D8 buff to both stats which can be extended by 30mins during a short rest.", mana: 0, stamina: 0, cooldown: 0, tags: ["Dimension", "Special Ability", "Buff"], statEffects: [
            { id: "dimensional-transfiguration-physical", stat: "physicalAttack", bonus: "1D8", duration: 1, target: "self" },
            { id: "dimensional-transfiguration-magic", stat: "magic", bonus: "1D8", duration: 1, target: "self" },
            { id: "dimensional-transfiguration-physical-resistance", stat: "damageResistance", bonus: "1D8", duration: 1, target: "self" },
            { id: "dimensional-transfiguration-magic-resistance", stat: "magicResistance", bonus: "1D8", duration: 1, target: "self" }
          ] },
          { id: "giorn-reaper-hand", name: "Hand of the Reaper", category: "Dimension", summary: "expand your reach to 2 spaces through a semi-substantial arm.", description: "Conjure up to 2 highly flexible semi-substantial shadow-arms that can extend or shrink up to 2 spaces. Conjured items can be conjured into the shadow hand. Can be used to make melee special attacks. Special attacks made using the arm inflict [Creeping Death] and [Rigor Mortis].", mana: 6, stamina: 0, cooldown: 0, activeMode: "toggle", upkeep: { mana: 6 }, tags: ["Conjuration", "Disease", "Magic", "Holy"] },
          { id: "giorn-dimensional-anomaly", name: "Dimensional Anomaly", category: "Dimension", summary: "Allies dimensional and attribute increasing abilities are enhanced.", description: "Allies within your aura gain a bonus to their dimensional and attribute increasing abilities and the physical reality around you is more stable.", mana: 0, stamina: 0, cooldown: 0, tags: ["aura", "Dimension", "buff", "passive", "enhancement"], enhancement: { target: "others", targetTags: ["Attribute-Increasing", "Dimension"] } },
          { id: "giorn-dive-bomb", name: "Dive Bomb", category: "Wing", summary: "Dive at an enemy from above to deal extra damage", description: "Accelerate down to attack from above; can be combined with normal or special melee attacks. Physical damage is increased by +1D8 and a resonating force shockwave is produced from the impact point to produce knockback but not damage. No falling damage is suffered from this ability, even if it misses. Can be specially combined with Flying Leap and another Special Attack for even more damage", mana: 0, stamina: 40, cooldown: 3, tags: ["Special Ability", "Movement", "Combination"], enhancements: [
            { stat: "physicalAttack", bonus: "1D8" } ], statEffects: [
            { id: "dive-bomb-attack", stat: "physicalAttack", bonus: "1D8", duration: 1, target: "self" } ] },
          { id: "giorn-flying-leap", name: "Flying Leap", category: "Wing", summary: "Powerful leap that can be combined with special attacks", description: "Swift and powerful leap with limited air control that can be combined with normal or special melee attacks, increasing all damage regardless of damage type by +1D8. Can be specially combined with Dive Bomb and another Special Attack for even more damage", mana: 0, stamina: 10, cooldown: 2, tags: ["Special Ability", "Combination", "Movement", "Wind"], enhancements: [
            { stat: "physicalAttack", bonus: "1D8" } ], statEffects: [
            { id: "flying-leap-attack", stat: "physicalAttack", bonus: "1D8", duration: 1, target: "self" } ] },
          { id: "giorn-gust", name: "Gust", category: "Wing", summary: "Flap your wings to create a gust of wind.", description: "flap your wings to create a gust of wind, this will create difficult terrain for 1 turn, ground anyone who is flying and give everyone disadvantage on attack checks unless they have wind resistance.", mana: 0, stamina: 20, cooldown: 1, tags: ["Special Ability", "Wind"] },
          { id: "giorn-dragon-wings", name: "Dragon Wings", category: "Wing", summary: "Manifest powerful dragon wings that lack agility", description: "Manifest powerful dragon wings that lack agility, they allow you to fly or make crude attacks to the sides and rear using half your physical attack, enhancement reduces cost from 18 to 12.", mana: 12, stamina: 0, cooldown: 0, activeMode: "toggle", upkeep: { mana: 12 }, tags: ["Conjuration", "Movement", "Dragon", "attack"],
          attacks: [{ id: "dragon-wings-attack", name: "Wing Attack", stats: ["physicalAttack"], damageMultiplier: 0.5 } ] },
          { id: "giorn-spiritual-wings", name: "Spiritual Wings", category: "Wing", summary: "Allies within the aura have feather falling", description: "Allies within your aura take reduced fall damage and have increased mobility in the air.", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "passive"] },
          { id: "giorn-spartoi", name: "Spartoi", category: "Dragon", summary: "summon 7 dragon tooth warriors", description: "Summon 7 dragon tooth warriors, +1 extra because of draconic ancestry. This takes your action this turn and the next turn but they summon next turn and can move but not attack. Costs 1 bronze spirit coin ontop of the mana cost", mana: 80, stamina: 0, cooldown: 3600, duration: 1, tags: ["Ritual", "Summon", "Dragon"] },
          { id: "giorn-mirage-dragon", name: "Mirage Dragon", category: "Dragon", summary: "You have bonded with a mirage dragon familiar", description: "you have bonded with a mirage dragon familiar, it can transform into any creature it has seen of bronze rank or lower but it only gains the magical abilities of creatures of bronze rank or lower. In it's dragon form, it's about the size of a golden retriever.", mana: 0, stamina: 0, cooldown: 0, tags: ["Familiar", "Bond", "passive"] },
          { id: "giorn-fire-breath", name: "Fire Breath", category: "Dragon", summary: "breathe a 3 space long line of fire", description: "breathe a 3 space long line of fire, dealing magic damage +1D8(2D8s because of Dragon's Might) that inflicts [Burning]", mana: 80, stamina: 0, cooldown: 9, tags: ["Dragon", "Magic", "attack", "Fire"], attacks: [
            { id: "fire-breath-attack", name: "Fire Breath", stats: ["magic"], modifier: "2D8" } ], enhancements: [
            { stat: "magic", bonus: "+1" } ] },
          { id: "giorn-dragon-sight", name: "Dragon Sight", category: "Dragon", summary: "You can see magic and auras", description: "You can see magic and auras of creatures at bronze rank or lower.", mana: 0, stamina: 0, cooldown: 0, tags: ["Dragon", "Perception", "passive"] },
          { id: "giorn-dragon-might", name: "Dragon's Might", category: "Dragon", summary: "Allies have significantly increased power and spirit attributes", description: "Allies within your aura have significantly increased power and spirit attributes and fire created by your essence abilities become dragon fire(+1D8)", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Buff", "passive", "Attribute Increasing", "enhancement"], enhancement: { target: "self", targetTags: ["Fire"] }, statEffects: [
            { id: "dragon-might-power", stat: "physicalAttack", bonus: "1D12", target: "others" },
            { id: "dragon-might-spirit", stat: "magic", bonus: "1D12", target: "others" },
            { id: "dragon-might-magic-resistance", stat: "magicResistance", bonus: "1D12", target: "others" },
            { id: "dragon-might-damage-resistance", stat: "damageResistance", bonus: "1D12", target: "others" }
          ] }
        ],
        equipment: [
          { id: "giorn-champion-sabre", name: "Champion Sabre", type: "weapon", summary: "A sabre that a fabled champion once used.", description: "Can channel conjured weapons to gain their effects, reflexes increased by +2. Hit \“Champion\'s Sabre\” against \“Champion\'s Aspis\” to lure the enemy towards you(2D8 modifier in the attack equation is from dimensional blade channeling)", statEffects: 
          [{ id: "champion-sabre", stat: "reflexes", bonus: "+2", target: "self" }], attacks: [
            { id: "standard", name: "Standard Attack", stats: ["physicalAttack", "magic"], statMode: "highest", modifier: "2D8" } ] },
          { id: "giorn-champion-aspis", name: "Champion Aspis", summary: "The shield that protected the champion from harm.", description: "Transfer an amount of targetable damage to a willing ally within 1 space, Damage Resistance is increased by 1D8 and you gain instances of [Resistant] over time", statEffects: 
          [{ id: "champion-aspis", stat: "damageResistance", bonus: "+1D8", target: "self" }] }
        ],
        inventory: [
          { id: "giorn-lessor-miracle-potion", name: "Lesser Miracle Potion", description: "A potion that completely restores health, mana and stamina. Only works on iron rankers and below."},
          { id: "giorn-plant-essence", name: "Plant Essence", description: "An essence that gives 1 active ability and 4 inactive abilities related to plants. Only usable if an eligible race has less than 4 essences. This one used to belong to Hamish but he's dead now so it belongs to Nero."},
          { id: "giorn-scroll-of-the-reaper", name: "Scroll of the Reaper", description: "increases physical attack by 2 but reduces magical attack by 2(trainable)." },
          { id: "giorn-money", name: "Money", description: "100 Gold spirit coints, can eat one to temporarily increase power levels for one turn but has debilitating effects on next turn." }
        ],
        racialGifts: [
          { id: "giorn-draconic-might", name: "Draconic Might", summary: "Increased power.", description: "Increases your power attribute by 1D8.", cooldown: 0, duration: 0, tags: ["Attribute Increasing", "Racial Gift", "passive"], statEffects: [
            { id: "draconic-might-power", stat: "physicalAttack", bonus: "1D8", target: "self" },
            { id: "draconic-might-damage-resistance", stat: "damageResistance", bonus: "1D8", target: "self" }
        ]},
      { id: "giorn-draconic-power", name: "Draconic Power", summary: "Increased spirit.", description: "Increases your spirit attribute by 1D8.", cooldown: 0, duration: 0, tags: ["Attribute Increasing", "Racial Gift", "passive"], statEffects: [
        { id: "draconic-spirit-spirit", stat: "magic", bonus: "1D8", target: "self" },
        { id: "draconic-spirit-magic-resistance", stat: "magicResistance", bonus: "1D8", target: "self" }
      ] },
      { id: "giorn-ancestry-blessing", name: "Ancestry's Blessing", summary: "Your dragon abilities are enhanced.", description: "Your dragon tagged abilities are enhanced", cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive"], enhancement: { target: "self", targetTags: ["Dragon"] } },
      { id: "giorn-magic-affinity", name: "Magic Affinity", summary: "Enhanced magical abilities.", description: "Increases magic damage by 1D8", cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive"], statEffects: [
        { id: "magic-affinity-magic", stat: "magic", bonus: "1D8", target: "self" } ] },
      { id: "giorn-reinforced-dragonhide", name: "Reinforced Dragonhide", summary: "Increased damage and magic resistance.", description: "Increases damage and magic resistance by 1D8.", cooldown: 0, duration: 0, tags: ["Racial Gift", "Buff", "passive"], statEffects: [
        { id: "reinforced-dragonhide-damage", stat: "damageResistance", bonus: "1D8", target: "self" },
        { id: "reinforced-dragonhide-magic-resistance", stat: "magicResistance", bonus: "1D8", target: "self" }
      ] },
      {id: "giorn-prismatic-heritage", name: "Prismatic Heritage", summary: "Strong breath weapon with a mixture of elements", description: "You can open your mouth to emit a mixture of purple lightning and green acid in a 3-space cone. This does 2d10(4d10 when combined with Fire Breath, actually use fire breath if you do this) damage and can only be done once per long rest.", mana: 0, stamina: 0, cooldown: 3600, duration: 0, tags: ["Racial Gift", "Fire", "attack"] } ] },
      {
        id: "Lizzie", name: "Amarynth Bellwether", race: "Celelstine", magicspecialty: "Array",
        rank: "Bronze", initials: "AB", color: "#c5a6d8", avatarBg: "#30273a",
        resources: { health: 24, mana: 440, stamina: 440 },
        stats: { manaRecovery: 12, staminaRecovery: 64, physicalAttack: "2D8+1", damageResistance: "2D8+1", magic: "2D8", magicResistance: "2D8", speed: 32, reflexes: 4 },
        essences: ["Moon", "Star", "Sun", "Sky"],
        abilities: [
          { id: "amarynth-fountain", name: "Fountain of Life", category: "Moon", summary: "summons a healing fountain", description: "Creates an ornate fountain that appears in the air, spraying water over people to heal their wounds over time and slowly regenerate mana.", mana: 80, stamina: 0, cooldown: 9999, tags: ["Special Ability", "Healing", "Conjuration"], afflictionEffects: [
            { id: "fountain-of-life-healing", afflictionId: "fountain of life", target: "party", stacks: 1, duration: 10}
          ] },
          { id: "amarynth-path-of-shadows", name: "Path of Shadows", category: "Moon", summary: "Teleport using shadows as a portal", description: "You can sense nearby shadows within your aura and teleport to them using another shadow. Increase the cost to moderate to be able to expand shadows at both the ingress and egress points", mana: 10, stamina: 0, cooldown: 0, tags: ["Special Ability", "Conjuration", "Dimension", "Teleport", "light"], variants: [
            { id: "amarynth-path-of-shadows-expand", name: "Path of Shadows (Expanded)", description: "Expand shadows at both the ingress and egress points so you can teleport between them", mana: 20, stamina: 0, cooldown: 0, usesPerTurn: 2 },
            { id: "amarynth-shadow-portal", name: "Shadow Portal", description: "Conjure a shadow gate between two locations up to 10km apart. The distant location must be a location you've previously visited.", mana: 20, stamina: 0, cooldown: 0, usesPerTurn: 1 }
          ] },
          { id: "amarynth-reaper-shadow", name: "Shadow of the Reaper", category: "Moon", summary: "Summons a Shadow of the Reaper to serve as your familiar", description: "An incorporeal shadow entity with 7 bodies, highly visible in well lit areas but has high mobility, shadow bodies can hide in other peoples shadows as well as your own. When there is no body attached to the summoner, they won't have a shadow and when there is atleast one inside the summoners shadow: they can see and hear through other shadow bodies and hide traces of the summoners presense such as heat, scent, sound, etc. The summoner can also shadow teleport between shade bodies with the teleport range limited to one rank below the current abilities rank.", mana: 0, stamina: 0, cooldown: 0, tags: ["Familiar", "Summon", "light", "Teleport", "passive"] },
          { id: "amarynth-moon-mans-blessing", name: "Moon Man's Blessing", category: "Moon", summary: "The Man on the Moon has blessed you and your abilities are stronger", description: "Your astral affinity has increased, strengthening your astral attacks and resistances. Your spirit attribute is greatly enhanced", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Attribute-Increasing", "passive"], statEffects: [
            { id: "moon-mans-blessing-spirit", stat: "magic", bonus: "1D12", target: "self" },
            { id: "moon-mans-blessing-magic-resistance", stat: "magicResistance", bonus: "1D12", target: "self" }
          ] },
          { id: "amarynth-midnight-eyes", name: "Midnight Eyes", category: "Moon", summary: "Perception ability that allows you to see in the dark", description: "You can see in the dark, but only in monochrome colours and you can sense magic.", mana: 0, stamina: 0, cooldown: 0, tags: ["Perception", "Light", "passive"] },
          { id: "amarynth-retribution-mantle", name: "Mantle of Retribution", category: "Star", summary: "inflicts retributive impact on anyone who attacks the target", description: "Inflicts retributive impact damage on anyone who attacks the target ally equal to the damage dealt; lasts for 1 turn.", mana: 10, stamina: 0, cooldown: 2, tags: ["Spell", "Buff", "Retributive"], afflictionEffects: [
            { id: "mantle-of-retribution", afflictionId: "retributive", target: "self", stacks: 1, duration: 1 }
          ], variants: [ {id: "retribution-team", name: "Team Mantle of Retribution", description: "Moderate mana cost but the mantle of retribution can be bestowed on allies and it lasts for 2 turns", mana: 20, stamina: 0, cooldown: 2, afflictionEffects: [{ id: "team-mantle", afflictionId: "retributive", target: "selected", selectPlayers: true, stacks: 1, duration: 2 }] }]},
          { id: "amarynth-alacrity-reward", name: "Alacrity's Reward", category: "Star", summary: "Accumulate afflictions over time", description: "Accumulate instances of [Blessing of Anticipation] over time, up to an instance threshold of 20. When hit, get a stack of [Integrity] equal to the amount of [Blessing of Anticipation] consumed.", mana: 0, stamina: 0, cooldown: 0, tags: ["Buff", "Special Ability", "Holy", "passive"], afflictionEffects: [ {id: "blessing-of-anticipation", afflictionId: "Blessing of Anticipation", target: "self", stacks: 6, duration: null } ] },
          { id: "amarynth-eye-of-karma", name: "Eye of Karma", category: "Star", summary: "Creates a zone of retributive damage", description: "Creates a wide zone, within the zone, any enemies that attack allies take 1D6 of retributive damage and gain an instance of [Bad Karma] while the attacked ally gains an instance of [Good Karma].", mana: 90, stamina: 0, cooldown: 9999, tags: ["Zone", "Retributive", "Spell"] },
          { id: "amarynth-limit-breaker", name: "Limit Breaker", category: "Star", summary: "Ignore rank disparity upto silver rank", description: "Ignore rank disparity up to silver rank and you can increase the cost of abilities by 10 mana to increase the effect.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "passive"] },
          { id: "amarynth-astral-lantern", name: "Astral Lantern", category: "Star", summary: "Familiar that resembles a small floating lantern.", description: "Reveals nearby, hidden enemies. Makes ranged attacks with bolts of disruptive force. Can intercept and negate magical projectiles. Negating powerful projectiles means the Astral lantern needs to recharge. The summoner can use mana to help Astral lantern recharge faster. Familiar can be subsumed into the caster's eyes. When it has done so, the summoner can see hidden enemies and consume mana to make disruptive-force beam attacks from their eyes. Enemies revealed by the Astral lantern take 6 transcendent damage per turn.", mana: 0, stamina: 0, cooldown: 2, tags: ["Familiar", "Summon", "Transcendent"] },
          { id: "amarynth-burning-orbs", name: "Burning Orbs", category: "Sun", summary: "3 flaming orbs float around you and attack", description: "3 floating orbs float around you, attacking as a free action for 2D10 + your magic damage dice amount(eg. 2D8+1D10+1D6= +4 per orb).", mana: 20, stamina: 0, cooldown: 600, tags: ["Elemental", "Spell", "Conjuration"] },
          { id: "amarynth-boost", name: "Boost", category: "Sun", summary: "Enhances the effect of the next 2 abilities", description: "Enhances the effect of the next 2 abilities.", mana: 10, stamina: 0, cooldown: 600, tags: ["Special Ability", "enhancement"] },
          { id: "amarynth-infinite-eclipse", name: "Realm of the Infinite Eclipse", category: "Sun", summary: "Creates a zone of darkness that suppresses light", description: "Create a zone of darkness that suppresses light sources other than those that come from the user's essence abilities. Enemies are limned in moonlight that increases damage suffered from all sources, which is a curse effect. Allies are limned in sunlight that adds heat damage to all their physical and projectile attacks, which is a magic and fire boon effect. Attacks made by allies bestow [Burning Eye of the Sun] of them and [Pale Eye of the Moon] on enemies. On the 5th turn of this effect, all instances of [Burning Eye of the Sun] and [Pale Eye of the Moon] are consumed to create a powerful beam attack from the eclipse in the sky. Inflicting 1D8 transcendant damage for each affliction consumed", mana: 80, stamina: 0, cooldown: 7200, tags: ["Spell", "Curse", "Buff", "Magic", "Elemental", "Dimension", "Light"] },
          { id: "amarynth-magma-golem", name: "Magma Golem", category: "Sun", summary: "Summons a magma golem to fight for you", description: "Summons a magma golem that can fight for you and make ranged attacks that deal 2D8 damage. Takes this turn to summon but you are unable to use your next turn, magma golem can move next turn. Costs 1 bronze spirit coin ontop of the mana cost", mana: 40, stamina: 0, cooldown: 3600, tags: ["Summon", "Ritual", "Elemental"] },
          { id: "amarynth-radiant-fist", name: "Radiant Fist", category: "Sun", summary: "Unarmed attacks deal additional damage to magical defences and intangible/incorporeal entities", description: "Unarmed attacks deal additional disruptive-force damage, which is highly effective against magical defences and intangible or incorporeal enemies. Unarmed attacks do not trigger retaliation effects. Negate any non-damage effects from actively intercepted attacks(This uses your reaction). Gain an instance of [Impervious] when intercepting non-physical attacks. Gain mana when intercepting magical projectiles.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "passive"] },
          { id: "amarynth-life-bolt", name: "Life Bolt", category: "Sky", summary: "deliver an instanious healing effect through a projectile", description: "Delivers life energy through a projectile, giving a small burst of instantaneous healing as a well as a mild ongoing healing effect. Damages certain targets that are inimical to life force, such as most forms of undead (gives healing equal to your magic). Incantation: \"Imbue with life\"", mana: 10, stamina: 0, cooldown: 0, tags: ["Spell", "Healing"] },
          { id: "amarynth-lightning-tether", name: "Lightning Tether", category: "Sky", summary: "Conjure an iron rod that tethers to a nearby enemy", description: "Conjures an iron rod, from which a tether connects to the nearest enemy within a short range and then chain between any other enemies with 3 spaces. If no enemy is in range, it will attach to the first enemy that enters range. The tether deals 1 damage per space away from the rod/previous connectee per turn. If the rod is destroyed or removed from its location, then lightning strikes the nearest enemy before chaining from one enemy to the next until all enemies in the vicinity have been struck that does damage equal to double your magic damage. The lightning triggered by the destruction of the rod deals heavy electrical damage and inflicts the [Stunned] condition. Dimensional displacement severs the tether. Only one tether may exist at a time.", mana: 6, stamina: 0, cooldown: 0, activeMode: "toggle", upkeep: { mana: 18 }, tags: ["Special Ability", "Conjuration", "Elemental", "Lightning"] },
          { id: "amarynth-flying-leap", name: "Flying Leap", category: "Sky", summary: "Powerful leap that can be combined with special attacks", description: "Swift and powerful leap with limited air control that can be combined with normal or special melee attacks, increasing all damage regardless of damage type by +1D8. Can be specially combined with Dive Bomb and another Special Attack for even more damage", mana: 0, stamina: 10, cooldown: 2, tags: ["Special Ability", "Combination", "Movement", "Wind"], enhancements: [
            { stat: "physicalAttack", bonus: "1D8" } ], statEffects: [
            { id: "flying-leap-attack", stat: "physicalAttack", bonus: "1D8", duration: 1, target: "self" } ] },
          { id: "amarynth-free-runner", name: "Free Runner", category: "Sky", summary: "Increased speed, reflexes, balance and spatial sense.", description: "Increase your speed, reflexes, balance and spatial sense.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Movement", "passive"], enhancements: [
          { stat: "speed", bonus: 6 }, { stat: "reflexes", bonus: 1 } ], statEffects: [
            { id: "free-runner-speed", stat: "speed", bonus: 6, target: "self" },
            { id: "free-runner-reflexes", stat: "reflexes", bonus: 1, target: "self" } ], variants: [
            { id: "free-runner-balance", name: "Wall/Water Run", description: "Low mana cost to run on walls or water. Momentum must be maintained on walls or water to prevent falling", mana: 6, stamina: 6, cooldown: 0, activeVersion: true, tags: ["Movement"] }]},
          { id: "amarynth-celestial-wind", name: "Child of the Celestial Wind", category: "Sky", summary: "Your powers have increased effect", description: "Your celestine racial powers, dimension and wind-related abilities have increased effect. You gain damage reduction to disruptive-force damage and increased resistance to dimension and wind-based effects, and enemies subjected to your wind-related abilities suffer disruptive-force damage.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Dimension", "Holy", "passive"] }
        ],
        equipment: [
          { id: "amarynth-enchantress-gauntlet", name: "Enchantress' Gauntlet", summary: "The glove of a mighty magic user.", description: "Elemental and Astral Abilities have an increased effect and all mana costs are decreased", statEffects: 
          [{ id: "enchantress-gauntlet", stat: "damageResistance", bonus: "+1D8", target: "self" }]},
          { id: "amarynth-enchantress-amulet", name: "Enchantress' Amulet", summary: "The queen of the succubus' amulet.", description: "Healing spells have increased effect and once-off healing bestows an over-time effect, you can also imbue 5 other weapons with [Succubus Blessing]", statEffects: 
          [{ id: "enchantress-amulet", stat: "damageResistance", bonus: "+1D8", target: "self" }] },
          { id: "amarynth-bramble-glove", name: "Glove of Brambles", summary: "Increases elemental abilities effects", description: "Increases the effects of Elemental abilities and significantly increases the effect of nature abilities"},
          { id: "amarynth-kunai-chain", name: "Kunai with Chain", type: "weapon", summary: "A weapon used by a great ninja.", description: "A bronze rank weapon that uses physical attack with 2 spaces of reach.", attacks: [
            { id: "standard", name: "Standard Attack", stats: ["physicalAttack"]}
          ]},
        ],
        inventory: [
          { id: "amarynth-lessor-miracle-potion", name: "Lesser Miracle Potion", description: "A potion that completely restores health, mana and stamina. Only works on iron rankers and below."},
          { id: "amarynth-scroll-of-the-reaper", name: "Scroll of the Reaper", description: "increases magic by 2 but reduces physical attack by 2(trainable)." },
          { id: "amarynth-money", name: "Money", description: "70 Gold spirit coints, can eat one to temporarily increase power levels for one turn but has debilitating effects on next turn." }
        ],
        racialGifts: [
          { id: "amarynth-twilight-avatar", name: "Avatar of Twilight", summary: "Your light abilities have decreased mana and stamina costs", description: "Your light tagged abilities have decreased mana and stamina costs.", cooldown: 0, duration: 0, tags: ["Buff", "Racial Gift", "passive", "enhancement"], costEffects: [
            { id: "Twilight-Avatar", mana: 5, stamina: 5, target: "self", abilityTags: ["Light"] } ] },
          { id: "amarynth-elemental-avatar", name: "Elemental Avatar", summary: "Increased resistances and enhanced elemental abilities", description: "dimension effects, astral forces and Elemental strikes have increased resistance and effects. Transcendent damage is also increased.", cooldown: 0, duration: 0, tags: ["Buff", "Racial Gift", "passive", "enhancement"] },
          { id: "amarynth-holy-affinity", name: "Holy Affinity", summary: "Increased resistance to holy afflictions", description: "Increased resistance to holy afflictions, and Cleanse effects are more effective.", cooldown: 0, duration: 0, tags: ["Holy", "Racial Gift", "passive", "enhancement"] },
          { id: "amarynth-celestial-bounty", name: "Celestial Bounty", summary: "Increased mana recovery", description: "Increases mana recovery by +1.", cooldown: 0, duration: 0, tags: ["Racial Gift", "passive"], statEffects: [{ id: "celetial-mana-recovery", stat: "manaRecovery", bonus: "+1", target: "self" } ] },
          { id: "amarynth-mana-integrity", name: "Mana Integrity", summary: "Mana costs are reduced", description: "Ongoing mana costs for maintained abilities are reduced. Resistance to mana drain effects is increased.", cooldown: 0, duration: 0, tags: ["Racial Gift", "passive"] },
          { id: "amarynth-faster-than-light", name: "Faster than Light", summary: "Speed and Reflexes increased", description: "Your Speed and Reflexes increase proportionally to the amount of [Shades] in your shadow.", cooldown: 0, duration: 0, tags: ["Racial Gift", "passive", "Buff"] }
        ]
      },
      {
        id: "Hamish", name: "Gertrude Smith", race: "Celestine", magicspecialty: "Astral",
        rank: "Bronze", initials: "GS", color: "#55dc6e", avatarBg: "#1a6120",
        resources: { health: 59, mana: 500, stamina: 500 },
        stats: { manaRecovery: 12, staminaRecovery: 64, physicalAttack: "2D8", damageResistance: "2D8", magic: "2D8", magicResistance: "2D8", speed: 32, reflexes: 4 },
        essences: ["Wind", "Balance", "Potent", "Dimension"],
        abilities: [
          { id: "gertrude-absorb-energy", name: "Absorb Energy", category: "Wind", summary: "Drain energy to get mana that caps at your maximum", description: "You can drain kinetic, heat and potential energy from objects and creatures within 2 spaces, this bestows you with mana equal to 1D20 multiplied by 10 but cannot go above your maximum.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Drain"] },
          { id: "gertrude-wind-wave", name: "Wind Wave", category: "Wind", summary: "Produce a powerful blast of air.", description: "Produce a powerful blast of air that can push away enemies and physical projectiles and affects magic area affects/projectiles. Can launch you into the air or move rapidly while already airborne. Is a reaction.", mana: 20, stamina: 0, cooldown: 1, tags: ["Special Ability", "Movement", "Reaction", "Wind"] },
          { id: "gertrude-wind-blade", name: "Wind Blade", category: "Wind", summary: "Create a cutting projectile of air", description: "Create a cutting projectile of air that starts at half a space long and grows for every space it moves while tracking it's target until it hits something, deals half of Magic Damage.", mana: 10, stamina: 0, cooldown: 0, tags: ["Special Attack", "Elemental", "Wind"] },
          { id: "gertrude-cleansing-breeze", name: "Cleansing Breeze", category: "Wind", summary: "Aura that purges toxins from the air", description: "Allies within the aura have increased Resistance to curses, diseases, magic afflictions, poisons and unholy afflictions. Cleansing abilities used on allies within the aura have an increased effect and toxins are continuously purged from allies and the air within the aura.", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Cleanse", "passive"] },
          { id: "gertrude-celestial-wind", name: "Child of the Celestial Wind", category: "Wind", summary: "Your powers have increased effect", description: "Your celestine racial powers, dimension and wind-related abilities have increased effect. You gain damage reduction to disruptive-force damage and increased resistance to dimension and wind-based effects, and enemies subjected to your wind-related abilities suffer disruptive-force damage.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Dimension", "Holy", "passive"] },
          { id: "gertrude-burst-shield", name: "Burst Shield", category: "Balance", summary: "Give an ally a shield", description: "Create a short-lived shield that can fully negate an enemy attack less than silver and partially negate a silver one, exploding outwards, knocking back nearby enemies and inflicting 1D6 of concussive damage and [Vibrant Echo] on anyone damaged by the blast. This is a predictive action, not a reaction", mana: 20, stamina: 0, cooldown: 4, tags: ["Special Ability", "Recovery", "Retributive", "Curse", "Magic"] },
          { id: "gertrude-instant-karma", name: "Instant Karma", category: "Balance", summary: "Target takes the damage it just dealt", description: "The target suffers damage of the same amount and type. This is considered retributive damage. Reducing or negating the original damage does not reduce or negate the retributive damage. (Only affects entities with a motive spirit).", mana: 10, stamina: 0, cooldown: 0, tags: ["Spell", "Retributive", "Holy"] },
          { id: "gertrude-magic-lord", name: "Lord of Magic", category: "Balance", summary: "Increases magic stats and resistance to negative magical effects", description: "You and Allies gain 12 mana recovery and increased resistance to mana drain effects. You gain a permanent +30 maximum mana", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Magic", "Buff", "passive"] }, 
          { id: "gertrude-karmic-warrior", name: "Karmic Warrior", category: "Balance", summary: "Gain and afflict a bunch of stupid Afflictions", description: "When attacked, gain an instance of [Agent of Karma] and [Karmic Sacrifice] and inflict [Bad Karma] on the enemy. Gain an instance of [Good Karma] when healing, cleansing others or suffering damage", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Healing", "Recovery", "passive"] },
          { id: "gertrude-equity", name: "Equity", category: "Balance", summary: "you gain boons that the enemy gains", description: "When an enemy gains a boon, you can choose to take that same boon. When you suffer a non-wounding affliction, all enemies within the aura suffer that same affliction", mana: 0, stamina: 0, cooldown: 0, tags: ["Aura", "Holy", "Retributive", "passive"] },
          { id: "gertrude-crystalise-mana", name: "Crystalise Mana", category: "Potent", summary: "Create up to three crystals that accelerate mana recovery.", description: "Create a crystal that floats around you, accelerating mana recovery. The crystal is impervious to damage, but vulnerable to dispel effects and can intercept projectiles, negating the effect then it becomes inactive for 3 turns. If dispelled, crystals grant an immediate burst of 50 mana. You can have up to three mana crystals at a time.", mana: 10, stamina: 0, cooldown: 0, charges: 3, recharge: 3, crystalSummon: { max: 3, disableTurns: 3 }, tags: ["Conjuration", "Restoration", "Buff"] },
          { id: "gertrude-reaper-hand", name: "Hand of the Reaper", category: "Potent", summary: "expand your reach to 2 spaces through a semi-substantial arm.", description: "Conjure up to 2 highly flexible semi-substantial shadow-arms that can extend or shrink up to 2 spaces. Conjured items can be conjured into the shadow hand. Can be used to make melee special attacks. Special attacks made using the arm inflict [Creeping Death] and [Rigor Mortis].", mana: 6, stamina: 0, cooldown: 0, activeMode: "toggle", upkeep: { mana: 6 }, tags: ["Conjuration", "Disease", "Magic", "Holy"] },
          { id: "gertrude-immortality", name: "Immortality", category: "Potent", summary: "Restore everything", description: "Instantly Fully restore all health, mana and stamina. Gain an ongoing health, mana and stamina recovery effects of 10/s for 3 rounds", mana: 0, stamina: 0, cooldown: 9999, tags: ["Special Ability", "Healing", "Recovery"] },
          { id: "gertrude-specious-sorcerer", name: "Specious Sorcerer", category: "Potent", summary: "You can use magical tools and your magical attributes are increased.", description: "You can use magical tools, your maximum mana is increased by 40 and you have a permanent +12 to mana recovery.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "Buff", "passive"], statEffects: [
            { id: "specious-sorcerer-recovery", stat: "manaRecovery", bonus: "+12", target: "self" }], resourceEffects: [
            { id: "specious-sorcerer-mana", resource: "mana", bonus: 40, maximumIncrease: 40, target: "self" } ], variants: [
            { id: "specious-sorcerer-buff", name: "Spirit Increase", description: "Increase Magic and Magic Resistance by 1D12", mana: 60, stamina: 0, cooldown: 3600, tags: ["Special Ability", "Buff"], statEffects: [{ id: "specious-sorcerer-magic", stat: "magic", bonus: "+1D12", target: "self" }, { id: "specious-sorcerer-resistance", stat: "magicResistance", bonus: "+1D12", target: "self" }] }]},
          { id: "gertrude-immortal-fist", name: "Immortal Fist", category: "Potent", summary: "Unarmed attacks deal additional damage", description: "Unarmed attacks deal 1D8 of resonating force damage against physical defences and you suffer no damage when actively interceptingg attacks(reaction). Not all damage from powerful silver rank attacks or higher will be negated and you will gain an instance of [Momentum]", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "passive"] },
          { id: "gertrude-boost", name: "Boost", category: "Dimension", summary: "Enhances the effect of the next 2 abilities", description: "Enhances the effect of the next 2 abilities.", mana: 10, stamina: 0, cooldown: 600, tags: ["Special Ability", "enhancement"] },
          { id: "gertrude-divinity", name: "Divinity", category: "Dimension", summary: "Channel the power of Hero, the god of... heroes to gain buffs or bestow it to 1 ally within your aura", description: "All your stats get increased by 2D10, your mana recovery is increased by 24, reflexes is increased by 5 and speed is increased by 30.", mana: 90, stamina: 0, cooldown: 99999, tags: ["Special Ability", "Buff", "Boon"] },
          { id: "gertrude-dimensional-blade", name: "Dimensional Blade", category: "Dimension", summary: "Summon a dimensional sword that adds 2D8 to your higher attack stat.", description: "Summon a sword made of black lightning lined in silver; it can cut through almost anything. Its slash uses whichever is higher, Physical Attack or Magic, and adds 2D8.", mana: 20, stamina: 0, cooldown: 0, tags: ["Dimension", "conjuration", "attack"],
          attacks: [{ id: "dimensional-blade-slash", name: "Dimensional Slash", stats: ["physicalAttack", "magic"], statMode: "highest", modifier: "2D8" }]},
          { id: "gertrude-strong-soul", name: "Strong Soul", category: "Dimension", ummary: "Resistances increased and you can physically interact with incorporeal entities.", description: "Disruptive force damage is reduced by a large amount, other damage is reduced by a small amount, increased curse, magic and unholy resistance. You can physically interact with incorporeal entities", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Abiity", "Dimension", "Magic", "passive", "Attribute-Increasing"], statEffects: [
            { id: "strong-soul-damage-resistance", stat: "damageResistance", bonus: "1D8", target: "self" },
            { id: "strong-soul-magic-resistance", stat: "magicResistance", bonus: "1D8", target: "self" }
          ], enhancements: [
            { stat: "damageResistance", bonus: "+1" },
            { stat: "magicResistance", bonus: "+1" }
          ] },
          { id: "gertrude-radiant-fist", name: "Radiant Fist", category: "Dimension", summary: "Unarmed attacks deal additional damage to magical defences and intangible/incorporeal entities", description: "Unarmed attacks deal additional disruptive-force damage, which is highly effective against magical defences and intangible or incorporeal enemies. Unarmed attacks do not trigger retaliation effects. Negate any non-damage effects from actively intercepted attacks(This uses your reaction). Gain an instance of [Impervious] when intercepting non-physical attacks. Gain mana when intercepting magical projectiles.", mana: 0, stamina: 0, cooldown: 0, tags: ["Special Ability", "passive"] },
        ],
        equipment: [
          { id: "gertrude-sword-cannon", name: "Sword Cannon", summary: "A sword once used by the strongest commissioner.", description: "IDEAS: CAN USE WIND BLADE, enhances wind powers, conjure weapon into it, wind blade is free action"},
          { id: "gertrude-basic-cape", name: "Badass Cape", summary: "Looks cool.", description: "Doesn't do anything but always moves in the wind to make you look cool plus has Anti-get-stuck-in-things-and-die protection.™ Made and patented by Edna Mode", },
        ],
        inventory: [
          { id: "gertude-plant-awakening-stone", name: "Plant Awakening Stone", description: "An awakening stone that activates an inactive ability related to Plants. Only usable if an eligible race has less than 20 awakened abilities."},
          { id: "gertrude-money", name: "Money", description: "100 Gold spirit coints, can eat one to temporarily increase power levels for one turn but has debilitating effects on next turn." }
        ],
        racialGifts: [
          { id: "gertrude-holy-affinity", name: "Holy Affinity", summary: "Increased resistance to holy afflictions", description: "Increased resistance to holy afflictions, and Cleanse effects are more effective.", cooldown: 0, duration: 0, tags: ["Holy", "Racial Gift", "passive", "enhancement"] },
          { id: "gertrude-astral-elementalist", name: "Astral Elementalist", summary: "Dimension, astral and elemental attributes is increased", description: "Dimension, astral and elemental reistances and abilities are significantly increased effects and transcendant damage is also significantly increased.", cooldown: 0, duration: 0, tags: ["Racial Gift", "Elemental", "passive"]},
          { id: "gertrude-guardian", name: "Guardian", summary: "Your commitment to defending your allies has increased your attributes", description: "Your physical and magical resistances are increased by 1D8 and your physical and magical attack is increased by 2D8 when someone is unconscious.", cooldown: 0, duration: 0, tags: ["Racial Gift", "passive"]},
          { id: "gertrude-mana-integrity", name: "Mana Integrity", summary: "Mana costs are reduced", description: "Ongoing mana costs for maintained abilities are reduced. Resistance to mana drain effects is increased.", cooldown: 0, duration: 0, tags: ["Racial Gift", "passive"] },
          { id: "gertrude-celestial-bounty", name: "Celestial Bounty", summary: "Increased mana recovery", description: "Increases mana recovery by +1.", cooldown: 0, duration: 0, tags: ["Racial Gift", "passive"], statEffects: [{ id: "celetial-mana-recovery", stat: "manaRecovery", bonus: "+1", target: "self" } ] },
          { id: "gertrude-celestial-swiftness", name: "Celestial Swiftness", summary: "Speed is increased", description: "Your speed is increased by 17 spaces.", cooldown: 0, duration: 0, tags: ["Racial Gift", "Movement", "passive"]},
        ]
      },
      {
        id: "Izaak", name: "Iron Man", race: "Human", magicspecialty: "Ritual",
        rank: "Bronze", initials: "IM", color: "#ccdc55", avatarBg: "#54611a",
        resources: { health: 28, mana: 200, stamina: 200 },
        stats: { manaRecovery: 12, staminaRecovery: 64, physicalAttack: "2D8", damageResistance: "2D8+2", magic: "2D8+2", magicResistance: "2D8+2", speed: 32, reflexes: 4 },
        essences: ["Earth", "Iron", "Shield", "Fortress"],
        abilities: [
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
        ],
        equipment: [
          { id: "", name: "", summary: ".", description: ""},
          { id: "", name: "", summary: ".", description: "", },
        ],
        inventory: [
          { id: "gertude-plant-awakening-stone", name: "Plant Awakening Stone", description: "An awakening stone that activates an inactive ability related to Plants. Only usable if an eligible race has less than 20 awakened abilities."},
          { id: "gertrude-money", name: "Money", description: "100 Gold spirit coints, can eat one to temporarily increase power levels for one turn but has debilitating effects on next turn." }
        ],
        racialGifts: [
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
        ]
      },
      {
        id: "Mason", name: "Smelf Smelfmin", race: "Elf", magicspecialty: "Improv",
        rank: "Bronze", initials: "SS", color: "#d8aa67", avatarBg: "#352b1e",
        resources: { health: 59, mana: 500, stamina: 500 },
        stats: { manaRecovery: 12, staminaRecovery: 64, physicalAttack: "2D8", damageResistance: "2D8", magic: "2D8", magicResistance: "2D8", speed: 32, reflexes: 4 },
        essences: ["Echo", "Song", "Harmonic", "Resonating"],
        abilities: [
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
          { id: "", name: "", category: "", summary: "", description: ".", mana: 80, stamina: 0, cooldown: 9999, tags: [] },
        ],
        equipment: [
          { id: "", name: "", summary: ".", description: ""},
          { id: "", name: "", summary: ".", description: "", },
        ],
        inventory: [
          { id: "gertude-plant-awakening-stone", name: "Plant Awakening Stone", description: "An awakening stone that activates an inactive ability related to Plants. Only usable if an eligible race has less than 20 awakened abilities."},
          { id: "gertrude-money", name: "Money", description: "100 Gold spirit coints, can eat one to temporarily increase power levels for one turn but has debilitating effects on next turn." }
        ],
        racialGifts: [
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
          { id: "", name: "", summary: "", description: ".", cooldown: 0, duration: 0, tags: []},
        ]
      }
    ];

    const CATEGORIES = ["Arcana", "Combat", "Technique", "Support"];

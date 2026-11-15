    // Edit these descriptions to match the campaign's exact affliction rules.
    const AFFLICTION_GLOSSARY = {
      stunned: {
        name: "Stunned",
        description: "The target is unable to act until the effect expires."
      },
      bleeding: {
        name: "Bleeding",
        description: "Takes 1D6 damage at the start of each turn, this condition absorbs healing, after which it expires."
      },
      momentum: {
        name: "Momentum",
        description: "When making an attack, all instances are consumed to inflict +1 resonating force damage. Additional instances can be accumulated.",
        statEffects: [{ stat: "physicalAttack", bonus: "+1", perStack: true }]
      },
      "leech toxin": {
        name: "Leech Toxin",
        description: "When bleeding is negated, an instance of [leech toxin] is consumed to reapply bleeding. Additional instances can be accumulated."
      },
      necrotoxin: {
        name: "Necrotoxin",
        description: "Inflicts 1D6 damage at the start of each turn for each instance of this affliction until poison is cleansed."
      },
      "phantom's curse": {
        name: "Phantom's Curse",
        description: "The recipient takes +1 damage from Intangible entities."
      },
      "gladiator's honour": {
        name: "Gladiator's Honour",
        description: "The recipient must not move 5 spaces away from another person with this affliction or start taking 1 damage per second equal to the number of stacks."
      },
      "the crowd cheers": {
        name: "The Crowd Cheers",
        description: "Anyone with this affliction has damage done to them multiplied by 1+instances of this affliction after damage resistance."
      },
      "gladiator's mercy": {
        name: "Gladiator's Mercy",
        description: "Any damage dealt to someone with this affliction is non-lethal and will not kill the target when their health reaches zero."
      },
      "the crowd boos": {
        name: "The Crowd Boos",
        description: "Anyone with this affliction is disheartened and must succeed a DC 11 check or will not be able to take an action."
      },
      ectoplasm: {
        name: "Ectoplasm",
        description: "You become harder to perceive and will become completely invisible when stacks of this affliction >= others perception."
      },
      "dark descent": {
        name: "Dark Descent",
        description: "The target's perception distance, the effect of their perception ability, and resistance to all afflictions are reduced slightly. Additional instances have a cumulative effect. When the target's perception < Dark Descent, they can't see and will strike out randomly"
      },
      impervious: {
        name: "Impervious",
        description: "Magic resistance is increased by 3D12 and affliction resistance is also increased. Additional instances have a cumulative effect.",
        statEffects: [{ stat: "magicResistance", bonus: "3D12", perStack: true }]
      },
      integrity: {
        name: "Integrity",
        description: "At the end of each turn, recover 1 health, 10 mana, and 20 stamina per Integrity stack, up to each resource's maximum. Additional instances have a cumulative effect.",
        resourceEffects: [
          { resource: "health", amountPerStack: 1 },
          { resource: "mana", amountPerStack: 10 },
          { resource: "stamina", amountPerStack: 20 }
        ]
      },
      resistant: {
        name: "Resistant",
        description: "Resistance to afflictions is increased. Additional instances have a cumulative effect. Resistant stacks are tracked here; automatic affliction resistance checks and [Vulnerability] cancellation are not implemented yet.",
      },
      "lotus redoubt": {
        name: "Lotus Redoubt",
        description: "At the end of each turn, recover 15 health, 25 mana and 50 stamina.",
        resourceEffects: [
          { resource: "health", amountPerStack: 15 },
          { resource: "mana", amountPerStack: 25 },
          { resource: "stamina", amountPerStack: 50 }
        ]
      },
      "echo-roar": {
        name: "Echo Roar",
        description: "Significantly increased Power, Speed and Spirit attributes.",
        statEffects: [{ stat: "physicalAttack", bonus: "1D12", perStack: true }, { stat: "damageResistance", bonus: "1D12", perStack: true }, { stat: "magic", bonus: "1D12", perStack: true }, { stat: "magicResistance", bonus: "+1D12", perStack: true }, { stat: "speed", bonus: "+12", perStack: true }, { stat: "reflexes", bonus: "+2", perStack: true }]
      },
      'subjugating toxin': {
        name: "Subjugating Toxin",
        description: "Anyone with this affliction has -1 reflexes, wears off after 1 turn.",
        statEffects: [{ stat: "reflexes", bonus: "-1", perStack: true }]
      },
      "creeping death": {
        name: "Creeping Death",
        description: "Inflicts 1/s necrotic damage until the disease is cleansed. Additional instances have a cumulative effect."
      },
      "rigor mortis": {
        name: "Rigor Mortis",
        description: "Penalty to the [Speed] and [Recovery] attributes. Additional instances have a cumulative effect. Each time a new instance is inflicted, it deals 2 necrotic damage for each existing instance."
      },
      burning: {
        name: "Burning",
        description: "Takes 1D6 damage at the start of each turn."
      },
      "fountain of life": {
        name: "Fountain of Life",
        description: "At the end of each turn, recover 1 health and 1 mana.",
        resourceEffects: [
          { resource: "health", amountPerStack: 1 },
          { resource: "mana", amountPerStack: 1 }
        ]
      },
      retributive: {
        name: "Retributive",
        description: "Inflicts the damage that was done to the target back on the attacker."
      }
    };

    
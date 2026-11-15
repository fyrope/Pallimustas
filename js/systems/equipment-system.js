    function toggleEquipment(itemId) {
      const character = getSelectedCharacter();
      const item = (character.equipment || []).find((entry) => entry.id === itemId);
      if (!item) return;
      const progress = state.characters[character.id];
      progress.equippedEquipment ??= [];
      const isEquipped = progress.equippedEquipment.includes(item.id);
      progress.equippedEquipment = isEquipped
        ? progress.equippedEquipment.filter((equippedId) => equippedId !== item.id)
        : [...progress.equippedEquipment, item.id];
      saveCampaign();
      render();
      notify(`${item.name} ${isEquipped ? "unequipped" : "equipped"}.`);
    }
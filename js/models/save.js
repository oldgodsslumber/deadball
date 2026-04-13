// Deadball Digital - Save/Load System
var DB = DB || {};

DB.Save = {
  SLOT_COUNT: 5,
  VERSION: 1,
  KEY_PREFIX: 'deadball_save_',

  save(slotId) {
    var data = {
      version: DB.Save.VERSION,
      slot: slotId,
      era: DB.App.currentEra,
      teams: DB.App.teams.map(DB.Team.serialize),
      currentGame: DB.App.currentGame ? DB.GameState.serialize(DB.App.currentGame) : null,
      playerPool: DB.App.playerPool.map(DB.Player.serialize),
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(DB.Save.KEY_PREFIX + slotId, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  },

  load(slotId) {
    try {
      var raw = localStorage.getItem(DB.Save.KEY_PREFIX + slotId);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return {
        version: data.version,
        slot: data.slot,
        era: data.era,
        teams: (data.teams || []).map(DB.Team.deserialize),
        currentGame: data.currentGame ? DB.GameState.deserialize(data.currentGame) : null,
        playerPool: (data.playerPool || []).map(DB.Player.deserialize),
        timestamp: data.timestamp
      };
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  delete(slotId) {
    localStorage.removeItem(DB.Save.KEY_PREFIX + slotId);
  },

  getSlotInfo(slotId) {
    try {
      var raw = localStorage.getItem(DB.Save.KEY_PREFIX + slotId);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return {
        slot: slotId,
        era: data.era,
        teamCount: (data.teams || []).length,
        hasGame: !!data.currentGame,
        timestamp: data.timestamp
      };
    } catch (e) {
      return null;
    }
  },

  listSlots() {
    var slots = [];
    for (var i = 1; i <= DB.Save.SLOT_COUNT; i++) {
      slots.push(DB.Save.getSlotInfo(i));
    }
    return slots;
  },

  refreshSlotDisplay() {
    var container = document.getElementById('save-slots-list');
    if (!container) return;
    var slots = DB.Save.listSlots();
    var html = '';
    for (var i = 0; i < slots.length; i++) {
      var info = slots[i];
      var slotNum = i + 1;
      if (info) {
        var date = new Date(info.timestamp).toLocaleDateString();
        var eraName = DB.Eras[info.era] ? DB.Eras[info.era].name : info.era;
        html += '<div class="save-slot occupied" data-slot="' + slotNum + '">' +
          '<div class="slot-num">Slot ' + slotNum + '</div>' +
          '<div class="slot-info">' + eraName + '<br>' + info.teamCount + ' teams<br>' + date + '</div>' +
          '</div>';
      } else {
        html += '<div class="save-slot" data-slot="' + slotNum + '">' +
          '<div class="slot-num">Slot ' + slotNum + '</div>' +
          '<div class="slot-info">Empty</div>' +
          '</div>';
      }
    }
    container.innerHTML = html;

    // Bind click handlers
    container.querySelectorAll('.save-slot').forEach(function(el) {
      el.addEventListener('click', function() {
        var slot = parseInt(this.getAttribute('data-slot'));
        DB.Events.emit('slot:select', slot);
      });
    });
  },

  // Export save as downloadable JSON
  exportSlot(slotId) {
    var raw = localStorage.getItem(DB.Save.KEY_PREFIX + slotId);
    if (!raw) return;
    var blob = new Blob([raw], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'deadball_save_' + slotId + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import save from JSON file
  importSlot(slotId, file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        data.slot = slotId;
        localStorage.setItem(DB.Save.KEY_PREFIX + slotId, JSON.stringify(data));
        DB.Save.refreshSlotDisplay();
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    reader.readAsText(file);
  }
};

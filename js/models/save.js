// Deadball Digital - League-Based Persistence System
var DB = DB || {};

DB.Save = {
  SLOT_COUNT: 5,
  VERSION: 2,
  KEY_PREFIX: 'deadball_league_',

  // ===== AUTO-SAVE =====
  // Called after any team/player creation, game completion, or state change
  autoSave() {
    var slot = DB.App.currentSaveSlot;
    if (!slot) return false;
    return DB.Save.save(slot);
  },

  // Save current state to a league slot
  save(slotId) {
    var data = {
      version: DB.Save.VERSION,
      slot: slotId,
      // League config
      leagueName: DB.App.leagueName || 'My League',
      era: DB.App.currentEra,
      teamGender: DB.App.leagueTeamGender || 'mixed',
      // Data
      teams: DB.App.teams.map(DB.Team.serialize),
      currentGame: DB.App.currentGame ? DB.GameState.serialize(DB.App.currentGame) : null,
      playerPool: DB.App.playerPool.map(DB.Player.serialize),
      gameHistory: DB.App.gameHistory || [],
      season: DB.App.season || null,
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
      if (!raw) {
        // Check old format
        raw = localStorage.getItem('deadball_save_' + slotId);
      }
      if (!raw) return null;
      var data = JSON.parse(raw);
      return {
        version: data.version,
        slot: data.slot,
        leagueName: data.leagueName || 'League ' + slotId,
        era: data.era,
        teamGender: data.teamGender || 'mixed',
        teams: (data.teams || []).map(DB.Team.deserialize),
        currentGame: data.currentGame ? DB.GameState.deserialize(data.currentGame) : null,
        playerPool: (data.playerPool || []).map(DB.Player.deserialize),
        gameHistory: data.gameHistory || [],
        season: data.season || null,
        timestamp: data.timestamp
      };
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  delete(slotId) {
    localStorage.removeItem(DB.Save.KEY_PREFIX + slotId);
    localStorage.removeItem('deadball_save_' + slotId); // clean old format too
  },

  getSlotInfo(slotId) {
    try {
      var raw = localStorage.getItem(DB.Save.KEY_PREFIX + slotId);
      if (!raw) raw = localStorage.getItem('deadball_save_' + slotId);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return {
        slot: slotId,
        leagueName: data.leagueName || 'League ' + slotId,
        era: data.era,
        teamGender: data.teamGender || 'mixed',
        teamCount: (data.teams || []).length,
        hasGame: !!data.currentGame,
        gameCount: (data.gameHistory || []).length,
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

  // Apply loaded data to app state
  applyToApp(data) {
    DB.App.currentEra = data.era;
    DB.App.leagueName = data.leagueName;
    DB.App.leagueTeamGender = data.teamGender;
    DB.App.teams = data.teams;
    DB.App.playerPool = data.playerPool;
    DB.App.currentGame = data.currentGame;
    DB.App.gameHistory = data.gameHistory;
    DB.App.season = data.season;
  },

  // Export save as downloadable JSON
  exportSlot(slotId) {
    var raw = localStorage.getItem(DB.Save.KEY_PREFIX + slotId);
    if (!raw) return;
    var blob = new Blob([raw], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'deadball_league_' + slotId + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importSlot(slotId, file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        data.slot = slotId;
        localStorage.setItem(DB.Save.KEY_PREFIX + slotId, JSON.stringify(data));
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    reader.readAsText(file);
  }
};

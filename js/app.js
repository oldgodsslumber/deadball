// Deadball Digital - App Bootstrap & Screen Router
var DB = DB || {};

DB.App = {
  currentScreen: null,
  currentEra: 'modern',
  currentSaveSlot: null,
  leagueName: '',
  leagueTeamGender: 'mixed',
  teams: [],
  playerPool: [],
  currentGame: null,
  gameHistory: [], // Array of completed game summaries
  season: null,

  init() {
    // Bind global navigation
    document.querySelectorAll('[data-screen],[data-action]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var screen = this.getAttribute('data-screen');
        var action = this.getAttribute('data-action');
        if (action) {
          DB.App.handleAction(action, this);
        } else {
          DB.Screens.show(screen);
        }
      });
    });

    // Inject nav bars and show main menu
    DB.Screens.initNavBars();
    DB.Screens.show('main-menu');

    console.log('Deadball Digital initialized');
  },

  handleAction(action, el) {
    switch (action) {
      case 'new-league':
        DB.Screens.show('league-setup');
        break;
      case 'continue':
        DB.Screens.show('load-game');
        break;
      case 'quick-sim':
        DB.Screens.show('quick-sim');
        break;
      case 'exhibition':
        // Quick exhibition: no league, just make teams and play
        DB.App.currentSaveSlot = null;
        DB.App.teams = [];
        DB.App.gameHistory = [];
        DB.Screens.show('team-setup');
        break;
      case 'create-player':
        DB.Screens.show('player-creator');
        break;
      case 'manage-teams':
        DB.Screens.show('team-manager');
        break;
      default:
        console.warn('Unknown action:', action);
    }
  },

  setEra(era) {
    DB.App.currentEra = era;
    document.querySelectorAll('.era-badge').forEach(function(el) {
      el.textContent = DB.Eras[era].name;
    });
  },

  // Record a completed game in history
  recordGame(gs) {
    var summary = {
      date: new Date().toISOString(),
      away: { name: gs.awayTeam.name, score: gs.score.away },
      home: { name: gs.homeTeam.name, score: gs.score.home },
      winner: gs.winner === 'home' ? gs.homeTeam.name : (gs.winner === 'away' ? gs.awayTeam.name : 'Tie'),
      innings: gs.inning,
      mode: gs.mode
    };
    DB.App.gameHistory.push(summary);
    DB.Save.autoSave();
  }
};

// ===== EVENT BUS =====
DB.Events = {
  _listeners: {},

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(function(f) { return f !== fn; });
  },

  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(function(fn) { fn(data); });
  }
};

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  DB.App.init();
});

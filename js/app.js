// Deadball Digital - App Bootstrap & Screen Router
var DB = DB || {};

DB.App = {
  currentScreen: null,
  currentEra: 'modern',
  currentSaveSlot: null,
  teams: [],
  playerPool: [],
  currentGame: null,

  init() {
    // Bind global navigation
    document.querySelectorAll('[data-screen]').forEach(function(el) {
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

    // Show main menu
    DB.Screens.show('main-menu');

    // Load save slot metadata for display
    if (DB.Save) DB.Save.refreshSlotDisplay();

    console.log('Deadball Digital initialized');
  },

  handleAction(action, el) {
    switch (action) {
      case 'new-game':
        DB.Screens.show('era-select');
        break;
      case 'continue':
        DB.Screens.show('load-game');
        break;
      case 'quick-sim':
        DB.Screens.show('quick-sim');
        break;
      case 'create-player':
        DB.Screens.show('player-creator');
        break;
      case 'manage-teams':
        DB.Screens.show('team-manager');
        break;
      case 'franchise-builder':
        DB.Screens.show('franchise-builder');
        break;
      case 'mlb-import':
        DB.Screens.show('mlb-import');
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

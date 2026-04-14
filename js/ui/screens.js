// Deadball Digital - Screen Management with Hierarchical Navigation
var DB = DB || {};

DB.Screens = {
  // Parent screen mapping: each screen's logical parent for the back button
  // Back always goes to the parent, not the previous-visited screen
  parents: {
    'main-menu': null,
    'era-select': 'main-menu',
    'league-setup': 'main-menu',
    'save-select': 'main-menu',
    'load-game': 'main-menu',
    'team-setup': 'main-menu',
    'rapid-create': 'team-setup',
    'detailed-builder': 'team-setup',
    'franchise-builder': 'team-setup',
    'mlb-import': 'team-setup',
    'mlb-season': 'team-setup',
    'player-creator': 'main-menu',
    'player-builder': 'player-creator',
    'team-manager': 'team-setup',
    'game-history': 'team-setup',
    'quick-sim': 'main-menu',
    'game-setup': 'team-setup',
    'season': 'team-setup',
    'game': 'main-menu',
    'post-game': 'main-menu'
  },

  current: null,

  show(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(function(el) {
      el.classList.remove('active');
    });

    // Show target
    var target = document.getElementById('screen-' + screenId);
    if (target) {
      target.classList.add('active');
      DB.Screens.current = screenId;
      DB.Events.emit('screen:change', screenId);
    } else {
      console.warn('Screen not found:', screenId);
    }
  },

  // Go to the logical parent screen (not browser-history style)
  back() {
    var parent = DB.Screens.parents[DB.Screens.current];
    if (parent) {
      DB.Screens.show(parent);
    } else {
      DB.Screens.show('main-menu');
    }
  },

  // Always go home
  home() {
    DB.Screens.show('main-menu');
  },

  // Inject nav bars into all screens (call once on init)
  initNavBars() {
    document.querySelectorAll('.screen').forEach(function(el) {
      var screenId = el.id.replace('screen-', '');
      if (screenId === 'main-menu') return; // no nav on main menu

      // Remove old back-btn if present
      var oldBtn = el.querySelector('.back-btn');
      if (oldBtn && !oldBtn.parentElement.classList.contains('screen-nav')) {
        oldBtn.remove();
      }

      // Skip if nav already injected
      if (el.querySelector('.screen-nav')) return;

      var nav = document.createElement('div');
      nav.className = 'screen-nav';
      nav.innerHTML = '<button class="back-btn" onclick="DB.Screens.back()">&larr; Back</button>' +
        '<span class="league-name" id="nav-league-' + screenId + '"></span>' +
        '<button class="home-btn" onclick="DB.Screens.home()">Home</button>';
      el.insertBefore(nav, el.firstChild);
    });
  },

  // Update league name in nav bars
  updateNavLeagueName() {
    var name = DB.App.leagueName || '';
    document.querySelectorAll('.screen-nav .league-name').forEach(function(el) {
      el.textContent = name;
    });
  },

  // Utility: populate a container with HTML
  render(containerId, html) {
    var el = document.getElementById(containerId);
    if (el) el.innerHTML = html;
  }
};

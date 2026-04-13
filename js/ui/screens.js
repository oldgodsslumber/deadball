// Deadball Digital - Screen Management
var DB = DB || {};

DB.Screens = {
  history: [],

  show(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(function(el) {
      el.classList.remove('active');
    });

    // Show target
    var target = document.getElementById('screen-' + screenId);
    if (target) {
      target.classList.add('active');
      if (DB.Screens.history[DB.Screens.history.length - 1] !== screenId) {
        DB.Screens.history.push(screenId);
      }
      DB.App.currentScreen = screenId;
      DB.Events.emit('screen:change', screenId);
    } else {
      console.warn('Screen not found:', screenId);
    }
  },

  back() {
    if (DB.Screens.history.length > 1) {
      DB.Screens.history.pop(); // remove current
      var prev = DB.Screens.history[DB.Screens.history.length - 1];
      DB.Screens.show(prev);
    }
  },

  // Utility: populate a container with HTML
  render(containerId, html) {
    var el = document.getElementById(containerId);
    if (el) el.innerHTML = html;
  }
};

// Deadball Digital - Save Slot UI
var DB = DB || {};

DB.SaveUI = {
  init() {
    // Listen for slot selection
    DB.Events.on('slot:select', function(slotId) {
      var currentScreen = DB.App.currentScreen;

      if (currentScreen === 'save-select') {
        // New game: assign slot and go to team setup
        var existing = DB.Save.getSlotInfo(slotId);
        if (existing) {
          if (!confirm('Slot ' + slotId + ' has data. Overwrite?')) return;
        }
        DB.App.currentSaveSlot = slotId;
        DB.Screens.show('team-setup');
        DB.TeamBuilderUI.refreshTeamSetup();
      } else if (currentScreen === 'load-game') {
        // Load existing game
        var data = DB.Save.load(slotId);
        if (!data) {
          alert('This slot is empty.');
          return;
        }
        DB.App.currentSaveSlot = slotId;
        DB.App.currentEra = data.era;
        DB.App.teams = data.teams;
        DB.App.playerPool = data.playerPool;
        DB.App.currentGame = data.currentGame;

        if (data.currentGame && !data.currentGame.isComplete) {
          // Resume game
          DB.GameUI.gameState = data.currentGame;
          DB.GameUI.updateDisplay();
          DB.Screens.show('game');
        } else {
          // Go to team setup
          DB.Screens.show('team-setup');
          DB.TeamBuilderUI.refreshTeamSetup();
        }
      }
    });
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  DB.SaveUI.init();
});

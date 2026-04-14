// Deadball Digital - Save/League Slot UI
var DB = DB || {};

DB.SaveUI = {
  init() {
    // Listen for slot selection on load screen
    DB.Events.on('slot:select', function(slotId) {
      var currentScreen = DB.Screens.current;

      if (currentScreen === 'load-game') {
        var data = DB.Save.load(slotId);
        if (!data) {
          alert('This slot is empty.');
          return;
        }
        DB.App.currentSaveSlot = slotId;
        DB.Save.applyToApp(data);
        DB.Screens.updateNavLeagueName();
        DB.Screens.show('team-setup');
        DB.TeamBuilderUI.refreshTeamSetup();
      }
    });
  },

  // Create a new league from the setup screen
  createLeague() {
    var nameInput = document.getElementById('league-name-input');
    var eraSelect = document.getElementById('league-era-select');
    var genderSelect = document.getElementById('league-gender-select');
    var leagueName = nameInput ? nameInput.value.trim() : '';
    var era = eraSelect ? eraSelect.value : 'modern';
    var gender = genderSelect ? genderSelect.value : 'mixed';

    if (!leagueName) {
      alert('Enter a league name.');
      return;
    }

    // Find selected slot
    var slot = DB.SaveUI._selectedSlot;
    if (!slot) {
      alert('Select a save slot.');
      return;
    }

    // Check if slot is occupied
    var existing = DB.Save.getSlotInfo(slot);
    if (existing) {
      if (!confirm('Slot ' + slot + ' has data ("' + existing.leagueName + '"). Overwrite?')) return;
    }

    // Initialize league
    DB.App.currentSaveSlot = slot;
    DB.App.leagueName = leagueName;
    DB.App.currentEra = era;
    DB.App.leagueTeamGender = gender;
    DB.App.teams = [];
    DB.App.playerPool = [];
    DB.App.currentGame = null;
    DB.App.gameHistory = [];
    DB.App.season = null;

    DB.App.setEra(era);
    DB.Save.autoSave();
    DB.Screens.updateNavLeagueName();
    DB.Screens.show('team-setup');
    DB.TeamBuilderUI.refreshTeamSetup();
  },

  _selectedSlot: null,

  // Render league slots for the setup screen
  renderLeagueSlots(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var slots = DB.Save.listSlots();
    var html = '';
    for (var i = 0; i < slots.length; i++) {
      var info = slots[i];
      var slotNum = i + 1;
      var selected = DB.SaveUI._selectedSlot === slotNum ? ' style="border-color:var(--accent);"' : '';
      if (info) {
        var date = new Date(info.timestamp).toLocaleDateString();
        var eraName = DB.Eras[info.era] ? DB.Eras[info.era].name : info.era;
        html += '<div class="save-slot occupied" data-slot="' + slotNum + '"' + selected + '>';
        html += '<div class="slot-num">Slot ' + slotNum + '</div>';
        html += '<div class="slot-info">' + info.leagueName + '<br>' + eraName + '<br>' + info.teamCount + ' teams, ' + info.gameCount + ' games<br>' + date + '</div>';
        html += '</div>';
      } else {
        html += '<div class="save-slot" data-slot="' + slotNum + '"' + selected + '>';
        html += '<div class="slot-num">Slot ' + slotNum + '</div>';
        html += '<div class="slot-info">Empty</div>';
        html += '</div>';
      }
    }
    container.innerHTML = html;

    // Bind clicks
    container.querySelectorAll('.save-slot').forEach(function(el) {
      el.addEventListener('click', function() {
        var s = parseInt(this.getAttribute('data-slot'));
        DB.SaveUI._selectedSlot = s;
        // Highlight
        container.querySelectorAll('.save-slot').forEach(function(sl) {
          sl.style.borderColor = '';
        });
        this.style.borderColor = 'var(--accent)';
      });
    });
  },

  // Render load screen slots
  renderLoadSlots() {
    var container = document.getElementById('load-slots-list');
    if (!container) return;

    var slots = DB.Save.listSlots();
    var html = '';
    for (var i = 0; i < slots.length; i++) {
      var info = slots[i];
      var slotNum = i + 1;
      if (info) {
        var date = new Date(info.timestamp).toLocaleDateString();
        var eraName = DB.Eras[info.era] ? DB.Eras[info.era].name : info.era;
        html += '<div class="save-slot occupied" onclick="DB.Events.emit(\'slot:select\',' + slotNum + ')">';
        html += '<div class="slot-num">Slot ' + slotNum + '</div>';
        html += '<div class="slot-info"><strong>' + info.leagueName + '</strong><br>' + eraName + '<br>' + info.teamCount + ' teams, ' + info.gameCount + ' games<br>' + date + '</div>';
        html += '<button class="btn btn-small" style="margin-top:8px;background:var(--red);" onclick="event.stopPropagation(); DB.Save.delete(' + slotNum + '); DB.SaveUI.renderLoadSlots();">Delete</button>';
        html += '</div>';
      } else {
        html += '<div class="save-slot" style="opacity:0.5;">';
        html += '<div class="slot-num">Slot ' + slotNum + '</div>';
        html += '<div class="slot-info">Empty</div>';
        html += '</div>';
      }
    }
    container.innerHTML = html;
  }
};

document.addEventListener('DOMContentLoaded', function() {
  DB.SaveUI.init();
});

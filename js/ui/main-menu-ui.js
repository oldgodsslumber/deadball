// Deadball Digital - Main Menu UI
var DB = DB || {};

DB.MainMenuUI = {
  init() {
    // Screen change handler: refresh dynamic content when screens are shown
    DB.Events.on('screen:change', function(screenId) {
      switch (screenId) {
        case 'league-setup':
          DB.SaveUI.renderLeagueSlots('league-slot-list');
          break;
        case 'load-game':
          DB.SaveUI.renderLoadSlots();
          break;
        case 'team-setup':
          DB.TeamBuilderUI.refreshTeamSetup();
          break;
        case 'team-manager':
          DB.MainMenuUI.refreshTeamManager();
          break;
        case 'quick-sim':
          DB.MainMenuUI.renderQuickSim();
          break;
        case 'game-history':
          DB.MainMenuUI.renderGameHistory();
          break;
      }
    });
  },

  renderGameHistory() {
    var container = document.getElementById('game-history-content');
    if (!container) return;

    var history = DB.App.gameHistory || [];
    if (history.length === 0) {
      container.innerHTML = '<p class="subtitle">No games played yet.</p>';
      return;
    }

    var html = '<p class="subtitle">' + history.length + ' game(s) played</p>';
    html += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    html += '<table class="data-table"><tr><th>#</th><th>Date</th><th>Away</th><th>Score</th><th>Home</th><th>Score</th><th>Winner</th><th>Inn</th></tr>';
    // Show most recent first
    for (var i = history.length - 1; i >= 0; i--) {
      var g = history[i];
      var date = new Date(g.date).toLocaleDateString();
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td>' + date + '</td>';
      html += '<td>' + g.away.name + '</td>';
      html += '<td>' + g.away.score + '</td>';
      html += '<td>' + g.home.name + '</td>';
      html += '<td>' + g.home.score + '</td>';
      html += '<td><strong>' + g.winner + '</strong></td>';
      html += '<td>' + g.innings + '</td>';
      html += '</tr>';
    }
    html += '</table></div>';
    container.innerHTML = html;
  },

  refreshTeamManager() {
    var container = document.getElementById('team-manager-content');
    if (!container) return;

    var html = '<div class="menu-grid" style="margin-bottom:20px;">';
    html += '<div class="menu-item" onclick="DB.TeamBuilderUI.startRapid()"><div class="icon">&#9889;</div><h3>Rapid Create</h3><p>Auto-generate from a name</p></div>';
    html += '<div class="menu-item" onclick="DB.TeamBuilderUI.startDetailed()"><div class="icon">&#128295;</div><h3>Detailed Builder</h3><p>Craft each player</p></div>';
    html += '<div class="menu-item" onclick="DB.FranchiseUI.start()"><div class="icon">&#127967;</div><h3>Franchise Builder</h3><p>Random franchise from tables</p></div>';
    html += '<div class="menu-item" onclick="DB.ImportUI.start()"><div class="icon">&#127758;</div><h3>Import MLB Team</h3><p>Pull real player stats</p></div>';
    html += '</div>';

    if (DB.App.teams.length === 0) {
      container.innerHTML = html + '<p class="subtitle">No teams yet. Use the options above to create one.</p>';
      return;
    }

    DB.App.teams.forEach(function(team, idx) {
      html += '<div class="card">';
      html += '<div class="card-header"><h3>' + team.name + '</h3>';
      html += '<span class="era-badge">' + (DB.Eras[team.era] ? DB.Eras[team.era].name : team.era) + '</span></div>';
      html += '<p>Team Score: <strong>' + team.teamScore + '</strong> | ' +
        DB.Team.getRosterCount(team) + ' players</p>';
      html += '<p>Manager: ' + team.manager.name + ' (Daring: ' + team.manager.daring + ', ' + team.manager.personality + ')</p>';

      if (team.ballpark) {
        html += '<p>Ballpark: ' + team.ballpark.name + ' (' + team.ballpark.type + ', ' +
          (team.ballpark.capacity || 0).toLocaleString() + ' seats)</p>';
      }
      if (team.fanbase) {
        html += '<p>Fanbase: ' + team.fanbase.level + ' (' + team.fanbase.attendance + '% attendance)</p>';
      }

      html += '<details><summary style="cursor:pointer;color:var(--accent2);">View Roster</summary>';
      html += DB.RosterUI.renderRoster(team);
      html += '</details>';

      html += '<div class="btn-group" style="margin-top:12px;">';
      html += '<button class="btn btn-small btn-warning" onclick="DB.RosterUI.exportTeam(DB.App.teams[' + idx + '])">Export/Print</button>';
      html += '<button class="btn btn-small btn-secondary" onclick="DB.App.teams.splice(' + idx + ',1); DB.Save.autoSave(); DB.MainMenuUI.refreshTeamManager();">Remove</button>';
      html += '</div></div>';
    });

    container.innerHTML = html;
  },

  renderQuickSim() {
    var container = document.getElementById('quick-sim-content');
    if (!container) return;

    if (DB.App.teams.length < 2) {
      container.innerHTML = '<p class="subtitle">You need at least 2 teams. Create some first!</p>' +
        '<button class="btn btn-primary" onclick="DB.Screens.show(\'team-setup\')">Create Teams</button>' +
        '<hr style="border-color:var(--border);margin:20px 0;">' +
        '<h3>Quick Generate & Sim</h3>' +
        '<p class="subtitle">Generate two random teams and simulate a game.</p>' +
        '<button class="btn btn-warning" onclick="DB.MainMenuUI.quickRandomSim()">Random Sim!</button>' +
        '<div id="quick-sim-result"></div>';
      return;
    }

    var html = '<div class="grid-2col" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">';
    html += '<div class="form-group"><label>Team 1</label><select id="sim-team1">';
    DB.App.teams.forEach(function(t, i) {
      html += '<option value="' + i + '">' + t.name + ' (TS:' + t.teamScore + ')</option>';
    });
    html += '</select></div>';
    html += '<div class="form-group"><label>Team 2</label><select id="sim-team2">';
    DB.App.teams.forEach(function(t, i) {
      html += '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + t.name + ' (TS:' + t.teamScore + ')</option>';
    });
    html += '</select></div></div>';

    html += '<div class="form-group"><label>Simulation Type</label><select id="sim-type">';
    html += '<option value="quick">Quick Sim (Team Score)</option>';
    html += '<option value="full">Full At-Bat Simulation</option>';
    html += '</select></div>';

    html += '<button class="btn btn-primary btn-block" onclick="DB.MainMenuUI.runSim()">Simulate!</button>';
    html += '<div id="quick-sim-result" style="margin-top:16px;"></div>';
    container.innerHTML = html;
  },

  runSim() {
    var idx1 = parseInt(document.getElementById('sim-team1').value);
    var idx2 = parseInt(document.getElementById('sim-team2').value);
    var simType = document.getElementById('sim-type').value;

    if (idx1 === idx2) { alert('Pick different teams!'); return; }

    var team1 = DB.App.teams[idx1];
    var team2 = DB.App.teams[idx2];
    var result;

    if (simType === 'quick') {
      result = DB.Sim.quickSim(team1, team2);
      var html = '<div class="card fade-in">';
      html += '<h3>' + result.desc + '</h3>';
      html += '<p>Team Scores: ' + result.team1Name + ' ' + result.ts1 + ' vs ' + result.team2Name + ' ' + result.ts2 + '</p>';
      html += '<p>Win probability: ' + result.winChance + '% | Roll: ' + result.winRoll + '</p>';
      html += '</div>';
      document.getElementById('quick-sim-result').innerHTML = html;
    } else {
      var gs = DB.Sim.fullSim(team1, team2, DB.App.currentEra);
      var html2 = '<div class="card fade-in">';
      html2 += '<h3>FINAL: ' + gs.awayTeam.name + ' ' + gs.score.away + ', ' + gs.homeTeam.name + ' ' + gs.score.home + '</h3>';
      html2 += DB.GameUI.renderBoxScore(gs.awayTeam, 'Away');
      html2 += DB.GameUI.renderBoxScore(gs.homeTeam, 'Home');
      html2 += '<details><summary style="cursor:pointer;color:var(--accent2);">Play-by-Play</summary>';
      html2 += '<div class="play-log" style="max-height:400px;">';
      gs.log.forEach(function(msg) {
        html2 += '<div class="entry">' + msg + '</div>';
      });
      html2 += '</div></details></div>';
      document.getElementById('quick-sim-result').innerHTML = html2;
    }
  },

  quickRandomSim() {
    var era = DB.App.currentEra || 'modern';
    var team1 = DB.Team.generateRandom({ era: era });
    var team2 = DB.Team.generateRandom({ era: era });

    var result = DB.Sim.quickSim(team1, team2);
    var html = '<div class="card fade-in">';
    html += '<h3>' + result.desc + '</h3>';
    html += '<p>' + team1.name + ' (TS:' + team1.teamScore + ') vs ' + team2.name + ' (TS:' + team2.teamScore + ')</p>';
    html += '<div class="btn-group" style="margin-top:8px;">';
    html += '<button class="btn btn-small btn-success" onclick="DB.MainMenuUI.quickRandomSim()">Sim Again</button>';
    html += '</div></div>';

    var container = document.getElementById('quick-sim-result');
    if (container) container.innerHTML = html;
  }
};

document.addEventListener('DOMContentLoaded', function() {
  DB.MainMenuUI.init();
});

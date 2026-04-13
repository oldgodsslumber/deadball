// Deadball Digital - Roster Display
var DB = DB || {};

DB.RosterUI = {
  renderRoster(team) {
    var html = '';
    var sw = '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    var ew = '</div>';

    html += '<h4>Starting Lineup</h4>';
    html += sw + '<table class="data-table"><tr><th>#</th><th>Name</th><th>Pos</th><th>H</th><th>BT</th><th>OBT</th><th>Age</th><th>Traits</th></tr>';
    team.lineup.forEach(function(p, i) {
      html += '<tr><td>' + (i + 1) + '</td><td>' + p.name + '</td><td>' + p.position + '</td>';
      html += '<td>' + p.handedness + '</td><td>' + p.bt + '</td><td>' + p.obt + '</td>';
      html += '<td>' + p.age + '</td><td>' + DB.RosterUI.renderTraits(p.traits) + '</td></tr>';
    });
    html += '</table>' + ew;

    if (team.bench.length > 0) {
      html += '<h4>Bench</h4>';
      html += sw + '<table class="data-table"><tr><th>Name</th><th>Pos</th><th>H</th><th>BT</th><th>OBT</th><th>Age</th><th>Traits</th></tr>';
      team.bench.forEach(function(p) {
        html += '<tr><td>' + p.name + '</td><td>' + p.position + '</td>';
        html += '<td>' + p.handedness + '</td><td>' + p.bt + '</td><td>' + p.obt + '</td>';
        html += '<td>' + p.age + '</td><td>' + DB.RosterUI.renderTraits(p.traits) + '</td></tr>';
      });
      html += '</table>' + ew;
    }

    html += '<h4>Starting Rotation</h4>';
    html += sw + '<table class="data-table"><tr><th>Name</th><th>H</th><th>PD</th><th>BT</th><th>OBT</th><th>Age</th><th>Traits</th></tr>';
    team.rotation.forEach(function(p) {
      html += '<tr><td>' + p.name + '</td>';
      html += '<td>' + p.handedness + '</td><td>' + DB.Dice.formatPD(p.pitchDie) + '</td>';
      html += '<td>' + p.bt + '</td><td>' + p.obt + '</td>';
      html += '<td>' + p.age + '</td><td>' + DB.RosterUI.renderTraits(p.traits) + '</td></tr>';
    });
    html += '</table>' + ew;

    if (team.bullpen.length > 0) {
      html += '<h4>Bullpen</h4>';
      html += sw + '<table class="data-table"><tr><th>Name</th><th>H</th><th>PD</th><th>BT</th><th>OBT</th><th>Age</th><th>Traits</th></tr>';
      team.bullpen.forEach(function(p) {
        html += '<tr><td>' + p.name + '</td>';
        html += '<td>' + p.handedness + '</td><td>' + DB.Dice.formatPD(p.pitchDie) + '</td>';
        html += '<td>' + p.bt + '</td><td>' + p.obt + '</td>';
        html += '<td>' + p.age + '</td><td>' + DB.RosterUI.renderTraits(p.traits) + '</td></tr>';
      });
      html += '</table>' + ew;
    }

    return html;
  },

  renderTraits(traits) {
    if (!traits || traits.length === 0) return '-';
    return traits.map(function(t) {
      var cls = t.indexOf('-') !== -1 ? 'trait-negative' : 'trait-positive';
      return '<span class="trait-badge ' + cls + '">' + t + '</span>';
    }).join(' ');
  },

  // Render a compact player line
  renderPlayerLine(player) {
    var traits = player.traits.length > 0 ? ' [' + player.traits.join(', ') + ']' : '';
    var pd = player.isPitcher ? ' PD:' + DB.Dice.formatPD(player.pitchDie) : '';
    return player.name + ' (' + player.position + ' ' + player.handedness +
      ') BT:' + player.bt + ' OBT:' + player.obt + pd + traits;
  },

  // ===== EDITABLE ROSTER =====
  // Renders an editable version of a team's roster with inline edit and
  // "open in builder" links. teamIdx = index in DB.App.teams, or use
  // a callback for custom save.

  renderEditableRoster(team, onUpdate) {
    var html = '';

    function renderSection(title, players, listKey) {
      html += '<h4>' + title + '</h4>';
      players.forEach(function(p, idx) {
        html += '<div class="player-card" style="cursor:pointer;" data-list="' + listKey + '" data-idx="' + idx + '">';
        html += '<span class="pos">' + p.position + '</span>';
        html += '<span class="name" style="flex:1;">' + p.name + '</span>';
        html += '<span class="stats" style="font-size:0.8rem;color:var(--text-dim);">';
        html += p.handedness + ' | BT:' + p.bt + ' OBT:' + p.obt;
        if (p.isPitcher) html += ' | PD:' + DB.Dice.formatPD(p.pitchDie);
        html += '</span>';
        html += ' ' + DB.RosterUI.renderTraits(p.traits);
        html += '<button class="btn btn-small btn-secondary" style="padding:4px 8px;font-size:0.75rem;" '
          + 'onclick="DB.RosterUI.editPlayer(\'' + listKey + '\',' + idx + ')">Edit</button>';
        html += '</div>';
      });
    }

    renderSection('Starting Lineup', team.lineup, 'lineup');
    if (team.bench.length > 0) renderSection('Bench', team.bench, 'bench');
    renderSection('Starting Rotation', team.rotation, 'rotation');
    if (team.bullpen.length > 0) renderSection('Bullpen', team.bullpen, 'bullpen');

    // Manager edit
    html += '<h4>Manager</h4>';
    html += '<div class="card" style="padding:12px;">';
    html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">';
    html += '<input type="text" id="edit-mgr-name" value="' + (team.manager.name || '').replace(/"/g, '&quot;') + '" style="flex:1;min-width:120px;" placeholder="Manager name">';
    html += '<label style="font-size:0.85rem;color:var(--text-dim);">Daring:</label>';
    html += '<input type="number" id="edit-mgr-daring" value="' + (team.manager.daring || 10) + '" min="1" max="20" style="width:60px;">';
    html += '<button class="btn btn-small btn-secondary" onclick="var d=DB.Dice.d20(); document.getElementById(\'edit-mgr-daring\').value=d;">Roll</button>';
    html += '</div></div>';

    return html;
  },

  // Open the in-depth builder for a specific player on the editing team
  _editTeam: null,
  _editCallback: null,

  editPlayer(listKey, idx) {
    var team = DB.RosterUI._editTeam;
    if (!team) return;
    var player = team[listKey][idx];
    if (!player) return;

    // Store where to put the result back
    DB.RosterUI._editListKey = listKey;
    DB.RosterUI._editIdx = idx;

    // Open the in-depth builder with this player
    DB.PlayerCardUI.openBuilder(player);

    // Override the save behavior to put the player back into the team
    DB.PlayerCardUI._overrideSave = function(newPlayer) {
      team[listKey][idx] = newPlayer;
      DB.Team.calculateTeamScore(team);
      if (DB.RosterUI._editCallback) DB.RosterUI._editCallback();
    };
  },

  // Start an edit session for a team
  startEditSession(team, callback) {
    DB.RosterUI._editTeam = team;
    DB.RosterUI._editCallback = callback;
  }
};

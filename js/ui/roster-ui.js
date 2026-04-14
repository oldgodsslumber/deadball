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

  // ===== EXPORT / PRINT =====
  exportTeam(team) {
    var w = window.open('', '_blank');
    if (!w) { alert('Please allow popups to print.'); return; }

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
    html += '<title>' + team.name + ' Roster</title>';
    html += '<style>';
    html += 'body{font-family:Georgia,serif;color:#111;max-width:800px;margin:0 auto;padding:20px;}';
    html += 'h1{text-align:center;border-bottom:3px double #333;padding-bottom:8px;}';
    html += 'h2{margin-top:20px;border-bottom:1px solid #999;font-size:1.1rem;}';
    html += 'table{width:100%;border-collapse:collapse;margin:8px 0 16px;}';
    html += 'th,td{padding:4px 8px;text-align:left;border-bottom:1px solid #ddd;font-size:0.9rem;}';
    html += 'th{background:#f0f0f0;font-size:0.8rem;text-transform:uppercase;}';
    html += '.trait{display:inline-block;padding:1px 5px;border-radius:3px;font-size:0.75rem;font-weight:bold;}';
    html += '.trait-pos{background:#d4edda;color:#155724;} .trait-neg{background:#f8d7da;color:#721c24;}';
    html += '.info{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin:8px 0;}';
    html += '.info span{font-size:0.9rem;}';
    html += '@media print{body{padding:0;} button{display:none!important;}}';
    html += '</style></head><body>';

    html += '<h1>' + team.name + '</h1>';
    html += '<div class="info">';
    html += '<span><strong>Era:</strong> ' + (DB.Eras[team.era] ? DB.Eras[team.era].name : team.era) + '</span>';
    html += '<span><strong>Team Score:</strong> ' + team.teamScore + '</span>';
    html += '<span><strong>Manager:</strong> ' + team.manager.name + ' (Daring: ' + team.manager.daring + ', ' + team.manager.personality + ')</span>';
    html += '</div>';

    if (team.ballpark && team.ballpark.name) {
      html += '<div class="info">';
      html += '<span><strong>Ballpark:</strong> ' + team.ballpark.name + ' (' + team.ballpark.type + ', ' + (team.ballpark.capacity || 0).toLocaleString() + ')</span>';
      if (team.fanbase) html += '<span><strong>Fanbase:</strong> ' + team.fanbase.level + '</span>';
      html += '</div>';
    }

    function renderTable(title, players, showPD) {
      if (!players || players.length === 0) return '';
      var h = '<h2>' + title + '</h2><table><tr><th>#</th><th>Name</th><th>Pos</th><th>H</th><th>BT</th><th>OBT</th>';
      if (showPD) h += '<th>PD</th>';
      h += '<th>Age</th><th>Traits</th></tr>';
      players.forEach(function(p, i) {
        h += '<tr><td>' + (i + 1) + '</td><td>' + p.name + '</td><td>' + p.position + '</td>';
        h += '<td>' + p.handedness + '</td><td>' + p.bt + '</td><td>' + p.obt + '</td>';
        if (showPD) h += '<td>' + (p.pitchDie != null ? DB.Dice.formatPD(p.pitchDie) : '-') + '</td>';
        h += '<td>' + p.age + '</td><td>';
        if (p.traits.length > 0) {
          h += p.traits.map(function(t) {
            var cls = t.indexOf('-') !== -1 ? 'trait-neg' : 'trait-pos';
            return '<span class="trait ' + cls + '">' + t + '</span>';
          }).join(' ');
        } else { h += '-'; }
        h += '</td></tr>';
      });
      h += '</table>';
      return h;
    }

    html += renderTable('Starting Lineup', team.lineup, false);
    html += renderTable('Bench', team.bench, false);
    html += renderTable('Starting Rotation', team.rotation, true);
    html += renderTable('Bullpen', team.bullpen, true);

    html += '<div style="text-align:center;margin:20px 0;">';
    html += '<button onclick="window.print()" style="padding:10px 30px;font-size:1rem;cursor:pointer;">Print</button>';
    html += '</div>';
    html += '</body></html>';

    w.document.write(html);
    w.document.close();
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

// Deadball Digital - Team Builder UI
var DB = DB || {};

DB.TeamBuilderUI = {
  startRapid() {
    DB.Screens.show('rapid-create');
  },

  startDetailed() {
    DB.TeamBuilderUI.renderDetailedBuilder();
    DB.Screens.show('detailed-builder');
  },

  // Rapid generation: type a name, get a full team
  rapidGenerate() {
    var nameInput = document.getElementById('rapid-team-name');
    var name = nameInput ? nameInput.value.trim() : '';
    var era = DB.App.currentEra;

    var team = DB.Team.generateRapid(name || null, era);
    DB.App.teams.push(team);

    // Show result
    var container = document.getElementById('rapid-result');
    if (container) {
      var html = '<div class="card fade-in">';
      html += '<div class="card-header"><h3>' + team.name + '</h3>';
      html += '<span class="era-badge">' + DB.Eras[era].name + '</span></div>';
      html += '<p>Team Score: <strong>' + team.teamScore + '</strong> | Manager: ' + team.manager.name + ' (Daring: ' + team.manager.daring + ')</p>';
      html += DB.RosterUI.renderRoster(team);
      html += '<div class="btn-group" style="margin-top:12px;">';
      html += '<button class="btn btn-success btn-small" onclick="DB.Screens.show(\'team-setup\'); DB.TeamBuilderUI.refreshTeamSetup();">Use This Team</button>';
      html += '<button class="btn btn-secondary btn-small" onclick="DB.App.teams.pop(); document.getElementById(\'rapid-result\').innerHTML=\'\';">Discard</button>';
      html += '</div></div>';
      container.innerHTML += html;
    }

    if (nameInput) nameInput.value = '';
  },

  // Detailed builder
  renderDetailedBuilder() {
    var era = DB.App.currentEra;
    var eraConfig = DB.Eras[era];
    var html = '';

    html += '<div class="card">';
    html += '<div class="form-group"><label>Team Name</label>';
    html += '<input type="text" id="detail-team-name" placeholder="e.g. Brooklyn Robins"></div>';
    html += '<p class="subtitle">Build a ' + eraConfig.rosterSize + '-player roster for the ' + DB.Eras[era].name + '.</p>';
    html += '</div>';

    // Lineup slots
    var positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    html += '<h3>Starting Lineup (' + eraConfig.starters + ' players)</h3>';
    html += '<div id="detail-lineup">';
    for (var i = 0; i < eraConfig.starters; i++) {
      html += DB.TeamBuilderUI.renderPlayerSlot('lineup-' + i, positions[i] || 'UT', false);
    }
    html += '</div>';

    html += '<h3>Bench (' + eraConfig.bench + ' players)</h3>';
    html += '<div id="detail-bench">';
    for (var j = 0; j < eraConfig.bench; j++) {
      html += DB.TeamBuilderUI.renderPlayerSlot('bench-' + j, 'UT', false);
    }
    html += '</div>';

    html += '<h3>Starting Pitchers (' + eraConfig.startingPitchers + ')</h3>';
    html += '<div id="detail-rotation">';
    for (var k = 0; k < eraConfig.startingPitchers; k++) {
      html += DB.TeamBuilderUI.renderPlayerSlot('sp-' + k, 'SP', true);
    }
    html += '</div>';

    html += '<h3>Bullpen (' + eraConfig.relievers + ')</h3>';
    html += '<div id="detail-bullpen">';
    for (var l = 0; l < eraConfig.relievers; l++) {
      html += DB.TeamBuilderUI.renderPlayerSlot('rp-' + l, 'RP', true);
    }
    html += '</div>';

    html += '<div style="margin-top:20px;text-align:center;">';
    html += '<button class="btn btn-warning" onclick="DB.TeamBuilderUI.autoFillAll()">Auto-Fill All Empty</button> ';
    html += '<button class="btn btn-primary" onclick="DB.TeamBuilderUI.saveDetailedTeam()">Save Team</button>';
    html += '</div>';

    DB.Screens.render('detailed-builder-content', html);
  },

  renderPlayerSlot(slotId, defaultPos, isPitcher) {
    var html = '<div class="player-card" id="slot-' + slotId + '" data-pos="' + defaultPos + '" data-pitcher="' + isPitcher + '">';
    html += '<span class="pos">' + defaultPos + '</span>';
    html += '<input type="text" style="flex:1;min-width:100px;padding:6px;" id="name-' + slotId + '" placeholder="Name (blank=random)">';
    html += '<input type="number" style="width:50px;padding:6px;" id="bt-' + slotId + '" placeholder="BT" min="1" max="50">';
    html += '<input type="number" style="width:50px;padding:6px;" id="obt-' + slotId + '" placeholder="OBT" min="1" max="60">';
    if (isPitcher) {
      html += '<select id="pd-' + slotId + '" style="width:70px;padding:6px;">';
      html += '<option value="auto">Auto</option>';
      DB.Dice.PD_LADDER.forEach(function(pd) {
        html += '<option value="' + pd + '">' + DB.Dice.formatPD(pd) + '</option>';
      });
      html += '</select>';
    }
    html += '<button class="btn btn-small btn-secondary" onclick="DB.TeamBuilderUI.randomizeSlot(\'' + slotId + '\')">Roll</button>';
    html += '</div>';
    return html;
  },

  randomizeSlot(slotId) {
    var slotEl = document.getElementById('slot-' + slotId);
    var pos = slotEl.getAttribute('data-pos');
    var isPitcher = slotEl.getAttribute('data-pitcher') === 'true';
    var era = DB.App.currentEra;

    var player = DB.Player.generateRandom({
      era: era,
      position: pos,
      tier: 'prospect'
    });

    document.getElementById('name-' + slotId).value = player.name;
    document.getElementById('bt-' + slotId).value = player.bt;
    document.getElementById('obt-' + slotId).value = player.obt;
    if (isPitcher) {
      var pdSel = document.getElementById('pd-' + slotId);
      if (pdSel) pdSel.value = player.pitchDie;
    }
  },

  autoFillAll() {
    document.querySelectorAll('.player-card[id^="slot-"]').forEach(function(el) {
      var slotId = el.id.replace('slot-', '');
      var nameInput = document.getElementById('name-' + slotId);
      if (!nameInput.value.trim()) {
        DB.TeamBuilderUI.randomizeSlot(slotId);
      }
    });
  },

  saveDetailedTeam() {
    var teamName = document.getElementById('detail-team-name').value.trim() || 'My Team';
    var era = DB.App.currentEra;
    var eraConfig = DB.Eras[era];

    var team = DB.Team.create({ name: teamName, era: era });

    // Collect lineup
    for (var i = 0; i < eraConfig.starters; i++) {
      var p = DB.TeamBuilderUI.collectSlot('lineup-' + i, false);
      if (p) team.lineup.push(p);
    }

    // Bench
    for (var j = 0; j < eraConfig.bench; j++) {
      var p2 = DB.TeamBuilderUI.collectSlot('bench-' + j, false);
      if (p2) team.bench.push(p2);
    }

    // Rotation
    for (var k = 0; k < eraConfig.startingPitchers; k++) {
      var p3 = DB.TeamBuilderUI.collectSlot('sp-' + k, true);
      if (p3) { p3.isStarter = true; team.rotation.push(p3); }
    }

    // Bullpen
    for (var l = 0; l < eraConfig.relievers; l++) {
      var p4 = DB.TeamBuilderUI.collectSlot('rp-' + l, true);
      if (p4) { p4.isStarter = false; team.bullpen.push(p4); }
    }

    team.manager = { name: DB.Player.generateName(), daring: DB.Dice.d20(), personality: 'Even-Keeled' };
    DB.Team.calculateTeamScore(team);
    DB.App.teams.push(team);

    alert(team.name + ' saved! Team Score: ' + team.teamScore);
    DB.Screens.show('team-setup');
    DB.TeamBuilderUI.refreshTeamSetup();
  },

  collectSlot(slotId, isPitcher) {
    var name = document.getElementById('name-' + slotId).value.trim();
    var bt = parseInt(document.getElementById('bt-' + slotId).value) || 0;
    var obt = parseInt(document.getElementById('obt-' + slotId).value) || 0;
    var pos = document.getElementById('slot-' + slotId).getAttribute('data-pos');

    if (!name && !bt) {
      // Auto-generate
      var player = DB.Player.generateRandom({
        era: DB.App.currentEra,
        position: pos,
        tier: 'prospect'
      });
      return player;
    }

    var pitchDie = null;
    if (isPitcher) {
      var pdVal = document.getElementById('pd-' + slotId).value;
      pitchDie = pdVal === 'auto' ? DB.Tables.fictionalPitchDie.modern[DB.Dice.d8()] : parseInt(pdVal);
    }

    if (!name) name = DB.Player.generateName();
    if (!bt) bt = DB.Dice.roll2d(10) + 15;
    if (!obt || obt <= bt) obt = bt + DB.Dice.roll2d(4);

    return DB.Player.create({
      name: name, position: pos, bt: bt, obt: obt,
      pitchDie: pitchDie, isPitcher: isPitcher,
      handedness: DB.Tables.handednessTable.batter[DB.Dice.d10()],
      age: DB.Dice.d6() + 22
    });
  },

  refreshTeamSetup() {
    var container = document.getElementById('team-setup-teams');
    if (!container) return;

    if (DB.App.teams.length === 0) {
      container.innerHTML = '<p class="subtitle">No teams created yet.</p>';
      document.getElementById('btn-start-game').style.display = 'none';
      return;
    }

    var html = '<h3>Your Teams</h3>';
    DB.App.teams.forEach(function(t, i) {
      html += '<div class="card"><div class="card-header"><h3>' + t.name + '</h3>';
      html += '<span>TS: ' + t.teamScore + '</span></div>';
      html += '<p>' + DB.Team.getRosterCount(t) + ' players | Manager: ' + t.manager.name + '</p>';
      html += '</div>';
    });
    container.innerHTML = html;

    if (DB.App.teams.length >= 2) {
      document.getElementById('btn-start-game').style.display = '';
    }
  }
};

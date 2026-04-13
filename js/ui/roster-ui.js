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
  }
};

// Deadball Digital - Player Card UI
var DB = DB || {};

DB.PlayerCardUI = {
  // Generate a random player from the creator screen
  generateRandom() {
    var name = document.getElementById('player-name').value.trim() || undefined;
    var pos = document.getElementById('player-position').value;
    var tier = document.getElementById('player-tier').value;
    var ageCat = document.getElementById('player-age-cat').value;
    var era = document.getElementById('player-era').value;

    var options = {
      era: era,
      tier: tier,
      ageCategory: ageCat,
      name: name
    };
    if (pos !== 'random') options.position = pos;

    var player = DB.Player.generateRandom(options);

    // Show result
    var container = document.getElementById('player-creator-result');
    if (container) {
      container.innerHTML = DB.PlayerCardUI.renderFullCard(player) +
        '<div class="btn-group" style="margin-top:12px;">' +
        '<button class="btn btn-success btn-small" onclick="DB.PlayerCardUI.addToPool()">Add to Player Pool</button>' +
        '</div>';
      DB.PlayerCardUI._lastPlayer = player;
    }
  },

  _lastPlayer: null,

  addToPool() {
    if (DB.PlayerCardUI._lastPlayer) {
      DB.App.playerPool.push(DB.PlayerCardUI._lastPlayer);
      alert(DB.PlayerCardUI._lastPlayer.name + ' added to player pool!');
    }
  },

  renderFullCard(player) {
    var html = '<div class="card fade-in">';
    html += '<div class="card-header">';
    html += '<h3>' + player.name + '</h3>';
    html += '<span class="pos" style="font-size:1.2rem;">' + player.position + '</span>';
    html += '</div>';

    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">';
    html += DB.PlayerCardUI.statBox('Batter Target', player.bt);
    html += DB.PlayerCardUI.statBox('On Base Target', player.obt);
    if (player.isPitcher) {
      html += DB.PlayerCardUI.statBox('Pitch Die', DB.Dice.formatPD(player.pitchDie));
    }
    html += DB.PlayerCardUI.statBox('Age', player.age);
    html += DB.PlayerCardUI.statBox('Handedness', player.handedness === 'R' ? 'Right' : player.handedness === 'L' ? 'Left' : 'Switch');
    html += DB.PlayerCardUI.statBox('Type', player.isPitcher ? (player.isStarter ? 'Starter' : 'Reliever') : 'Position Player');
    html += '</div>';

    if (player.traits.length > 0) {
      html += '<div style="margin-top:8px;">';
      html += '<strong>Traits:</strong> ';
      html += player.traits.map(function(t) {
        var cls = t.indexOf('-') !== -1 ? 'trait-negative' : 'trait-positive';
        var desc = DB.PlayerCardUI.traitDescriptions[t] || t;
        return '<span class="trait-badge ' + cls + '" title="' + desc + '">' + t + '</span>';
      }).join(' ');
      html += '</div>';
    }

    // Approximate real stats
    html += '<div style="margin-top:12px; color:var(--text-dim); font-size:0.85rem;">';
    html += 'Approx: .' + String(player.bt).padStart(3, '0') + ' AVG / .' + String(player.obt).padStart(3, '0') + ' OBP';
    if (player.isPitcher) {
      var approxERA = DB.PlayerCardUI.pdToApproxERA(player.pitchDie);
      html += ' / ~' + approxERA + ' ERA';
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  statBox(label, value) {
    return '<div style="background:var(--bg-input);padding:8px;border-radius:4px;text-align:center;">' +
      '<div style="font-size:0.75rem;color:var(--text-dim);">' + label + '</div>' +
      '<div style="font-size:1.3rem;font-weight:700;">' + value + '</div></div>';
  },

  pdToApproxERA(pd) {
    var map = { 20: '1.50', 12: '2.50', 8: '3.50', 6: '2.75', 4: '4.50', 0: '3.75', '-4': '5.50', '-6': '4.75', '-8': '6.50', '-12': '7.50', '-20': '8.50' };
    return map[String(pd)] || '4.50';
  },

  traitDescriptions: {
    'P+': 'Power Hitter: +1 on Hit Table',
    'P++': 'Elite Power: +2 on Hit Table',
    'P-': 'Weak Hitter: -1 on Hit Table',
    'P--': 'Very Weak: -2 on Hit Table',
    'C+': 'Contact: Singles become doubles on 1-2, no DEF, +1 bunt, +10 BT/OBT on H&R',
    'C-': 'Free Swinger: -1 bunt, no H&R bonus',
    'S+': 'Speed: Roll 2=triple, +1 steal, can steal home',
    'S-': 'Slow: -2 to steal attempts',
    'D+': 'Great Defense: +1 DEF rolls, catcher -1 opponent steal',
    'D-': 'Poor Defense: -1 DEF rolls, catcher +1 opponent steal',
    'T+': 'Tough: Reroll injury once, aging never below -3',
    'K+': 'Strikeout Artist: -1 opponent BT, K on out table 3',
    'GB+': 'Groundball: SS grounder on result 2, auto DP, +1 PD bases loaded',
    'CN+': 'Control: -2 opponent OBT',
    'CN-': 'Wild: +3 opponent OBT',
    'ST+': 'Stamina: Extra inning before fatigue'
  }
};

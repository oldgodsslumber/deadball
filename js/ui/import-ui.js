// Deadball Digital - MLB Stats API Import
var DB = DB || {};

DB.ImportUI = {
  MLB_API: 'https://statsapi.mlb.com',

  start() {
    DB.Screens.show('mlb-import');
    DB.ImportUI.loadTeamList();
  },

  loadTeamList() {
    var container = document.getElementById('mlb-import-content');
    container.innerHTML = '<p>Loading MLB teams...</p>';

    var seasonYear = new Date().getFullYear();
    fetch(DB.ImportUI.MLB_API + '/api/v1/teams?sportId=1&season=' + seasonYear)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var teams = data.teams || [];
        teams.sort(function(a, b) { return a.name.localeCompare(b.name); });

        var html = '<div class="form-group"><label>Select MLB Team</label>';
        html += '<select id="mlb-team-select" onchange="DB.ImportUI.selectTeam(this.value)">';
        html += '<option value="">-- Choose a team --</option>';
        teams.forEach(function(t) {
          html += '<option value="' + t.id + '">' + t.name + '</option>';
        });
        html += '</select></div>';
        html += '<div class="form-group"><label>Season</label>';
        html += '<select id="mlb-import-season">';
        var curYear = new Date().getFullYear();
        for (var y = curYear; y >= curYear - 5; y--) {
          html += '<option value="' + y + '">' + y + ' Season</option>';
        }
        html += '</select></div>';
        html += '<div class="form-group"><label>Era Rules</label>';
        html += '<select id="mlb-import-era"><option value="modern">Modern</option><option value="juiced">Juiced Ball</option></select></div>';
        html += '<div id="mlb-roster-preview"></div>';
        container.innerHTML = html;
      })
      .catch(function(err) {
        container.innerHTML = '<p style="color:var(--red)">Failed to load MLB teams. Check your internet connection.</p>' +
          '<button class="btn btn-secondary" onclick="DB.ImportUI.loadTeamList()">Retry</button>';
      });
  },

  selectTeam(teamId) {
    if (!teamId) return;
    var preview = document.getElementById('mlb-roster-preview');
    preview.innerHTML = '<p>Loading roster...</p>';

    var season = document.getElementById('mlb-import-season');
    var seasonVal = season ? season.value : new Date().getFullYear();
    fetch(DB.ImportUI.MLB_API + '/api/v1/teams/' + teamId + '/roster?rosterType=active&season=' + seasonVal)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var roster = data.roster || [];
        var playerIds = roster.map(function(r) { return r.person.id; });

        // Fetch stats for all players
        var promises = playerIds.map(function(pid) {
          return fetch(DB.ImportUI.MLB_API + '/api/v1/people/' + pid + '?hydrate=stats(group=[hitting,pitching],type=season,season=' + seasonVal + ')')
            .then(function(r) { return r.json(); })
            .then(function(d) { return d.people ? d.people[0] : null; })
            .catch(function() { return null; });
        });

        return Promise.all(promises);
      })
      .then(function(players) {
        players = players.filter(Boolean);
        DB.ImportUI._importPlayers = players;

        var html = '<h3>Roster Preview (' + players.length + ' players)</h3>';
        html += '<table class="data-table"><tr><th>Name</th><th>Pos</th><th>H</th><th>AVG/ERA</th><th>BT</th><th>OBT/PD</th></tr>';

        players.forEach(function(p) {
          var pos = p.primaryPosition ? p.primaryPosition.abbreviation : '??';
          var isPitcher = pos === 'P' || pos === 'SP' || pos === 'RP' || pos === 'TWP';
          var stats = DB.ImportUI.extractStats(p, isPitcher);

          html += '<tr><td>' + p.fullName + '</td><td>' + pos + '</td>';
          html += '<td>' + (p.batSide ? p.batSide.code : '?') + '</td>';

          if (isPitcher) {
            html += '<td>' + (stats.era || '-') + ' ERA</td>';
            html += '<td>' + (stats.bt || '-') + '</td>';
            html += '<td>' + DB.Dice.formatPD(stats.pd || 4) + '</td>';
          } else {
            html += '<td>' + (stats.avg || '-') + '</td>';
            html += '<td>' + (stats.bt || '-') + '</td>';
            html += '<td>' + (stats.obt || '-') + '</td>';
          }
          html += '</tr>';
        });
        html += '</table>';
        html += '<button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="DB.ImportUI.importTeam()">Import as Deadball Team</button>';

        preview.innerHTML = html;
      })
      .catch(function(err) {
        preview.innerHTML = '<p style="color:var(--red)">Failed to load roster: ' + err.message + '</p>';
      });
  },

  _importPlayers: [],

  extractStats(mlbPlayer, isPitcher) {
    var result = { bt: 20, obt: 25, pd: 4, avg: '.000', era: '0.00', hr: 0, sb: 0, kPer9: 0, bbPer9: 0, gbPct: 0, ip: 0, kPct: 0, gamesPlayed: 0, drs: 0 };

    if (!mlbPlayer.stats) return result;

    mlbPlayer.stats.forEach(function(statGroup) {
      if (!statGroup.splits || statGroup.splits.length === 0) return;
      var s = statGroup.splits[0].stat;

      if (statGroup.group && statGroup.group.displayName === 'hitting' && !isPitcher) {
        result.avg = s.avg || '.000';
        result.bt = Math.round(parseFloat(s.avg || '0.250') * 100);
        result.obt = Math.round(parseFloat(s.obp || '0.320') * 100);
        result.hr = parseInt(s.homeRuns) || 0;
        result.sb = parseInt(s.stolenBases) || 0;
        result.gamesPlayed = parseInt(s.gamesPlayed) || 0;
        if (s.atBats && s.strikeOuts) {
          result.kPct = parseInt(s.strikeOuts) / Math.max(1, parseInt(s.atBats));
        }
      }

      if (statGroup.group && statGroup.group.displayName === 'pitching' && isPitcher) {
        result.era = s.era || '4.50';
        var eraVal = parseFloat(s.era || '4.50');
        var importEra = document.getElementById('mlb-import-era');
        var eraId = importEra ? importEra.value : 'modern';
        result.pd = DB.Eras.eraToPD(eraVal, eraId);
        result.bt = Math.round(parseFloat(s.avg || '0.100') * 100) || 10;
        result.obt = result.bt + 5;
        result.ip = parseFloat(s.inningsPitched) || 0;
        if (s.strikeOuts && s.inningsPitched) {
          result.kPer9 = (parseInt(s.strikeOuts) / Math.max(1, parseFloat(s.inningsPitched))) * 9;
        }
        if (s.baseOnBalls && s.inningsPitched) {
          result.bbPer9 = (parseInt(s.baseOnBalls) / Math.max(1, parseFloat(s.inningsPitched))) * 9;
        }
      }
    });

    return result;
  },

  importTeam() {
    var players = DB.ImportUI._importPlayers;
    if (!players.length) return;

    var teamSelect = document.getElementById('mlb-team-select');
    var teamName = teamSelect.options[teamSelect.selectedIndex].text;
    var eraId = document.getElementById('mlb-import-era').value;

    var team = DB.Team.create({ name: teamName, era: eraId });

    var pitchers = [];
    var batters = [];

    players.forEach(function(p) {
      var pos = p.primaryPosition ? p.primaryPosition.abbreviation : 'UT';
      var isPitcher = ['P', 'SP', 'RP', 'TWP'].indexOf(pos) !== -1;
      var stats = DB.ImportUI.extractStats(p, isPitcher);

      var dbPlayer = DB.Player.createFromStats({
        name: p.fullName,
        position: isPitcher ? (pos === 'RP' ? 'RP' : 'SP') : (pos === 'DH' ? 'DH' : pos),
        handedness: p.batSide ? p.batSide.code : 'R',
        battingAvg: parseFloat(stats.avg) || 0.250,
        obp: stats.obt / 100,
        era: parseFloat(stats.era) || 4.50,
        isPitcher: isPitcher,
        isStarter: pos !== 'RP',
        hr: stats.hr,
        sb: stats.sb,
        kPct: stats.kPct,
        kPer9: stats.kPer9,
        bbPer9: stats.bbPer9,
        ip: stats.ip,
        gamesPlayed: stats.gamesPlayed,
        age: p.currentAge || 25
      }, eraId);

      if (isPitcher) pitchers.push(dbPlayer);
      else batters.push(dbPlayer);
    });

    // Sort batters by BT descending
    batters.sort(function(a, b) { return b.bt - a.bt; });

    // Assign to lineup (first 8-9) and bench
    team.lineup = batters.slice(0, 8);
    team.bench = batters.slice(8, 13);

    // Sort pitchers: starters first (by PD), then relievers
    var starters = pitchers.filter(function(p) { return p.isStarter; });
    var relievers = pitchers.filter(function(p) { return !p.isStarter; });
    starters.sort(function(a, b) { return (b.pitchDie || 0) - (a.pitchDie || 0); });
    relievers.sort(function(a, b) { return (b.pitchDie || 0) - (a.pitchDie || 0); });

    team.rotation = starters.slice(0, 5);
    team.bullpen = relievers.slice(0, 7);

    // Fill if not enough
    while (team.rotation.length < 5 && starters.length > team.rotation.length) {
      team.rotation.push(starters[team.rotation.length]);
    }

    team.manager = { name: 'Manager', daring: 10, personality: 'Even-Keeled' };
    DB.Team.calculateTeamScore(team);
    DB.App.teams.push(team);

    var impSeason = document.getElementById('mlb-import-season');
    var impYear = impSeason ? impSeason.value : new Date().getFullYear();
    alert(team.name + ' (' + impYear + ' season) imported! Team Score: ' + team.teamScore);
    DB.Screens.show('team-setup');
    DB.TeamBuilderUI.refreshTeamSetup();
  }
};

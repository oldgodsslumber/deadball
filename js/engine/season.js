// Deadball Digital - Season Engine
var DB = DB || {};

DB.Season = {
  // ===== SEASON CREATION =====
  create(teams, options) {
    options = options || {};
    var numTeams = teams.length;
    var seasonLength = options.seasonLength || 'half'; // 'short','half','full','custom'
    var customGames = options.customGames || 81;
    var era = options.era || DB.App.currentEra || 'modern';

    // Calculate games per team
    var gamesPerTeam;
    switch (seasonLength) {
      case 'short': gamesPerTeam = 40; break;
      case 'half':  gamesPerTeam = 81; break;
      case 'full':  gamesPerTeam = 162; break;
      case 'custom': gamesPerTeam = customGames; break;
      default: gamesPerTeam = 81;
    }

    // Build divisions
    var divisions = DB.Season.buildDivisions(teams);

    // Build schedule
    var schedule = DB.Season.generateSchedule(teams, divisions, gamesPerTeam);

    // Calculate all-star break point (midseason)
    var totalWeeks = schedule.length;
    var allStarWeek = Math.floor(totalWeeks / 2);

    var season = {
      era: era,
      teams: teams.map(function(t) { return t.id; }),
      teamNames: {},
      divisions: divisions,
      seasonLength: seasonLength,
      gamesPerTeam: gamesPerTeam,
      schedule: schedule,       // Array of weeks, each week is array of matchups
      currentWeek: 0,
      allStarWeek: allStarWeek,
      allStarDone: false,
      playoffsStarted: false,
      playoffs: null,
      standings: {},
      gameResults: [],          // All game results [{week, away, home, awayScore, homeScore, played}]
      phase: 'regular',         // 'regular', 'allstar', 'playoffs', 'offseason'
      champion: null
    };

    // Initialize standings per division
    teams.forEach(function(t) {
      season.teamNames[t.id] = t.name;
      season.standings[t.id] = { w: 0, l: 0, rs: 0, ra: 0 };
    });

    return season;
  },

  // ===== DIVISIONS =====
  buildDivisions(teams) {
    var n = teams.length;
    var divs = {};

    if (n <= 5) {
      // Single division
      divs['Division'] = teams.map(function(t) { return t.id; });
    } else if (n <= 8) {
      // 2 divisions
      var half = Math.ceil(n / 2);
      divs['East'] = teams.slice(0, half).map(function(t) { return t.id; });
      divs['West'] = teams.slice(half).map(function(t) { return t.id; });
    } else {
      // 2 leagues, 2 divisions each
      var quarter = Math.ceil(n / 4);
      divs['AL East'] = teams.slice(0, quarter).map(function(t) { return t.id; });
      divs['AL West'] = teams.slice(quarter, quarter * 2).map(function(t) { return t.id; });
      divs['NL East'] = teams.slice(quarter * 2, quarter * 3).map(function(t) { return t.id; });
      divs['NL West'] = teams.slice(quarter * 3).map(function(t) { return t.id; });
    }

    return divs;
  },

  // ===== SCHEDULE GENERATION =====
  generateSchedule(teams, divisions, gamesPerTeam) {
    var ids = teams.map(function(t) { return t.id; });
    var n = ids.length;
    var matchups = []; // all matchups needed

    // Generate round-robin pairings
    var pairings = [];
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        pairings.push([ids[i], ids[j]]);
      }
    }

    // Determine how many times each pair plays
    // Division rivals play more often
    var divisionOf = {};
    Object.keys(divisions).forEach(function(div) {
      divisions[div].forEach(function(tid) { divisionOf[tid] = div; });
    });

    var totalPairGames = Math.max(2, Math.floor(gamesPerTeam / (n - 1)));
    var divBonus = Object.keys(divisions).length > 1 ? 2 : 0;

    pairings.forEach(function(pair) {
      var sameDivision = divisionOf[pair[0]] === divisionOf[pair[1]];
      var gamesForPair = totalPairGames + (sameDivision ? divBonus : 0);
      for (var g = 0; g < gamesForPair; g++) {
        // Alternate home/away
        if (g % 2 === 0) {
          matchups.push({ away: pair[0], home: pair[1] });
        } else {
          matchups.push({ away: pair[1], home: pair[0] });
        }
      }
    });

    // Shuffle matchups
    for (var k = matchups.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var tmp = matchups[k]; matchups[k] = matchups[r]; matchups[r] = tmp;
    }

    // Split into weeks (each team plays ~3-4 games per week)
    var gamesPerWeek = Math.max(1, Math.floor(n / 2));
    var weeks = [];
    var idx = 0;
    while (idx < matchups.length) {
      var week = matchups.slice(idx, idx + gamesPerWeek);
      weeks.push(week);
      idx += gamesPerWeek;
    }

    return weeks;
  },

  // ===== STANDINGS =====
  getStandings(season) {
    var divStandings = {};
    Object.keys(season.divisions).forEach(function(div) {
      var teamIds = season.divisions[div];
      var rows = teamIds.map(function(tid) {
        var s = season.standings[tid] || { w: 0, l: 0, rs: 0, ra: 0 };
        var pct = s.w + s.l > 0 ? (s.w / (s.w + s.l)) : 0;
        return { id: tid, name: season.teamNames[tid], w: s.w, l: s.l, pct: pct, rs: s.rs, ra: s.ra };
      });
      rows.sort(function(a, b) { return b.pct - a.pct || b.w - a.w; });

      // Calculate GB
      if (rows.length > 0) {
        var leader = rows[0];
        rows.forEach(function(r) {
          r.gb = ((leader.w - r.w) + (r.l - leader.l)) / 2;
        });
      }
      divStandings[div] = rows;
    });
    return divStandings;
  },

  // Record a game result
  recordResult(season, away, home, awayScore, homeScore, week) {
    season.gameResults.push({
      week: week,
      away: away,
      home: home,
      awayScore: awayScore,
      homeScore: homeScore
    });

    var winnerId = homeScore > awayScore ? home : away;
    var loserId = homeScore > awayScore ? away : home;

    if (!season.standings[winnerId]) season.standings[winnerId] = { w: 0, l: 0, rs: 0, ra: 0 };
    if (!season.standings[loserId]) season.standings[loserId] = { w: 0, l: 0, rs: 0, ra: 0 };

    season.standings[winnerId].w++;
    season.standings[loserId].l++;
    season.standings[away].rs += awayScore;
    season.standings[away].ra += homeScore;
    season.standings[home].rs += homeScore;
    season.standings[home].ra += awayScore;
  },

  // Sim a single game between two team IDs using Team Score
  simGame(season, awayId, homeId) {
    var awayTeam = DB.Season.findTeam(awayId);
    var homeTeam = DB.Season.findTeam(homeId);
    if (!awayTeam || !homeTeam) return { awayScore: 0, homeScore: 0 };

    var result = DB.Sim.quickSim(awayTeam, homeTeam);
    var awayScore, homeScore;
    if (result.winner === awayTeam.name) {
      awayScore = result.winnerScore;
      homeScore = result.loserScore;
    } else {
      homeScore = result.winnerScore;
      awayScore = result.loserScore;
    }
    return { awayScore: awayScore, homeScore: homeScore };
  },

  findTeam(teamId) {
    for (var i = 0; i < DB.App.teams.length; i++) {
      if (DB.App.teams[i].id === teamId) return DB.App.teams[i];
    }
    return null;
  },

  // ===== ALL-STAR BREAK =====
  generateAllStarRosters(season) {
    // Pick top players from each division
    var allBatters = [];
    var allPitchers = [];

    DB.App.teams.forEach(function(team) {
      team.lineup.forEach(function(p) {
        allBatters.push({ player: p, team: team.name, bt: p.bt });
      });
      team.rotation.concat(team.bullpen).forEach(function(p) {
        allPitchers.push({ player: p, team: team.name, pd: p.pitchDie || 0 });
      });
    });

    allBatters.sort(function(a, b) { return b.bt - a.bt; });
    allPitchers.sort(function(a, b) { return b.pd - a.pd; });

    return {
      batters: allBatters.slice(0, 18), // top 18 batters
      pitchers: allPitchers.slice(0, 10) // top 10 pitchers
    };
  },

  // ===== PLAYOFFS =====
  generatePlayoffs(season) {
    var divNames = Object.keys(season.divisions);
    var seeds = [];

    divNames.forEach(function(div) {
      var standings = DB.Season.getStandings(season)[div];
      if (standings.length > 0) {
        seeds.push({ id: standings[0].id, name: standings[0].name, div: div, seed: seeds.length + 1 });
      }
    });

    // If only 1 division, take top 4
    if (divNames.length === 1) {
      var st = DB.Season.getStandings(season)[divNames[0]];
      seeds = [];
      for (var i = 0; i < Math.min(4, st.length); i++) {
        seeds.push({ id: st[i].id, name: st[i].name, div: divNames[0], seed: i + 1 });
      }
    }

    // Build bracket: #1 vs #4, #2 vs #3 (or fewer if less teams)
    var series = [];
    if (seeds.length >= 4) {
      series.push(DB.Season.createSeries(seeds[0], seeds[3], 'Semifinal 1'));
      series.push(DB.Season.createSeries(seeds[1], seeds[2], 'Semifinal 2'));
    } else if (seeds.length >= 2) {
      series.push(DB.Season.createSeries(seeds[0], seeds[1], 'Finals'));
    }

    return {
      seeds: seeds,
      round: 'Semifinals',
      series: series,
      finals: null,
      champion: null
    };
  },

  createSeries(team1, team2, label) {
    return {
      label: label,
      higher: team1,
      lower: team2,
      wins: { higher: 0, lower: 0 },
      games: [],
      complete: false,
      winner: null
    };
  },

  // Play one game in a playoff series
  playPlayoffGame(series) {
    var homeTeam, awayTeam;
    var gameNum = series.games.length + 1;
    // Home advantage: higher seed gets games 1,2,5; lower gets 3,4
    if (gameNum <= 2 || gameNum === 5) {
      homeTeam = series.higher;
      awayTeam = series.lower;
    } else {
      homeTeam = series.lower;
      awayTeam = series.higher;
    }

    var home = DB.Season.findTeam(homeTeam.id);
    var away = DB.Season.findTeam(awayTeam.id);
    if (!home || !away) return null;

    var result = DB.Sim.quickSim(away, home);
    var awayScore, homeScore;
    if (result.winner === away.name) {
      awayScore = result.winnerScore;
      homeScore = result.loserScore;
    } else {
      homeScore = result.winnerScore;
      awayScore = result.loserScore;
    }

    var winnerId = homeScore > awayScore ? homeTeam.id : awayTeam.id;
    if (winnerId === series.higher.id) series.wins.higher++;
    else series.wins.lower++;

    series.games.push({
      game: gameNum,
      away: awayTeam.name,
      home: homeTeam.name,
      awayScore: awayScore,
      homeScore: homeScore,
      winner: winnerId === series.higher.id ? series.higher.name : series.lower.name
    });

    // Check for series win (best of 5 = first to 3)
    if (series.wins.higher >= 3) {
      series.complete = true;
      series.winner = series.higher;
    } else if (series.wins.lower >= 3) {
      series.complete = true;
      series.winner = series.lower;
    }

    return series;
  },

  // ===== DRAFT =====
  generateDraftPool(numPlayers, era) {
    var pool = [];
    for (var i = 0; i < numPlayers; i++) {
      var player = DB.Player.generateRandom({
        era: era || 'modern',
        tier: i < Math.floor(numPlayers / 3) ? 'prospect' : 'farmhand',
        ageCategory: i < Math.floor(numPlayers / 2) ? 'prospect' : 'rookie'
      });
      pool.push(player);
    }
    // Sort by BT descending (best players first)
    pool.sort(function(a, b) {
      var aVal = a.isPitcher ? (a.pitchDie || 0) * 3 : a.bt;
      var bVal = b.isPitcher ? (b.pitchDie || 0) * 3 : b.bt;
      return bVal - aVal;
    });
    return pool;
  },

  // ===== TRADES =====
  // Generate a random trade proposal between two teams
  generateTradeProposal(team1, team2) {
    var all1 = DB.Team.getAllPlayers(team1);
    var all2 = DB.Team.getAllPlayers(team2);
    if (all1.length < 2 || all2.length < 2) return null;

    // Pick 1-2 random players from each
    var give = [all1[Math.floor(Math.random() * all1.length)]];
    var receive = [all2[Math.floor(Math.random() * all2.length)]];

    if (Math.random() < 0.3 && all1.length > 5) {
      var second = all1[Math.floor(Math.random() * all1.length)];
      if (second !== give[0]) give.push(second);
    }

    return {
      team1: team1,
      team2: team2,
      give: give,    // team1 gives these
      receive: receive // team1 receives these
    };
  },

  // Execute a trade
  executeTrade(team1, team2, givePlayers, receivePlayers) {
    givePlayers.forEach(function(p) {
      DB.Season.removePlayerFromTeam(team1, p);
      DB.Season.addPlayerToTeam(team2, p);
    });
    receivePlayers.forEach(function(p) {
      DB.Season.removePlayerFromTeam(team2, p);
      DB.Season.addPlayerToTeam(team1, p);
    });
    DB.Team.calculateTeamScore(team1);
    DB.Team.calculateTeamScore(team2);
  },

  removePlayerFromTeam(team, player) {
    ['lineup', 'bench', 'rotation', 'bullpen'].forEach(function(list) {
      var idx = team[list].indexOf(player);
      if (idx !== -1) team[list].splice(idx, 1);
    });
  },

  addPlayerToTeam(team, player) {
    if (player.isPitcher) {
      if (player.isStarter) team.rotation.push(player);
      else team.bullpen.push(player);
    } else {
      if (team.lineup.length < 9) team.lineup.push(player);
      else team.bench.push(player);
    }
  },

  // ===== AGING (end of season) =====
  applyAging(team) {
    var results = [];
    DB.Team.getAllPlayers(team).forEach(function(player) {
      player.age++;
      var mod = DB.Tables.agingModifier(player.age);
      if (DB.Player.hasTrait(player, 'T+') && mod < -3) mod = -3;

      var roll = DB.Dice.roll2d(6) + mod;
      var effect = DB.Tables.resolveAging(roll);
      var desc = player.name + ' (age ' + player.age + ', 2d6+' + mod + '=' + roll + '): ';

      switch (effect) {
        case 'severe_decline':
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdDown(player.pitchDie, 2);
            desc += 'Severe decline! PD now ' + DB.Dice.formatPD(player.pitchDie);
          } else {
            player.bt = Math.max(1, player.bt - 5);
            player.obt = Math.max(player.bt + 1, player.obt - 5);
            desc += 'Severe decline! BT/OBT now ' + player.bt + '/' + player.obt;
          }
          player.traits = player.traits.filter(function(t) { return t.indexOf('-') !== -1; });
          break;
        case 'decline':
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdDown(player.pitchDie, 1);
            desc += 'Decline. PD now ' + DB.Dice.formatPD(player.pitchDie);
          } else {
            player.bt = Math.max(1, player.bt - 3);
            player.obt = Math.max(player.bt + 1, player.obt - 3);
            desc += 'Decline. BT/OBT now ' + player.bt + '/' + player.obt;
          }
          for (var i = player.traits.length - 1; i >= 0; i--) {
            if (player.traits[i].indexOf('-') === -1) { player.traits.splice(i, 1); break; }
          }
          break;
        case 'slight_decline':
          player.bt = Math.max(1, player.bt - 1);
          player.obt = Math.max(player.bt + 1, player.obt - 1);
          desc += 'Slight decline. BT/OBT now ' + player.bt + '/' + player.obt;
          break;
        case 'no_change':
          desc += 'No change.';
          break;
        case 'slight_improve':
          player.bt++; player.obt++;
          desc += 'Slight improvement! BT/OBT now ' + player.bt + '/' + player.obt;
          break;
        case 'improve':
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdUp(player.pitchDie, 1);
            desc += 'Improvement! PD now ' + DB.Dice.formatPD(player.pitchDie);
          } else {
            player.bt += 3; player.obt += 3;
            desc += 'Improvement! BT/OBT now ' + player.bt + '/' + player.obt;
          }
          break;
        case 'breakout':
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdUp(player.pitchDie, 2);
            desc += 'BREAKOUT! PD now ' + DB.Dice.formatPD(player.pitchDie);
          } else {
            player.bt += 5; player.obt += 5;
            desc += 'BREAKOUT! BT/OBT now ' + player.bt + '/' + player.obt;
          }
          var traitRoll = DB.Dice.d6() + 14;
          var traitTable = player.isPitcher ? DB.Tables.traitsTable.pitcher : DB.Tables.traitsTable.batter;
          var newTrait = traitTable[traitRoll];
          if (newTrait && player.traits.indexOf(newTrait) === -1) {
            player.traits.push(newTrait);
            desc += '. Gained ' + newTrait + '!';
          }
          break;
      }
      results.push(desc);
    });
    DB.Team.calculateTeamScore(team);
    return results;
  }
};

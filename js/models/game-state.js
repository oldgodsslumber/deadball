// Deadball Digital - Game State Model
var DB = DB || {};

DB.GameState = {
  create(homeTeam, awayTeam, options) {
    options = options || {};
    var era = options.era || homeTeam.era || 'modern';

    // Reset all player game stats
    DB.Team.getAllPlayers(homeTeam).forEach(DB.Player.resetGameStats);
    DB.Team.getAllPlayers(awayTeam).forEach(DB.Player.resetGameStats);

    return {
      id: 'g' + Date.now(),
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      era: era,
      inning: 1,
      halfInning: 'top', // 'top' or 'bottom'
      outs: 0,
      bases: DB.Baserunning.createBases(),
      score: { home: 0, away: 0 },
      currentBatterIndex: { home: 0, away: 0 },
      currentPitcher: {
        home: homeTeam.rotation[0],
        away: awayTeam.rotation[0]
      },
      log: [],
      lineScore: {
        away: [],
        home: []
      },
      halfInningRuns: 0,
      mode: options.mode || 'pass-and-play', // 'pass-and-play', 'solo', 'sim'
      aiSide: options.aiSide || null,
      isComplete: false,
      winner: null,

      // Pitcher tracking per half-inning
      pitcherRunsThisInning: { home: 0, away: 0 },
      pitcherRunsLastInning: { home: 0, away: 0 },
      strikeoutsThisInning: 0,
      battersThisInning: 0
    };
  },

  // Process the result of an at-bat
  processAtBat(gs, event) {
    // Update bases
    if (event.newBases) {
      gs.bases = event.newBases;
    }

    // Update outs
    gs.outs += event.outsAdded || 0;

    // Update score
    var runsScored = event.scored ? event.scored.length : 0;
    if (runsScored > 0) {
      if (gs.halfInning === 'top') {
        gs.score.away += runsScored;
      } else {
        gs.score.home += runsScored;
      }
      gs.halfInningRuns += runsScored;

      // Track pitcher runs
      var pitcherKey = gs.halfInning === 'top' ? 'home' : 'away';
      gs.pitcherRunsThisInning[pitcherKey] += runsScored;

      // Update pitcher stats
      var pitcher = DB.AtBat.getCurrentPitcher(gs);
      pitcher.runsAllowedTotal += runsScored;
      pitcher.runsAllowedThisInning += runsScored;
      pitcher.pitchingStats.r += runsScored;
      pitcher.pitchingStats.er += runsScored;

      // Reliever fatigue: lose PD per run
      if (!pitcher.isStarter) {
        for (var i = 0; i < runsScored; i++) {
          DB.Pitching.relieverRunAllowed(pitcher);
        }
      }

      // Starter fatigue checks
      if (pitcher.isStarter) {
        var changes = DB.Pitching.checkRunFatigue(
          pitcher,
          pitcher.runsAllowedThisInning,
          gs.pitcherRunsLastInning[pitcherKey] + pitcher.runsAllowedThisInning,
          pitcher.runsAllowedTotal,
          gs.inning
        );
        event.fatigueChanges = (event.fatigueChanges || []).concat(changes);
      }
    }

    // Track pitcher outs
    if (event.outsAdded > 0) {
      var pitcher2 = DB.AtBat.getCurrentPitcher(gs);
      pitcher2.outsRecorded += event.outsAdded;
      if (event.outType && event.outType.type === 'strikeout') {
        gs.strikeoutsThisInning++;
        pitcher2.pitchingStats.k++;
      }
      // Reliever fatigue: check per 3 outs
      if (!pitcher2.isStarter) {
        DB.Pitching.checkRelieverFatigue(pitcher2);
      }
    }

    // Track hits against pitcher
    if (event.result === 'hit') {
      var pitcher3 = DB.AtBat.getCurrentPitcher(gs);
      pitcher3.pitchingStats.h++;
    }
    if (event.result === 'walk' || event.result === 'hbp') {
      var pitcher4 = DB.AtBat.getCurrentPitcher(gs);
      pitcher4.pitchingStats.bb++;
    }

    gs.battersThisInning++;

    // Add to game log
    if (event.log) {
      event.log.forEach(function(msg) { gs.log.push(msg); });
    }
    if (event.fatigueChanges) {
      event.fatigueChanges.forEach(function(msg) { gs.log.push(msg); });
    }

    // Advance batter
    DB.AtBat.advanceBatterIndex(gs);

    // Check for half-inning end
    if (gs.outs >= 3) {
      DB.GameState.endHalfInning(gs);
    }

    // Check walk-off
    if (gs.halfInning === 'bottom' && gs.inning >= 9 && gs.score.home > gs.score.away) {
      gs.isComplete = true;
      gs.winner = 'home';
      gs.log.push('WALK-OFF! ' + gs.homeTeam.name + ' wins!');
    }

    return event;
  },

  // End a half-inning
  endHalfInning(gs) {
    var pitcherKey = gs.halfInning === 'top' ? 'home' : 'away';
    var pitcher = gs.currentPitcher[pitcherKey];

    // Record line score
    if (gs.halfInning === 'top') {
      gs.lineScore.away.push(gs.halfInningRuns);
    } else {
      gs.lineScore.home.push(gs.halfInningRuns);
    }

    // Update pitcher consecutive scoreless innings
    if (gs.halfInningRuns === 0) {
      pitcher.consecutiveScorelessInnings++;
      var bonuses = DB.Pitching.checkStarterBonuses(pitcher);
      bonuses.forEach(function(msg) { gs.log.push(msg); });
    } else {
      pitcher.consecutiveScorelessInnings = 0;
    }

    // Pitcher inning tracking
    pitcher.inningsPitched++;
    pitcher.runsAllowedThisInning = 0;

    // Check starter fatigue for innings pitched
    if (pitcher.isStarter) {
      var eraConfig = DB.Eras[gs.era];
      var fatigueChanges = DB.Pitching.checkStarterFatigue(pitcher, pitcher.inningsPitched, eraConfig);
      fatigueChanges.forEach(function(msg) { gs.log.push(msg); });
    }

    // Strikeout-the-side bonus
    if (gs.strikeoutsThisInning >= 3 && gs.battersThisInning === 3 && pitcher.isStarter) {
      pitcher.currentPitchDie = DB.Dice.pdUp(pitcher.currentPitchDie, 1);
      gs.log.push(pitcher.name + ' strikes out the side! PD improves to ' + DB.Dice.formatPD(pitcher.currentPitchDie));
    }

    // Save runs for two-inning tracking
    gs.pitcherRunsLastInning[pitcherKey] = gs.pitcherRunsThisInning[pitcherKey];
    gs.pitcherRunsThisInning[pitcherKey] = 0;

    // Transition
    if (gs.halfInning === 'top') {
      // Check if bottom of 9th+ needed
      if (gs.inning >= 9 && gs.score.home > gs.score.away) {
        // Home team already winning, game over
        gs.isComplete = true;
        gs.winner = 'home';
        gs.log.push(gs.homeTeam.name + ' wins!');
        return;
      }
      gs.halfInning = 'bottom';
      gs.log.push('--- Bottom of inning ' + gs.inning + ' ---');
    } else {
      // End of full inning
      if (gs.inning >= 9 && gs.score.home !== gs.score.away) {
        gs.isComplete = true;
        gs.winner = gs.score.home > gs.score.away ? 'home' : 'away';
        var winTeam = gs.winner === 'home' ? gs.homeTeam : gs.awayTeam;
        gs.log.push('FINAL: ' + gs.awayTeam.name + ' ' + gs.score.away + ', ' + gs.homeTeam.name + ' ' + gs.score.home);
        gs.log.push(winTeam.name + ' wins!');
        return;
      }

      // Check darkness rule (Ancient era)
      if (gs.era === 'ancient' && gs.inning >= 11) {
        var darknessRoll = DB.Dice.d6() + (gs.inning - 11);
        if (darknessRoll >= 6) {
          gs.isComplete = true;
          gs.winner = 'tie';
          gs.log.push('Darkness falls! The game ends in a tie.');
          return;
        }
        gs.log.push('Darkness check: d6+' + (gs.inning - 11) + ' = ' + darknessRoll + '. Game continues.');
      }

      gs.inning++;
      gs.halfInning = 'top';
      gs.log.push('=== Top of inning ' + gs.inning + ' ===');
    }

    // Reset half-inning state
    gs.outs = 0;
    gs.bases = DB.Baserunning.createBases();
    gs.halfInningRuns = 0;
    gs.strikeoutsThisInning = 0;
    gs.battersThisInning = 0;
  },

  // Get inning display text
  getInningDisplay(gs) {
    var half = gs.halfInning === 'top' ? 'Top' : 'Bot';
    var ordinal = DB.GameState.ordinal(gs.inning);
    return half + ' ' + ordinal;
  },

  ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },

  // Substitute pitcher
  substitutePitcher(gs, newPitcher, side) {
    var key = side || (gs.halfInning === 'top' ? 'home' : 'away');
    var oldPitcher = gs.currentPitcher[key];

    // Calculate rest for old pitcher
    oldPitcher.restDaysNeeded = DB.Pitching.calculateRestDays(oldPitcher);
    oldPitcher.restDaysRemaining = oldPitcher.restDaysNeeded;

    // Set new pitcher
    DB.Player.resetGameStats(newPitcher);
    newPitcher.currentPitchDie = newPitcher.pitchDie;
    gs.currentPitcher[key] = newPitcher;

    gs.log.push('Pitching change: ' + newPitcher.name + ' replaces ' + oldPitcher.name +
      ' (' + DB.Dice.formatPD(newPitcher.pitchDie) + ')');
  },

  // Pinch hit
  pinchHit(gs, newBatter, side) {
    var isHome = side === 'home' || gs.halfInning === 'bottom';
    var team = isHome ? gs.homeTeam : gs.awayTeam;
    var idx = isHome ? gs.currentBatterIndex.home : gs.currentBatterIndex.away;
    var oldBatter = team.lineup[idx % team.lineup.length];

    team.lineup[idx % team.lineup.length] = newBatter;
    gs.log.push('Pinch hitter: ' + newBatter.name + ' bats for ' + oldBatter.name);
  },

  // Serialize for save
  serialize(gs) {
    return {
      id: gs.id, era: gs.era, inning: gs.inning, halfInning: gs.halfInning,
      outs: gs.outs, bases: {
        first: gs.bases.first ? gs.bases.first.id : null,
        second: gs.bases.second ? gs.bases.second.id : null,
        third: gs.bases.third ? gs.bases.third.id : null
      },
      score: gs.score,
      currentBatterIndex: gs.currentBatterIndex,
      currentPitcher: { home: gs.currentPitcher.home.id, away: gs.currentPitcher.away.id },
      lineScore: gs.lineScore,
      halfInningRuns: gs.halfInningRuns,
      mode: gs.mode, aiSide: gs.aiSide, isComplete: gs.isComplete, winner: gs.winner,
      homeTeam: DB.Team.serialize(gs.homeTeam),
      awayTeam: DB.Team.serialize(gs.awayTeam),
      log: gs.log.slice(-100) // Keep last 100 log entries
    };
  },

  deserialize(data) {
    var home = DB.Team.deserialize(data.homeTeam);
    var away = DB.Team.deserialize(data.awayTeam);
    var gs = DB.GameState.create(home, away, { era: data.era, mode: data.mode, aiSide: data.aiSide });
    gs.id = data.id;
    gs.inning = data.inning;
    gs.halfInning = data.halfInning;
    gs.outs = data.outs;
    gs.score = data.score;
    gs.currentBatterIndex = data.currentBatterIndex;
    gs.lineScore = data.lineScore;
    gs.halfInningRuns = data.halfInningRuns;
    gs.isComplete = data.isComplete;
    gs.winner = data.winner;
    gs.log = data.log || [];

    // Restore base runners and pitchers by ID
    var allPlayers = DB.Team.getAllPlayers(home).concat(DB.Team.getAllPlayers(away));
    var playerMap = {};
    allPlayers.forEach(function(p) { playerMap[p.id] = p; });

    gs.bases.first = data.bases.first ? playerMap[data.bases.first] || null : null;
    gs.bases.second = data.bases.second ? playerMap[data.bases.second] || null : null;
    gs.bases.third = data.bases.third ? playerMap[data.bases.third] || null : null;
    gs.currentPitcher.home = playerMap[data.currentPitcher.home] || home.rotation[0];
    gs.currentPitcher.away = playerMap[data.currentPitcher.away] || away.rotation[0];

    return gs;
  }
};

// Deadball Digital - AI Manager (Solo Mode)
var DB = DB || {};

DB.AIManager = {
  // Make a decision for the AI-controlled team
  // Returns: { action, desc }
  // action: 'swing', 'steal', 'bunt', 'hitandrun', 'pitching_change', 'pinch_hit'
  decide(gameState) {
    var isAIBatting = DB.AIManager.isAIBatting(gameState);

    if (isAIBatting) {
      return DB.AIManager.decideBatting(gameState);
    } else {
      return DB.AIManager.decideFielding(gameState);
    }
  },

  isAIBatting(gs) {
    if (!gs.aiSide) return false;
    if (gs.aiSide === 'home' && gs.halfInning === 'bottom') return true;
    if (gs.aiSide === 'away' && gs.halfInning === 'top') return true;
    return false;
  },

  isAIFielding(gs) {
    if (!gs.aiSide) return false;
    return !DB.AIManager.isAIBatting(gs);
  },

  // Get the AI team's manager
  getAIManager(gs) {
    if (!gs.aiSide) return { daring: 10 };
    return gs.aiSide === 'home' ? gs.homeTeam.manager : gs.awayTeam.manager;
  },

  // Roll against daring: true = aggressive, false = conservative
  rollDaring(gs) {
    var mgr = DB.AIManager.getAIManager(gs);
    var roll = DB.Dice.d20();
    return roll <= mgr.daring;
  },

  decideBatting(gs) {
    var batter = DB.AtBat.getCurrentBatter(gs);
    var bases = gs.bases;
    var outs = gs.outs;
    var scoreDiff = DB.AIManager.getScoreDiff(gs);

    // Hard overrides (never do these regardless of daring)
    // Never steal when up or down by 5+
    if (Math.abs(scoreDiff) >= 5) {
      return { action: 'swing', desc: 'AI swings (blowout, no tricks)' };
    }

    // Never bunt with P+ or P++ hitter
    if (DB.Player.hasTrait(batter, 'P+') || DB.Player.hasTrait(batter, 'P++')) {
      // Still might steal if runner on base
      if (bases.first && outs < 2 && DB.Player.hasTrait(bases.first, 'S+')) {
        if (DB.AIManager.rollDaring(gs)) {
          return { action: 'steal', desc: 'AI attempts steal (S+ runner, power hitter at plate)' };
        }
      }
      return { action: 'swing', desc: 'AI swings (power hitter)' };
    }

    // Steal decision: runner on 1st, < 2 outs
    if (bases.first && !bases.second && outs < 2) {
      if (DB.AIManager.rollDaring(gs)) {
        if (DB.Player.hasTrait(bases.first, 'S+')) {
          return { action: 'steal', desc: 'AI attempts steal (daring + S+ runner)' };
        }
        // Even without S+, if daring enough
        if (DB.AIManager.rollDaring(gs)) {
          return { action: 'steal', desc: 'AI attempts steal (very daring)' };
        }
      }
    }

    // Bunt decision: runner on base, pitcher batting or weak hitter, < 2 outs
    if (bases.first && outs < 2) {
      if (batter.isPitcher || batter.bt < 20) {
        if (DB.AIManager.rollDaring(gs)) {
          return { action: 'bunt', desc: 'AI bunts (weak hitter, runner on)' };
        }
      }
    }

    // Squeeze bunt: runner on 3rd, < 2 outs, pitcher up
    if (bases.third && outs < 2 && batter.isPitcher) {
      if (DB.AIManager.rollDaring(gs)) {
        return { action: 'bunt', desc: 'AI squeeze bunt!' };
      }
    }

    // Hit and run: runner on 1st, < 2 outs
    if (bases.first && !bases.second && outs < 2 && batter.bt >= 25) {
      if (DB.AIManager.rollDaring(gs)) {
        return { action: 'hitandrun', desc: 'AI calls hit and run' };
      }
    }

    return { action: 'swing', desc: 'AI swings away' };
  },

  decideFielding(gs) {
    var pitcherKey = gs.halfInning === 'top' ? 'home' : 'away';
    var pitcher = gs.currentPitcher[pitcherKey];
    var team = gs.aiSide === 'home' ? gs.homeTeam : gs.awayTeam;
    var scoreDiff = DB.AIManager.getScoreDiff(gs);

    // Always pull a pitcher at -d8 or worse
    if (pitcher.currentPitchDie <= -8) {
      var replacement = DB.AIManager.findReliever(team, pitcher);
      if (replacement) {
        return { action: 'pitching_change', pitcher: replacement, desc: 'AI pulls struggling pitcher' };
      }
    }

    // Starter tiring in late innings
    if (pitcher.isStarter && gs.inning >= 7 && pitcher.currentPitchDie <= 4) {
      if (DB.AIManager.rollDaring(gs)) {
        // Daring: leave him in
        return { action: 'none', desc: 'AI leaves tiring starter in (daring)' };
      } else {
        var replacement2 = DB.AIManager.findReliever(team, pitcher);
        if (replacement2) {
          return { action: 'pitching_change', pitcher: replacement2, desc: 'AI pulls tired starter' };
        }
      }
    }

    // Save situation: lead of 1-3 in 9th, bring in closer
    if (gs.inning >= 9 && scoreDiff > 0 && scoreDiff <= 3) {
      if (!pitcher.isStarter || pitcher.currentPitchDie <= 4) {
        var closer = DB.AIManager.findCloser(team);
        if (closer && closer !== pitcher) {
          return { action: 'pitching_change', pitcher: closer, desc: 'AI brings in closer' };
        }
      }
    }

    // Pinch hit for pitcher in late innings when losing
    if (gs.inning >= 8 && scoreDiff < -1) {
      // This is fielding decision, pinch hitting handled separately
    }

    return { action: 'none', desc: 'AI makes no changes' };
  },

  findReliever(team, exclude) {
    for (var i = 0; i < team.bullpen.length; i++) {
      var p = team.bullpen[i];
      if (p !== exclude && p.restDaysRemaining === 0 && p.injuryGamesRemaining === 0) {
        return p;
      }
    }
    return null;
  },

  findCloser(team) {
    // Best reliever (highest pitch die) who is available
    var best = null;
    var bestPD = -100;
    for (var i = 0; i < team.bullpen.length; i++) {
      var p = team.bullpen[i];
      if (p.restDaysRemaining === 0 && p.injuryGamesRemaining === 0 && p.pitchDie > bestPD) {
        best = p;
        bestPD = p.pitchDie;
      }
    }
    return best;
  },

  getScoreDiff(gs) {
    // Positive = AI is winning
    if (gs.aiSide === 'home') return gs.score.home - gs.score.away;
    return gs.score.away - gs.score.home;
  }
};

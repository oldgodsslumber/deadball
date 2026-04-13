// Deadball Digital - Pitching & Fatigue Engine
var DB = DB || {};

DB.Pitching = {
  // Roll the pitch die for a pitcher, accounting for handedness advantage
  rollPitchDie(pitcher, batter) {
    var pd = pitcher.currentPitchDie;
    if (pd == null) pd = pitcher.pitchDie;

    // Handedness advantage: same-hand matchup bumps PD up one level
    if (pitcher.handedness === batter.handedness && batter.handedness !== 'S') {
      pd = DB.Dice.pdUp(pd, 1);
      // Starters can't exceed d12 from advantage, relievers can go to d20
      if (pitcher.isStarter && pd > 12) pd = 12;
    }

    return DB.Dice.rollPitchDie(pd);
  },

  // Get effective pitch die (accounting for handedness, for display)
  getEffectivePD(pitcher, batter) {
    var pd = pitcher.currentPitchDie;
    if (pd == null) pd = pitcher.pitchDie;
    if (pitcher.handedness === batter.handedness && batter.handedness !== 'S') {
      pd = DB.Dice.pdUp(pd, 1);
      if (pitcher.isStarter && pd > 12) pd = 12;
    }
    return pd;
  },

  // Check and apply fatigue after each half-inning for starters
  checkStarterFatigue(pitcher, inning, eraConfig) {
    var changes = [];
    var threshold = eraConfig.fatigueInningThreshold;

    // Every inning past threshold: lose 1 PD level
    if (inning > threshold) {
      pitcher.currentPitchDie = DB.Dice.pdDown(pitcher.currentPitchDie, 1);
      changes.push(pitcher.name + ' is tiring (inning ' + inning + '). PD drops to ' + DB.Dice.formatPD(pitcher.currentPitchDie));
    }

    return changes;
  },

  // Check fatigue triggers after runs are scored
  checkRunFatigue(pitcher, runsThisInning, runsLastTwoInnings, totalRuns, inning) {
    var changes = [];

    // 3+ runs in one inning
    if (runsThisInning >= 3) {
      pitcher.currentPitchDie = DB.Dice.pdDown(pitcher.currentPitchDie, 1);
      changes.push(pitcher.name + ' gives up 3+ runs this inning! PD drops to ' + DB.Dice.formatPD(pitcher.currentPitchDie));
    }

    // 4+ runs over two innings
    if (runsLastTwoInnings >= 4 && runsThisInning > 0) {
      pitcher.currentPitchDie = DB.Dice.pdDown(pitcher.currentPitchDie, 1);
      changes.push(pitcher.name + ' gives up 4+ runs over two innings! PD drops to ' + DB.Dice.formatPD(pitcher.currentPitchDie));
    }

    // Every run over 4 total
    if (totalRuns > 4) {
      var extraRuns = totalRuns - 4;
      // Only apply for the new run(s)
      if (totalRuns - runsThisInning < 4) {
        // Just crossed the threshold
      }
      // This is applied per run, handled by caller
    }

    // Modern: any run in 7th+ drops to d4
    if (inning >= 7 && runsThisInning > 0 && pitcher.isStarter) {
      if (pitcher.currentPitchDie > 4) {
        pitcher.currentPitchDie = 4;
        changes.push(pitcher.name + ' allows a run in the ' + inning + 'th! PD drops to d4.');
      }
    }

    return changes;
  },

  // Check positive fatigue bonuses
  checkStarterBonuses(pitcher) {
    var changes = [];

    // 3 consecutive scoreless innings
    if (pitcher.consecutiveScorelessInnings >= 3 && pitcher.consecutiveScorelessInnings % 3 === 0) {
      pitcher.currentPitchDie = DB.Dice.pdUp(pitcher.currentPitchDie, 1);
      changes.push(pitcher.name + ' is dealing! 3 scoreless innings. PD improves to ' + DB.Dice.formatPD(pitcher.currentPitchDie));
    }

    return changes;
  },

  // Check reliever fatigue (different rules)
  checkRelieverFatigue(pitcher) {
    var changes = [];

    // Every run allowed: -1 PD
    // (called per run by the game engine)

    // Every 3 outs recorded: -1 PD
    if (pitcher.outsRecorded > 0 && pitcher.outsRecorded % 3 === 0) {
      pitcher.currentPitchDie = DB.Dice.pdDown(pitcher.currentPitchDie, 1);
      changes.push(pitcher.name + ' (reliever) fatiguing after ' + pitcher.outsRecorded + ' outs. PD: ' + DB.Dice.formatPD(pitcher.currentPitchDie));
    }

    return changes;
  },

  // Apply run allowed to reliever
  relieverRunAllowed(pitcher) {
    pitcher.currentPitchDie = DB.Dice.pdDown(pitcher.currentPitchDie, 1);
    return pitcher.name + ' allows a run. PD drops to ' + DB.Dice.formatPD(pitcher.currentPitchDie);
  },

  // Calculate rest days needed after a game
  calculateRestDays(pitcher) {
    var innings = Math.floor(pitcher.outsRecorded / 3);
    var days = Math.floor(innings / 2);
    return Math.min(4, days);
  },

  // Check if pitcher should be pulled (utility for AI and suggestions)
  shouldPullPitcher(pitcher, inning, score) {
    // Extreme fatigue
    if (pitcher.currentPitchDie <= -8) return true;

    // Starter after many innings
    if (pitcher.isStarter && inning > 8 && pitcher.currentPitchDie <= 4) return true;

    // Reliever after 3+ innings
    if (!pitcher.isStarter && pitcher.outsRecorded >= 9) return true;

    return false;
  },

  // Power reliever rule: d12 reliever gets d20 vs same-handed batters
  isPowerReliever(pitcher) {
    return !pitcher.isStarter && pitcher.pitchDie === 12;
  },

  // GB+ trait: increases PD one level with bases loaded (max d20)
  applyBasesLoadedBonus(pitcher, basesLoaded) {
    if (basesLoaded && DB.Player.hasTrait(pitcher, 'GB+')) {
      return DB.Dice.pdUp(pitcher.currentPitchDie, 1);
    }
    return pitcher.currentPitchDie;
  }
};

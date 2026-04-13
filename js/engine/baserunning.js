// Deadball Digital - Baserunning Engine
var DB = DB || {};

DB.Baserunning = {
  // Create a fresh bases state
  createBases() {
    return { first: null, second: null, third: null };
  },

  // Count runners on base
  runnersOn(bases) {
    var count = 0;
    if (bases.first) count++;
    if (bases.second) count++;
    if (bases.third) count++;
    return count;
  },

  // Check if bases are loaded
  basesLoaded(bases) {
    return bases.first && bases.second && bases.third;
  },

  // Advance all runners by N bases, return array of players who scored
  advanceRunners(bases, numBases, batter) {
    var scored = [];
    var newBases = { first: null, second: null, third: null };

    // Process runners from 3rd to 1st
    if (bases.third) {
      if (numBases >= 1) scored.push(bases.third);
      else newBases.third = bases.third;
    }

    if (bases.second) {
      var dest = 2 + numBases; // base number (2=second, 3=third, 4+=home)
      if (dest >= 4) scored.push(bases.second);
      else if (dest === 3) newBases.third = bases.second;
      else newBases.second = bases.second;
    }

    if (bases.first) {
      var dest2 = 1 + numBases;
      if (dest2 >= 4) scored.push(bases.first);
      else if (dest2 === 3) newBases.third = bases.first;
      else if (dest2 === 2) newBases.second = bases.first;
      else newBases.first = bases.first;
    }

    // Place batter
    if (batter) {
      if (numBases >= 4) {
        scored.push(batter); // home run
      } else if (numBases === 3) {
        newBases.third = batter;
      } else if (numBases === 2) {
        newBases.second = batter;
      } else if (numBases === 1) {
        newBases.first = batter;
      }
    }

    return { bases: newBases, scored: scored };
  },

  // Walk: batter to first, force runners forward only if needed
  applyWalk(bases, batter) {
    var scored = [];
    var newBases = { first: batter, second: bases.second, third: bases.third };

    if (bases.first) {
      if (bases.second) {
        if (bases.third) {
          scored.push(bases.third); // bases loaded walk scores runner from 3rd
        }
        newBases.third = bases.second;
      }
      newBases.second = bases.first;
    }

    return { bases: newBases, scored: scored };
  },

  // Resolve a hit and advance runners appropriately
  resolveHit(bases, batter, hitResult, runnersAdv, isCritical) {
    // runnersAdv: 1=normal single, 2=runners advance 2, 3=runners advance 3, 4=HR
    var scored = [];
    var newBases = { first: null, second: null, third: null };

    if (hitResult === 'homerun') {
      // Everyone scores
      if (bases.third) scored.push(bases.third);
      if (bases.second) scored.push(bases.second);
      if (bases.first) scored.push(bases.first);
      scored.push(batter);
      return { bases: newBases, scored: scored };
    }

    // Critical hits: runners take an extra base
    var extraBase = isCritical ? 1 : 0;

    if (hitResult === 'triple') {
      if (bases.third) scored.push(bases.third);
      if (bases.second) scored.push(bases.second);
      if (bases.first) scored.push(bases.first);
      newBases.third = batter;
      return { bases: newBases, scored: scored };
    }

    if (hitResult === 'double') {
      if (bases.third) scored.push(bases.third);
      if (bases.second) scored.push(bases.second);
      if (bases.first) {
        if (runnersAdv >= 3 || extraBase) {
          scored.push(bases.first);
        } else {
          newBases.third = bases.first;
        }
      }
      newBases.second = batter;
      return { bases: newBases, scored: scored };
    }

    // Single
    if (bases.third) scored.push(bases.third);

    if (bases.second) {
      if (runnersAdv >= 2 || extraBase) {
        scored.push(bases.second);
      } else {
        newBases.third = bases.second;
      }
    }

    if (bases.first) {
      if (runnersAdv >= 2) {
        if (bases.second && runnersAdv >= 2) {
          newBases.third = bases.first;
        } else {
          newBases.third = bases.first;
        }
      } else {
        newBases.second = bases.first;
      }
    }

    newBases.first = batter;
    return { bases: newBases, scored: scored };
  },

  // Steal attempt
  // Returns: { success, roll, modifier, desc }
  attemptSteal(runner, stealingBase, catcher, pitcher) {
    var roll = DB.Dice.d8();
    var modifier = 0;

    // Stealing third: -1 to roll
    if (stealingBase === 'third') modifier -= 1;

    // Runner traits
    if (DB.Player.hasTrait(runner, 'S+')) modifier += 1;
    if (DB.Player.hasTrait(runner, 'S-')) modifier -= 2;

    // Catcher traits
    if (catcher && DB.Player.hasTrait(catcher, 'D+')) modifier -= 1;
    if (catcher && DB.Player.hasTrait(catcher, 'D-')) modifier += 1;

    var adjusted = roll + modifier;
    var success = adjusted >= DB.Tables.stealThreshold;

    return {
      success: success,
      roll: roll,
      modifier: modifier,
      adjusted: adjusted,
      runner: runner,
      base: stealingBase,
      desc: runner.name + ' attempts to steal ' + stealingBase + '... ' +
            '(d8: ' + roll + (modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : '') + ' = ' + adjusted + ') ' +
            (success ? 'SAFE!' : 'OUT!')
    };
  },

  // Double steal
  attemptDoubleSteal(leadRunner, trailRunner, catcher) {
    var roll = DB.Dice.d8();
    var modifier = 0;

    if (DB.Player.hasTrait(leadRunner, 'S+')) modifier += 1;
    if (DB.Player.hasTrait(leadRunner, 'S-')) modifier -= 1;
    if (catcher && DB.Player.hasTrait(catcher, 'D+')) modifier -= 1;
    if (catcher && DB.Player.hasTrait(catcher, 'D-')) modifier += 1;

    var adjusted = roll + modifier;
    var result = DB.Tables.resolveDoubleSteal(adjusted);

    return {
      result: result,
      roll: roll,
      modifier: modifier,
      adjusted: adjusted,
      desc: 'Double steal attempt! (d8: ' + roll + ' = ' + adjusted + ') ' +
            (result === 'both_safe' ? 'Both safe!' :
             result === 'lead_out' ? leadRunner.name + ' out at the lead base!' :
             trailRunner.name + ' out at the trailing base!')
    };
  },

  // Bunt resolution
  resolveBunt(bases, batter, era) {
    var roll = DB.Dice.d6();
    var table = era === 'ancient' ? DB.Tables.buntTable.ancient : DB.Tables.buntTable.modern;
    var entry = table[roll];

    if (!entry) return { desc: 'Bunt attempt failed.', outs: 0, scored: [] };

    var result = { roll: roll, outs: 0, scored: [], desc: '', bases: null };
    var hasSpeed = DB.Player.hasTrait(batter, 'S+');
    var hasContact = DB.Player.hasTrait(batter, 'C+');

    // Apply C+ modifier
    if (hasContact && era !== 'ancient') roll = Math.min(6, roll + 1);

    // Handle special entries
    if (entry.special === 'conditional_3') {
      if (bases.third) {
        // Runner at 3rd: lead runner out, batter safe
        result.desc = batter.name + ' bunts. Runner at third thrown out!';
        result.outs = 1;
        result.bases = { first: batter, second: bases.second, third: null };
      } else {
        // Runner at 1st/2nd: lead runner advances, batter out
        result.desc = batter.name + ' sacrifice bunt. Runners advance.';
        result.outs = 1;
        result.bases = DB.Baserunning.advanceSacrifice(bases).bases;
      }
    } else if (entry.special === 'speed_6') {
      if (hasSpeed) {
        result.desc = batter.name + ' bunts for a hit! Single!';
        // Treat as single with DEF(3B)
        result.isBuntHit = true;
      } else {
        result.desc = batter.name + ' sacrifice bunt. Runners advance.';
        result.outs = 1;
        result.bases = DB.Baserunning.advanceSacrifice(bases).bases;
      }
    } else if (entry.special === 'ancient_6') {
      if (!batter.isPitcher) {
        result.desc = batter.name + ' bunts for a hit! Single!';
        result.isBuntHit = true;
      } else {
        result.desc = batter.name + ' sacrifice bunt. Runners advance.';
        result.outs = 1;
        result.bases = DB.Baserunning.advanceSacrifice(bases).bases;
      }
    } else if (entry.leadRunnerOut) {
      result.desc = batter.name + ' bunts. Lead runner thrown out!';
      result.outs = 1;
      result.bases = DB.Baserunning.removeLeadRunner(bases, batter);
    } else if (entry.batterOut && entry.leadRunnerAdvances) {
      result.desc = batter.name + ' sacrifice bunt. Runners advance.';
      result.outs = 1;
      var advResult = DB.Baserunning.advanceSacrifice(bases);
      result.bases = advResult.bases;
      result.scored = advResult.scored;
    }

    return result;
  },

  // Advance runners for sacrifice (lead runner advances, batter is out)
  advanceSacrifice(bases) {
    var scored = [];
    var newBases = { first: null, second: null, third: null };

    if (bases.third) scored.push(bases.third);
    if (bases.second) newBases.third = bases.second;
    if (bases.first) newBases.second = bases.first;

    return { bases: newBases, scored: scored };
  },

  // Remove lead runner (out), batter takes first
  removeLeadRunner(bases, batter) {
    if (bases.third) {
      return { first: batter, second: bases.second, third: null };
    }
    if (bases.second) {
      return { first: batter, second: null, third: bases.third };
    }
    if (bases.first) {
      return { first: batter, second: null, third: bases.third };
    }
    return { first: batter, second: null, third: null };
  },

  // Productive out: advance runners based on MSS range and out type
  resolveProductiveOut(bases, mss, outInfo, batter) {
    var scored = [];
    var newBases = { first: bases.first, second: bases.second, third: bases.third };
    var outs = 1;
    var desc = '';

    var canAdvance = DB.Defense.canRunnersAdvance(outInfo);

    if (mss < 50) {
      // MSS OBT+6 to 49: Productive out
      if (canAdvance) {
        if (bases.third) { scored.push(bases.third); newBases.third = null; }
        if (bases.second) { newBases.third = bases.second; newBases.second = null; }
      }
      if (outInfo.isGroundball && bases.first) {
        // Runner at 1st advances to 2nd, batter out
        newBases.second = bases.first;
        newBases.first = null;
      }
      desc = outInfo.code + '. ';
      if (scored.length) desc += scored.map(function(p) { return p.name + ' scores!'; }).join(' ');
    } else if (mss < 70) {
      // MSS 50-69: Productive out with FC
      if (canAdvance) {
        if (bases.third) { scored.push(bases.third); newBases.third = null; }
        if (bases.second) { newBases.third = bases.second; newBases.second = null; }
      }
      if (outInfo.isGroundball && bases.first) {
        // Fielder's choice: runner at 1st is OUT, batter safe at 1st
        outs = 1; // runner out, not batter
        newBases.first = batter;
        newBases.second = null;
        desc = "Fielder's choice! " + bases.first.name + ' out at second. ';
      } else {
        desc = outInfo.code + '. ';
      }
      if (scored.length) desc += scored.map(function(p) { return p.name + ' scores!'; }).join(' ');
    } else if (mss < 100) {
      // MSS 70+: Out, runners can't advance on fly. DP possible.
      if (outInfo.isGroundball && bases.first) {
        // Double play
        outs = 2;
        newBases.first = null;
        desc = 'DOUBLE PLAY! ' + outInfo.code + '. ';
      } else {
        desc = outInfo.code + '. ';
        // Runners at 2nd/3rd cannot advance on fly
      }
    } else {
      // MSS 100+: Triple play possible
      if (outInfo.isGroundball && bases.first && bases.second) {
        outs = 3;
        newBases.first = null;
        newBases.second = null;
        desc = 'TRIPLE PLAY!!! ';
      } else if (outInfo.isGroundball && bases.first) {
        outs = 2;
        newBases.first = null;
        desc = 'DOUBLE PLAY! ';
      } else {
        desc = outInfo.code + '. ';
      }
    }

    return { bases: newBases, scored: scored, outs: outs, desc: desc };
  },

  // Hit and run resolution
  resolveHitAndRun(bases, batter, pitcher, era) {
    // Batter gets +5 BT/OBT (+10 if C+)
    var bonus = DB.Player.hasTrait(batter, 'C+') ? 10 : 5;

    // Steal attempt for runner
    var stealRoll = DB.Dice.d8();
    var stealSuccess = stealRoll >= DB.Tables.stealThreshold;

    return {
      btBonus: bonus,
      obtBonus: bonus,
      stealRoll: stealRoll,
      stealSuccess: stealSuccess
    };
  }
};

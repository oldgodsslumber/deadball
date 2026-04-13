// Deadball Digital - At-Bat Resolution Engine
var DB = DB || {};

DB.AtBat = {
  // Resolve a complete at-bat
  // Returns an event object describing everything that happened
  resolve(gameState, options) {
    options = options || {};
    var batter = options.batter || DB.AtBat.getCurrentBatter(gameState);
    var pitcher = options.pitcher || DB.AtBat.getCurrentPitcher(gameState);
    var era = gameState.era || 'modern';
    var eraConfig = DB.Eras[era];
    var hitTableKey = eraConfig.hitTable;
    var bases = gameState.bases;

    var event = {
      type: 'at-bat',
      batter: batter,
      pitcher: pitcher,
      swingScore: 0,
      pitchDieRoll: 0,
      mss: 0,
      bt: 0,
      obt: 0,
      result: null,    // 'hit', 'walk', 'out', 'error', 'oddity', 'hbp'
      hitType: null,    // 'single', 'double', 'triple', 'homerun'
      outType: null,    // out table info
      isCritical: false,
      defResult: null,
      scored: [],
      outsAdded: 0,
      newBases: null,
      log: [],
      fatigueChanges: []
    };

    // Calculate effective BT and OBT
    var bt = DB.Player.getEffectiveBT(batter, pitcher);
    var obt = DB.Player.getEffectiveOBT(batter, pitcher);

    // GB+ bases loaded bonus
    if (DB.Baserunning.basesLoaded(bases)) {
      var tempPD = DB.Pitching.applyBasesLoadedBonus(pitcher, true);
      if (tempPD !== pitcher.currentPitchDie) {
        event.log.push('Bases loaded! ' + pitcher.name + '\'s GB+ kicks in.');
      }
    }

    event.bt = bt;
    event.obt = obt;

    // Roll swing score (d100)
    event.swingScore = DB.Dice.d100();

    // Roll pitch die
    event.pitchDieRoll = DB.Pitching.rollPitchDie(pitcher, batter);

    // Calculate MSS
    event.mss = event.swingScore + event.pitchDieRoll;

    var mss = event.mss;
    event.log.push(batter.name + ' at bat vs ' + pitcher.name +
      ' (d100: ' + event.swingScore + ' + PD: ' + event.pitchDieRoll + ' = MSS ' + mss + ')');
    event.log.push('BT: ' + bt + ' | OBT: ' + obt);

    // ===== RESOLVE MSS =====

    // Oddity on 1 or 99
    if (mss === 1 || mss === 99) {
      var oddity = DB.Oddities.resolve(gameState);
      event.result = 'oddity';
      event.oddity = oddity;
      event.log.push('ODDITY! ' + oddity.name + ' (2d10: ' + oddity.roll + ')');
      // Oddity effects applied by game state handler
      return event;
    }

    // Critical Hit: MSS 2-5
    if (mss >= 2 && mss <= 5) {
      event.isCritical = true;
      var hitRoll = DB.Dice.d20();
      var traitMod = DB.AtBat.getHitTableModifier(batter);
      var adjustedHitRoll = Math.min(21, Math.max(1, hitRoll + traitMod));

      var hitTable = DB.Tables.hitTable[hitTableKey];
      var hitEntry = hitTable[Math.min(adjustedHitRoll, hitTable.length - 1)];

      // Bump up one level for critical
      var critResult = DB.AtBat.upgradeHit(hitEntry.result);

      event.result = 'hit';
      event.hitType = critResult;
      event.log.push('CRITICAL HIT! (Hit Table d20: ' + hitRoll +
        (traitMod ? ' +' + traitMod + ' trait' : '') + ' = ' + adjustedHitRoll +
        ' -> ' + hitEntry.result + ' upgraded to ' + critResult + ')');

      // Resolve baserunning (critical: runners take extra base)
      var rAdv = hitEntry.runnersAdv;
      if (critResult === 'homerun') rAdv = 4;
      var baseResult = DB.Baserunning.resolveHit(bases, batter, critResult, rAdv, true);
      event.scored = baseResult.scored;
      event.newBases = baseResult.bases;

      DB.AtBat.logScoring(event);
      batter.gameStats.ab++;
      batter.gameStats.h++;
      if (critResult === 'homerun') batter.gameStats.hr++;
      return event;
    }

    // Ordinary Hit: MSS 6 to BT
    if (mss >= 6 && mss <= bt) {
      var hitRoll2 = DB.Dice.d20();
      var traitMod2 = DB.AtBat.getHitTableModifier(batter);
      var adjustedHitRoll2 = Math.min(21, Math.max(1, hitRoll2 + traitMod2));

      var hitTable2 = DB.Tables.hitTable[hitTableKey];
      var hitEntry2 = hitTable2[Math.min(adjustedHitRoll2, hitTable2.length - 1)];

      var finalResult = hitEntry2.result;
      var rAdv2 = hitEntry2.runnersAdv;

      // S+ trait: roll of 2 = triple
      if (adjustedHitRoll2 === 2 && DB.Player.hasTrait(batter, 'S+')) {
        finalResult = 'triple';
        rAdv2 = 3;
        event.log.push(batter.name + '\'s speed turns a single into a triple!');
      }

      // C+ trait: rolls 1-2 = double, no DEF
      if (adjustedHitRoll2 <= 2 && DB.Player.hasTrait(batter, 'C+')) {
        finalResult = 'double';
        rAdv2 = 2;
        hitEntry2 = { result: 'double', def: null, runnersAdv: 2 };
        event.log.push(batter.name + '\'s contact turns a single into a double!');
      }

      // DEF roll if needed
      if (hitEntry2.def && !DB.Player.hasTrait(batter, 'C+')) {
        var fieldingTeam = DB.AtBat.getFieldingTeam(gameState);
        var defResult = DB.Defense.resolveHitDEF(hitEntry2, hitEntry2.def, fieldingTeam, era, false);
        event.defResult = defResult;

        if (defResult.result === 'out') {
          event.result = 'out';
          event.outsAdded = 1;
          event.outType = { type: 'defense', fielder: hitEntry2.def, code: 'DEF' };
          event.newBases = bases;
          event.log.push('Hit d20: ' + hitRoll2 + ' -> ' + hitEntry2.result +
            ', DEF by ' + hitEntry2.def + ': INCREDIBLE PLAY! Out!');
          batter.gameStats.ab++;
          return event;
        } else if (defResult.error) {
          // Error: extra base for runners
          rAdv2 = Math.min(4, rAdv2 + 1);
          event.log.push('Hit d20: ' + hitRoll2 + ' -> ' + finalResult +
            ', DEF by ' + hitEntry2.def + ': ERROR! Runners advance extra.');
        } else if (defResult.modified) {
          finalResult = defResult.result;
          event.log.push('Hit d20: ' + hitRoll2 + ' -> downgraded to ' + finalResult +
            ' by ' + hitEntry2.def + '\'s defense.');
        } else {
          event.log.push('Hit d20: ' + hitRoll2 + ' -> ' + finalResult);
        }
      } else {
        event.log.push('Hit d20: ' + hitRoll2 +
          (traitMod2 ? ' +' + traitMod2 : '') + ' -> ' + finalResult);
      }

      event.result = 'hit';
      event.hitType = finalResult;

      if (finalResult === 'homerun') rAdv2 = 4;
      else if (finalResult === 'triple') rAdv2 = 3;

      var baseResult2 = DB.Baserunning.resolveHit(bases, batter, finalResult, rAdv2, false);
      event.scored = baseResult2.scored;
      event.newBases = baseResult2.bases;

      DB.AtBat.logScoring(event);
      batter.gameStats.ab++;
      batter.gameStats.h++;
      if (finalResult === 'homerun') batter.gameStats.hr++;
      return event;
    }

    // Walk: MSS BT+1 to OBT
    if (mss >= bt + 1 && mss <= obt) {
      event.result = 'walk';
      event.log.push('Walk!');
      var walkResult = DB.Baserunning.applyWalk(bases, batter);
      event.scored = walkResult.scored;
      event.newBases = walkResult.bases;
      batter.gameStats.bb++;
      DB.AtBat.logScoring(event);
      return event;
    }

    // HBP: MSS equals OBT exactly (Year II rule)
    if (mss === obt) {
      event.result = 'hbp';
      event.log.push('Hit by pitch! Batter goes to first.');
      var hbpResult = DB.Baserunning.applyWalk(bases, batter);
      event.scored = hbpResult.scored;
      event.newBases = hbpResult.bases;
      return event;
    }

    // Possible Error: MSS OBT+1 to OBT+5
    if (mss >= obt + 1 && mss <= obt + 5) {
      var outInfo = DB.Defense.getOutInfo(mss, era);
      var fieldingTeam2 = DB.AtBat.getFieldingTeam(gameState);
      var errorCheck = DB.Defense.checkPossibleError(mss, era, fieldingTeam2);

      if (errorCheck.isError) {
        event.result = 'error';
        event.log.push('Possible error on ' + outInfo.code + '... ' + errorCheck.desc);
        // Batter to first, runners advance 1
        var errResult = DB.Baserunning.advanceRunners(bases, 1, batter);
        event.scored = errResult.scored;
        event.newBases = errResult.bases;
        DB.AtBat.logScoring(event);
      } else {
        event.result = 'out';
        event.outsAdded = 1;
        event.outType = outInfo;
        event.newBases = bases;
        event.log.push(errorCheck.desc);
        batter.gameStats.ab++;
        if (outInfo.type === 'strikeout') batter.gameStats.k++;
      }
      return event;
    }

    // Productive Out / Out: MSS > OBT+5
    if (mss > obt + 5) {
      var outInfo2 = DB.Defense.getOutInfo(mss, era);
      var prodResult = DB.Baserunning.resolveProductiveOut(bases, mss, outInfo2, batter);

      event.result = 'out';
      event.outType = outInfo2;
      event.outsAdded = prodResult.outs;
      event.scored = prodResult.scored;
      event.newBases = prodResult.bases;
      event.log.push(prodResult.desc || outInfo2.code);

      batter.gameStats.ab++;
      if (outInfo2.type === 'strikeout') batter.gameStats.k++;

      // K+ trait: strikeout on out table result 3 as well
      if (DB.Player.hasTrait(pitcher, 'K+') && (mss % 10) === 3) {
        event.log.push(pitcher.name + '\'s K+ turns groundball into strikeout!');
        event.outType = { type: 'strikeout', fielder: null, code: 'K', isGroundball: false, isPopup: false };
      }

      // GB+ trait: result 2 = groundball to SS, auto DP if runner on 1st
      if (DB.Player.hasTrait(pitcher, 'GB+') && (mss % 10) === 2) {
        event.log.push(pitcher.name + '\'s GB+ forces a grounder to SS!');
        if (bases.first) {
          event.outsAdded = 2;
          event.newBases.first = null;
          event.log.push('Double play!');
        }
      }

      DB.AtBat.logScoring(event);
      return event;
    }

    // Fallback (shouldn't reach here)
    event.result = 'out';
    event.outsAdded = 1;
    event.newBases = bases;
    event.log.push('Out.');
    batter.gameStats.ab++;
    return event;
  },

  // Get current batter from game state
  getCurrentBatter(gameState) {
    var isHome = gameState.halfInning === 'bottom';
    var team = isHome ? gameState.homeTeam : gameState.awayTeam;
    var idx = isHome ? gameState.currentBatterIndex.home : gameState.currentBatterIndex.away;
    return team.lineup[idx % team.lineup.length];
  },

  // Get current pitcher from game state
  getCurrentPitcher(gameState) {
    var isHome = gameState.halfInning === 'bottom';
    // Pitcher is from the OTHER team (fielding team pitches)
    var team = isHome ? gameState.awayTeam : gameState.homeTeam;
    var key = isHome ? 'away' : 'home';
    return gameState.currentPitcher[key];
  },

  // Get fielding team
  getFieldingTeam(gameState) {
    var isHome = gameState.halfInning === 'bottom';
    return isHome ? gameState.awayTeam : gameState.homeTeam;
  },

  // Get batting team
  getBattingTeam(gameState) {
    var isHome = gameState.halfInning === 'bottom';
    return isHome ? gameState.homeTeam : gameState.awayTeam;
  },

  // Get hit table modifier from traits
  getHitTableModifier(batter) {
    var mod = 0;
    if (DB.Player.hasTrait(batter, 'P++')) mod += 2;
    else if (DB.Player.hasTrait(batter, 'P+')) mod += 1;
    if (DB.Player.hasTrait(batter, 'P--')) mod -= 2;
    else if (DB.Player.hasTrait(batter, 'P-')) mod -= 1;
    return mod;
  },

  // Upgrade hit by one level (for critical hits)
  upgradeHit(hitType) {
    switch (hitType) {
      case 'single': return 'double';
      case 'double': return 'triple';
      case 'triple': return 'homerun';
      case 'homerun': return 'homerun';
      default: return hitType;
    }
  },

  // Log scoring events
  logScoring(event) {
    if (event.scored.length > 0) {
      event.scored.forEach(function(p) {
        event.log.push(p.name + ' SCORES!');
        p.gameStats.r++;
      });
      event.batter && (event.batter.gameStats.rbi += event.scored.length);
    }
  },

  // Advance batter index
  advanceBatterIndex(gameState) {
    var isHome = gameState.halfInning === 'bottom';
    if (isHome) {
      gameState.currentBatterIndex.home = (gameState.currentBatterIndex.home + 1) % gameState.homeTeam.lineup.length;
    } else {
      gameState.currentBatterIndex.away = (gameState.currentBatterIndex.away + 1) % gameState.awayTeam.lineup.length;
    }
  }
};

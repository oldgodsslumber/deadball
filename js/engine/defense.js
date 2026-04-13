// Deadball Digital - Defense & Out Resolution
var DB = DB || {};

DB.Defense = {
  // Get the out table entry for a given MSS
  getOutInfo(mss, era) {
    var lastDigit = Math.abs(mss) % 10;
    var tableKey = era === 'ancient' ? 'ancient' : 'modern';
    return DB.Tables.outTable[tableKey][lastDigit];
  },

  // Roll DEF for a fielder
  // Returns: { result, roll, modifier, fielder }
  // result: 'error', 'no_change', 'downgrade', 'out'
  rollDEF(fielderPos, fieldingTeam, era) {
    var roll = DB.Dice.d12();
    var modifier = 0;

    // Find fielder and check D+/D- traits
    var fielder = DB.Defense.findFielder(fielderPos, fieldingTeam);
    if (fielder) {
      if (DB.Player.hasTrait(fielder, 'D+')) modifier += 1;
      if (DB.Player.hasTrait(fielder, 'D-')) modifier -= 1;
    }

    var adjusted = roll + modifier;
    var result;
    if (era === 'ancient') {
      result = DB.Tables.resolveDefenseAncient(adjusted);
    } else {
      result = DB.Tables.resolveDefense(adjusted);
    }

    return { result: result, roll: roll, modifier: modifier, adjusted: adjusted, fielder: fielder };
  },

  // Find a fielder by position on a team's lineup
  findFielder(pos, team) {
    if (!team) return null;
    var allFielders = team.lineup.concat(team.bench);
    for (var i = 0; i < allFielders.length; i++) {
      if (allFielders[i].position === pos) return allFielders[i];
    }
    return null;
  },

  // Check for possible error (MSS in OBT+1 to OBT+5 range)
  checkPossibleError(mss, era, fieldingTeam) {
    var outInfo = DB.Defense.getOutInfo(mss, era);
    var defResult = DB.Defense.rollDEF(outInfo.fielder, fieldingTeam, era);

    if (defResult.result === 'error') {
      return {
        isError: true,
        fielder: outInfo.fielder,
        defResult: defResult,
        desc: 'Error by ' + (outInfo.fielder || 'fielder') + '! Batter reaches first, runners advance.'
      };
    }
    return {
      isError: false,
      fielder: outInfo.fielder,
      defResult: defResult,
      desc: outInfo.fielder + ' makes the play. Batter is out.'
    };
  },

  // Resolve a hit that requires a DEF roll
  // Returns modified hit result after DEF
  resolveHitDEF(hitEntry, fielderPos, fieldingTeam, era, isCritical) {
    // Critical hits cannot be taken away by defense
    if (isCritical) {
      return { result: hitEntry.result, defResult: null, modified: false };
    }

    // C+ hitters don't face DEF rolls
    // (caller should check this)

    var defResult = DB.Defense.rollDEF(fielderPos, fieldingTeam, era);

    switch (defResult.result) {
      case 'error':
        // Batter safe, runners advance extra base
        return {
          result: hitEntry.result,
          defResult: defResult,
          modified: false,
          error: true,
          desc: 'Error by ' + fielderPos + '! Runners advance an extra base.'
        };
      case 'no_change':
        return { result: hitEntry.result, defResult: defResult, modified: false };
      case 'downgrade':
        // Hit goes down one level
        var downgraded = DB.Defense.downgradeHit(hitEntry.result);
        return {
          result: downgraded,
          defResult: defResult,
          modified: true,
          desc: fielderPos + ' makes a great play! ' + hitEntry.result + ' becomes ' + downgraded + '.'
        };
      case 'out':
        return {
          result: 'out',
          defResult: defResult,
          modified: true,
          desc: fielderPos + ' makes an incredible play! Hit turned into an out!'
        };
    }

    return { result: hitEntry.result, defResult: defResult, modified: false };
  },

  // Downgrade a hit by one level
  downgradeHit(hitType) {
    switch (hitType) {
      case 'homerun': return 'triple';
      case 'triple': return 'double';
      case 'double': return 'single';
      case 'single': return 'single'; // single stays single
      default: return hitType;
    }
  },

  // Check if fielder position is infield (for productive out / DP logic)
  isInfieldOut(outInfo) {
    return outInfo.isGroundball;
  },

  // Check if the out is to the outfield or right side (for runner advancement on productive outs)
  canRunnersAdvance(outInfo) {
    // Runners at 2nd/3rd can advance on outfield fly balls and right side infield
    if (outInfo.isPopup) return true; // outfield
    if (outInfo.fielder === '1B' || outInfo.fielder === '2B') return true; // right side
    return false;
  }
};

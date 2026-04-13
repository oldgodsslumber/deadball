// Deadball Digital - Injury System
var DB = DB || {};

DB.Injuries = {
  // Roll and resolve a full injury
  resolveInjury(player, era) {
    var severityRoll = DB.Dice.d100();
    var severity = DB.Tables.resolveInjurySeverity(severityRoll);
    var locationRoll = DB.Dice.d20();
    var location = DB.Tables.injuryLocation[locationRoll];

    var result = {
      player: player,
      severity: severity,
      severityRoll: severityRoll,
      location: location,
      locationRoll: locationRoll,
      gamesOut: 0,
      permanent: false,
      retired: false,
      desc: ''
    };

    switch (severity) {
      case 'unhurt':
        result.desc = player.name + ' appears to be fine.';
        break;

      case 'superficial':
        var duration = DB.Dice.d6();
        result.gamesOut = duration;
        if (player.isPitcher) {
          result.desc = player.name + ' has a superficial ' + location.toLowerCase() + ' injury. PD reduced by 1 for ' + duration + ' games.';
          player.injuryPdReduction = 1;
        } else {
          result.desc = player.name + ' has a superficial ' + location.toLowerCase() + ' injury. BT reduced by 5 for ' + duration + ' games.';
          player.injuryBtReduction = 5;
        }
        player.injuryGamesRemaining = duration;
        break;

      case 'minor':
        var games = DB.Dice.d8();
        result.gamesOut = games;
        result.desc = player.name + ' has a minor ' + location.toLowerCase() + ' injury. Out for ' + games + ' games.';
        player.injuryGamesRemaining = games;
        break;

      case 'major':
        var games2 = DB.Dice.roll2d(20);
        result.gamesOut = games2;
        result.desc = player.name + ' has a major ' + location.toLowerCase() + ' injury! Out for ' + games2 + ' games.';
        player.injuryGamesRemaining = games2;
        break;

      case 'catastrophic':
        result.desc = player.name + ' has a CATASTROPHIC ' + location.toLowerCase() + ' injury!';
        var catRoll = DB.Dice.d6();
        var catResult = DB.Tables.resolveCatastrophicInjury(catRoll);

        if (catResult === 'retire') {
          result.retired = true;
          if (era === 'ancient' && location === 'Head') {
            result.desc += ' ' + player.name + ' has died from the injury.';
          } else {
            result.desc += ' ' + player.name + ' is forced to retire.';
          }
        } else {
          result.permanent = true;
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdDown(player.pitchDie, 1);
            result.desc += ' Permanent PD reduction. Now ' + DB.Dice.formatPD(player.pitchDie) + '.';
          } else {
            var btLoss = DB.Dice.d10() + 2;
            player.bt = Math.max(1, player.bt - btLoss);
            player.obt = Math.max(player.bt + 1, player.obt - btLoss);
            result.desc += ' Permanent BT reduction of ' + btLoss + '. Now ' + player.bt + '/' + player.obt + '.';
          }
          // Out for season
          player.injuryGamesRemaining = 162;
        }
        break;
    }

    return result;
  },

  // Process injury recovery (call each game day)
  processRecovery(player) {
    if (player.injuryGamesRemaining > 0) {
      player.injuryGamesRemaining--;
      if (player.injuryGamesRemaining === 0) {
        player.injuryBtReduction = 0;
        player.injuryPdReduction = 0;
        return player.name + ' has recovered from injury!';
      }
    }
    return null;
  }
};

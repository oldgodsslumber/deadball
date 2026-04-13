// Deadball Digital - Season Tracking
var DB = DB || {};

DB.Season = {
  create(teams, era) {
    return {
      era: era,
      teams: teams,
      week: 1,
      standings: teams.map(function(t) {
        return { teamId: t.id, name: t.name, w: 0, l: 0, pct: '.000', gb: 0 };
      }),
      schedule: [],
      results: []
    };
  },

  // Apply aging to all players on a team (end of season)
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
            desc += 'Severe decline! PD now ' + DB.Dice.formatPD(player.pitchDie) + '.';
          } else {
            player.bt = Math.max(1, player.bt - 5);
            player.obt = Math.max(player.bt + 1, player.obt - 5);
            desc += 'Severe decline! BT/OBT now ' + player.bt + '/' + player.obt + '.';
          }
          // Remove all positive traits
          player.traits = player.traits.filter(function(t) { return t.indexOf('-') !== -1; });
          break;

        case 'decline':
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdDown(player.pitchDie, 1);
            desc += 'Decline. PD now ' + DB.Dice.formatPD(player.pitchDie) + '.';
          } else {
            player.bt = Math.max(1, player.bt - 3);
            player.obt = Math.max(player.bt + 1, player.obt - 3);
            desc += 'Decline. BT/OBT now ' + player.bt + '/' + player.obt + '.';
          }
          // Remove 1 positive trait
          for (var i = player.traits.length - 1; i >= 0; i--) {
            if (player.traits[i].indexOf('-') === -1) {
              player.traits.splice(i, 1);
              break;
            }
          }
          break;

        case 'slight_decline':
          player.bt = Math.max(1, player.bt - 1);
          player.obt = Math.max(player.bt + 1, player.obt - 1);
          desc += 'Slight decline. BT/OBT now ' + player.bt + '/' + player.obt + '.';
          break;

        case 'no_change':
          desc += 'No change.';
          break;

        case 'slight_improve':
          player.bt++;
          player.obt++;
          desc += 'Slight improvement! BT/OBT now ' + player.bt + '/' + player.obt + '.';
          break;

        case 'improve':
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdUp(player.pitchDie, 1);
            desc += 'Improvement! PD now ' + DB.Dice.formatPD(player.pitchDie) + '.';
          } else {
            player.bt += 3;
            player.obt += 3;
            desc += 'Improvement! BT/OBT now ' + player.bt + '/' + player.obt + '.';
          }
          break;

        case 'breakout':
          if (player.isPitcher) {
            player.pitchDie = DB.Dice.pdUp(player.pitchDie, 2);
            desc += 'BREAKOUT! PD now ' + DB.Dice.formatPD(player.pitchDie) + '.';
          } else {
            player.bt += 5;
            player.obt += 5;
            desc += 'BREAKOUT! BT/OBT now ' + player.bt + '/' + player.obt + '.';
          }
          // Gain a positive trait
          var traitRoll = DB.Dice.d6() + 14;
          var traitTable = player.isPitcher ? DB.Tables.traitsTable.pitcher : DB.Tables.traitsTable.batter;
          var newTrait = traitTable[traitRoll];
          if (newTrait && player.traits.indexOf(newTrait) === -1) {
            player.traits.push(newTrait);
            desc += ' Gained ' + newTrait + '!';
          }
          break;
      }

      results.push(desc);
    });

    return results;
  },

  // Update standings
  updateStandings(season) {
    // Sort by winning percentage
    season.standings.sort(function(a, b) {
      var pctA = a.w / Math.max(1, a.w + a.l);
      var pctB = b.w / Math.max(1, b.w + b.l);
      return pctB - pctA;
    });

    // Calculate GB
    var leader = season.standings[0];
    var leaderPct = leader.w / Math.max(1, leader.w + leader.l);
    season.standings.forEach(function(s) {
      s.pct = (s.w / Math.max(1, s.w + s.l)).toFixed(3);
      s.gb = ((leader.w - s.w) + (s.l - leader.l)) / 2;
    });
  }
};

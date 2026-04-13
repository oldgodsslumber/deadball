// Deadball Digital - Oddities Resolution
var DB = DB || {};

DB.Oddities = {
  // Roll and resolve an oddity (2d10)
  resolve(gameState) {
    var roll = DB.Dice.roll2d(10);
    var oddity = DB.Tables.oddities[roll];
    if (!oddity) return { roll: roll, name: 'Nothing happens', effects: [] };

    var effects = [];
    var desc = oddity.name + ': ' + oddity.desc;

    // Auto-resolve some oddities
    switch (roll) {
      case 2: // Fan Interference
        var pdEven = (gameState.currentPitcher.currentPitchDie || 0) % 2 === 0;
        if (pdEven) {
          effects.push({ type: 'out', desc: 'Home run overturned by fan interference! Batter is out.' });
        } else {
          effects.push({ type: 'continue', desc: 'Fan catches a sure out! At-bat continues.' });
        }
        break;

      case 3: // Animal on field
        var animal = DB.Dice.d4();
        switch (animal) {
          case 1: effects.push({ type: 'pd_down', target: 'pitcher', amount: 1, desc: 'Seagull steals pitcher\'s hat! PD -1 this inning.' }); break;
          case 2: effects.push({ type: 'trait_add', trait: 'D-', target: 'last_fielder', desc: 'Raccoon bites fielder! D- for rest of game.' }); break;
          case 3: effects.push({ type: 'bt_reduce', amount: 5, target: 'home_team', duration: 1, desc: 'Black cat spooks home team! -5 BT/OBT for 1 inning.' }); break;
          case 4: effects.push({ type: 'pd_up', target: 'home_pitcher', amount: 1, desc: 'Streaker inspires crowd! Home pitcher PD +1.' }); break;
        }
        break;

      case 4: // Rain delay
        var delayMinutes = DB.Dice.d100() * 2;
        effects.push({ type: 'delay', minutes: delayMinutes, desc: 'Rain delay: ' + delayMinutes + ' minutes.' });
        break;

      case 7: // TOOTBLAN
        if (DB.Baserunning.runnersOn(gameState.bases) > 0) {
          effects.push({ type: 'lead_runner_out', desc: 'TOOTBLAN! Lead runner thrown out on the basepaths!' });
        } else {
          effects.push({ type: 'out', desc: 'TOOTBLAN! Batter tagged out on a bizarre play!' });
        }
        break;

      case 8: // Pick-off
        if (gameState.bases.first) {
          effects.push({ type: 'runner_out', base: 'first', desc: 'Pick-off! Runner at first is out!' });
        } else {
          effects.push({ type: 'catcher_bonus', desc: 'Catcher treated as D+ for next steal attempt.' });
        }
        break;

      case 11: // HBP
        effects.push({ type: 'hbp', desc: 'Hit by pitch! Batter goes to first.' });
        break;

      case 12: // Wild pitch
      case 15: // Passed ball
      case 19: // Balk
        effects.push({ type: 'advance_all', bases: 1, desc: oddity.name + '! All runners advance one base.' });
        break;

      case 14: // Dropped third strike
        var stealRoll = DB.Dice.d8();
        if (stealRoll >= 4) {
          effects.push({ type: 'batter_first', desc: 'Dropped third strike! Batter reaches first on steal roll (' + stealRoll + ').' });
        } else {
          effects.push({ type: 'out', desc: 'Dropped third strike, but batter thrown out (' + stealRoll + ').' });
        }
        break;

      case 18: // Pitcher error
        effects.push({ type: 'batter_first', desc: 'Pitcher error! Batter reaches first.' });
        effects.push({ type: 'advance_all', bases: 1, desc: 'All runners advance one base.' });
        break;

      case 20: // Catcher interference
        effects.push({ type: 'batter_first', desc: 'Catcher interference! Batter goes to first.' });
        break;

      default:
        // Injuries (5, 6, 16, 17) handled by caller checking the roll
        if ([5, 6, 16, 17].indexOf(roll) !== -1) {
          effects.push({ type: 'injury', roll: roll, desc: oddity.desc });
        } else {
          effects.push({ type: 'flavor', desc: desc });
        }
    }

    return { roll: roll, name: oddity.name, effects: effects, desc: desc };
  }
};

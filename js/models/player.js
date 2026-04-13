// Deadball Digital - Player Model
var DB = DB || {};

DB.Player = {
  _nextId: 1,

  create(data) {
    return {
      id: data.id || ('p' + DB.Player._nextId++),
      name: data.name || 'Unknown Player',
      position: data.position || 'UT',
      handedness: data.handedness || 'R',
      bt: data.bt || 20,
      obt: data.obt || 25,
      pitchDie: data.pitchDie != null ? data.pitchDie : null,
      traits: data.traits || [],
      age: data.age || 25,
      isPitcher: data.isPitcher || false,
      isStarter: data.isStarter != null ? data.isStarter : true,

      // Runtime game state (reset each game)
      currentPitchDie: data.pitchDie || null,
      inningsPitched: 0,
      outsRecorded: 0,
      runsAllowedTotal: 0,
      runsAllowedThisInning: 0,
      consecutiveScorelessInnings: 0,
      gameStats: { ab: 0, h: 0, hr: 0, rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, r: 0 },
      pitchingStats: { ip: 0, h: 0, r: 0, er: 0, bb: 0, k: 0 },

      // Season/career (persisted in saves)
      restDaysNeeded: 0,
      restDaysRemaining: 0,
      injuryGamesRemaining: 0,
      injuryBtReduction: 0,
      injuryPdReduction: 0,
      seasonStats: {
        g: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0,
        bb: 0, k: 0, sb: 0, cs: 0, r: 0,
        w: 0, l: 0, sv: 0, ipOuts: 0, pHits: 0, pRuns: 0,
        pEarnedRuns: 0, pBB: 0, pK: 0
      }
    };
  },

  // Check if player has a specific trait
  hasTrait(player, trait) {
    return player.traits.includes(trait);
  },

  // Get effective BT (accounting for injuries, traits applied by opponent pitcher)
  getEffectiveBT(player, pitcher) {
    let bt = player.bt - player.injuryBtReduction;
    if (pitcher && DB.Player.hasTrait(pitcher, 'K+')) bt -= 1;
    return Math.max(1, bt);
  },

  // Get effective OBT
  getEffectiveOBT(player, pitcher) {
    let obt = player.obt - player.injuryBtReduction;
    if (pitcher && DB.Player.hasTrait(pitcher, 'CN+')) obt -= 2;
    if (pitcher && DB.Player.hasTrait(pitcher, 'CN-')) obt += 3;
    return Math.max(player.bt + 1, obt);
  },

  // Get display name for pitch die
  getPitchDieDisplay(player) {
    if (!player.isPitcher) return '-';
    return DB.Dice.formatPD(player.currentPitchDie != null ? player.currentPitchDie : player.pitchDie);
  },

  // Get batting average from BT
  getBattingAvg(player) {
    return '.' + String(player.bt).padStart(3, '0');
  },

  // Get OBP from OBT
  getOBP(player) {
    return '.' + String(player.obt).padStart(3, '0');
  },

  // Reset per-game stats
  resetGameStats(player) {
    player.currentPitchDie = player.pitchDie;
    player.inningsPitched = 0;
    player.outsRecorded = 0;
    player.runsAllowedTotal = 0;
    player.runsAllowedThisInning = 0;
    player.consecutiveScorelessInnings = 0;
    player.gameStats = { ab: 0, h: 0, hr: 0, rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, r: 0 };
    player.pitchingStats = { ip: 0, h: 0, r: 0, er: 0, bb: 0, k: 0 };
  },

  // ===== RANDOM GENERATION =====

  // Generate a random fictional player
  generateRandom(options) {
    options = options || {};
    const era = options.era || 'modern';
    const tier = options.tier || 'prospect'; // 'prospect' or 'farmhand'

    // Position
    const posRoll = DB.Dice.d20();
    const position = options.position || DB.Tables.positionTable[posRoll];
    const isPitcher = ['SP', 'RP'].includes(position);

    // Handedness
    const handRoll = DB.Dice.d10();
    const handedness = isPitcher
      ? DB.Tables.handednessTable.pitcher[handRoll]
      : DB.Tables.handednessTable.batter[handRoll];

    // Age
    let age;
    switch (options.ageCategory || 'prospect') {
      case 'prospect':  age = DB.Dice.d6() + 18; break;
      case 'rookie':    age = DB.Dice.d6() + 21; break;
      case 'veteran':   age = DB.Dice.d6() + 27; break;
      case 'oldtimer':  age = DB.Dice.d6() + 32; break;
      default:          age = DB.Dice.d6() + 18;
    }

    // BT and OBT
    let bt, obt;
    if (isPitcher) {
      bt = DB.Dice.roll2d(6) + 12;
      obt = bt + DB.Dice.d8();
    } else if (tier === 'prospect') {
      bt = DB.Dice.roll2d(10) + 15;
      obt = bt + DB.Dice.roll2d(4);
    } else {
      bt = DB.Dice.roll2d(10) + 12;
      obt = bt + DB.Dice.roll2d(4);
    }

    // Pitch die (for pitchers)
    let pitchDie = null;
    if (isPitcher) {
      const pdTable = DB.Tables.fictionalPitchDie[era === 'ancient' ? 'ancient' : 'modern'];
      const pdRoll = era === 'ancient' ? DB.Dice.d12() : DB.Dice.d8();
      const farmhandBonus = tier === 'farmhand' ? 2 : 0;
      const pdIdx = Math.min(pdRoll + farmhandBonus, pdTable.length - 1);
      pitchDie = pdTable[pdIdx];
    }

    // Traits
    const traits = [];
    const traitRoll1 = DB.Dice.roll2d(10);
    const traitTable = isPitcher ? DB.Tables.traitsTable.pitcher : DB.Tables.traitsTable.batter;
    const trait1 = traitTable[traitRoll1];
    if (trait1) {
      traits.push(trait1);
      // Top prospects get a second trait roll
      if (tier === 'prospect') {
        const traitRoll2 = DB.Dice.roll2d(10);
        const trait2 = traitTable[traitRoll2];
        if (trait2 && trait2 !== trait1) traits.push(trait2);
      }
    }

    // Name
    const name = options.name || DB.Player.generateName();

    return DB.Player.create({
      name, position, handedness, bt, obt, pitchDie, traits, age,
      isPitcher,
      isStarter: position === 'SP'
    });
  },

  // Create from real MLB stats
  createFromStats(stats, era) {
    era = era || 'modern';
    const isPitcher = stats.isPitcher || false;

    let bt, obt, pitchDie = null;

    if (isPitcher) {
      // Pitchers still bat (or not in DH leagues)
      bt = stats.battingAvg ? Math.round(stats.battingAvg * 100) : 10;
      obt = stats.obp ? Math.round(stats.obp * 100) : 15;
      pitchDie = DB.Eras.eraToPD(stats.era || 4.50, era);
    } else {
      bt = Math.round((stats.battingAvg || 0.250) * 100);
      obt = Math.round((stats.obp || 0.320) * 100);
    }

    // Determine traits from stats
    const traits = DB.Player.determineTraitsFromStats(stats, isPitcher);

    return DB.Player.create({
      name: stats.name || 'Unknown',
      position: stats.position || (isPitcher ? 'SP' : 'UT'),
      handedness: stats.handedness || 'R',
      bt, obt, pitchDie, traits,
      age: stats.age || 25,
      isPitcher,
      isStarter: stats.isStarter != null ? stats.isStarter : (isPitcher ? true : true)
    });
  },

  // Determine traits from real stats
  determineTraitsFromStats(stats, isPitcher) {
    const traits = [];
    const t = DB.Tables.realPlayerTraits;

    if (isPitcher) {
      if (stats.kPer9 >= t.pitcher['K+'].kPer9) traits.push('K+');
      if (stats.gbPct >= t.pitcher['GB+'].gbPct) traits.push('GB+');
      if (stats.bbPer9 != null && stats.bbPer9 <= t.pitcher['CN+'].bbPer9Max) traits.push('CN+');
      if (stats.ip >= t.pitcher['ST+'].ip) traits.push('ST+');
      if (stats.bbPer9 != null && stats.bbPer9 >= t.pitcher['CN-'].bbPer9Min) traits.push('CN-');
    } else {
      if (stats.hr >= t.batter['P++'].hr) traits.push('P++');
      else if (stats.hr >= t.batter['P+'].hr) traits.push('P+');
      else if (stats.hr != null && stats.hr <= t.batter['P--'].hrMax) traits.push('P--');
      else if (stats.hr != null && stats.hr <= t.batter['P-'].hrMax) traits.push('P-');

      if (stats.sb >= t.batter['S+'].sb) traits.push('S+');
      else if (stats.sb != null && stats.sb <= t.batter['S-'].sbMax) traits.push('S-');

      if (stats.kPct != null && stats.kPct <= t.batter['C+'].kPct) traits.push('C+');
      else if (stats.kPct != null && stats.kPct >= t.batter['C-'].kPctMin) traits.push('C-');

      if (stats.drs >= t.batter['D+'].drs) traits.push('D+');
      else if (stats.drs != null && stats.drs <= t.batter['D-'].drsMax) traits.push('D-');

      if (stats.gamesPlayed >= t.batter['T+'].gamesPlayed) traits.push('T+');
    }
    return traits;
  },

  // ===== NAME GENERATION =====
  _firstNames: [
    'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
    'Chris','Daniel','Matthew','Anthony','Mark','Steven','Paul','Andrew','Joshua','Kenneth',
    'Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeff','Ryan','Jacob',
    'Gary','Nick','Eric','Frank','Juan','Carlos','Jose','Miguel','Pedro','Rafael',
    'Alex','Sam','Ben','Zach','Tyler','Luke','Nolan','Aaron','Derek','Cal',
    'Buck','Dizzy','Satchel','Lefty','Smoky','Rube','Cy','Honus','Ty','Babe',
    'Lou','Joe','Ted','Jackie','Mickey','Willie','Hank','Roberto','Sandy','Nolan'
  ],
  _lastNames: [
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
    'Anderson','Taylor','Thomas','Jackson','White','Harris','Martin','Thompson','Robinson','Clark',
    'Lewis','Walker','Hall','Allen','Young','King','Wright','Lopez','Hill','Scott',
    'Green','Adams','Baker','Cruz','Rivera','Reyes','Torres','Ramirez','Diaz','Morales',
    'Sullivan','Murphy','O\'Brien','Kelly','Kennedy','O\'Neill','Quinn','Walsh','Flynn','Doyle',
    'Wagner','Mueller','Schmidt','Schneider','Weber','Fischer','Hoffmann','Schultz','Koch','Bauer',
    'Harper','Trout','Judge','Ohtani','Acuna','Soto','Freeman','Alvarez','Betts','Guerrero'
  ],

  generateName() {
    const first = DB.Player._firstNames[Math.floor(Math.random() * DB.Player._firstNames.length)];
    const last = DB.Player._lastNames[Math.floor(Math.random() * DB.Player._lastNames.length)];
    return first + ' ' + last;
  },

  // Serialize for save
  serialize(player) {
    return {
      id: player.id, name: player.name, position: player.position,
      handedness: player.handedness, bt: player.bt, obt: player.obt,
      pitchDie: player.pitchDie, traits: player.traits, age: player.age,
      isPitcher: player.isPitcher, isStarter: player.isStarter,
      restDaysNeeded: player.restDaysNeeded, restDaysRemaining: player.restDaysRemaining,
      injuryGamesRemaining: player.injuryGamesRemaining,
      injuryBtReduction: player.injuryBtReduction, injuryPdReduction: player.injuryPdReduction,
      seasonStats: player.seasonStats
    };
  },

  // Deserialize from save
  deserialize(data) {
    return DB.Player.create(data);
  }
};

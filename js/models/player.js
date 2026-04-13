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
      gender: data.gender || 'M', // 'M' or 'F'

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

    // Gender and Name
    const gender = options.gender || (Math.random() < 0.5 ? 'M' : 'F');
    const name = options.name || DB.Player.generateName(gender);

    return DB.Player.create({
      name, position, handedness, bt, obt, pitchDie, traits, age,
      isPitcher, gender,
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

  // ===== NAME GENERATION (from Modern Roll Tables) =====

  // Generate a name using the country-based tables from the docx
  // gender: 'M' or 'F'
  // country: specific country string, or null for random
  generateName(gender, country) {
    gender = gender || (Math.random() < 0.5 ? 'M' : 'F');
    if (!DB.Names) {
      // Fallback if names.js hasn't loaded
      return 'Player ' + Math.floor(Math.random() * 9999);
    }
    var c = country || DB.Player.pickWeightedCountry();
    var firstList = gender === 'F' ? DB.Names.female[c] : DB.Names.male[c];
    var lastList = DB.Names.last[c];
    if (!firstList || !lastList) {
      c = 'United States';
      firstList = gender === 'F' ? DB.Names.female[c] : DB.Names.male[c];
      lastList = DB.Names.last[c];
    }
    var first = firstList[Math.floor(Math.random() * firstList.length)];
    var last = lastList[Math.floor(Math.random() * lastList.length)];
    return first + ' ' + last;
  },

  // Weighted country selection - favors countries well-represented in baseball
  // Weights roughly reflect MLB player demographics
  _countryWeights: [
    { country: 'United States', weight: 30 },
    { country: 'Mexico', weight: 8 },
    { country: 'Japan', weight: 8 },
    { country: 'South Korea', weight: 7 },
    { country: 'United Kingdom', weight: 6 },
    { country: 'Germany', weight: 6 },
    { country: 'Brazil', weight: 6 },
    { country: 'Colombia', weight: 4 },
    { country: 'Australia', weight: 3 },
    { country: 'Philippines', weight: 3 },
    { country: 'India', weight: 2 },
    { country: 'Nigeria', weight: 2 },
    { country: 'France', weight: 2 },
    { country: 'China', weight: 2 },
    { country: 'Russia', weight: 2 },
    { country: 'Italy', weight: 2 },
    { country: 'Argentina', weight: 2 },
    { country: 'Egypt', weight: 1 },
    { country: 'Pakistan', weight: 1 },
    { country: 'Poland', weight: 1 }
  ],
  _countryWeightTotal: 0,

  pickWeightedCountry() {
    if (!DB.Player._countryWeightTotal) {
      DB.Player._countryWeightTotal = DB.Player._countryWeights.reduce(function(s, e) { return s + e.weight; }, 0);
    }
    var roll = Math.random() * DB.Player._countryWeightTotal;
    var sum = 0;
    for (var i = 0; i < DB.Player._countryWeights.length; i++) {
      sum += DB.Player._countryWeights[i].weight;
      if (roll < sum) return DB.Player._countryWeights[i].country;
    }
    return 'United States';
  },

  // Serialize for save
  serialize(player) {
    return {
      id: player.id, name: player.name, position: player.position,
      handedness: player.handedness, bt: player.bt, obt: player.obt,
      pitchDie: player.pitchDie, traits: player.traits, age: player.age,
      isPitcher: player.isPitcher, isStarter: player.isStarter, gender: player.gender,
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

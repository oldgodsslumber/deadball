// Deadball Digital - All Lookup Tables
var DB = DB || {};

DB.Tables = {

  // ===== HIT TABLES (d20) =====
  // Each entry: { result, def, runnersAdv }
  // result: 'single', 'double', 'triple', 'homerun'
  // def: null or fielder position string for DEF roll
  // runnersAdv: how many bases runners advance (1=normal, 2=extra, 3=extra+, 4=all score)

  hitTable: {
    // 2nd Edition standard
    modern: [
      null, // index 0 unused (d20 is 1-20)
      { result: 'single',  def: null,  runnersAdv: 1 }, // 1
      { result: 'single',  def: null,  runnersAdv: 1 }, // 2
      { result: 'single',  def: '1B',  runnersAdv: 1 }, // 3
      { result: 'single',  def: '2B',  runnersAdv: 1 }, // 4
      { result: 'single',  def: '3B',  runnersAdv: 1 }, // 5
      { result: 'single',  def: 'SS',  runnersAdv: 1 }, // 6
      { result: 'single',  def: null,  runnersAdv: 1 }, // 7
      { result: 'single',  def: null,  runnersAdv: 1 }, // 8
      { result: 'single',  def: null,  runnersAdv: 1 }, // 9
      { result: 'single',  def: null,  runnersAdv: 2 }, // 10
      { result: 'single',  def: null,  runnersAdv: 2 }, // 11
      { result: 'single',  def: null,  runnersAdv: 2 }, // 12
      { result: 'single',  def: null,  runnersAdv: 2 }, // 13
      { result: 'single',  def: null,  runnersAdv: 2 }, // 14
      { result: 'double',  def: 'LF',  runnersAdv: 2 }, // 15
      { result: 'double',  def: 'CF',  runnersAdv: 2 }, // 16
      { result: 'double',  def: 'RF',  runnersAdv: 2 }, // 17
      { result: 'double',  def: null,  runnersAdv: 3 }, // 18
      { result: 'homerun', def: null,  runnersAdv: 4 }, // 19
      { result: 'homerun', def: null,  runnersAdv: 4 }, // 20
    ],

    ancient: [
      null,
      { result: 'single',  def: null,  runnersAdv: 1 }, // 1
      { result: 'single',  def: null,  runnersAdv: 1 }, // 2
      { result: 'single',  def: '1B',  runnersAdv: 1 }, // 3
      { result: 'single',  def: '2B',  runnersAdv: 1 }, // 4
      { result: 'single',  def: '3B',  runnersAdv: 1 }, // 5
      { result: 'single',  def: 'SS',  runnersAdv: 1 }, // 6
      { result: 'single',  def: null,  runnersAdv: 2 }, // 7
      { result: 'single',  def: null,  runnersAdv: 2 }, // 8
      { result: 'single',  def: null,  runnersAdv: 2 }, // 9
      { result: 'single',  def: null,  runnersAdv: 2 }, // 10
      { result: 'single',  def: null,  runnersAdv: 2 }, // 11
      { result: 'single',  def: null,  runnersAdv: 2 }, // 12
      { result: 'single',  def: null,  runnersAdv: 2 }, // 13
      { result: 'single',  def: null,  runnersAdv: 2 }, // 14
      { result: 'single',  def: null,  runnersAdv: 2 }, // 15
      { result: 'single',  def: null,  runnersAdv: 2 }, // 16
      { result: 'double',  def: 'LF',  runnersAdv: 2 }, // 17
      { result: 'double',  def: 'CF',  runnersAdv: 2 }, // 18
      { result: 'double',  def: 'RF',  runnersAdv: 2 }, // 19
      { result: 'triple',  def: 'RF',  runnersAdv: 3 }, // 20  (RF if MSS even, CF if odd)
      // 21+ only reachable via P+/P++ bonus
      { result: 'homerun', def: null,  runnersAdv: 4 }, // 21+
    ],

    juiced: [
      null,
      { result: 'single',  def: null,  runnersAdv: 1 }, // 1
      { result: 'single',  def: null,  runnersAdv: 1 }, // 2
      { result: 'single',  def: '1B',  runnersAdv: 1 }, // 3
      { result: 'single',  def: '2B',  runnersAdv: 1 }, // 4
      { result: 'single',  def: '3B',  runnersAdv: 1 }, // 5
      { result: 'single',  def: 'SS',  runnersAdv: 1 }, // 6
      { result: 'single',  def: null,  runnersAdv: 1 }, // 7
      { result: 'single',  def: null,  runnersAdv: 1 }, // 8
      { result: 'single',  def: null,  runnersAdv: 1 }, // 9
      { result: 'single',  def: null,  runnersAdv: 2 }, // 10
      { result: 'single',  def: null,  runnersAdv: 2 }, // 11
      { result: 'single',  def: null,  runnersAdv: 2 }, // 12
      { result: 'single',  def: null,  runnersAdv: 2 }, // 13
      { result: 'double',  def: 'LF',  runnersAdv: 2 }, // 14
      { result: 'double',  def: 'CF',  runnersAdv: 2 }, // 15
      { result: 'double',  def: 'RF',  runnersAdv: 2 }, // 16
      { result: 'double',  def: null,  runnersAdv: 3 }, // 17
      { result: 'homerun', def: null,  runnersAdv: 4 }, // 18
      { result: 'homerun', def: null,  runnersAdv: 4 }, // 19
      { result: 'homerun', def: null,  runnersAdv: 4 }, // 20
    ]
  },

  // ===== OUT TABLE (last digit of MSS) =====
  outTable: {
    modern: [
      // index = last digit of MSS
      { type: 'strikeout', fielder: null,  code: 'K',   isGroundball: false, isPopup: false }, // 0
      { type: 'strikeout', fielder: null,  code: 'K',   isGroundball: false, isPopup: false }, // 1
      { type: 'strikeout', fielder: null,  code: 'K',   isGroundball: false, isPopup: false }, // 2
      { type: 'groundball', fielder: '1B', code: 'G-3', isGroundball: true,  isPopup: false }, // 3
      { type: 'groundball', fielder: '2B', code: '4-3', isGroundball: true,  isPopup: false }, // 4
      { type: 'groundball', fielder: '3B', code: '5-3', isGroundball: true,  isPopup: false }, // 5
      { type: 'groundball', fielder: 'SS', code: '6-3', isGroundball: true,  isPopup: false }, // 6
      { type: 'popup',      fielder: 'LF', code: 'F-7', isGroundball: false, isPopup: true  }, // 7
      { type: 'popup',      fielder: 'CF', code: 'F-8', isGroundball: false, isPopup: true  }, // 8
      { type: 'popup',      fielder: 'RF', code: 'F-9', isGroundball: false, isPopup: true  }, // 9
    ],
    ancient: [
      { type: 'strikeout',  fielder: null,  code: 'K',   isGroundball: false, isPopup: false }, // 0
      { type: 'groundball', fielder: 'P',   code: '1-3', isGroundball: true,  isPopup: false }, // 1
      { type: 'groundball', fielder: 'SS',  code: '6-3', isGroundball: true,  isPopup: false }, // 2
      { type: 'groundball', fielder: '1B',  code: 'G-3', isGroundball: true,  isPopup: false }, // 3
      { type: 'groundball', fielder: '2B',  code: '4-3', isGroundball: true,  isPopup: false }, // 4
      { type: 'groundball', fielder: '3B',  code: '5-3', isGroundball: true,  isPopup: false }, // 5
      { type: 'groundball', fielder: 'SS',  code: '6-3', isGroundball: true,  isPopup: false }, // 6
      { type: 'popup',      fielder: 'LF',  code: 'F-7', isGroundball: false, isPopup: true  }, // 7
      { type: 'popup',      fielder: 'CF',  code: 'F-8', isGroundball: false, isPopup: true  }, // 8
      { type: 'popup',      fielder: 'RF',  code: 'F-9', isGroundball: false, isPopup: true  }, // 9
    ]
  },

  // ===== DEFENSE TABLE (d12) =====
  // Returns: 'error', 'no_change', 'downgrade', 'out'
  resolveDefense(roll) {
    if (roll <= 2) return 'error';
    if (roll <= 9) return 'no_change';
    if (roll <= 11) return 'downgrade';
    return 'out'; // 12+
  },

  // Ancient era: errors on 1-3 instead of 0-2
  resolveDefenseAncient(roll) {
    if (roll <= 3) return 'error';
    if (roll <= 9) return 'no_change';
    if (roll <= 11) return 'downgrade';
    return 'out';
  },

  // ===== ODDITIES TABLE (2d10, range 2-20) =====
  oddities: {
    2:  { name: 'Fan Interference', desc: 'Even PD: HR overturned, batter out. Odd PD: fan catches sure out, at-bat continues.' },
    3:  { name: 'Animal On Field', desc: 'Roll d4: 1=Seagull (PD-1 this inning), 2=Raccoon (fielder D- rest of game), 3=Black Cat (-5 BT/OBT home team 1 inning), 4=Streaker (+1 PD home pitcher).' },
    4:  { name: 'Rain Delay', desc: 'Delay lasts d100×2 minutes.' },
    5:  { name: 'Fielder Appears Injured', desc: 'Roll injury table for fielder who made last out.' },
    6:  { name: 'Pitcher Appears Injured', desc: 'Roll injury table for pitcher.' },
    7:  { name: 'TOOTBLAN', desc: 'Lead runner thrown out on basepaths. If no runner, batter tagged out.' },
    8:  { name: 'Pick-Off', desc: 'Runner at 1st picked off. If no runner at 1st, catcher treated as D+ for next steal.' },
    9:  { name: 'Call Blown at First', desc: 'Even PD: batter wrongly called safe. Odd PD: batter wrongly called out.' },
    10: { name: 'Call Blown at Home Plate', desc: 'Even PD: walk on should-be strike. Odd PD: out on should-be ball.' },
    11: { name: 'Hit by Pitch', desc: 'Batter goes to first.' },
    12: { name: 'Wild Pitch', desc: 'All runners advance one base.' },
    13: { name: 'Pitcher Distracted', desc: '+1 to stolen base attempts this at-bat.' },
    14: { name: 'Dropped Third Strike', desc: 'Roll d8 steal. If successful, batter reaches first.' },
    15: { name: 'Passed Ball', desc: 'All runners advance one base.' },
    16: { name: 'Current Batter Injured', desc: 'Roll injury table for current batter.' },
    17: { name: 'Previous Batter Injured', desc: 'Roll injury table for previous batter.' },
    18: { name: 'Pitcher Error', desc: 'Batter reaches first. All runners advance one base.' },
    19: { name: 'Balk', desc: 'All runners advance one base.' },
    20: { name: 'Catcher Interference', desc: 'Batter goes to first.' }
  },

  // ===== BUNT TABLE (d6) =====
  // Returns depend on situation, handled in engine
  // Structure: { leadRunnerOut, batterOut, leadRunnerAdvances, batterSafe, special }
  buntTable: {
    modern: [
      null, // index 0 unused
      // 1-2: Lead runner out, batter safe
      { leadRunnerOut: true, batterOut: false },
      { leadRunnerOut: true, batterOut: false },
      // 3: Depends on runner position (handled in engine)
      // If runner at 1st/2nd: lead advances, batter out
      // If runner at 3rd: lead runner out, batter safe
      { special: 'conditional_3' },
      // 4-5: Lead runner advances, batter out
      { leadRunnerOut: false, batterOut: true, leadRunnerAdvances: true },
      { leadRunnerOut: false, batterOut: true, leadRunnerAdvances: true },
      // 6: S+ gets single DEF(3B), otherwise lead advances + batter out
      { special: 'speed_6' }
    ],
    ancient: [
      null,
      // 1: Lead runner out, batter safe
      { leadRunnerOut: true, batterOut: false },
      // 2: Conditional (same as modern 3)
      { special: 'conditional_3' },
      // 3-4: Lead runner advances, batter out
      { leadRunnerOut: false, batterOut: true, leadRunnerAdvances: true },
      { leadRunnerOut: false, batterOut: true, leadRunnerAdvances: true },
      // 5: S+ gets single DEF(3B), otherwise lead advances + batter out
      { special: 'speed_6' },
      // 6: Position player gets single DEF(3B), pitcher gets lead advances + batter out
      { special: 'ancient_6' }
    ]
  },

  // ===== STEAL TABLE =====
  // d8 to steal 2nd, d8-1 to steal 3rd
  // 1-3: out, 4+: safe
  stealThreshold: 4, // need this or higher to be safe

  // ===== DOUBLE STEAL TABLE (d8) =====
  // 1-3: lead runner out, 4-5: trailing runner out, 6+: both safe
  resolveDoubleSteal(roll) {
    if (roll <= 3) return 'lead_out';
    if (roll <= 5) return 'trail_out';
    return 'both_safe';
  },

  // ===== INJURY SEVERITY TABLE (d100) =====
  resolveInjurySeverity(roll) {
    if (roll === 1) return 'catastrophic';
    if (roll <= 5) return 'major';
    if (roll <= 10) return 'minor';
    if (roll <= 75) return 'superficial';
    return 'unhurt';
  },

  // ===== INJURY LOCATION TABLE (d20) =====
  injuryLocation: [
    null,
    'Head',       // 1
    'Shoulder',   // 2
    'Shoulder',   // 3
    'Shoulder',   // 4
    'Shoulder',   // 5
    'Elbow',      // 6
    'Elbow',      // 7
    'Elbow',      // 8
    'Elbow',      // 9
    'Forearm',    // 10
    'Wrist',      // 11
    'Hand',       // 12
    'Back',       // 13
    'Back',       // 14
    'Oblique',    // 15
    'Hip',        // 16
    'Hamstring',  // 17
    'Knee',       // 18
    'Ankle',      // 19
    'Foot'        // 20
  ],

  // ===== CATASTROPHIC INJURY TABLE (d6) =====
  // 1: retire (ancient head injury: death), 2-6: permanent stat reduction
  resolveCatastrophicInjury(roll) {
    if (roll === 1) return 'retire';
    return 'permanent_reduction'; // BT reduced by d10+2, or PD by 1
  },

  // ===== TRAITS TABLE (2d10) =====
  traitsTable: {
    batter: {
      2: 'P--', 3: 'P-', 4: 'S-', 5: 'C-', 6: 'D-',
      7: null, 8: null, 9: null, 10: null, 11: null, 12: null, 13: null, 14: null,
      15: 'D+', 16: 'P+', 17: 'C+', 18: 'S+', 19: 'T+', 20: 'P++'
    },
    pitcher: {
      2: null, 3: null, 4: null, 5: 'CN-', 6: null,
      7: null, 8: null, 9: null, 10: null, 11: null, 12: null, 13: null, 14: null,
      15: 'K+', 16: 'GB+', 17: 'CN+', 18: 'ST+', 19: null, 20: null
    }
  },

  // ===== POSITION TABLE (d20) =====
  positionTable: [
    null,
    'UT',  // 1
    'C',   // 2
    '1B',  // 3
    '2B',  // 4
    '3B',  // 5
    'SS',  // 6
    'LF',  // 7
    'CF',  // 8
    'RF',  // 9
    'SP',  // 10
    'SP',  // 11
    'SP',  // 12
    'SP',  // 13
    'SP',  // 14
    'SP',  // 15
    'RP',  // 16
    'RP',  // 17
    'RP',  // 18
    'RP',  // 19
    'RP'   // 20
  ],

  // ===== HANDEDNESS TABLE (d10) =====
  handednessTable: {
    batter: [
      null,
      'R','R','R','R','R','R', // 1-6
      'L','L','L',             // 7-9
      'S'                      // 10 = Switch
    ],
    pitcher: [
      null,
      'R','R','R','R','R','R', // 1-6
      'L','L','L',             // 7-9
      'L'                      // 10 = Left for pitchers
    ]
  },

  // ===== AGING =====
  agingModifier(age) {
    if (age <= 23) return 2;
    if (age <= 26) return 1;
    if (age <= 29) return 0;
    if (age <= 31) return -1;
    if (age <= 33) return -2;
    if (age <= 35) return -3;
    if (age <= 39) return -5;
    return -7; // 40+
  },

  // 2d6 + modifier result
  resolveAging(result) {
    if (result <= 1) return 'severe_decline';   // BT/OBT -5 or PD -2, lose all positive traits
    if (result <= 4) return 'decline';           // BT/OBT -3 or PD -1, lose 1 positive trait
    if (result <= 6) return 'slight_decline';    // BT/OBT -1
    if (result === 7) return 'no_change';
    if (result <= 10) return 'slight_improve';   // BT/OBT +1
    if (result === 11) return 'improve';         // BT/OBT +3 or PD +1
    return 'breakout';                           // BT/OBT +5 or PD +2, gain positive trait
  },

  // ===== FICTIONAL PLAYER GENERATION =====
  // Pitch die generation for fictional pitchers
  fictionalPitchDie: {
    modern: [
      null, // index 0
      12,   // d8 roll 1 = d12
      8,    // 2 = d8
      8,    // 3 = d8
      4,    // 4 = d4
      4,    // 5 = d4
      4,    // 6 = d4
      4,    // 7 = d4
      -4,   // 8 = -d4
    ],
    ancient: [
      null,
      20,   // d12 roll 1 = d20
      12,   // 2 = d12
      12,   // 3 = d12
      8,    // 4 = d8
      8,    // 5 = d8
      6,    // 6 = d6
      6,    // 7 = d6
      6,    // 8 = d6
      4,    // 9 = d4
      4,    // 10 = d4
      0,    // 11 = No Dice!
      -4,   // 12 = -d4
    ]
  },

  // ===== REAL PLAYER TRAIT THRESHOLDS =====
  realPlayerTraits: {
    batter: {
      'P++': { hr: 35, iso: 0.260 },
      'P+':  { hr: 25, iso: 0.225 },
      'C+':  { doubles: 35, kPct: 0.12 },
      'S+':  { sb: 20, bsr: 4.0 },
      'D+':  { drs: 11, fldPct: 0.998 },
      'T+':  { gamesPlayed: 150 },
      'P-':  { hrMax: 10, isoMax: 0.125 },
      'P--': { hrMax: 5, isoMax: 0.100 },
      'C-':  { kPctMin: 0.25 },
      'S-':  { sbMax: 0, bsrMax: -4.0 },
      'D-':  { drsMax: -8, fldPctMax: 0.950 }
    },
    pitcher: {
      'K+':  { kPer9: 10 },
      'GB+': { gbPct: 0.55 },
      'CN+': { bbPer9Max: 2 },
      'ST+': { ip: 200 },
      'CN-': { bbPer9Min: 4 }
    }
  },

  // ===== POSITIONS =====
  allPositions: ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SP', 'RP', 'DH', 'UT'],
  fieldPositions: ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
  pitcherPositions: ['SP', 'RP'],

  // Position is infield if 1B, 2B, 3B, SS, C, P
  isInfield(pos) {
    return ['C', '1B', '2B', '3B', 'SS', 'P'].includes(pos);
  },

  // Position is outfield if LF, CF, RF
  isOutfield(pos) {
    return ['LF', 'CF', 'RF'].includes(pos);
  },

  // Right side of infield (for productive out advancement)
  isRightSide(pos) {
    return ['1B', '2B'].includes(pos);
  }
};

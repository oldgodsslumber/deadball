// Deadball Digital - Era Configuration
var DB = DB || {};

DB.Eras = {
  modern: {
    id: 'modern',
    name: 'Modern Era',
    description: 'Post-1920 baseball (standard rules)',
    rosterSize: 25,
    starters: 8,
    bench: 5,
    startingPitchers: 5,
    relievers: 7,
    hitTable: 'modern',
    fatigueInningThreshold: 6,  // lose PD after this inning
    darknessRule: false,
    dhRule: true,
    pitchDieFromERA: [
      { maxERA: 1.99, pd: 20 },
      { maxERA: 2.99, pd: 12 },
      { maxERA: 3.99, pd: 8 },
      { maxERA: 4.99, pd: 4 },
      { maxERA: 5.99, pd: -4 },
      { maxERA: 6.99, pd: -8 },
      { maxERA: 7.99, pd: -12 },
      { maxERA: Infinity, pd: -20 }
    ]
  },

  ancient: {
    id: 'ancient',
    name: 'Ancient Era',
    description: 'Dead-ball era (1901-1920)',
    rosterSize: 17,
    starters: 8,
    bench: 1,
    startingPitchers: 4,
    relievers: 4,
    hitTable: 'ancient',
    fatigueInningThreshold: 7,
    darknessRule: true,
    dhRule: false,
    pitchDieFromERA: [
      { maxERA: 1.25, pd: 20 },
      { maxERA: 1.99, pd: 12 },
      { maxERA: 2.49, pd: 8 },
      { maxERA: 2.99, pd: 6 },
      { maxERA: 3.49, pd: 4 },
      { maxERA: 3.99, pd: 0 },
      { maxERA: 4.49, pd: -4 },
      { maxERA: 4.99, pd: -6 },
      { maxERA: 5.49, pd: -8 },
      { maxERA: 5.99, pd: -12 },
      { maxERA: Infinity, pd: -20 }
    ]
  },

  juiced: {
    id: 'juiced',
    name: 'Juiced Ball Era',
    description: 'Modern era with juiced ball (2017+)',
    rosterSize: 25,
    starters: 8,
    bench: 5,
    startingPitchers: 5,
    relievers: 7,
    hitTable: 'juiced',
    fatigueInningThreshold: 6,
    darknessRule: false,
    dhRule: true,
    pitchDieFromERA: [
      { maxERA: 1.99, pd: 20 },
      { maxERA: 2.99, pd: 12 },
      { maxERA: 3.99, pd: 8 },
      { maxERA: 4.99, pd: 4 },
      { maxERA: 5.99, pd: -4 },
      { maxERA: 6.99, pd: -8 },
      { maxERA: 7.99, pd: -12 },
      { maxERA: Infinity, pd: -20 }
    ]
  },

  // Convert an ERA to a pitch die value for a given era
  eraToPD(era, eraId) {
    const config = this[eraId];
    if (!config) return 4;
    for (const bracket of config.pitchDieFromERA) {
      if (era <= bracket.maxERA) return bracket.pd;
    }
    return -20;
  }
};

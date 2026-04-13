// Deadball Digital - Dice Utilities
var DB = DB || {};

DB.Dice = {
  // Roll a single die of N sides (1 to N)
  roll(sides) {
    return Math.floor(Math.random() * sides) + 1;
  },

  d4()   { return this.roll(4); },
  d6()   { return this.roll(6); },
  d8()   { return this.roll(8); },
  d10()  { return this.roll(10); },
  d12()  { return this.roll(12); },
  d20()  { return this.roll(20); },
  d100() { return this.roll(100); },

  // Roll 2dN and sum
  roll2d(sides) {
    return this.roll(sides) + this.roll(sides);
  },

  // Roll NdS and sum
  rollNd(n, sides) {
    let total = 0;
    for (let i = 0; i < n; i++) total += this.roll(sides);
    return total;
  },

  // Pitch Die ladder: index 0 = best (d20), index 10 = worst (-d20)
  // Values represent the die: positive = add to MSS, negative = subtract
  PD_LADDER: [20, 12, 8, 6, 4, 0, -4, -6, -8, -12, -20],

  // Roll a pitch die given its signed value
  // d20 = 20, d12 = 12, ... -d4 = -4, etc.
  // Returns the value to ADD to the swing score
  rollPitchDie(pd) {
    if (pd === 0) return 0; // "No Dice!"
    const abs = Math.abs(pd);
    const rolled = this.roll(abs);
    return pd > 0 ? rolled : -rolled;
  },

  // Get the index on the PD ladder for a given pitch die value
  pdIndex(pd) {
    return this.PD_LADDER.indexOf(pd);
  },

  // Move up (better for pitcher) on the PD ladder
  pdUp(pd, levels) {
    levels = levels || 1;
    const idx = this.pdIndex(pd);
    if (idx === -1) return pd;
    return this.PD_LADDER[Math.max(0, idx - levels)];
  },

  // Move down (worse for pitcher) on the PD ladder
  pdDown(pd, levels) {
    levels = levels || 1;
    const idx = this.pdIndex(pd);
    if (idx === -1) return pd;
    return this.PD_LADDER[Math.min(this.PD_LADDER.length - 1, idx + levels)];
  },

  // Format a pitch die value for display
  formatPD(pd) {
    if (pd === 0) return 'No Dice!';
    if (pd > 0) return 'd' + pd;
    return '-d' + Math.abs(pd);
  }
};

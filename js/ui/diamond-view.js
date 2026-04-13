// Deadball Digital - Baseball Diamond SVG View
var DB = DB || {};

DB.DiamondView = {
  // Update base occupation indicators
  updateBases(bases) {
    var b1 = document.getElementById('base-first');
    var b2 = document.getElementById('base-second');
    var b3 = document.getElementById('base-third');
    var r1 = document.getElementById('runner-first');
    var r2 = document.getElementById('runner-second');
    var r3 = document.getElementById('runner-third');

    if (b1) b1.classList.toggle('occupied', !!bases.first);
    if (b2) b2.classList.toggle('occupied', !!bases.second);
    if (b3) b3.classList.toggle('occupied', !!bases.third);
    if (r1) r1.classList.toggle('active', !!bases.first);
    if (r2) r2.classList.toggle('active', !!bases.second);
    if (r3) r3.classList.toggle('active', !!bases.third);
  },

  // Show hit flash animation
  showHitFlash(type) {
    var el = document.getElementById('hit-flash');
    if (!el) return;

    var labels = {
      'single': 'SINGLE!',
      'double': 'DOUBLE!',
      'triple': 'TRIPLE!',
      'homerun': 'HOME RUN!',
      'strikeout': 'STRIKEOUT!',
      'walk': 'WALK',
      'error': 'ERROR!',
      'hbp': 'HIT BY PITCH',
      'oddity': 'ODDITY!',
      'out': 'OUT',
      'double_play': 'DOUBLE PLAY!',
      'triple_play': 'TRIPLE PLAY!'
    };

    el.textContent = labels[type] || type.toUpperCase();
    el.className = 'hit-flash ' + type;

    // Trigger animation
    el.classList.remove('show');
    void el.offsetWidth; // force reflow
    el.classList.add('show');
  },

  // Move ball smoothly to a position (uses CSS transition)
  moveBall(cx, cy) {
    var ball = document.getElementById('ball');
    if (!ball) return;
    ball.setAttribute('cx', cx);
    ball.setAttribute('cy', cy);
    ball.classList.add('active');
  },

  // Instantly reposition ball without transition (for resetting between plays)
  placeBall(cx, cy) {
    var ball = document.getElementById('ball');
    if (!ball) return;
    ball.classList.add('no-transition');
    ball.setAttribute('cx', cx);
    ball.setAttribute('cy', cy);
    // Force reflow so the no-transition class takes effect before we remove it
    void ball.getBoundingClientRect();
    ball.classList.remove('no-transition');
  },

  hideBall() {
    var ball = document.getElementById('ball');
    if (!ball) return;
    ball.classList.remove('active');
    // Reset position instantly so next play starts clean
    ball.classList.add('no-transition');
    ball.setAttribute('cx', 200);
    ball.setAttribute('cy', 165);
    void ball.getBoundingClientRect();
    ball.classList.remove('no-transition');
  },

  // Field positions for ball targets
  fieldPos: {
    'P':    { cx: 200, cy: 165 },
    'C':    { cx: 200, cy: 240 },
    '1B':   { cx: 300, cy: 175 },
    '2B':   { cx: 260, cy: 140 },
    '3B':   { cx: 100, cy: 175 },
    'SS':   { cx: 140, cy: 140 },
    'LF':   { cx: 80,  cy: 80 },
    'CF':   { cx: 200, cy: 50 },
    'RF':   { cx: 320, cy: 80 },
    'home': { cx: 200, cy: 270 }
  },

  // Animate a runner scoring
  animateScore(base) {
    var runner = document.getElementById('runner-' + base);
    if (runner) {
      runner.classList.add('scoring');
      setTimeout(function() {
        runner.classList.remove('scoring');
        runner.classList.remove('active');
      }, 800);
    }
  },

  // ===== FULL PLAY ANIMATION SEQUENCE =====
  // Phase 1: Pitch (ball from mound to plate)
  // Phase 2: Hit result (ball travels to field) or miss (strikeout/walk)
  // Phase 3: Flash label
  // Phase 4: Runner movement
  // Phase 5: Update bases, callback
  animatePlay(event, callback) {
    var delay = 0;
    var speed = DB.DiamondView.animSpeed || 600;
    var halfSpeed = Math.round(speed * 0.5);

    // === PHASE 1: PITCH — ball from mound toward home plate ===
    DB.DiamondView.placeBall(200, 165); // instantly place at pitcher (no transition)
    // Make visible, then after a tick animate toward the plate
    var ball = document.getElementById('ball');
    if (ball) ball.classList.add('active');
    setTimeout(function() {
      DB.DiamondView.moveBall(200, 250); // pitch to plate (smooth transition)
    }, 60);
    delay += halfSpeed;

    // === PHASE 2: CONTACT / RESULT ===
    if (event.result === 'hit') {
      // Ball launches into the field
      var target = DB.DiamondView.getHitTarget(event);
      setTimeout(function() {
        DB.DiamondView.moveBall(target.cx, target.cy);
      }, delay);
      delay += speed;

    } else if (event.result === 'out' && event.outType) {
      if (event.outType.type === 'strikeout') {
        // Ball stays at catcher (caught pitch)
        setTimeout(function() {
          DB.DiamondView.moveBall(200, 245);
        }, delay);
        delay += halfSpeed;
      } else {
        // Ball hit into field toward fielder
        var outTarget = DB.DiamondView.fieldPos[event.outType.fielder] || DB.DiamondView.fieldPos['SS'];
        setTimeout(function() {
          DB.DiamondView.moveBall(outTarget.cx, outTarget.cy);
        }, delay);
        delay += speed;
      }

    } else if (event.result === 'walk' || event.result === 'hbp') {
      // Ball stays near plate area
      setTimeout(function() {
        DB.DiamondView.moveBall(200, 255);
      }, delay);
      delay += halfSpeed;

    } else if (event.result === 'error') {
      // Ball goes to fielder then bobbles
      var errTarget = DB.DiamondView.fieldPos['SS'];
      setTimeout(function() {
        DB.DiamondView.moveBall(errTarget.cx, errTarget.cy);
      }, delay);
      delay += speed;

    } else if (event.result === 'oddity') {
      delay += halfSpeed;
    }

    // === PHASE 3: FLASH LABEL ===
    setTimeout(function() {
      DB.DiamondView.hideBall();
      if (event.result === 'hit') {
        DB.DiamondView.showHitFlash(event.hitType);
      } else if (event.result === 'walk') {
        DB.DiamondView.showHitFlash('walk');
      } else if (event.result === 'hbp') {
        DB.DiamondView.showHitFlash('hbp');
      } else if (event.result === 'error') {
        DB.DiamondView.showHitFlash('error');
      } else if (event.result === 'oddity') {
        DB.DiamondView.showHitFlash('oddity');
      } else if (event.result === 'out') {
        if (event.outsAdded >= 3) DB.DiamondView.showHitFlash('triple_play');
        else if (event.outsAdded >= 2) DB.DiamondView.showHitFlash('double_play');
        else if (event.outType && event.outType.type === 'strikeout') DB.DiamondView.showHitFlash('strikeout');
        else DB.DiamondView.showHitFlash('out');
      }
    }, delay);
    delay += speed;

    // === PHASE 4: RUNNER SCORING ===
    if (event.scored && event.scored.length > 0) {
      setTimeout(function() {
        ['third', 'second', 'first'].forEach(function(base) {
          DB.DiamondView.animateScore(base);
        });
      }, delay);
      delay += speed;
    }

    // === PHASE 5: UPDATE BASES + CALLBACK ===
    setTimeout(function() {
      if (event.newBases) {
        DB.DiamondView.updateBases(event.newBases);
      }
      if (callback) callback();
    }, delay);
  },

  // Determine where a hit ball should go
  getHitTarget(event) {
    // If DEF fielder, aim at them
    if (event.defResult && event.defResult.fielder) {
      var pos = typeof event.defResult.fielder === 'string'
        ? event.defResult.fielder
        : event.defResult.fielder.position;
      if (DB.DiamondView.fieldPos[pos]) return DB.DiamondView.fieldPos[pos];
    }

    // By hit type
    switch (event.hitType) {
      case 'homerun': return { cx: 200, cy: 20 };  // over the fence
      case 'triple':  return DB.DiamondView.fieldPos['RF'];
      case 'double':  return DB.DiamondView.fieldPos[Math.random() < 0.5 ? 'LF' : 'RF'];
      case 'single':
      default:
        // Randomly pick a gap
        var singles = ['SS', '2B', 'LF', 'CF', 'RF'];
        var pick = singles[Math.floor(Math.random() * singles.length)];
        return DB.DiamondView.fieldPos[pick];
    }
  },

  animSpeed: 600,

  setAnimSpeed(speed) {
    DB.DiamondView.animSpeed = speed;
  }
};

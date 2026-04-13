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

  // Animate ball to a field position
  animateBall(targetPos) {
    var ball = document.getElementById('ball');
    if (!ball) return;

    var positions = {
      'P':  { cx: 200, cy: 165 },
      'C':  { cx: 200, cy: 240 },
      '1B': { cx: 300, cy: 175 },
      '2B': { cx: 260, cy: 140 },
      '3B': { cx: 100, cy: 175 },
      'SS': { cx: 140, cy: 140 },
      'LF': { cx: 80,  cy: 80 },
      'CF': { cx: 200, cy: 50 },
      'RF': { cx: 320, cy: 80 },
      'home': { cx: 200, cy: 270 }
    };

    var target = positions[targetPos] || positions['CF'];

    // Start at pitcher
    ball.setAttribute('cx', 200);
    ball.setAttribute('cy', 165);
    ball.classList.add('active');

    // Animate to target
    setTimeout(function() {
      ball.setAttribute('cx', target.cx);
      ball.setAttribute('cy', target.cy);
    }, 50);

    // Hide after animation
    setTimeout(function() {
      ball.classList.remove('active');
    }, 800);
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

  // Full play animation sequence
  animatePlay(event, callback) {
    var delay = 0;
    var animSpeed = DB.DiamondView.animSpeed || 600;

    // Show ball trajectory based on result
    if (event.result === 'hit') {
      var hitPositions = {
        'single': event.hitType === 'single' ? 'SS' : 'CF',
        'double': 'LF',
        'triple': 'RF',
        'homerun': 'CF'
      };
      // If there's a DEF fielder, animate to them
      if (event.defResult && event.defResult.fielder) {
        DB.DiamondView.animateBall(event.defResult.fielder.position || 'CF');
      } else {
        DB.DiamondView.animateBall(hitPositions[event.hitType] || 'CF');
      }
      delay += animSpeed;
    } else if (event.result === 'out' && event.outType) {
      DB.DiamondView.animateBall(event.outType.fielder || 'P');
      delay += animSpeed;
    }

    // Show flash
    setTimeout(function() {
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
    delay += animSpeed;

    // Animate scoring runners
    if (event.scored && event.scored.length > 0) {
      setTimeout(function() {
        // Figure out which bases had runners that scored
        ['third', 'second', 'first'].forEach(function(base) {
          event.scored.forEach(function(p) {
            DB.DiamondView.animateScore(base);
          });
        });
      }, delay);
      delay += animSpeed;
    }

    // Update bases after all animations
    setTimeout(function() {
      if (event.newBases) {
        DB.DiamondView.updateBases(event.newBases);
      }
      if (callback) callback();
    }, delay);
  },

  animSpeed: 600,

  setAnimSpeed(speed) {
    DB.DiamondView.animSpeed = speed;
  }
};

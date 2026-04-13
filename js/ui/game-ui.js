// Deadball Digital - Game UI
var DB = DB || {};

DB.GameUI = {
  gameState: null,
  isAnimating: false,

  // Initialize a game with two teams
  setupGame() {
    if (DB.App.teams.length < 2) {
      alert('You need at least 2 teams to start a game. Create teams first!');
      return;
    }

    var html = '<h3>Select Teams</h3>';
    html += '<div class="grid-2col" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">';

    // Away team
    html += '<div class="form-group"><label>Away Team</label><select id="setup-away">';
    DB.App.teams.forEach(function(t, i) {
      html += '<option value="' + i + '">' + t.name + ' (TS: ' + t.teamScore + ')</option>';
    });
    html += '</select></div>';

    // Home team
    html += '<div class="form-group"><label>Home Team</label><select id="setup-home">';
    DB.App.teams.forEach(function(t, i) {
      html += '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + t.name + ' (TS: ' + t.teamScore + ')</option>';
    });
    html += '</select></div>';
    html += '</div>';

    // Game mode
    html += '<div class="form-group"><label>Game Mode</label><select id="setup-mode">';
    html += '<option value="pass-and-play">Pass & Play (2 Players)</option>';
    html += '<option value="solo-home">Solo (You play Home)</option>';
    html += '<option value="solo-away">Solo (You play Away)</option>';
    html += '<option value="sim">Watch Simulation</option>';
    html += '</select></div>';

    html += '<button class="btn btn-primary btn-block" onclick="DB.GameUI.startGame()">Play Ball!</button>';

    DB.Screens.render('game-setup-content', html);
    DB.Screens.show('game-setup');
  },

  startGame() {
    var awayIdx = parseInt(document.getElementById('setup-away').value);
    var homeIdx = parseInt(document.getElementById('setup-home').value);
    var mode = document.getElementById('setup-mode').value;

    if (awayIdx === homeIdx) {
      alert('Please select different teams!');
      return;
    }

    var awayTeam = DB.App.teams[awayIdx];
    var homeTeam = DB.App.teams[homeIdx];

    var aiSide = null;
    var actualMode = mode;
    if (mode === 'solo-home') { aiSide = 'away'; actualMode = 'solo'; }
    if (mode === 'solo-away') { aiSide = 'home'; actualMode = 'solo'; }

    DB.GameUI.gameState = DB.GameState.create(homeTeam, awayTeam, {
      era: DB.App.currentEra,
      mode: actualMode,
      aiSide: aiSide
    });

    DB.App.currentGame = DB.GameUI.gameState;
    DB.Screens.show('game');
    DB.GameUI.updateDisplay();

    // Add initial log entry
    DB.GameUI.addLog('=== ' + awayTeam.name + ' at ' + homeTeam.name + ' ===', 'inning-break');
    DB.GameUI.addLog('=== Top of inning 1 ===', 'inning-break');

    // Kick off AI or sim if needed
    DB.GameUI.checkAutoPlay();
  },

  // Main swing action
  doSwing() {
    if (DB.GameUI.isAnimating || !DB.GameUI.gameState || DB.GameUI.gameState.isComplete) return;
    DB.GameUI.isAnimating = true;

    var gs = DB.GameUI.gameState;
    var event = DB.AtBat.resolve(gs);
    DB.GameState.processAtBat(gs, event);

    // Log
    event.log.forEach(function(msg) {
      var cls = '';
      if (msg.indexOf('SCORES') !== -1) cls = 'score';
      else if (msg.indexOf('CRITICAL') !== -1 || msg.indexOf('HOME RUN') !== -1) cls = 'highlight';
      else if (msg.indexOf('Out') !== -1 || msg.indexOf('DOUBLE PLAY') !== -1) cls = 'out';
      else if (msg.indexOf('===') !== -1 || msg.indexOf('---') !== -1) cls = 'inning-break';
      DB.GameUI.addLog(msg, cls);
    });

    // Animate
    DB.DiamondView.animatePlay(event, function() {
      DB.GameUI.updateDisplay();
      DB.GameUI.isAnimating = false;

      // Check game over
      if (gs.isComplete) {
        DB.GameUI.showGameOver();
        return;
      }

      // AI fielding decisions (pitching changes between at-bats)
      if (gs.mode === 'solo' && DB.AIManager.isAIFielding(gs)) {
        var fieldDecision = DB.AIManager.decideFielding(gs);
        if (fieldDecision.action === 'pitching_change' && fieldDecision.pitcher) {
          var side = gs.aiSide;
          DB.GameState.substitutePitcher(gs, fieldDecision.pitcher, side);
          DB.GameUI.addLog(fieldDecision.desc, '');
          DB.GameUI.updateDisplay();
        }
      }

      // Auto-play next at-bat if AI is batting or sim mode
      DB.GameUI.checkAutoPlay();
    });
  },

  // Check if AI or sim should auto-play the next at-bat
  checkAutoPlay() {
    var gs = DB.GameUI.gameState;
    if (!gs || gs.isComplete) return;

    // Sim mode: auto-continue all at-bats
    if (gs.mode === 'sim') {
      setTimeout(function() { DB.GameUI.doSwing(); }, 100);
      return;
    }

    // Solo mode: auto-play when AI is batting
    if (gs.mode === 'solo' && DB.AIManager.isAIBatting(gs)) {
      var decision = DB.AIManager.decide(gs);
      setTimeout(function() {
        if (decision.action === 'steal') DB.GameUI.doSteal();
        else if (decision.action === 'bunt') DB.GameUI.doBunt();
        else if (decision.action === 'hitandrun') DB.GameUI.doHitAndRun();
        else DB.GameUI.doSwing();
      }, 300);
      return;
    }
  },

  // Steal action
  doSteal() {
    if (DB.GameUI.isAnimating || !DB.GameUI.gameState) return;
    var gs = DB.GameUI.gameState;

    // Find a runner to steal
    var runner = null;
    var stealBase = null;
    if (gs.bases.second && !gs.bases.third) {
      runner = gs.bases.second;
      stealBase = 'third';
    } else if (gs.bases.first && !gs.bases.second) {
      runner = gs.bases.first;
      stealBase = 'second';
    }

    if (!runner) {
      // No valid steal target -- fall back to swing if AI, otherwise just log
      if (gs.mode === 'solo' && DB.AIManager.isAIBatting(gs)) {
        DB.GameUI.doSwing();
        return;
      }
      DB.GameUI.addLog('No runner available to steal.', '');
      return;
    }

    var catcher = DB.Defense.findFielder('C', DB.AtBat.getFieldingTeam(gs));
    var result = DB.Baserunning.attemptSteal(runner, stealBase, catcher);
    DB.GameUI.addLog(result.desc, result.success ? 'highlight' : 'out');

    if (result.success) {
      if (stealBase === 'second') {
        gs.bases.second = gs.bases.first;
        gs.bases.first = null;
      } else if (stealBase === 'third') {
        gs.bases.third = gs.bases.second;
        gs.bases.second = null;
      }
      runner.gameStats.sb++;
    } else {
      if (stealBase === 'second') gs.bases.first = null;
      else if (stealBase === 'third') gs.bases.second = null;
      gs.outs++;
      runner.gameStats.cs++;
      if (gs.outs >= 3) DB.GameState.endHalfInning(gs);
    }

    DB.DiamondView.updateBases(gs.bases);
    DB.GameUI.updateDisplay();
    // Continue AI turn if applicable
    DB.GameUI.checkAutoPlay();
  },

  // Bunt action
  doBunt() {
    if (DB.GameUI.isAnimating || !DB.GameUI.gameState) return;
    var gs = DB.GameUI.gameState;

    if (DB.Baserunning.runnersOn(gs.bases) === 0) {
      // No runners -- fall back to swing if AI
      if (gs.mode === 'solo' && DB.AIManager.isAIBatting(gs)) {
        DB.GameUI.doSwing();
        return;
      }
      DB.GameUI.addLog('No runners on base to bunt.', '');
      return;
    }

    var batter = DB.AtBat.getCurrentBatter(gs);
    var result = DB.Baserunning.resolveBunt(gs.bases, batter, gs.era);

    DB.GameUI.addLog(result.desc, result.outs > 0 ? 'out' : 'highlight');

    if (result.bases) gs.bases = result.bases;
    gs.outs += result.outs;
    if (result.scored) {
      result.scored.forEach(function(p) {
        var key = gs.halfInning === 'top' ? 'away' : 'home';
        gs.score[key]++;
        gs.halfInningRuns++;
        DB.GameUI.addLog(p.name + ' SCORES on the bunt!', 'score');
      });
    }

    if (result.isBuntHit) {
      // Treat as single
      var hitResult = DB.Baserunning.resolveHit(gs.bases, batter, 'single', 1, false);
      gs.bases = hitResult.bases;
      hitResult.scored.forEach(function(p) {
        var key = gs.halfInning === 'top' ? 'away' : 'home';
        gs.score[key]++;
        gs.halfInningRuns++;
      });
      batter.gameStats.h++;
    }

    batter.gameStats.ab++;
    DB.AtBat.advanceBatterIndex(gs);

    if (gs.outs >= 3) DB.GameState.endHalfInning(gs);

    DB.DiamondView.updateBases(gs.bases);
    DB.GameUI.updateDisplay();
    // Continue AI turn if applicable
    DB.GameUI.checkAutoPlay();
  },

  // Hit and Run
  doHitAndRun() {
    if (DB.GameUI.isAnimating || !DB.GameUI.gameState) return;
    var gs = DB.GameUI.gameState;

    if (!gs.bases.first) {
      // No runner on first -- fall back to swing if AI
      if (gs.mode === 'solo' && DB.AIManager.isAIBatting(gs)) {
        DB.GameUI.doSwing();
        return;
      }
      DB.GameUI.addLog('Need a runner on first for hit and run.', '');
      return;
    }

    var batter = DB.AtBat.getCurrentBatter(gs);
    var hnr = DB.Baserunning.resolveHitAndRun(gs.bases, batter, null, gs.era);

    DB.GameUI.addLog('Hit and run! Steal roll: ' + hnr.stealRoll + (hnr.stealSuccess ? ' (safe)' : ' (out)'), '');

    // Resolve the at-bat with BT/OBT bonus
    var event = DB.AtBat.resolve(gs, {
      batter: batter,
      btBonus: hnr.btBonus,
      obtBonus: hnr.obtBonus
    });

    // Apply hit-and-run special outcomes
    if (event.result === 'out') {
      if (event.outType && event.outType.type === 'strikeout') {
        if (!hnr.stealSuccess) {
          event.outsAdded = 2;
          gs.bases.first = null;
          DB.GameUI.addLog('Strikeout + caught stealing! Double play!', 'out');
        }
      } else if (event.outType && event.outType.isGroundball) {
        if (!hnr.stealSuccess) {
          event.outsAdded = 2;
          gs.bases.first = null;
          DB.GameUI.addLog('Groundball double play!', 'out');
        } else {
          gs.bases.second = gs.bases.first;
          gs.bases.first = null;
          DB.GameUI.addLog('Runner reaches second on the hit and run.', '');
        }
      }
    } else if (event.result === 'hit' && hnr.stealSuccess) {
      // Runner gets extra advancement
      DB.GameUI.addLog('Hit and run succeeds! Runner advances extra.', 'highlight');
    }

    DB.GameState.processAtBat(gs, event);
    event.log.forEach(function(msg) { DB.GameUI.addLog(msg, ''); });

    DB.DiamondView.updateBases(gs.bases);
    DB.GameUI.updateDisplay();
    // Continue AI turn if applicable
    DB.GameUI.checkAutoPlay();
  },

  // Show substitution modal
  showSubstitution() {
    var gs = DB.GameUI.gameState;
    if (!gs) return;

    var html = '<h3>Substitutions</h3>';

    // Pitching change
    var fieldingTeam = DB.AtBat.getFieldingTeam(gs);
    var pitcherKey = gs.halfInning === 'top' ? 'home' : 'away';

    html += '<h4>Pitching Change</h4>';
    html += '<div class="form-group">';
    html += '<label>Current: ' + gs.currentPitcher[pitcherKey].name +
      ' (' + DB.Dice.formatPD(gs.currentPitcher[pitcherKey].currentPitchDie) + ')</label>';
    html += '<select id="sub-pitcher">';
    html += '<option value="">-- No change --</option>';
    fieldingTeam.bullpen.forEach(function(p, i) {
      var avail = p.restDaysRemaining === 0 && p !== gs.currentPitcher[pitcherKey];
      if (avail) {
        html += '<option value="' + i + '">' + p.name + ' (' + DB.Dice.formatPD(p.pitchDie) + ')</option>';
      }
    });
    html += '</select></div>';

    // Pinch hitter
    var battingTeam = DB.AtBat.getBattingTeam(gs);
    html += '<h4>Pinch Hitter</h4>';
    html += '<div class="form-group">';
    html += '<label>Current batter: ' + DB.AtBat.getCurrentBatter(gs).name + '</label>';
    html += '<select id="sub-batter">';
    html += '<option value="">-- No change --</option>';
    battingTeam.bench.forEach(function(p, i) {
      html += '<option value="' + i + '">' + p.name + ' (BT:' + p.bt + ' OBT:' + p.obt + ')</option>';
    });
    html += '</select></div>';

    html += '<div class="btn-group">';
    html += '<button class="btn btn-primary" onclick="DB.GameUI.applySubs()">Apply</button>';
    html += '<button class="btn btn-secondary" onclick="DB.GameUI.closeModal()">Cancel</button>';
    html += '</div>';

    DB.GameUI.showModal(html);
  },

  applySubs() {
    var gs = DB.GameUI.gameState;
    var pitcherSel = document.getElementById('sub-pitcher');
    var batterSel = document.getElementById('sub-batter');

    if (pitcherSel && pitcherSel.value !== '') {
      var fieldingTeam = DB.AtBat.getFieldingTeam(gs);
      var pitcherKey = gs.halfInning === 'top' ? 'home' : 'away';
      var newPitcher = fieldingTeam.bullpen[parseInt(pitcherSel.value)];
      DB.GameState.substitutePitcher(gs, newPitcher, pitcherKey);
      DB.GameUI.addLog(gs.log[gs.log.length - 1], '');
    }

    if (batterSel && batterSel.value !== '') {
      var battingTeam = DB.AtBat.getBattingTeam(gs);
      var side = gs.halfInning === 'bottom' ? 'home' : 'away';
      var newBatter = battingTeam.bench[parseInt(batterSel.value)];
      DB.GameState.pinchHit(gs, newBatter, side);
      DB.GameUI.addLog(gs.log[gs.log.length - 1], '');
    }

    DB.GameUI.closeModal();
    DB.GameUI.updateDisplay();
  },

  // Update all display elements
  updateDisplay() {
    var gs = DB.GameUI.gameState;
    if (!gs) return;

    // Team names
    var awayName = document.getElementById('away-team-name');
    var homeName = document.getElementById('home-team-name');
    if (awayName) awayName.textContent = gs.awayTeam.name;
    if (homeName) homeName.textContent = gs.homeTeam.name;

    // Scores
    var awayScore = document.getElementById('away-score');
    var homeScore = document.getElementById('home-score');
    if (awayScore) awayScore.textContent = gs.score.away;
    if (homeScore) homeScore.textContent = gs.score.home;

    // Inning
    var inningEl = document.getElementById('inning-display');
    if (inningEl) inningEl.textContent = DB.GameState.getInningDisplay(gs);

    // Outs
    for (var i = 1; i <= 3; i++) {
      var dot = document.getElementById('out-' + i);
      if (dot) dot.classList.toggle('active', i <= gs.outs);
    }

    // Bases
    DB.DiamondView.updateBases(gs.bases);

    // At-bat info
    var batter = DB.AtBat.getCurrentBatter(gs);
    var pitcher = DB.AtBat.getCurrentPitcher(gs);

    var batterNameEl = document.getElementById('batter-name');
    var batterStatsEl = document.getElementById('batter-stats');
    var pitcherNameEl = document.getElementById('pitcher-name');
    var pitcherStatsEl = document.getElementById('pitcher-stats');

    if (batterNameEl) batterNameEl.textContent = batter.name;
    if (batterStatsEl) {
      var traits = batter.traits.length > 0 ? ' [' + batter.traits.join(', ') + ']' : '';
      batterStatsEl.textContent = batter.position + ' ' + batter.handedness +
        ' | BT:' + batter.bt + ' OBT:' + batter.obt + traits;
    }
    if (pitcherNameEl) pitcherNameEl.textContent = pitcher.name;
    if (pitcherStatsEl) {
      var pd = pitcher.currentPitchDie != null ? pitcher.currentPitchDie : pitcher.pitchDie;
      var pTraits = pitcher.traits.length > 0 ? ' [' + pitcher.traits.join(', ') + ']' : '';
      pitcherStatsEl.textContent = pitcher.handedness + ' | PD:' +
        DB.Dice.formatPD(pd) + pTraits;
    }

    // Line score
    DB.GameUI.updateLineScore(gs);

    // Action bar visibility
    var isHumanBatting = gs.mode !== 'sim' &&
      (gs.mode !== 'solo' || !DB.AIManager.isAIBatting(gs));
    var actionBar = document.getElementById('action-bar');
    if (actionBar) {
      if (isHumanBatting && !gs.isComplete) {
        actionBar.classList.remove('hidden');
      } else {
        actionBar.classList.add('hidden');
      }
    }
  },

  updateLineScore(gs) {
    var container = document.getElementById('line-score-container');
    if (!container) return;

    var maxInnings = Math.max(9, gs.inning);
    var html = '<table><tr><th></th>';
    for (var i = 1; i <= maxInnings; i++) {
      html += '<th class="' + (i === gs.inning ? 'current-inning' : '') + '">' + i + '</th>';
    }
    html += '<th>R</th><th>H</th></tr>';

    // Away
    html += '<tr><td>' + (gs.awayTeam.name.length > 10 ? gs.awayTeam.mascot || 'AWY' : gs.awayTeam.name) + '</td>';
    for (var j = 0; j < maxInnings; j++) {
      html += '<td>' + (gs.lineScore.away[j] != null ? gs.lineScore.away[j] : '') + '</td>';
    }
    var awayHits = 0;
    gs.awayTeam.lineup.forEach(function(p) { awayHits += p.gameStats.h; });
    html += '<td><b>' + gs.score.away + '</b></td><td>' + awayHits + '</td></tr>';

    // Home
    html += '<tr><td>' + (gs.homeTeam.name.length > 10 ? gs.homeTeam.mascot || 'HME' : gs.homeTeam.name) + '</td>';
    for (var k = 0; k < maxInnings; k++) {
      html += '<td>' + (gs.lineScore.home[k] != null ? gs.lineScore.home[k] : '') + '</td>';
    }
    var homeHits = 0;
    gs.homeTeam.lineup.forEach(function(p) { homeHits += p.gameStats.h; });
    html += '<td><b>' + gs.score.home + '</b></td><td>' + homeHits + '</td></tr>';

    html += '</table>';
    container.innerHTML = html;
  },

  // Add to play-by-play log
  addLog(msg, cls) {
    var log = document.getElementById('play-log');
    if (!log) return;
    var entry = document.createElement('div');
    entry.className = 'entry' + (cls ? ' ' + cls : '');
    entry.textContent = msg;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  },

  // Game over
  showGameOver() {
    var gs = DB.GameUI.gameState;
    setTimeout(function() {
      var html = '<div class="scoreboard" style="margin-bottom:20px;">';
      html += '<h2>FINAL</h2>';
      html += '<div class="teams"><div>';
      html += '<div class="team-name">' + gs.awayTeam.name + '</div>';
      html += '<div class="score">' + gs.score.away + '</div>';
      html += '</div><div>';
      html += '<div class="team-name">' + gs.homeTeam.name + '</div>';
      html += '<div class="score">' + gs.score.home + '</div>';
      html += '</div></div></div>';

      // Box score
      html += '<h3>Box Score</h3>';
      html += DB.GameUI.renderBoxScore(gs.awayTeam, 'Away');
      html += DB.GameUI.renderBoxScore(gs.homeTeam, 'Home');

      // Pitching summary
      html += '<h3>Pitching</h3>';
      html += DB.GameUI.renderPitchingScore(gs);

      DB.Screens.render('post-game-content', html);
      DB.Screens.show('post-game');
    }, 1500);
  },

  renderBoxScore(team, label) {
    var html = '<h4>' + label + ': ' + team.name + '</h4>';
    html += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    html += '<table class="data-table"><tr><th>Name</th><th>Pos</th><th>AB</th><th>H</th><th>HR</th><th>RBI</th><th>BB</th><th>K</th><th>R</th></tr>';
    team.lineup.forEach(function(p) {
      var s = p.gameStats;
      html += '<tr><td>' + p.name + '</td><td>' + p.position + '</td>';
      html += '<td>' + s.ab + '</td><td>' + s.h + '</td><td>' + s.hr + '</td>';
      html += '<td>' + s.rbi + '</td><td>' + s.bb + '</td><td>' + s.k + '</td><td>' + s.r + '</td></tr>';
    });
    html += '</table></div>';
    return html;
  },

  renderPitchingScore(gs) {
    var html = '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    html += '<table class="data-table"><tr><th>Name</th><th>Team</th><th>IP</th><th>H</th><th>R</th><th>BB</th><th>K</th></tr>';
    var allPitchers = DB.Team.getAllPlayers(gs.homeTeam).concat(DB.Team.getAllPlayers(gs.awayTeam));
    allPitchers.forEach(function(p) {
      if (p.isPitcher && p.pitchingStats.ip > 0 || p.outsRecorded > 0) {
        var ip = Math.floor(p.outsRecorded / 3) + '.' + (p.outsRecorded % 3);
        var s = p.pitchingStats;
        var teamName = gs.homeTeam.lineup.indexOf(p) !== -1 || gs.homeTeam.rotation.indexOf(p) !== -1 || gs.homeTeam.bullpen.indexOf(p) !== -1 ? gs.homeTeam.name : gs.awayTeam.name;
        html += '<tr><td>' + p.name + '</td><td>' + teamName + '</td>';
        html += '<td>' + ip + '</td><td>' + s.h + '</td><td>' + s.r + '</td>';
        html += '<td>' + s.bb + '</td><td>' + s.k + '</td></tr>';
      }
    });
    html += '</table></div>';
    return html;
  },

  // Game menu
  showGameMenu() {
    var html = '<h3>Game Menu</h3>';
    html += '<div style="display:flex; flex-direction:column; gap:10px;">';
    html += '<button class="btn btn-primary" onclick="DB.Save.save(DB.App.currentSaveSlot || 1); DB.GameUI.addLog(\'Game saved!\', \'\'); DB.GameUI.closeModal();">Save Game</button>';
    html += '<button class="btn btn-secondary" onclick="DB.DiamondView.setAnimSpeed(DB.DiamondView.animSpeed === 600 ? 200 : 600); DB.GameUI.closeModal();">Toggle Speed</button>';
    html += '<button class="btn btn-secondary" onclick="DB.GameUI.closeModal(); DB.Screens.show(\'main-menu\');">Quit to Menu</button>';
    html += '<button class="btn btn-secondary" onclick="DB.GameUI.closeModal();">Resume</button>';
    html += '</div>';
    DB.GameUI.showModal(html);
  },

  // Modal helpers
  showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }
};

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.id === 'modal-overlay') DB.GameUI.closeModal();
});

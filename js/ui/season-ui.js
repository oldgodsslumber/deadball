// Deadball Digital - Season Mode UI
var DB = DB || {};

DB.SeasonUI = {
  // ===== BEGIN SEASON =====
  showBeginSeason() {
    var teams = DB.App.teams;
    if (teams.length < 4) {
      alert('You need at least 4 teams to start a season. You have ' + teams.length + '.');
      return;
    }

    var html = '<div class="card">';
    html += '<h3>Begin Season</h3>';
    html += '<p class="subtitle">' + teams.length + ' teams will compete.</p>';

    html += '<div class="form-group"><label>Season Length</label>';
    html += '<select id="season-length">';
    html += '<option value="short">Short Season (40 games)</option>';
    html += '<option value="half" selected>Half Season (81 games)</option>';
    html += '<option value="full">Full Season (162 games)</option>';
    html += '<option value="custom">Custom</option>';
    html += '</select></div>';

    html += '<div class="form-group hidden" id="custom-games-group"><label>Games Per Team</label>';
    html += '<input type="number" id="custom-games" value="81" min="10" max="200"></div>';

    html += '<h4>Division Preview</h4>';
    var divisions = DB.Season.buildDivisions(teams);
    Object.keys(divisions).forEach(function(div) {
      html += '<p><strong>' + div + ':</strong> ';
      html += divisions[div].map(function(tid) {
        for (var i = 0; i < teams.length; i++) { if (teams[i].id === tid) return teams[i].name; }
        return '?';
      }).join(', ');
      html += '</p>';
    });

    html += '<button class="btn btn-primary btn-block" onclick="DB.SeasonUI.startSeason()" style="margin-top:16px;">Play Ball!</button>';
    html += '</div>';

    DB.Screens.render('season-content', html);
    DB.Screens.show('season');

    // Toggle custom games input
    document.getElementById('season-length').addEventListener('change', function() {
      var cg = document.getElementById('custom-games-group');
      if (cg) cg.classList.toggle('hidden', this.value !== 'custom');
    });
  },

  startSeason() {
    var length = document.getElementById('season-length').value;
    var customGames = parseInt(document.getElementById('custom-games').value) || 81;

    var season = DB.Season.create(DB.App.teams, {
      seasonLength: length,
      customGames: customGames,
      era: DB.App.currentEra
    });

    DB.App.season = season;
    DB.Save.autoSave();
    DB.SeasonUI.showWeek();
  },

  // ===== WEEKLY VIEW =====
  showWeek() {
    var season = DB.App.season;
    if (!season) return;

    // Check for all-star break
    if (season.currentWeek === season.allStarWeek && !season.allStarDone) {
      season.phase = 'allstar';
      DB.SeasonUI.showAllStar();
      return;
    }

    // Check if regular season is over
    if (season.currentWeek >= season.schedule.length) {
      if (!season.playoffsStarted) {
        DB.SeasonUI.showPrePlayoffs();
      } else {
        DB.SeasonUI.showPlayoffs();
      }
      return;
    }

    season.phase = 'regular';
    var week = season.schedule[season.currentWeek];

    var html = '<div class="card">';
    html += '<div class="card-header"><h3>Week ' + (season.currentWeek + 1) + ' of ' + season.schedule.length + '</h3>';
    html += '<span class="era-badge">' + season.phase + '</span></div>';

    // This week's matchups
    html += '<h4>This Week\'s Games</h4>';
    html += '<div style="overflow-x:auto;">';
    html += '<table class="data-table"><tr><th>Away</th><th>vs</th><th>Home</th><th>Action</th></tr>';
    week.forEach(function(game, idx) {
      var awayName = season.teamNames[game.away] || '?';
      var homeName = season.teamNames[game.home] || '?';
      html += '<tr>';
      html += '<td>' + awayName + '</td><td>@</td><td>' + homeName + '</td>';
      html += '<td>';
      html += '<button class="btn btn-small btn-primary" onclick="DB.SeasonUI.playGame(' + idx + ')">Play</button> ';
      html += '<button class="btn btn-small btn-secondary" onclick="DB.SeasonUI.simGame(' + idx + ')">Sim</button>';
      html += '</td>';
      html += '</tr>';
    });
    html += '</table></div>';

    html += '<div class="btn-group" style="margin-top:12px;">';
    html += '<button class="btn btn-warning" onclick="DB.SeasonUI.simWeek()">Sim Entire Week</button>';
    html += '<button class="btn btn-secondary" onclick="DB.SeasonUI.showStandings()">Standings</button>';
    html += '</div>';

    html += '</div>';

    // Standings below
    html += DB.SeasonUI.renderStandings(season);

    DB.Screens.render('season-content', html);
    DB.Screens.show('season');
  },

  // Play a game interactively
  playGame(gameIdx) {
    var season = DB.App.season;
    var game = season.schedule[season.currentWeek][gameIdx];
    var awayTeam = DB.Season.findTeam(game.away);
    var homeTeam = DB.Season.findTeam(game.home);
    if (!awayTeam || !homeTeam) { alert('Team not found!'); return; }

    // Store context so we can record result after
    DB.SeasonUI._pendingGame = { gameIdx: gameIdx, awayId: game.away, homeId: game.home };

    // Set up game like normal game-ui flow
    DB.GameUI.gameState = DB.GameState.create(homeTeam, awayTeam, {
      era: season.era,
      mode: 'pass-and-play'
    });
    DB.App.currentGame = DB.GameUI.gameState;
    DB.Screens.show('game');
    DB.GameUI.updateDisplay();
    DB.GameUI.addLog('=== Season Week ' + (season.currentWeek + 1) + ' ===', 'inning-break');
    DB.GameUI.addLog('=== ' + awayTeam.name + ' at ' + homeTeam.name + ' ===', 'inning-break');
    DB.GameUI.addLog('=== Top of inning 1 ===', 'inning-break');
    DB.GameUI.checkAutoPlay();
  },

  // Quick sim one game
  simGame(gameIdx) {
    var season = DB.App.season;
    var game = season.schedule[season.currentWeek][gameIdx];
    var result = DB.Season.simGame(season, game.away, game.home);
    DB.Season.recordResult(season, game.away, game.home, result.awayScore, result.homeScore, season.currentWeek);

    // Remove this game from the week
    season.schedule[season.currentWeek].splice(gameIdx, 1);

    // Check if week is done
    if (season.schedule[season.currentWeek].length === 0) {
      season.currentWeek++;
    }

    DB.Save.autoSave();
    DB.SeasonUI.showWeek();
  },

  // Sim all remaining games this week
  simWeek() {
    var season = DB.App.season;
    var week = season.schedule[season.currentWeek];
    if (!week) return;

    // Sim all games
    week.forEach(function(game) {
      var result = DB.Season.simGame(season, game.away, game.home);
      DB.Season.recordResult(season, game.away, game.home, result.awayScore, result.homeScore, season.currentWeek);
    });

    season.schedule[season.currentWeek] = []; // clear week
    season.currentWeek++;
    DB.Save.autoSave();
    DB.SeasonUI.showWeek();
  },

  // Called when a season game ends (from showGameOver hook)
  onSeasonGameEnd(gs) {
    var pending = DB.SeasonUI._pendingGame;
    if (!pending) return;

    var season = DB.App.season;
    DB.Season.recordResult(season, pending.awayId, pending.homeId, gs.score.away, gs.score.home, season.currentWeek);

    // Remove game from week
    var week = season.schedule[season.currentWeek];
    if (week) {
      season.schedule[season.currentWeek] = week.filter(function(g, idx) {
        return idx !== pending.gameIdx;
      });
      if (season.schedule[season.currentWeek].length === 0) {
        season.currentWeek++;
      }
    }

    DB.SeasonUI._pendingGame = null;
    DB.Save.autoSave();
  },

  _pendingGame: null,

  // ===== STANDINGS =====
  renderStandings(season) {
    var divStandings = DB.Season.getStandings(season);
    var html = '<div class="card" style="margin-top:16px;">';
    html += '<h3>Standings</h3>';

    Object.keys(divStandings).forEach(function(div) {
      html += '<h4>' + div + '</h4>';
      html += '<div style="overflow-x:auto;"><table class="data-table">';
      html += '<tr><th>Team</th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>RS</th><th>RA</th></tr>';
      divStandings[div].forEach(function(r) {
        html += '<tr><td>' + r.name + '</td><td>' + r.w + '</td><td>' + r.l + '</td>';
        html += '<td>' + r.pct.toFixed(3) + '</td><td>' + (r.gb === 0 ? '-' : r.gb) + '</td>';
        html += '<td>' + r.rs + '</td><td>' + r.ra + '</td></tr>';
      });
      html += '</table></div>';
    });

    html += '</div>';
    return html;
  },

  showStandings() {
    var season = DB.App.season;
    if (!season) return;
    var html = DB.SeasonUI.renderStandings(season);
    html += '<div style="text-align:center;margin-top:12px;">';
    html += '<button class="btn btn-secondary" onclick="DB.SeasonUI.showWeek()">Back to Schedule</button>';
    html += '</div>';
    DB.Screens.render('season-content', html);
  },

  // ===== ALL-STAR BREAK =====
  showAllStar() {
    var season = DB.App.season;
    var rosters = DB.Season.generateAllStarRosters(season);

    var html = '<div class="card">';
    html += '<h2 style="text-align:center;color:var(--accent2);">All-Star Break</h2>';
    html += '<p class="subtitle" style="text-align:center;">Midseason showcase of the league\'s best!</p>';

    html += '<h3>All-Star Batters</h3>';
    html += '<div style="overflow-x:auto;"><table class="data-table">';
    html += '<tr><th>Name</th><th>Team</th><th>Pos</th><th>BT</th><th>OBT</th><th>Traits</th></tr>';
    rosters.batters.forEach(function(entry) {
      var p = entry.player;
      html += '<tr><td>' + p.name + '</td><td>' + entry.team + '</td><td>' + p.position + '</td>';
      html += '<td>' + p.bt + '</td><td>' + p.obt + '</td>';
      html += '<td>' + DB.RosterUI.renderTraits(p.traits) + '</td></tr>';
    });
    html += '</table></div>';

    html += '<h3>All-Star Pitchers</h3>';
    html += '<div style="overflow-x:auto;"><table class="data-table">';
    html += '<tr><th>Name</th><th>Team</th><th>PD</th><th>Traits</th></tr>';
    rosters.pitchers.forEach(function(entry) {
      var p = entry.player;
      html += '<tr><td>' + p.name + '</td><td>' + entry.team + '</td>';
      html += '<td>' + DB.Dice.formatPD(p.pitchDie) + '</td>';
      html += '<td>' + DB.RosterUI.renderTraits(p.traits) + '</td></tr>';
    });
    html += '</table></div>';

    html += '<button class="btn btn-primary btn-block" onclick="DB.SeasonUI.endAllStar()" style="margin-top:16px;">Continue Season</button>';
    html += '</div>';

    DB.Screens.render('season-content', html);
    DB.Screens.show('season');
  },

  endAllStar() {
    DB.App.season.allStarDone = true;
    DB.App.season.phase = 'regular';
    DB.Save.autoSave();
    DB.SeasonUI.showWeek();
  },

  // ===== PRE-PLAYOFFS =====
  showPrePlayoffs() {
    var season = DB.App.season;
    var html = '<div class="card">';
    html += '<h2 style="text-align:center;color:var(--accent2);">Regular Season Complete!</h2>';
    html += DB.SeasonUI.renderStandings(season);

    html += '<button class="btn btn-primary btn-block" onclick="DB.SeasonUI.beginPlayoffs()" style="margin-top:16px;">Begin Playoffs (Best of 5)</button>';
    html += '</div>';

    DB.Screens.render('season-content', html);
    DB.Screens.show('season');
  },

  beginPlayoffs() {
    var season = DB.App.season;
    season.playoffsStarted = true;
    season.phase = 'playoffs';
    season.playoffs = DB.Season.generatePlayoffs(season);
    DB.Save.autoSave();
    DB.SeasonUI.showPlayoffs();
  },

  // ===== PLAYOFFS =====
  showPlayoffs() {
    var season = DB.App.season;
    var playoffs = season.playoffs;
    if (!playoffs) return;

    var html = '<div class="card">';
    html += '<h2 style="text-align:center;color:var(--accent2);">Playoffs</h2>';

    // Check if we need finals
    if (playoffs.series.length > 1) {
      var allDone = playoffs.series.every(function(s) { return s.complete; });
      if (allDone && !playoffs.finals) {
        // Create finals from semifinal winners
        playoffs.finals = DB.Season.createSeries(playoffs.series[0].winner, playoffs.series[1].winner, 'Finals');
        playoffs.round = 'Finals';
        DB.Save.autoSave();
      }
    }

    // Show current series
    var activeSeries = playoffs.finals || null;
    if (!activeSeries) {
      playoffs.series.forEach(function(s) { if (!s.complete) activeSeries = s; });
    }
    if (!activeSeries && playoffs.series.length === 1) {
      activeSeries = playoffs.series[0];
    }

    // Render all series
    var allSeries = playoffs.series.slice();
    if (playoffs.finals) allSeries.push(playoffs.finals);

    allSeries.forEach(function(s) {
      html += '<div class="card" style="margin:8px 0;">';
      html += '<h4>' + s.label + ': ' + s.higher.name + ' vs ' + s.lower.name + '</h4>';
      html += '<p style="font-size:1.2rem;font-weight:700;text-align:center;">';
      html += s.higher.name + ' ' + s.wins.higher + ' - ' + s.wins.lower + ' ' + s.lower.name;
      html += '</p>';

      // Game log
      if (s.games.length > 0) {
        html += '<div style="overflow-x:auto;"><table class="data-table">';
        html += '<tr><th>Game</th><th>Away</th><th>Score</th><th>Home</th><th>Score</th><th>Winner</th></tr>';
        s.games.forEach(function(g) {
          html += '<tr><td>' + g.game + '</td><td>' + g.away + '</td><td>' + g.awayScore + '</td>';
          html += '<td>' + g.home + '</td><td>' + g.homeScore + '</td><td><strong>' + g.winner + '</strong></td></tr>';
        });
        html += '</table></div>';
      }

      if (s.complete) {
        html += '<p style="text-align:center;color:var(--green);font-weight:700;">' + s.winner.name + ' wins the series!</p>';
      } else {
        html += '<div class="btn-group" style="justify-content:center;margin-top:8px;">';
        html += '<button class="btn btn-primary btn-small" onclick="DB.SeasonUI.playPlayoffGame()">Play Next Game</button>';
        html += '<button class="btn btn-secondary btn-small" onclick="DB.SeasonUI.simPlayoffGame()">Sim Next Game</button>';
        html += '</div>';
      }
      html += '</div>';
    });

    // Check for champion
    var champSeries = playoffs.finals || (playoffs.series.length === 1 ? playoffs.series[0] : null);
    if (champSeries && champSeries.complete && !season.champion) {
      season.champion = champSeries.winner.name;
      season.phase = 'offseason';
      DB.Save.autoSave();
    }

    if (season.champion) {
      html += '<div style="text-align:center;padding:20px;">';
      html += '<h2 style="color:var(--accent2);">' + season.champion + ' are the Champions!</h2>';
      html += '<button class="btn btn-primary" onclick="DB.SeasonUI.showOffseason()" style="margin-top:12px;">Offseason</button>';
      html += '</div>';
    }

    html += '</div>';
    DB.Screens.render('season-content', html);
    DB.Screens.show('season');
  },

  simPlayoffGame() {
    var season = DB.App.season;
    var playoffs = season.playoffs;
    var active = playoffs.finals || null;
    if (!active) {
      for (var i = 0; i < playoffs.series.length; i++) {
        if (!playoffs.series[i].complete) { active = playoffs.series[i]; break; }
      }
    }
    if (!active || active.complete) return;

    DB.Season.playPlayoffGame(active);
    DB.Save.autoSave();
    DB.SeasonUI.showPlayoffs();
  },

  playPlayoffGame() {
    // For now, sim it (full interactive playoff games can be added later)
    DB.SeasonUI.simPlayoffGame();
  },

  // ===== OFFSEASON =====
  showOffseason() {
    var season = DB.App.season;
    var html = '<div class="card">';
    html += '<h2 style="text-align:center;color:var(--accent2);">Offseason</h2>';

    html += '<div class="menu-grid">';
    html += '<div class="menu-item" onclick="DB.SeasonUI.showAgingResults()">';
    html += '<div class="icon">&#128116;</div><h3>Aging</h3><p>Players age and stats change</p></div>';

    html += '<div class="menu-item" onclick="DB.SeasonUI.showDraft()">';
    html += '<div class="icon">&#127919;</div><h3>Draft</h3><p>Draft new prospects</p></div>';

    html += '<div class="menu-item" onclick="DB.SeasonUI.showTradeBlock()">';
    html += '<div class="icon">&#128260;</div><h3>Trades</h3><p>Trade players between teams</p></div>';

    html += '<div class="menu-item" onclick="DB.SeasonUI.startNewSeason()">';
    html += '<div class="icon">&#9918;</div><h3>Next Season</h3><p>Start a new season with updated rosters</p></div>';
    html += '</div></div>';

    DB.Screens.render('season-content', html);
    DB.Screens.show('season');
  },

  // ===== AGING =====
  showAgingResults() {
    var html = '<div class="card"><h3>Aging Results</h3>';

    DB.App.teams.forEach(function(team) {
      html += '<h4>' + team.name + '</h4>';
      var results = DB.Season.applyAging(team);
      html += '<div style="font-size:0.85rem;max-height:200px;overflow-y:auto;background:var(--bg-input);padding:8px;border-radius:4px;">';
      results.forEach(function(r) {
        var color = r.indexOf('decline') !== -1 || r.indexOf('Severe') !== -1 ? 'var(--red)' :
          r.indexOf('BREAKOUT') !== -1 || r.indexOf('Improvement') !== -1 ? 'var(--green)' : 'var(--text-dim)';
        html += '<div style="color:' + color + ';">' + r + '</div>';
      });
      html += '</div>';
    });

    html += '<button class="btn btn-secondary btn-block" onclick="DB.SeasonUI.showOffseason()" style="margin-top:12px;">Back</button>';
    html += '</div>';
    DB.Save.autoSave();
    DB.Screens.render('season-content', html);
  },

  // ===== DRAFT =====
  _draftPool: null,
  _draftOrder: null,
  _draftRound: 0,
  _draftPick: 0,

  showDraft() {
    var season = DB.App.season;
    // Generate draft pool: 3 players per team
    var numPlayers = DB.App.teams.length * 3;
    DB.SeasonUI._draftPool = DB.Season.generateDraftPool(numPlayers, season.era);

    // Draft order: worst record first
    var standings = [];
    DB.App.teams.forEach(function(t) {
      var s = season.standings[t.id] || { w: 0, l: 0 };
      standings.push({ team: t, pct: s.w / Math.max(1, s.w + s.l) });
    });
    standings.sort(function(a, b) { return a.pct - b.pct; }); // worst first
    DB.SeasonUI._draftOrder = standings.map(function(s) { return s.team; });
    DB.SeasonUI._draftRound = 1;
    DB.SeasonUI._draftPick = 0;

    DB.SeasonUI.renderDraft();
  },

  renderDraft() {
    var pool = DB.SeasonUI._draftPool;
    var order = DB.SeasonUI._draftOrder;
    var pick = DB.SeasonUI._draftPick;

    if (!pool || pool.length === 0 || pick >= order.length * 3) {
      // Draft complete
      var html = '<div class="card"><h3>Draft Complete!</h3>';
      html += '<p>All teams have drafted new players.</p>';
      html += '<button class="btn btn-secondary btn-block" onclick="DB.SeasonUI.showOffseason()">Back</button></div>';
      DB.Save.autoSave();
      DB.Screens.render('season-content', html);
      return;
    }

    var round = Math.floor(pick / order.length) + 1;
    var teamIdx = pick % order.length;
    var currentTeam = order[teamIdx];

    var html = '<div class="card">';
    html += '<h3>Draft - Round ' + round + ', Pick ' + (pick + 1) + '</h3>';
    html += '<p><strong>' + currentTeam.name + '</strong> is on the clock.</p>';

    // Show top available players
    html += '<div style="overflow-x:auto;"><table class="data-table">';
    html += '<tr><th>Name</th><th>Pos</th><th>BT</th><th>OBT</th><th>PD</th><th>Age</th><th>Traits</th><th></th></tr>';
    var shown = Math.min(10, pool.length);
    for (var i = 0; i < shown; i++) {
      var p = pool[i];
      html += '<tr><td>' + p.name + '</td><td>' + p.position + '</td>';
      html += '<td>' + p.bt + '</td><td>' + p.obt + '</td>';
      html += '<td>' + (p.isPitcher ? DB.Dice.formatPD(p.pitchDie) : '-') + '</td>';
      html += '<td>' + p.age + '</td><td>' + DB.RosterUI.renderTraits(p.traits) + '</td>';
      html += '<td><button class="btn btn-small btn-primary" onclick="DB.SeasonUI.draftPlayer(' + i + ')">Draft</button></td>';
      html += '</tr>';
    }
    html += '</table></div>';

    html += '<div class="btn-group" style="margin-top:8px;">';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.SeasonUI.autoDraft()">Auto-Draft Remaining</button>';
    html += '</div></div>';

    DB.Screens.render('season-content', html);
  },

  draftPlayer(poolIdx) {
    var pool = DB.SeasonUI._draftPool;
    var order = DB.SeasonUI._draftOrder;
    var pick = DB.SeasonUI._draftPick;
    var teamIdx = pick % order.length;
    var team = order[teamIdx];
    var player = pool.splice(poolIdx, 1)[0];

    DB.Season.addPlayerToTeam(team, player);
    DB.Team.calculateTeamScore(team);
    DB.SeasonUI._draftPick++;
    DB.SeasonUI.renderDraft();
  },

  autoDraft() {
    var pool = DB.SeasonUI._draftPool;
    var order = DB.SeasonUI._draftOrder;

    while (pool.length > 0 && DB.SeasonUI._draftPick < order.length * 3) {
      var teamIdx = DB.SeasonUI._draftPick % order.length;
      var team = order[teamIdx];
      var player = pool.shift(); // take best available
      DB.Season.addPlayerToTeam(team, player);
      DB.Team.calculateTeamScore(team);
      DB.SeasonUI._draftPick++;
    }

    DB.SeasonUI.renderDraft(); // shows completion
  },

  // ===== TRADES =====
  showTradeBlock() {
    var html = '<div class="card"><h3>Trade Block</h3>';
    html += '<p class="subtitle">Select two teams to arrange a trade.</p>';

    html += '<div class="grid-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    html += '<div class="form-group"><label>Team 1</label><select id="trade-team1">';
    DB.App.teams.forEach(function(t, i) {
      html += '<option value="' + i + '">' + t.name + '</option>';
    });
    html += '</select></div>';
    html += '<div class="form-group"><label>Team 2</label><select id="trade-team2">';
    DB.App.teams.forEach(function(t, i) {
      html += '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + t.name + '</option>';
    });
    html += '</select></div></div>';

    html += '<button class="btn btn-primary btn-block" onclick="DB.SeasonUI.proposeTrade()" style="margin-top:12px;">Generate Trade Proposal</button>';
    html += '<div id="trade-proposal" style="margin-top:12px;"></div>';
    html += '<button class="btn btn-secondary btn-block" onclick="DB.SeasonUI.showOffseason()" style="margin-top:12px;">Back</button>';
    html += '</div>';

    DB.Screens.render('season-content', html);
  },

  proposeTrade() {
    var idx1 = parseInt(document.getElementById('trade-team1').value);
    var idx2 = parseInt(document.getElementById('trade-team2').value);
    if (idx1 === idx2) { alert('Pick different teams!'); return; }

    var team1 = DB.App.teams[idx1];
    var team2 = DB.App.teams[idx2];
    var proposal = DB.Season.generateTradeProposal(team1, team2);
    if (!proposal) { alert('Could not generate a trade.'); return; }

    DB.SeasonUI._pendingTrade = proposal;

    var html = '<div class="card">';
    html += '<h4>Proposed Trade</h4>';
    html += '<p><strong>' + team1.name + ' sends:</strong> ' + proposal.give.map(function(p) {
      return p.name + ' (' + p.position + ', BT:' + p.bt + ')';
    }).join(', ') + '</p>';
    html += '<p><strong>' + team2.name + ' sends:</strong> ' + proposal.receive.map(function(p) {
      return p.name + ' (' + p.position + ', BT:' + p.bt + ')';
    }).join(', ') + '</p>';
    html += '<div class="btn-group">';
    html += '<button class="btn btn-success btn-small" onclick="DB.SeasonUI.acceptTrade()">Accept</button>';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.SeasonUI.proposeTrade()">Reroll</button>';
    html += '</div></div>';

    document.getElementById('trade-proposal').innerHTML = html;
  },

  _pendingTrade: null,

  acceptTrade() {
    var trade = DB.SeasonUI._pendingTrade;
    if (!trade) return;

    DB.Season.executeTrade(trade.team1, trade.team2, trade.give, trade.receive);
    DB.Save.autoSave();
    alert('Trade completed!');
    DB.SeasonUI._pendingTrade = null;
    DB.SeasonUI.showTradeBlock();
  },

  // ===== NEW SEASON =====
  startNewSeason() {
    DB.App.season = null;
    DB.Save.autoSave();
    DB.SeasonUI.showBeginSeason();
  }
};

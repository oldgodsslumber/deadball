// Deadball Digital - Quick Simulation Engine
var DB = DB || {};

DB.Sim = {
  // Quick sim using Team Score system
  quickSim(team1, team2) {
    var ts1 = team1.teamScore || DB.Team.calculateTeamScore(team1);
    var ts2 = team2.teamScore || DB.Team.calculateTeamScore(team2);

    // Determine favorite
    var favorite, underdog, favName, undName;
    if (ts1 >= ts2) {
      favorite = ts1; underdog = ts2; favName = team1.name; undName = team2.name;
    } else {
      favorite = ts2; underdog = ts1; favName = team2.name; undName = team1.name;
    }

    // Win chance: capped at 80%
    var winChance = Math.min(80, (favorite - underdog) + 50);

    // Roll for winner
    var winRoll = DB.Dice.d100();
    var favoriteWins = winRoll <= winChance;
    var winnerName = favoriteWins ? favName : undName;
    var loserName = favoriteWins ? undName : favName;

    // Determine score
    var scoreRoll1 = DB.Dice.d10() - 1; // 0-9
    var scoreRoll2 = DB.Dice.d10() - 1;
    var winnerScore = Math.max(scoreRoll1, scoreRoll2);
    var loserScore = Math.min(scoreRoll1, scoreRoll2);

    // Ensure winner score > loser score (reroll if tie)
    if (winnerScore === loserScore) {
      winnerScore++;
    }

    return {
      winner: winnerName,
      loser: loserName,
      winnerScore: winnerScore,
      loserScore: loserScore,
      favoriteWins: favoriteWins,
      winChance: winChance,
      winRoll: winRoll,
      ts1: ts1,
      ts2: ts2,
      team1Name: team1.name,
      team2Name: team2.name,
      desc: winnerName + ' ' + winnerScore + ', ' + loserName + ' ' + loserScore +
        (favoriteWins ? '' : ' (UPSET!)')
    };
  },

  // Simulate a full game at-bat by at-bat (headless, returns final state)
  fullSim(homeTeam, awayTeam, era) {
    var gs = DB.GameState.create(homeTeam, awayTeam, { era: era, mode: 'sim' });

    var maxAtBats = 500; // safety limit
    var atBats = 0;

    while (!gs.isComplete && atBats < maxAtBats) {
      var event = DB.AtBat.resolve(gs);
      DB.GameState.processAtBat(gs, event);
      atBats++;
    }

    return gs;
  },

  // Simulate a series (best of N)
  simSeries(team1, team2, games, era) {
    var results = [];
    var wins = { team1: 0, team2: 0 };

    for (var i = 0; i < games; i++) {
      // Alternate home/away
      var home = i % 2 === 0 ? team1 : team2;
      var away = i % 2 === 0 ? team2 : team1;
      var gs = DB.Sim.fullSim(home, away, era);

      var winner = gs.winner === 'home' ? home : away;
      results.push({
        game: i + 1,
        home: home.name,
        away: away.name,
        score: gs.score,
        winner: winner.name
      });

      if (winner === team1) wins.team1++;
      else wins.team2++;
    }

    return {
      results: results,
      wins: wins,
      seriesWinner: wins.team1 > wins.team2 ? team1.name : team2.name
    };
  }
};

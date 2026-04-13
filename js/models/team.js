// Deadball Digital - Team Model
var DB = DB || {};

DB.Team = {
  _nextId: 1,

  create(data) {
    return {
      id: data.id || ('t' + DB.Team._nextId++),
      name: data.name || 'Unknown Team',
      location: data.location || '',
      mascot: data.mascot || '',
      era: data.era || 'modern',

      // Roster
      lineup: data.lineup || [],       // Position players in batting order
      bench: data.bench || [],
      rotation: data.rotation || [],    // Starting pitchers
      bullpen: data.bullpen || [],      // Relief pitchers

      // Staff
      manager: data.manager || { name: 'Manager', daring: 10, personality: 'Even-Keeled' },
      owner: data.owner || null,

      // Ballpark
      ballpark: data.ballpark || { name: 'Stadium', type: 'Retro', capacity: 40000, quirks: [], turf: 'Good', roof: 'None', condition: 'Sparkling' },

      // Team composition
      teamGender: data.teamGender || 'mixed', // 'men', 'women', 'mixed'

      // Franchise
      fanbase: data.fanbase || { level: 'Fair Weather', attendance: 50 },
      franchise: data.franchise || { yearsInLeague: 1, lastChampionship: null, priority: 'Balanced', makeup: 'Balanced' },

      // Computed
      teamScore: data.teamScore || 0
    };
  },

  // Calculate Team Score
  calculateTeamScore(team) {
    // Sum all position player BTs
    let battingScore = 0;
    const allBatters = team.lineup.concat(team.bench);
    for (const p of allBatters) {
      battingScore += p.bt;
    }

    // Sum all pitcher PD values × 7
    let pitchingScore = 0;
    const allPitchers = team.rotation.concat(team.bullpen);
    for (const p of allPitchers) {
      pitchingScore += (p.pitchDie || 0);
    }
    pitchingScore *= 7;

    team.teamScore = Math.round((battingScore + pitchingScore) / 10);
    return team.teamScore;
  },

  // Get all players on the team
  getAllPlayers(team) {
    return team.lineup.concat(team.bench, team.rotation, team.bullpen);
  },

  // Get roster count
  getRosterCount(team) {
    return team.lineup.length + team.bench.length + team.rotation.length + team.bullpen.length;
  },

  // Generate a full random team
  // options.teamGender: 'men', 'women', or 'mixed' (default)
  generateRandom(options) {
    options = options || {};
    const era = options.era || 'modern';
    const eraConfig = DB.Eras[era];
    const teamName = options.name || DB.Team.generateTeamName();
    const teamGender = options.teamGender || 'mixed';

    // Helper: pick gender for a player based on team composition
    function pickGender() {
      if (teamGender === 'men') return 'M';
      if (teamGender === 'women') return 'F';
      return Math.random() < 0.5 ? 'M' : 'F';
    }

    const team = DB.Team.create({
      name: teamName.name,
      location: teamName.location,
      mascot: teamName.mascot,
      era: era,
      teamGender: teamGender
    });

    // Generate lineup (position players)
    const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    for (let i = 0; i < eraConfig.starters; i++) {
      const player = DB.Player.generateRandom({
        era: era,
        position: positions[i],
        tier: 'prospect',
        gender: pickGender()
      });
      player.isPitcher = false;
      team.lineup.push(player);
    }

    // Generate bench
    for (let i = 0; i < eraConfig.bench; i++) {
      const player = DB.Player.generateRandom({
        era: era,
        position: positions[Math.floor(Math.random() * positions.length)],
        tier: Math.random() < 0.5 ? 'prospect' : 'farmhand',
        gender: pickGender()
      });
      player.isPitcher = false;
      team.bench.push(player);
    }

    // Generate starting pitchers
    for (let i = 0; i < eraConfig.startingPitchers; i++) {
      const player = DB.Player.generateRandom({
        era: era,
        position: 'SP',
        tier: i < 2 ? 'prospect' : 'farmhand',
        gender: pickGender()
      });
      player.isPitcher = true;
      player.isStarter = true;
      team.rotation.push(player);
    }

    // Generate relievers
    for (let i = 0; i < eraConfig.relievers; i++) {
      const player = DB.Player.generateRandom({
        era: era,
        position: 'RP',
        tier: i === 0 ? 'prospect' : 'farmhand',
        gender: pickGender()
      });
      player.isPitcher = true;
      player.isStarter = false;
      team.bullpen.push(player);
    }

    // Generate manager
    team.manager = {
      name: DB.Player.generateName(),
      daring: DB.Dice.d20(),
      personality: DB.Team._managerPersonalities[DB.Dice.d20() - 1]
    };

    DB.Team.calculateTeamScore(team);
    return team;
  },

  // Rapid team generation - just provide name + era, get a full team
  generateRapid(name, era, teamGender) {
    const team = DB.Team.generateRandom({ era: era, teamGender: teamGender || 'mixed' });
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        team.mascot = parts.pop();
        team.location = parts.join(' ');
        team.name = name;
      } else {
        team.name = name;
      }
    }
    return team;
  },

  // Team name generation
  _locations: [
    'New York','Boston','Chicago','Philadelphia','Pittsburgh','St. Louis','Cincinnati','Cleveland',
    'Detroit','Baltimore','Washington','San Francisco','Los Angeles','Oakland','Atlanta','Houston',
    'Minneapolis','Milwaukee','Kansas City','Seattle','Denver','Phoenix','Tampa Bay','Miami',
    'San Diego','Arlington','Cooperstown','Louisville','Nashville','Charlotte','Portland','Montreal',
    'Brooklyn','Havana','Springfield','Riverside','Lakewood','Greenville','Baytown','Ironville'
  ],
  _mascots: [
    'Eagles','Bears','Tigers','Lions','Wolves','Hawks','Falcons','Panthers',
    'Sharks','Rays','Marlins','Dolphins','Whales','Barracudas',
    'Foxes','Stallions','Mustangs','Bison','Rams','Bulls',
    'Stars','Suns','Comets','Rockets','Titans','Giants','Knights','Kings',
    'Miners','Steelers','Oilers','Drillers','Loggers','Grinders',
    'Red Sox','Blue Jays','Cardinals','Orioles','Robins','Crows',
    'Brewers','Bakers','Cobblers','Smiths','Weavers',
    'Thunderbolts','Cyclones','Hurricanes','Tornadoes','Blizzards'
  ],
  _managerPersonalities: [
    'Apathetic','Charming','Colorless','Dignified','Domineering',
    'Dull','Fatalistic','Fiery','Fun-Loving','Gloomy',
    'Imaginative','Loyal','Open','Polite','Rude',
    'Sincere','Taciturn','Thin-Skinned','Tough','Vain'
  ],

  generateTeamName() {
    const loc = DB.Team._locations[Math.floor(Math.random() * DB.Team._locations.length)];
    const mascot = DB.Team._mascots[Math.floor(Math.random() * DB.Team._mascots.length)];
    return { location: loc, mascot: mascot, name: loc + ' ' + mascot };
  },

  // Serialize
  serialize(team) {
    return {
      id: team.id, name: team.name, location: team.location, mascot: team.mascot, era: team.era, teamGender: team.teamGender,
      lineup: team.lineup.map(DB.Player.serialize),
      bench: team.bench.map(DB.Player.serialize),
      rotation: team.rotation.map(DB.Player.serialize),
      bullpen: team.bullpen.map(DB.Player.serialize),
      manager: team.manager, owner: team.owner,
      ballpark: team.ballpark, fanbase: team.fanbase, franchise: team.franchise,
      teamScore: team.teamScore
    };
  },

  deserialize(data) {
    data.lineup = (data.lineup || []).map(DB.Player.deserialize);
    data.bench = (data.bench || []).map(DB.Player.deserialize);
    data.rotation = (data.rotation || []).map(DB.Player.deserialize);
    data.bullpen = (data.bullpen || []).map(DB.Player.deserialize);
    return DB.Team.create(data);
  }
};

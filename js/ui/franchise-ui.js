// Deadball Digital - Franchise Builder UI
var DB = DB || {};

DB.FranchiseUI = {
  start() {
    DB.Screens.show('franchise-builder');
  },

  generate() {
    var era = document.getElementById('franchise-era').value;
    var FT = DB.FranchiseTables;
    var result = {};
    var fbTotal = 0; // Fanbase modifier accumulator

    // Location
    var locRoll = DB.Dice.d20();
    var loc = FT.lookup(FT.locations, locRoll);
    result.location = loc.name;
    fbTotal += loc.fbMod;

    // Team Priority
    var prioTable = era === 'ancient' ? FT.teamPriority.ancient : FT.teamPriority.modern;
    var prioRoll = DB.Dice.d20();
    result.priority = FT.lookup(prioTable, prioRoll).name;

    // Team Makeup
    var makeupRoll = DB.Dice.d20();
    result.makeup = FT.lookup(FT.teamMakeup, makeupRoll).name;

    // Last Championship
    var champRoll = DB.Dice.d20();
    var champ = FT.lookup(FT.lastChampionship, champRoll);
    result.lastChampionship = champ.name;
    fbTotal += champ.fbMod;

    // Mascot
    var mascotRoll = DB.Dice.d20();
    var mascotCategory = FT.mascots[mascotRoll - 1];
    var examples = FT.mascotExamples[mascotCategory] || ['Unknown'];
    var mascotName = examples[Math.floor(Math.random() * examples.length)];
    result.mascotCategory = mascotCategory;
    result.mascot = mascotName;

    // Years in League
    var yearsRoll = DB.Dice.d20();
    var years = FT.lookup(FT.yearsInLeague, yearsRoll);
    result.yearsInLeague = years.name;
    fbTotal += years.fbMod;

    // Owner
    result.ownerBackground = FT.ownerBackgrounds[DB.Dice.d20() - 1];
    result.ownerPersonality = FT.ownerPersonalities[DB.Dice.d20() - 1];

    // Ballpark
    var stadTable = era === 'ancient' ? FT.stadiumTypes.ancient : FT.stadiumTypes.modern;
    var stadRoll = DB.Dice.d20();
    var stad = FT.lookup(stadTable, stadRoll);
    result.stadiumType = stad.name;
    result.capacity = stad.baseCapacity + DB.Dice.d10() * 1000;
    fbTotal += stad.fbMod;

    // Park details
    result.parkNamedFor = FT.parkNamedFor[Math.floor(Math.random() * FT.parkNamedFor.length)];
    result.parkLocation = FT.parkLocations[Math.floor(Math.random() * FT.parkLocations.length)];

    var condRoll = DB.Dice.d20();
    var cond = FT.lookup(FT.parkConditions, condRoll);
    result.parkCondition = cond.name;
    fbTotal += cond.fbMod;

    // Park quirks
    result.quirks = [];
    for (var q = 0; q < stad.quirks; q++) {
      var quirkIdx = Math.floor(Math.random() * FT.parkQuirks.length);
      result.quirks.push(FT.parkQuirks[quirkIdx]);
    }

    // Fanbase
    var fbRoll = DB.Dice.d20();
    var fbResult = fbRoll + fbTotal;
    result.fanbase = FT.fanbaseLevel(fbResult);
    result.fanbaseRoll = fbRoll;
    result.fanbaseMod = fbTotal;

    // Manager
    result.managerName = DB.Player.generateName();
    result.managerPosition = FT.managerPositions[DB.Dice.d20() - 1];
    result.managerDaring = DB.Dice.d20();
    result.managerPersonality = FT.managerPersonalities[DB.Dice.d20() - 1];

    // Team name
    var cityNames = {
      'Middle of Nowhere': ['Dustville','Nowhere','Backwater','Hollow'],
      'Small Town': ['Millfield','Oakdale','Riverdale','Springdale','Mapleton'],
      'Small City': ['Bridgeport','Greenfield','Lakewood','Fairview','Riverside'],
      'Medium City': ['Springfield','Portland','Rochester','Norfolk','Richmond'],
      'Metropolis': ['New York','Chicago','Philadelphia','Boston','San Francisco']
    };
    var cities = cityNames[result.location] || ['Anytown'];
    var cityName = cities[Math.floor(Math.random() * cities.length)];
    result.teamName = cityName + ' ' + mascotName;
    result.cityName = cityName;

    // Generate the actual team
    var genderSel = document.getElementById('franchise-team-gender');
    var teamGender = genderSel ? genderSel.value : 'mixed';
    var team = DB.Team.generateRandom({ era: era, name: result.teamName, teamGender: teamGender });
    team.location = cityName;
    team.mascot = mascotName;
    team.manager = { name: result.managerName, daring: result.managerDaring, personality: result.managerPersonality };
    team.owner = { background: result.ownerBackground, personality: result.ownerPersonality };
    team.ballpark = {
      name: (result.parkNamedFor === 'Corporate Sponsor' ? 'TechCorp' : cityName) + ' Stadium',
      type: result.stadiumType,
      capacity: result.capacity,
      condition: result.parkCondition,
      quirks: result.quirks.map(function(q) { return q.name; }),
      turf: 'Good',
      roof: 'None',
      location: result.parkLocation
    };
    team.fanbase = result.fanbase;
    team.franchise = {
      yearsInLeague: result.yearsInLeague,
      lastChampionship: result.lastChampionship,
      priority: result.priority,
      makeup: result.makeup
    };

    // Render
    var html = '<div class="card fade-in">';
    html += '<h2>' + result.teamName + '</h2>';
    html += '<table class="data-table">';
    html += '<tr><td>Location</td><td>' + result.location + ' (' + cityName + ')</td></tr>';
    html += '<tr><td>Priority</td><td>' + result.priority + '</td></tr>';
    html += '<tr><td>Makeup</td><td>' + result.makeup + '</td></tr>';
    html += '<tr><td>Last Championship</td><td>' + result.lastChampionship + '</td></tr>';
    html += '<tr><td>Mascot Category</td><td>' + result.mascotCategory + ' (' + mascotName + ')</td></tr>';
    html += '<tr><td>Years in League</td><td>' + result.yearsInLeague + '</td></tr>';
    html += '<tr><td>Owner</td><td>' + result.ownerBackground + ' (' + result.ownerPersonality + ')</td></tr>';
    html += '<tr><td>Fanbase</td><td>' + result.fanbase.level + ' (' + result.fanbase.attendance + '% attendance, ' + result.fanbase.financial + ')</td></tr>';
    html += '</table>';

    html += '<h3>Ballpark</h3>';
    html += '<table class="data-table">';
    html += '<tr><td>Type</td><td>' + result.stadiumType + '</td></tr>';
    html += '<tr><td>Capacity</td><td>' + result.capacity.toLocaleString() + '</td></tr>';
    html += '<tr><td>Location</td><td>' + result.parkLocation + '</td></tr>';
    html += '<tr><td>Condition</td><td>' + result.parkCondition + '</td></tr>';
    html += '<tr><td>Named For</td><td>' + result.parkNamedFor + '</td></tr>';
    if (result.quirks.length > 0) {
      html += '<tr><td>Quirks</td><td>' + result.quirks.map(function(q) { return q.name + ' (' + q.effect + ')'; }).join(', ') + '</td></tr>';
    }
    html += '</table>';

    html += '<h3>Manager: ' + result.managerName + '</h3>';
    html += '<table class="data-table">';
    html += '<tr><td>Played</td><td>' + result.managerPosition + '</td></tr>';
    html += '<tr><td>Daring</td><td>' + result.managerDaring + '/20</td></tr>';
    html += '<tr><td>Personality</td><td>' + result.managerPersonality + '</td></tr>';
    html += '</table>';

    html += '<h3>Roster (Team Score: ' + team.teamScore + ')</h3>';
    html += '<div id="franchise-roster-area">';
    html += DB.RosterUI.renderRoster(team);
    html += '</div>';

    html += '<div class="btn-group" style="margin-top:16px;flex-wrap:wrap;">';
    html += '<button class="btn btn-success" onclick="DB.FranchiseUI.saveFranchise()">Save Franchise</button>';
    html += '<button class="btn btn-warning" onclick="DB.FranchiseUI.editRoster()">Edit Roster</button>';
    html += '<button class="btn btn-secondary" onclick="DB.FranchiseUI.generate()">Reroll</button>';
    html += '</div></div>';

    document.getElementById('franchise-result').innerHTML = html;
    DB.FranchiseUI._lastTeam = team;
  },

  _lastTeam: null,

  saveFranchise() {
    if (DB.FranchiseUI._lastTeam) {
      DB.App.teams.push(DB.FranchiseUI._lastTeam); DB.Save.autoSave();
      alert(DB.FranchiseUI._lastTeam.name + ' added to your teams!');
    }
  },

  editRoster() {
    var team = DB.FranchiseUI._lastTeam;
    if (!team) return;
    DB.RosterUI.startEditSession(team, function() {
      // Re-render roster area after edit
      var area = document.getElementById('franchise-roster-area');
      if (area) {
        area.innerHTML = '<h4>Team Score: ' + team.teamScore + '</h4>' +
          DB.RosterUI.renderEditableRoster(team);
      }
    });
    var area = document.getElementById('franchise-roster-area');
    if (area) {
      area.innerHTML = '<h4>Team Score: ' + team.teamScore + '</h4>' +
        DB.RosterUI.renderEditableRoster(team);
    }
  }
};

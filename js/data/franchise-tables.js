// Deadball Digital - Franchise Builder Tables (Year II)
var DB = DB || {};

DB.FranchiseTables = {
  locations: [
    { roll: [1,2],   name: 'Middle of Nowhere', fbMod: -2 },
    { roll: [3,4,5], name: 'Small Town', fbMod: -1 },
    { roll: [6,7,8,9,10,11,12,13,14], name: 'Small City', fbMod: 0 },
    { roll: [15,16,17,18], name: 'Medium City', fbMod: 1 },
    { roll: [19,20], name: 'Metropolis', fbMod: 2 }
  ],

  teamPriority: {
    modern: [
      { roll: [1,2,3,4,5],     name: 'Hitting for Power' },
      { roll: [6,7,8,9,10],    name: 'Hitting for Average' },
      { roll: [11,12,13,14,15],name: 'Starting Pitching' },
      { roll: [16],            name: 'Bullpen' },
      { roll: [17,18],         name: 'Speed' },
      { roll: [19,20],         name: 'Defense' }
    ],
    ancient: [
      { roll: [1,2,3,4,5],     name: 'Hitting for Average' },
      { roll: [6,7,8,9,10],    name: 'Starting Pitching' },
      { roll: [11,12,13,14,15,16,17,18], name: 'Defense' },
      { roll: [19,20],         name: 'Speed' }
    ]
  },

  teamMakeup: [
    { roll: [1,2,3,4,5],       name: 'Mostly Prospects' },
    { roll: [6,7,8,9,10,11,12,13,14,15], name: 'Balanced' },
    { roll: [16,17,18,19,20],  name: 'Mostly Veterans' }
  ],

  lastChampionship: [
    { roll: [1],     name: 'Last Season', fbMod: 3 },
    { roll: [2,3],   name: 'Within 5 Years', fbMod: 2 },
    { roll: [4,5,6], name: 'Within 10 Years', fbMod: 1 },
    { roll: [7,8,9,10,11,12,13,14], name: 'Within 25 Years', fbMod: 0 },
    { roll: [15,16,17], name: 'Within 50 Years', fbMod: -1 },
    { roll: [18,19,20], name: '50+ Years / Never', fbMod: -2 }
  ],

  mascots: [
    'Generic Demonym','Local Nickname','Geography','Weather','Industry',
    'Bird','Fish','Predator','Horse','Gentle Animal',
    'Mythological','Color','Clothing','Baseball Term','Food',
    'Historical Figure','Noble Title','Military Rank','Weapon','Random Word'
  ],

  mascotExamples: {
    'Bird': ['Eagles','Cardinals','Blue Jays','Orioles','Hawks','Robins','Crows','Falcons'],
    'Fish': ['Marlins','Rays','Barracudas','Sharks','Sailfish','Trout','Minnows'],
    'Predator': ['Tigers','Lions','Panthers','Wolves','Bears','Cougars','Wildcats'],
    'Horse': ['Stallions','Mustangs','Colts','Broncos','Chargers'],
    'Gentle Animal': ['Deer','Lambs','Doves','Rabbits','Turtles'],
    'Mythological': ['Titans','Cyclops','Griffins','Phoenixes','Dragons','Sirens'],
    'Color': ['Reds','Blues','Whites','Grays','Crimson','Scarlet'],
    'Clothing': ['Red Sox','White Sox','Caps','Boots','Toppers'],
    'Weather': ['Cyclones','Hurricanes','Thunder','Lightning','Storm','Blizzards'],
    'Industry': ['Miners','Steelers','Oilers','Loggers','Brewers','Ironmen'],
    'Geography': ['Islanders','Highlanders','Rivermen','Lakers','Mountaineers'],
    'Food': ['Peppers','Biscuits','Crawdads','Jumbo Shrimp'],
    'Baseball Term': ['Sluggers','Aces','Batsmen','Grounders','Dingers'],
    'Military Rank': ['Generals','Admirals','Colonels','Captains','Majors'],
    'Weapon': ['Cannons','Sabers','Arrows','Musketeers','Bombers'],
    'Noble Title': ['Kings','Barons','Dukes','Knights','Monarchs'],
    'Historical Figure': ['Lincolns','Roosevelts','Hamiltons'],
    'Generic Demonym': ['Nationals','Americans','Metropolitans','Citizens'],
    'Local Nickname': ['Mudcats','Yard Goats','RubberDucks','Biscuits'],
    'Random Word': ['Chaos','Ruckus','Mayhem','Shenanigans','Raptors']
  },

  yearsInLeague: [
    { roll: [1,2],   name: 'Expansion Team', fbMod: -2 },
    { roll: [3,4,5], name: '5 Years', fbMod: -1 },
    { roll: [6,7,8,9,10], name: '10 Years', fbMod: 0 },
    { roll: [11,12,13,14,15], name: '25 Years', fbMod: 1 },
    { roll: [16,17,18], name: '50 Years', fbMod: 1 },
    { roll: [19,20], name: 'Since Founding', fbMod: 2 }
  ],

  ownerBackgrounds: [
    'Captain of Industry','Eccentric Inventor','Entertainer','Former Player','Heir',
    'Government Official','Business Magnate','Media Mogul','Recluse','Corporation',
    'Newspaper Owner','Oil Man','Player Co-op','Politician','Railroad Baron',
    'Real Estate Mogul','Gambler','Tycoon','Venture Capitalist','War Hero'
  ],

  ownerPersonalities: [
    'Baffled','Boastful','Combative','Cowardly','Destructive',
    'Elegant','Even-Keeled','Giddy','Gossipy','Gregarious',
    'Hedonistic','Humble','Lovable','Miserly','Noble',
    'Quixotic','Sadistic','Slovenly','Temperamental','Unbalanced'
  ],

  fanbaseLevel(total) {
    if (total <= 2)  return { level: 'Non-existent', attendance: 20, financial: 'Broke' };
    if (total <= 5)  return { level: 'Indifferent', attendance: 35, financial: 'Struggling' };
    if (total <= 10) return { level: 'Fair Weather', attendance: 50, financial: 'Breaking Even' };
    if (total <= 18) return { level: 'Loyal', attendance: 75, financial: 'Prospering' };
    return { level: 'Obsessive', attendance: 100, financial: 'Printing Money' };
  },

  stadiumTypes: {
    modern: [
      { roll: [1,2,3,4],  name: 'Jewel Box', baseCapacity: 35000, fbMod: 1, quirks: 1 },
      { roll: [5,6,7,8],  name: 'Baseball Palace', baseCapacity: 50000, fbMod: 2, quirks: 0 },
      { roll: [9,10,11],  name: 'Space Age', baseCapacity: 50000, fbMod: 0, quirks: 1 },
      { roll: [12,13,14,15,16], name: 'Concrete Donut', baseCapacity: 55000, fbMod: -1, quirks: 1 },
      { roll: [17,18,19,20], name: 'Retro', baseCapacity: 38000, fbMod: 0, quirks: 1 }
    ],
    ancient: [
      { roll: [1,2,3,4,5,6,7,8], name: 'Wood Frame Pavilion', baseCapacity: 5000, fbMod: 0, quirks: 2 },
      { roll: [9,10,11,12,13,14,15,16], name: 'Jewel Box', baseCapacity: 35000, fbMod: 1, quirks: 1 },
      { roll: [17,18,19,20], name: 'Baseball Palace', baseCapacity: 50000, fbMod: 2, quirks: 0 }
    ]
  },

  parkNamedFor: ['City','Geography','Owner','Famous Player','Corporate Sponsor'],

  parkLocations: [
    'Downtown (bustling)','Downtown (seedy)','Downtown (quiet)',
    'Riverfront','Waterfront','Mountaintop','Suburbs',
    'Industrial District','Near University','Countryside'
  ],

  parkConditions: [
    { roll: [1,2],   name: 'Falling Apart', fbMod: -3 },
    { roll: [3,4,5,6], name: 'Decrepit', fbMod: -2 },
    { roll: [7,8,9,10,11,12,13,14], name: 'Well-Worn', fbMod: 0 },
    { roll: [15,16,17,18,19,20], name: 'Sparkling', fbMod: 2 }
  ],

  parkQuirks: [
    { name: 'Cozy Outfield', effect: '+1 on Hit Table rolls' },
    { name: 'Expansive Outfield', effect: '-1 on Hit Table rolls' },
    { name: 'Short Left Porch', effect: 'HR on MSS 47 (left-handed batters)' },
    { name: 'Short Right Porch', effect: 'HR on MSS 57 (right-handed batters)' },
    { name: 'LF Oddity', effect: '-1 DEF for LF' },
    { name: 'CF Oddity', effect: '-1 DEF for CF' },
    { name: 'RF Oddity', effect: '+1 DEF for RF' },
    { name: 'Fast Infield', effect: '+1 steal, -1 infield DEF' },
    { name: 'Slow Infield', effect: '-1 steal, +1 infield DEF' },
    { name: 'High Mound', effect: '+1 to MSS' },
    { name: 'Beautiful Park', effect: '+1 Fanbase modifier' },
    { name: 'Hideous Park', effect: '-1 Fanbase modifier' },
    { name: 'Quirky Dimensions', effect: 'Triples more likely (+1 on 18+ hit table)' },
    { name: 'Deep Center Field', effect: '-1 on Hit Table for CF hits' },
    { name: 'Short Fences', effect: '+1 on Hit Table rolls' },
    { name: 'Tall Fences', effect: '-1 on Hit Table rolls' },
    { name: 'Wind Blowing Out', effect: '+1 on Hit Table when batting from home side' },
    { name: 'Wind Blowing In', effect: '-1 on Hit Table when batting from home side' },
    { name: 'Thin Air', effect: '+2 on Hit Table rolls (altitude)' },
    { name: 'No Quirks', effect: 'Standard dimensions' }
  ],

  managerPositions: [
    'Pitcher (Majors)','Pitcher (Minors)','Catcher','First Base','Second Base',
    'Third Base','Shortstop','Left Field','Center Field','Right Field',
    'Utility','DH','Catcher (Minors)','Outfield (Minors)','Infield (Minors)',
    'Never Played','Never Played','Broadcaster','Front Office','Coach Only'
  ],

  managerPersonalities: [
    'Apathetic','Charming','Colorless','Dignified','Domineering',
    'Dull','Fatalistic','Fiery','Fun-Loving','Gloomy',
    'Imaginative','Loyal','Open','Polite','Rude',
    'Sincere','Taciturn','Thin-Skinned','Tough','Vain'
  ],

  // Lookup helper: find entry by d20 roll
  lookup(table, roll) {
    for (var i = 0; i < table.length; i++) {
      if (table[i].roll && table[i].roll.indexOf(roll) !== -1) return table[i];
    }
    return table[table.length - 1];
  }
};

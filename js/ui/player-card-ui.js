// Deadball Digital - Player Card & In-Depth Player Creator UI
var DB = DB || {};

DB.PlayerCardUI = {
  _lastPlayer: null,
  _buildState: null, // working state for the in-depth builder
  _overrideSave: null, // callback when editing a player from a team roster

  // ===== QUICK RANDOM GENERATE (from the old creator) =====
  generateRandom() {
    var name = document.getElementById('player-name').value.trim() || undefined;
    var pos = document.getElementById('player-position').value;
    var tier = document.getElementById('player-tier').value;
    var ageCat = document.getElementById('player-age-cat').value;
    var era = document.getElementById('player-era').value;
    var gender = document.getElementById('player-gender').value;

    var options = { era: era, tier: tier, ageCategory: ageCat };
    if (name) options.name = name;
    if (pos !== 'random') options.position = pos;
    if (gender !== 'random') options.gender = gender;

    var player = DB.Player.generateRandom(options);
    DB.PlayerCardUI._lastPlayer = player;

    var container = document.getElementById('player-creator-result');
    if (container) {
      container.innerHTML = DB.PlayerCardUI.renderFullCard(player) +
        '<div class="btn-group" style="margin-top:12px;">' +
        '<button class="btn btn-success btn-small" onclick="DB.PlayerCardUI.addToPool()">Add to Player Pool</button>' +
        '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.openBuilder()">Edit in Builder</button>' +
        '</div>';
    }
  },

  addToPool() {
    if (DB.PlayerCardUI._lastPlayer) {
      DB.App.playerPool.push(DB.PlayerCardUI._lastPlayer); DB.Save.autoSave();
      alert(DB.PlayerCardUI._lastPlayer.name + ' added to player pool!');
    }
  },

  // ===== IN-DEPTH PLAYER BUILDER =====
  openBuilder(existingPlayer) {
    // Initialize build state from existing player or blank
    var p = existingPlayer || DB.PlayerCardUI._lastPlayer || null;
    DB.PlayerCardUI._buildState = {
      name: p ? p.name : '',
      gender: p ? p.gender : 'M',
      position: p ? p.position : 'UT',
      handedness: p ? p.handedness : 'R',
      age: p ? p.age : 25,
      bt: p ? p.bt : null,
      obt: p ? p.obt : null,
      pitchDie: p ? p.pitchDie : null,
      traits: p ? p.traits.slice() : [],
      isPitcher: p ? p.isPitcher : false,
      isStarter: p ? p.isStarter : true,
      country: 'United States',
      era: DB.App.currentEra || 'modern',
      tier: 'prospect'
    };
    DB.PlayerCardUI.renderBuilder();
    DB.Screens.show('player-builder');
  },

  renderBuilder() {
    var s = DB.PlayerCardUI._buildState;
    var isPitcher = ['SP', 'RP'].includes(s.position);
    s.isPitcher = isPitcher;

    var html = '<div class="card">';

    // Row 1: Gender, Country, Name
    html += '<div class="grid-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">';
    html += '<div class="form-group"><label>Gender</label><select id="build-gender" onchange="DB.PlayerCardUI.onBuilderChange()">';
    html += '<option value="M"' + (s.gender === 'M' ? ' selected' : '') + '>Male</option>';
    html += '<option value="F"' + (s.gender === 'F' ? ' selected' : '') + '>Female</option>';
    html += '</select></div>';
    html += '<div class="form-group"><label>Country (for name)</label><select id="build-country">';
    DB.Names.countries.forEach(function(c) {
      html += '<option value="' + c + '"' + (s.country === c ? ' selected' : '') + '>' + c + '</option>';
    });
    html += '</select></div>';
    html += '</div>';

    html += '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:12px;">';
    html += '<div class="form-group" style="flex:1;margin-bottom:0;"><label>Name</label>';
    html += '<input type="text" id="build-name" value="' + (s.name || '').replace(/"/g, '&quot;') + '" placeholder="Enter or roll a name"></div>';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.rollName()" style="margin-bottom:0;">Roll Name</button>';
    html += '</div>';

    // Row 2: Position, Handedness, Age
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;" class="grid-2col">';
    html += '<div class="form-group"><label>Position</label><select id="build-position" onchange="DB.PlayerCardUI.onBuilderChange()">';
    var positions = ['C','1B','2B','3B','SS','LF','CF','RF','SP','RP','DH','UT'];
    positions.forEach(function(p) {
      html += '<option value="' + p + '"' + (s.position === p ? ' selected' : '') + '>' + p + '</option>';
    });
    html += '</select></div>';
    html += '<div class="form-group"><label>Handedness</label><select id="build-hand">';
    html += '<option value="R"' + (s.handedness === 'R' ? ' selected' : '') + '>Right</option>';
    html += '<option value="L"' + (s.handedness === 'L' ? ' selected' : '') + '>Left</option>';
    html += '<option value="S"' + (s.handedness === 'S' ? ' selected' : '') + '>Switch</option>';
    html += '</select></div>';

    html += '<div class="form-group"><label>Age</label>';
    html += '<div style="display:flex;gap:4px;">';
    html += '<input type="number" id="build-age" value="' + (s.age || '') + '" min="16" max="50" style="flex:1;">';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.rollAge()" title="Roll age">Roll</button>';
    html += '</div></div>';
    html += '</div>';

    // Row 3: Era & Tier (for rolling context)
    html += '<div class="grid-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">';
    html += '<div class="form-group"><label>Era (for roll tables)</label><select id="build-era">';
    ['modern', 'ancient', 'juiced'].forEach(function(e) {
      html += '<option value="' + e + '"' + (s.era === e ? ' selected' : '') + '>' + DB.Eras[e].name + '</option>';
    });
    html += '</select></div>';
    html += '<div class="form-group"><label>Tier (for roll tables)</label><select id="build-tier">';
    html += '<option value="prospect"' + (s.tier === 'prospect' ? ' selected' : '') + '>Top Prospect</option>';
    html += '<option value="farmhand"' + (s.tier === 'farmhand' ? ' selected' : '') + '>Farmhand</option>';
    html += '</select></div>';
    html += '</div>';

    html += '</div>'; // end top card

    // ===== STATS SECTION =====
    html += '<div class="card">';
    html += '<h3>Stats</h3>';
    html += '<p class="subtitle">Set values manually or roll using the Deadball tables.</p>';

    // BT
    html += '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:12px;">';
    html += '<div class="form-group" style="flex:1;margin-bottom:0;">';
    html += '<label>Batter Target (BT) <span style="color:var(--text-muted);font-size:0.8rem;">~ batting avg &times;100</span></label>';
    html += '<input type="number" id="build-bt" value="' + (s.bt != null ? s.bt : '') + '" min="1" max="50" placeholder="e.g. 27 = .270 AVG">';
    html += '</div>';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.rollBT()" style="margin-bottom:0;">Roll</button>';
    html += '</div>';

    // OBT
    html += '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:12px;">';
    html += '<div class="form-group" style="flex:1;margin-bottom:0;">';
    html += '<label>On Base Target (OBT) <span style="color:var(--text-muted);font-size:0.8rem;">~ OBP &times;100</span></label>';
    html += '<input type="number" id="build-obt" value="' + (s.obt != null ? s.obt : '') + '" min="1" max="60" placeholder="e.g. 35 = .350 OBP">';
    html += '</div>';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.rollOBT()" style="margin-bottom:0;">Roll</button>';
    html += '</div>';

    // Pitch Die (only for pitchers)
    if (isPitcher) {
      html += '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:12px;">';
      html += '<div class="form-group" style="flex:1;margin-bottom:0;">';
      html += '<label>Pitch Die</label>';
      html += '<select id="build-pd">';
      html += '<option value="">-- Select --</option>';
      DB.Dice.PD_LADDER.forEach(function(pd) {
        var sel = s.pitchDie === pd ? ' selected' : '';
        html += '<option value="' + pd + '"' + sel + '>' + DB.Dice.formatPD(pd) + '</option>';
      });
      html += '</select></div>';
      html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.rollPD()" style="margin-bottom:0;">Roll</button>';
      html += '</div>';
    }

    html += '</div>'; // end stats card

    // ===== TRAITS SECTION =====
    html += '<div class="card">';
    html += '<h3>Traits</h3>';

    // Current traits
    html += '<div id="build-traits-display" style="margin-bottom:12px;">';
    html += DB.PlayerCardUI.renderTraitsList(s.traits, isPitcher);
    html += '</div>';

    // Roll or add
    html += '<div class="btn-group">';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.rollTrait()">Roll Trait (2d10)</button>';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.showTraitPicker()">Add Manually</button>';
    html += '<button class="btn btn-secondary btn-small" onclick="DB.PlayerCardUI.clearTraits()">Clear All</button>';
    html += '</div>';

    html += '</div>'; // end traits card

    // ===== PREVIEW & ACTIONS =====
    html += '<div class="card" id="build-preview"></div>';

    html += '<div class="btn-group" style="margin-top:16px;justify-content:center;">';
    html += '<button class="btn btn-warning" onclick="DB.PlayerCardUI.rollAll()">Roll Everything</button>';
    html += '<button class="btn btn-primary" onclick="DB.PlayerCardUI.saveBuilder()">Save Player</button>';
    html += '<button class="btn btn-secondary" onclick="DB.Screens.back()">Cancel</button>';
    html += '</div>';

    DB.Screens.render('player-builder-content', html);
    DB.PlayerCardUI.updatePreview();
  },

  // ===== ROLL FUNCTIONS =====
  rollName() {
    var gender = document.getElementById('build-gender').value;
    var country = document.getElementById('build-country').value;
    var name = DB.Player.generateName(gender, country);
    document.getElementById('build-name').value = name;
    DB.PlayerCardUI.syncState();
    DB.PlayerCardUI.updatePreview();
  },

  rollAge() {
    var cats = ['prospect', 'rookie', 'veteran', 'oldtimer'];
    var cat = cats[Math.floor(Math.random() * cats.length)];
    var age;
    switch (cat) {
      case 'prospect': age = DB.Dice.d6() + 18; break;
      case 'rookie':   age = DB.Dice.d6() + 21; break;
      case 'veteran':  age = DB.Dice.d6() + 27; break;
      case 'oldtimer': age = DB.Dice.d6() + 32; break;
    }
    document.getElementById('build-age').value = age;
    DB.PlayerCardUI.syncState();
    DB.PlayerCardUI.updatePreview();
  },

  rollBT() {
    var tier = document.getElementById('build-tier').value;
    var isPitcher = DB.PlayerCardUI._buildState.isPitcher;
    var bt;
    if (isPitcher) {
      bt = DB.Dice.roll2d(6) + 12;
    } else if (tier === 'prospect') {
      bt = DB.Dice.roll2d(10) + 15;
    } else {
      bt = DB.Dice.roll2d(10) + 12;
    }
    document.getElementById('build-bt').value = bt;
    DB.PlayerCardUI.syncState();
    DB.PlayerCardUI.updatePreview();
  },

  rollOBT() {
    var bt = parseInt(document.getElementById('build-bt').value);
    if (!bt) { alert('Roll or set BT first.'); return; }
    var isPitcher = DB.PlayerCardUI._buildState.isPitcher;
    var obt = isPitcher ? bt + DB.Dice.d8() : bt + DB.Dice.roll2d(4);
    document.getElementById('build-obt').value = obt;
    DB.PlayerCardUI.syncState();
    DB.PlayerCardUI.updatePreview();
  },

  rollPD() {
    var era = document.getElementById('build-era').value;
    var tier = document.getElementById('build-tier').value;
    var pdTable = DB.Tables.fictionalPitchDie[era === 'ancient' ? 'ancient' : 'modern'];
    var dieSize = era === 'ancient' ? DB.Dice.d12() : DB.Dice.d8();
    var farmhandBonus = tier === 'farmhand' ? 2 : 0;
    var pdIdx = Math.min(dieSize + farmhandBonus, pdTable.length - 1);
    var pd = pdTable[pdIdx];
    document.getElementById('build-pd').value = pd;
    DB.PlayerCardUI.syncState();
    DB.PlayerCardUI.updatePreview();
  },

  rollTrait() {
    var s = DB.PlayerCardUI._buildState;
    var isPitcher = s.isPitcher;
    var roll = DB.Dice.roll2d(10);
    var table = isPitcher ? DB.Tables.traitsTable.pitcher : DB.Tables.traitsTable.batter;
    var trait = table[roll];
    if (!trait) {
      alert('Rolled ' + roll + ': No trait (7-14 = none).');
      return;
    }
    if (s.traits.indexOf(trait) !== -1) {
      alert('Rolled ' + roll + ': ' + trait + ' (already have it).');
      return;
    }
    s.traits.push(trait);
    document.getElementById('build-traits-display').innerHTML =
      DB.PlayerCardUI.renderTraitsList(s.traits, isPitcher);
    DB.PlayerCardUI.updatePreview();
  },

  showTraitPicker() {
    var s = DB.PlayerCardUI._buildState;
    var isPitcher = s.isPitcher;
    var allTraits = isPitcher
      ? ['K+','GB+','CN+','ST+','CN-']
      : ['P++','P+','C+','S+','D+','T+','P-','P--','C-','S-','D-'];

    var html = '<h3>Add Trait</h3><div class="btn-group" style="flex-wrap:wrap;">';
    allTraits.forEach(function(t) {
      var has = s.traits.indexOf(t) !== -1;
      var cls = t.indexOf('-') !== -1 ? 'btn-small' : 'btn-small btn-success';
      if (has) cls = 'btn-small';
      html += '<button class="btn ' + cls + '"' + (has ? ' disabled style="opacity:0.4"' : '') +
        ' onclick="DB.PlayerCardUI.addTrait(\'' + t + '\')">' + t + '</button>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px;"><button class="btn btn-secondary" onclick="DB.GameUI.closeModal()">Done</button></div>';
    DB.GameUI.showModal(html);
  },

  addTrait(trait) {
    var s = DB.PlayerCardUI._buildState;
    if (s.traits.indexOf(trait) === -1) {
      s.traits.push(trait);
      document.getElementById('build-traits-display').innerHTML =
        DB.PlayerCardUI.renderTraitsList(s.traits, s.isPitcher);
      DB.PlayerCardUI.updatePreview();
    }
    DB.GameUI.closeModal();
  },

  removeTrait(trait) {
    var s = DB.PlayerCardUI._buildState;
    s.traits = s.traits.filter(function(t) { return t !== trait; });
    document.getElementById('build-traits-display').innerHTML =
      DB.PlayerCardUI.renderTraitsList(s.traits, s.isPitcher);
    DB.PlayerCardUI.updatePreview();
  },

  clearTraits() {
    DB.PlayerCardUI._buildState.traits = [];
    document.getElementById('build-traits-display').innerHTML =
      DB.PlayerCardUI.renderTraitsList([], DB.PlayerCardUI._buildState.isPitcher);
    DB.PlayerCardUI.updatePreview();
  },

  renderTraitsList(traits, isPitcher) {
    if (!traits || traits.length === 0) return '<span style="color:var(--text-muted);">No traits. Roll or add manually.</span>';
    return traits.map(function(t) {
      var cls = t.indexOf('-') !== -1 ? 'trait-negative' : 'trait-positive';
      var desc = DB.PlayerCardUI.traitDescriptions[t] || t;
      return '<span class="trait-badge ' + cls + '" style="cursor:pointer;font-size:0.9rem;padding:4px 8px;" ' +
        'title="' + desc + ' (click to remove)" onclick="DB.PlayerCardUI.removeTrait(\'' + t + '\')">' + t + ' &times;</span>';
    }).join(' ');
  },

  // Roll everything at once
  rollAll() {
    var s = DB.PlayerCardUI._buildState;
    // Read current form selections first
    s.gender = document.getElementById('build-gender').value;
    s.position = document.getElementById('build-position').value;
    s.isPitcher = ['SP','RP'].includes(s.position);
    s.era = document.getElementById('build-era').value;
    s.tier = document.getElementById('build-tier').value;
    s.country = document.getElementById('build-country').value;

    // Roll name
    s.name = DB.Player.generateName(s.gender, s.country);

    // Roll handedness
    var handRoll = DB.Dice.d10();
    s.handedness = s.isPitcher
      ? DB.Tables.handednessTable.pitcher[handRoll]
      : DB.Tables.handednessTable.batter[handRoll];

    // Roll age
    var cats = ['prospect', 'rookie', 'veteran', 'oldtimer'];
    var cat = cats[Math.floor(Math.random() * cats.length)];
    switch (cat) {
      case 'prospect': s.age = DB.Dice.d6() + 18; break;
      case 'rookie':   s.age = DB.Dice.d6() + 21; break;
      case 'veteran':  s.age = DB.Dice.d6() + 27; break;
      case 'oldtimer': s.age = DB.Dice.d6() + 32; break;
    }

    // Roll BT
    if (s.isPitcher) {
      s.bt = DB.Dice.roll2d(6) + 12;
    } else if (s.tier === 'prospect') {
      s.bt = DB.Dice.roll2d(10) + 15;
    } else {
      s.bt = DB.Dice.roll2d(10) + 12;
    }

    // Roll OBT
    s.obt = s.isPitcher ? s.bt + DB.Dice.d8() : s.bt + DB.Dice.roll2d(4);

    // Roll PD if pitcher
    if (s.isPitcher) {
      var pdTable = DB.Tables.fictionalPitchDie[s.era === 'ancient' ? 'ancient' : 'modern'];
      var dieSize = s.era === 'ancient' ? DB.Dice.d12() : DB.Dice.d8();
      var bonus = s.tier === 'farmhand' ? 2 : 0;
      s.pitchDie = pdTable[Math.min(dieSize + bonus, pdTable.length - 1)];
    } else {
      s.pitchDie = null;
    }

    // Roll traits
    s.traits = [];
    var traitTable = s.isPitcher ? DB.Tables.traitsTable.pitcher : DB.Tables.traitsTable.batter;
    var t1 = traitTable[DB.Dice.roll2d(10)];
    if (t1) {
      s.traits.push(t1);
      if (s.tier === 'prospect') {
        var t2 = traitTable[DB.Dice.roll2d(10)];
        if (t2 && t2 !== t1) s.traits.push(t2);
      }
    }

    // Re-render entire builder with new state
    DB.PlayerCardUI.renderBuilder();
  },

  // Sync form values back to state
  syncState() {
    var s = DB.PlayerCardUI._buildState;
    s.name = document.getElementById('build-name').value.trim();
    s.gender = document.getElementById('build-gender').value;
    s.country = document.getElementById('build-country').value;
    s.position = document.getElementById('build-position').value;
    s.handedness = document.getElementById('build-hand').value;
    s.age = parseInt(document.getElementById('build-age').value) || 25;
    s.bt = parseInt(document.getElementById('build-bt').value) || null;
    s.obt = parseInt(document.getElementById('build-obt').value) || null;
    s.isPitcher = ['SP', 'RP'].includes(s.position);
    s.era = document.getElementById('build-era').value;
    s.tier = document.getElementById('build-tier').value;
    if (s.isPitcher) {
      var pdEl = document.getElementById('build-pd');
      s.pitchDie = pdEl ? parseInt(pdEl.value) : null;
      if (isNaN(s.pitchDie)) s.pitchDie = null;
    }
  },

  onBuilderChange() {
    DB.PlayerCardUI.syncState();
    // Re-render if position changed (pitcher/non-pitcher toggle changes available fields)
    DB.PlayerCardUI.renderBuilder();
  },

  // Update the preview card
  updatePreview() {
    var s = DB.PlayerCardUI._buildState;
    var container = document.getElementById('build-preview');
    if (!container) return;

    if (!s.name && s.bt == null) {
      container.innerHTML = '<p class="subtitle">Fill in stats or hit "Roll Everything" to see a preview.</p>';
      return;
    }

    var preview = DB.Player.create({
      name: s.name || '???',
      gender: s.gender,
      position: s.position,
      handedness: s.handedness,
      age: s.age || 25,
      bt: s.bt || 0,
      obt: s.obt || 0,
      pitchDie: s.pitchDie,
      traits: s.traits,
      isPitcher: s.isPitcher,
      isStarter: s.position === 'SP'
    });

    container.innerHTML = '<h4>Preview</h4>' + DB.PlayerCardUI.renderFullCard(preview);
  },

  // Save the built player
  saveBuilder() {
    DB.PlayerCardUI.syncState();
    var s = DB.PlayerCardUI._buildState;

    if (!s.name) { alert('Enter or roll a name.'); return; }
    if (!s.bt) { alert('Set or roll a Batter Target.'); return; }
    if (!s.obt) { alert('Set or roll an On Base Target.'); return; }
    if (s.isPitcher && s.pitchDie == null) { alert('Set or roll a Pitch Die.'); return; }

    var player = DB.Player.create({
      name: s.name,
      gender: s.gender,
      position: s.position,
      handedness: s.handedness,
      age: s.age,
      bt: s.bt,
      obt: s.obt,
      pitchDie: s.pitchDie,
      traits: s.traits,
      isPitcher: s.isPitcher,
      isStarter: s.position === 'SP'
    });

    DB.PlayerCardUI._lastPlayer = player;

    // If called from roster edit, put player back into the team
    if (DB.PlayerCardUI._overrideSave) {
      DB.PlayerCardUI._overrideSave(player);
      DB.PlayerCardUI._overrideSave = null;
      DB.Screens.back();
      return;
    }

    DB.App.playerPool.push(player); DB.Save.autoSave();
    alert(player.name + ' saved to player pool!');
    DB.Screens.back();
  },

  // ===== DISPLAY HELPERS =====
  renderFullCard(player) {
    var html = '<div class="card fade-in">';
    html += '<div class="card-header">';
    html += '<h3>' + player.name + '</h3>';
    html += '<span class="pos" style="font-size:1.2rem;">' + player.position + '</span>';
    html += '</div>';

    html += '<div class="grid-2col" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">';
    html += DB.PlayerCardUI.statBox('Batter Target', player.bt);
    html += DB.PlayerCardUI.statBox('On Base Target', player.obt);
    if (player.isPitcher) {
      html += DB.PlayerCardUI.statBox('Pitch Die', DB.Dice.formatPD(player.pitchDie));
    }
    html += DB.PlayerCardUI.statBox('Age', player.age);
    html += DB.PlayerCardUI.statBox('Hand', player.handedness === 'R' ? 'Right' : player.handedness === 'L' ? 'Left' : 'Switch');
    html += DB.PlayerCardUI.statBox('Gender', player.gender === 'F' ? 'Female' : 'Male');
    html += '</div>';

    if (player.traits.length > 0) {
      html += '<div style="margin-top:8px;">';
      html += '<strong>Traits:</strong> ';
      html += player.traits.map(function(t) {
        var cls = t.indexOf('-') !== -1 ? 'trait-negative' : 'trait-positive';
        var desc = DB.PlayerCardUI.traitDescriptions[t] || t;
        return '<span class="trait-badge ' + cls + '" title="' + desc + '">' + t + '</span>';
      }).join(' ');
      html += '</div>';
    }

    html += '<div style="margin-top:12px; color:var(--text-dim); font-size:0.85rem;">';
    html += 'Approx: .' + String(player.bt).padStart(3, '0') + ' AVG / .' + String(player.obt).padStart(3, '0') + ' OBP';
    if (player.isPitcher) {
      html += ' / ~' + DB.PlayerCardUI.pdToApproxERA(player.pitchDie) + ' ERA';
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  statBox(label, value) {
    return '<div style="background:var(--bg-input);padding:8px;border-radius:4px;text-align:center;">' +
      '<div style="font-size:0.75rem;color:var(--text-dim);">' + label + '</div>' +
      '<div style="font-size:1.3rem;font-weight:700;">' + value + '</div></div>';
  },

  pdToApproxERA(pd) {
    var map = { 20: '1.50', 12: '2.50', 8: '3.50', 6: '2.75', 4: '4.50', 0: '3.75', '-4': '5.50', '-6': '4.75', '-8': '6.50', '-12': '7.50', '-20': '8.50' };
    return map[String(pd)] || '4.50';
  },

  traitDescriptions: {
    'P+': 'Power Hitter: +1 on Hit Table',
    'P++': 'Elite Power: +2 on Hit Table',
    'P-': 'Weak Hitter: -1 on Hit Table',
    'P--': 'Very Weak: -2 on Hit Table',
    'C+': 'Contact: Singles become doubles on 1-2, no DEF, +1 bunt, +10 BT/OBT on H&R',
    'C-': 'Free Swinger: -1 bunt, no H&R bonus',
    'S+': 'Speed: Roll 2=triple, +1 steal, can steal home',
    'S-': 'Slow: -2 to steal attempts',
    'D+': 'Great Defense: +1 DEF rolls, catcher -1 opponent steal',
    'D-': 'Poor Defense: -1 DEF rolls, catcher +1 opponent steal',
    'T+': 'Tough: Reroll injury once, aging never below -3',
    'K+': 'Strikeout Artist: -1 opponent BT, K on out table 3',
    'GB+': 'Groundball: SS grounder on result 2, auto DP, +1 PD bases loaded',
    'CN+': 'Control: -2 opponent OBT',
    'CN-': 'Wild: +3 opponent OBT',
    'ST+': 'Stamina: Extra inning before fatigue'
  }
};

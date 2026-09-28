/**
 * Bharat gurukul - organiser workbook
 * ===================================
 * Add this as a SECOND file in the same Apps Script project (name it Workbook).
 * Then reload the sheet: a "Gurukul" menu appears. Choose Gurukul > Rebuild reports.
 * You do NOT need to redeploy the web app for this file.
 *
 * TWO KINDS OF TAB
 *   Report tabs   - Dashboard, By Month, Seva Roster.
 *                   Rebuilt every time. Never type in them.
 *   Working tabs  - Tasks, Presenters, Seva Kosh, Materials, Core Team.
 *                   Created once with starter rows, then left alone. Your edits are safe.
 * Raw tabs written by the website: Families, RSVPs, Seva, Questions. Do not rename them.
 */

var MONTHS = [
  ['1', '17 Jan', 'The Vedas'], ['2', '21 Feb', 'Vedic sciences'], ['3', '21 Mar', 'Upanishads'],
  ['4', '18 Apr', 'Kathopanishad'], ['5', '16 May', 'Dhyana and Pranayama'], ['6', '20 Jun', 'Yoga'],
  ['7', '18 Jul', 'Ramayana'], ['8', '15 Aug', 'Mahabharata'], ['9', '19 Sep', 'Bhagavad Gita'],
  ['10', '17 Oct', 'Srimad Bhagavatam'], ['11', '21 Nov', 'India in the Buddha’s time'], ['12', '19 Dec', 'Gautama Buddha (finale)']
];

var ROLES = [
  ['present', 'Present the month\u2019s topic', 1], ['circle', 'Lead a learning circle', 4],
  ['welcome', 'Welcome desk and registration', 3], ['seating', 'Seating and elders\u2019 care', 3],
  ['bal', 'Bal Gurukul helper', 3], ['stage', 'Stage, sound and timekeeping', 2],
  ['media', 'Photos and WhatsApp updates', 2], ['clean', 'Setting up and clean-up', 3],
  ['culture', 'Bhajan, dance or skit', 2], ['youth', 'Youth quiz master or jam lead', 1]
];

var TASKS = [
  ['15 Oct 2026', 'Form the committee; agree the plan', 'Convenor'],
  ['31 Oct 2026', 'Book the venue for all 12 dates; sound and seating', 'Civic liaison'],
  ['31 Oct 2026', 'Set up the Seva Kosh box and open accounts register', 'Accounts coordinator'],
  ['15 Nov 2026', 'Find volunteer presenters for Jan–Mar; send each the topic guide', 'Programme head'],
  ['15 Nov 2026', 'Arrange printing, durries and sound in kind', 'Management track lead'],
  ['30 Nov 2026', 'Print posters, Sadhana Cards, booklets; share the website link', 'Media and registrations'],
  ['30 Nov 2026', 'Tie up with 3–5 schools and 2 senior citizens’ associations', 'Children’s and elders’ leads'],
  ['10 Dec 2026', 'Recruit and brief 20 volunteers; code of conduct signed', 'Volunteer coordinator'],
  ['10 Dec 2026', 'Recruit one lane volunteer per building to invite 5–10 families', 'Volunteer coordinator'],
  ['15 Dec 2026', 'Go/no-go: venue booked, 3 presenters, 150 registrations', 'Committee'],
  ['20 Dec 2026', 'Curtain-raiser at Gita Jayanti', 'Programme head'],
  ['10 Jan 2027', 'Dry run at the venue', 'All']
];

var MATERIALS = [
  ['1', 'Printed Gayatri cards, kites, mats for Surya Namaskar'], ['2', 'Knotted rope, wooden blocks, Saraswati corner'],
  ['3', 'Glass, water, salt; asato ma cards; notebooks'], ['4', 'Chart paper, markers, question box'],
  ['5', 'Mats, small bell, breathing practice cards'], ['6', 'Mats, yama-niyama cards, asana chart'],
  ['7', 'Cardboard for padukas, simple costumes, Ramayana picture book'], ['8', 'Mahabharata picture cards, dilemma cards'],
  ['9', 'Card and paper plates for chariots, 2.47 cards'], ['10', 'Star chart, card and sticks for Govardhan'],
  ['11', 'Map of the Mahajanapadas, voting tokens, local history notes'], ['12', 'Paper for lotuses, certificates, photo slideshow, pledge cards']
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Gurukul')
    .addItem('Rebuild reports', 'buildWorkbook')
    .addToUi();
}

function buildWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Families', 'RSVPs', 'Seva', 'Questions'].forEach(function (n) { if (!ss.getSheetByName(n)) ss.insertSheet(n); });
  seed_(ss, 'Tasks', ['Due', 'Task', 'Owner', 'Status', 'Notes'], TASKS.map(function (t) { return [t[0], t[1], t[2], 'Not started', '']; }));
  seed_(ss, 'Presenters', ['Month', 'Date', 'Topic', 'Volunteer presenter', 'Phone', 'Topic guide sent', 'Confirmed', 'Chief guest / delegates (opening)', 'Invitation sent', 'Circle leaders'],
        MONTHS.map(function (m) { return [m[0], m[1], m[2], '', '', 'No', 'No', 'An ambassador or invited delegate (to be announced)', 'No', '']; }));
  seed_(ss, 'Seva Kosh', ['Date', 'Month', 'In (₹)', 'Out (₹)', 'What for', 'Recorded by'], []);
  seed_(ss, 'Materials', ['Month', 'Topic', 'Materials (plus printed certificates and quiz sheets)', 'Arranged by', 'Ready?'],
        MATERIALS.map(function (m) { return [m[0], MONTHS[Number(m[0]) - 1][2], m[1], '', 'No']; }));
  seed_(ss, 'Core Team', ['Role', 'Name', 'Phone', 'Code of conduct signed'],
        ['Convenor', 'Programme head', 'Bal Gurukul lead', 'Karma Sabha lead', 'Vriddha Sabha lead', 'Civic liaison',
         'Accounts coordinator', 'Media and registrations', 'Volunteer coordinator', 'Safeguarding contact']
         .map(function (r) { return [r, '', '', 'No']; }));
  buildDashboard_(ss);
  buildByMonth_(ss);
  buildRoster_(ss);
  var order = ['Dashboard', 'By Month', 'Seva Roster', 'Tasks', 'Presenters', 'Materials', 'Seva Kosh', 'Core Team', 'Families', 'RSVPs', 'Seva', 'Questions'];
  order.forEach(function (n, i) { var sh = ss.getSheetByName(n); if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); } });
  ss.setActiveSheet(ss.getSheetByName('Dashboard'));
}

function seed_(ss, name, headers, rows) {
  if (ss.getSheetByName(name)) return;
  var sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#f3e6cf');
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
}

function report_(ss, name) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  return sh;
}

function values_(ss, name) {
  var sh = ss.getSheetByName(name);
  return sh && sh.getLastRow() > 1 ? sh.getDataRange().getValues().slice(1) : [];
}

function buildDashboard_(ss) {
  var sh = report_(ss, 'Dashboard');
  var fams = values_(ss, 'Families'), rsvps = values_(ss, 'RSVPs'), seva = values_(ss, 'Seva'), qs = values_(ss, 'Questions');
  var adults = 0, kids = 0;
  fams.forEach(function (r) { adults += Number(r[4]) || 0; kids += Number(r[5]) || 0; });
  var kosh = values_(ss, 'Seva Kosh'), inn = 0, out = 0;
  kosh.forEach(function (r) { inn += Number(r[2]) || 0; out += Number(r[3]) || 0; });
  sh.getRange('A1').setValue('Bharat gurukul · dashboard').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('Rebuilt ' + new Date().toLocaleString() + '. Do not type here; use Gurukul > Rebuild reports.');
  var rows = [
    ['Families registered', fams.length], ['Adults registered', adults], ['Children registered', kids],
    ['RSVPs (all months)', rsvps.length], ['Seva sign-ups (all months)', seva.length], ['Questions and suggestions', qs.length],
    ['Seva Kosh balance (₹)', inn - out]
  ];
  sh.getRange(4, 1, rows.length, 2).setValues(rows);
  sh.getRange(4, 1, rows.length, 1).setFontWeight('bold');
  sh.autoResizeColumns(1, 2);
}

function buildByMonth_(ss) {
  var sh = report_(ss, 'By Month');
  var rsvps = values_(ss, 'RSVPs'), seva = values_(ss, 'Seva');
  var need = ROLES.reduce(function (a, r) { return a + r[2]; }, 0);
  var rows = MONTHS.map(function (m) {
    var fam = 0, ppl = 0, sv = 0;
    rsvps.forEach(function (r) { if (String(r[3]) === m[0]) { fam++; ppl += Number(r[7]) || 0; } });
    seva.forEach(function (r) { if (String(r[3]) === m[0]) sv++; });
    return [m[1], m[2], fam, ppl, Math.ceil(ppl * 0.75), sv + ' / ' + need];
  });
  var head = ['Date', 'Topic', 'Families coming', 'People coming', 'Plan seating for (75%)', 'Sevaks filled / needed'];
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#f3e6cf');
  sh.getRange(2, 1, rows.length, head.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, head.length);
}

function buildRoster_(ss) {
  var sh = report_(ss, 'Seva Roster');
  var seva = values_(ss, 'Seva');
  var head = ['Role (need)'].concat(MONTHS.map(function (m) { return m[1]; }));
  var rows = ROLES.map(function (role) {
    return [role[1] + ' (' + role[2] + ')'].concat(MONTHS.map(function (m) {
      var names = seva.filter(function (r) { return String(r[3]) === m[0] && String(r[5]) === role[0]; })
                      .map(function (r) { return String(r[1]); });
      return names.length ? names.join(', ') + (names.length < role[2] ? '  (' + (role[2] - names.length) + ' more)' : '') : 'NEEDED';
    }));
  });
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#f3e6cf');
  sh.getRange(2, 1, rows.length, head.length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  var rng = sh.getRange(2, 2, rows.length, head.length - 1);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('NEEDED').setBackground('#f6d5cc').setRanges([rng]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('more)').setBackground('#f7eac9').setRanges([rng]).build()
  ];
  sh.setConditionalFormatRules(rules);
  sh.setFrozenRows(1); sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 230);
  for (var c = 2; c <= head.length; c++) sh.setColumnWidth(c, 120);
}

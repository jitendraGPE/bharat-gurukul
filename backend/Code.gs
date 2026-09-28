/**
 * Bharat: Rooted in Heritage, Inspired for the Future - registration backend
 * =========================================================================
 * This receives registrations, RSVPs, seva sign-ups and questions from the
 * website and writes them into this Google Sheet.
 *
 * FIRST-TIME SET-UP (about 10 minutes, see README.md for screenshots-level steps)
 *   1. Create a new Google Sheet, e.g. "Bharat Gurukul 2027".
 *   2. Extensions > Apps Script. Replace Code.gs with this file and save.
 *   3. Add a second script file named Workbook and paste backend/Workbook.gs.
 *   4. In the function list choose setOrganiserKey, press Run, approve access.
 *      Then open Project Settings > Script properties and change ORG_KEY to a
 *      secret phrase only organisers know. It is never stored in the website.
 *   5. Deploy > New deployment > Web app
 *        Execute as: Me       Who has access: Anyone
 *      Copy the /exec address into programme.json -> "scriptUrl".
 *
 * UPDATING LATER: paste the new code, then Deploy > Manage deployments >
 * pencil icon > Version: New version > Deploy. The /exec address stays the same.
 *
 * PRIVACY: the website only ever reads back family names and headcounts.
 * Phone numbers, areas and questions stay in this sheet, visible to organisers.
 */

var FAM_COLS  = ['When', 'Family name', 'Phone', 'Area / society', 'Adults', 'Children', 'Circles', 'Photo consent'];
var RSVP_COLS = ['When', 'Family name', 'Phone', 'Month', 'Topic', 'Adults', 'Children', 'Total'];
var SEVA_COLS = ['When', 'Name', 'Phone', 'Month', 'Topic', 'Role id', 'Role'];
var ASK_COLS  = ['When', 'Name', 'Phone', 'Month', 'Kind', 'Text'];

/* ---------- helpers ---------- */

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else if (sh.getLastColumn() < headers.length) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function digits_(s) { return String(s || '').replace(/[^0-9]/g, ''); }
function clip_(s, n) { return String(s || '').trim().slice(0, n); }
function int_(v) { return Math.max(0, Math.min(50, parseInt(v, 10) || 0)); }

function orgKey_() {
  return PropertiesService.getScriptProperties().getProperty('ORG_KEY') || '';
}

/** Run once from the editor. Then change the value in Project Settings > Script properties. */
function setOrganiserKey() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ORG_KEY')) {
    props.setProperty('ORG_KEY', 'change-me-' + Math.random().toString(36).slice(2, 10));
  }
  Logger.log('ORG_KEY is set. Change it in Project Settings > Script properties.');
}

/* ---------- read: names and headcounts only, never phone numbers ---------- */

function doGet(e) {
  try {
    var fams = sheet_('Families', FAM_COLS).getDataRange().getValues();
    var rsvps = sheet_('RSVPs', RSVP_COLS).getDataRange().getValues();
    var seva = sheet_('Seva', SEVA_COLS).getDataRange().getValues();

    var people = 0;
    for (var i = 1; i < fams.length; i++) people += (Number(fams[i][4]) || 0) + (Number(fams[i][5]) || 0);

    var months = {};
    function m_(n) { return months[n] || (months[n] = { families: 0, people: 0, names: [], seva: {} }); }

    for (var r = 1; r < rsvps.length; r++) {
      var row = rsvps[r];
      if (!String(row[1] || '').trim()) continue;
      var mo = m_(String(row[3]));
      mo.families += 1;
      mo.people += Number(row[7]) || 0;
      mo.names.push(String(row[1]).trim());
    }
    for (var s = 1; s < seva.length; s++) {
      var sr = seva[s];
      if (!String(sr[1] || '').trim()) continue;
      var ms = m_(String(sr[3]));
      var id = String(sr[5]);
      (ms.seva[id] = ms.seva[id] || []).push(String(sr[1]).trim());
    }
    return json_({ ok: true, families: Math.max(0, fams.length - 1), people: people, months: months });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------- write ---------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var body = JSON.parse(e.postData.contents);
    var now = new Date();
    var name = clip_(body.name, 80);
    var phone = clip_(body.phone, 32);

    /* ----- organiser actions: need the secret key from Script properties ----- */
    var admin = { removeRsvp: 1, removeSeva: 1, renameFamily: 1 };
    if (admin[body.action]) {
      var key = orgKey_();
      if (!key || String(body.key || '') !== key) return json_({ ok: false, error: 'not authorised' });
      var month = String(body.month || '');
      if (body.action === 'removeRsvp') return removeRows_('RSVPs', RSVP_COLS, function (r) {
        return String(r[1]).trim() === name && String(r[3]) === month;
      });
      if (body.action === 'removeSeva') return removeRows_('Seva', SEVA_COLS, function (r) {
        return String(r[1]).trim() === name && String(r[3]) === month && String(r[5]) === String(body.role || '');
      });
      if (body.action === 'renameFamily') {
        var newName = clip_(body.newName, 80);
        ['Families', 'RSVPs'].forEach(function (tab) {
          var sh = sheet_(tab, tab === 'Families' ? FAM_COLS : RSVP_COLS);
          var v = sh.getDataRange().getValues();
          for (var i = 1; i < v.length; i++) if (String(v[i][1]).trim() === name) sh.getRange(i + 1, 2).setValue(newName);
        });
        return json_({ ok: true });
      }
    }

    if (body.action === 'checkKey') {
      var k = orgKey_();
      return json_({ ok: !!k && String(body.key || '') === k });
    }

    if (!name || digits_(phone).length < 6) {
      return json_({ ok: false, error: 'name and phone are required' });
    }
    var pd = digits_(phone);

    if (body.action === 'register') {
      var sf = sheet_('Families', FAM_COLS);
      var fv = sf.getDataRange().getValues();
      var rowVals = [now, name, phone, clip_(body.area, 120), int_(body.adults), int_(body.children),
                     clip_((body.circles || []).join(', '), 200), body.photoConsent ? 'Yes' : 'No'];
      for (var i = 1; i < fv.length; i++) {
        if (digits_(fv[i][2]) === pd) {
          sf.getRange(i + 1, 1, 1, rowVals.length).setValues([rowVals]);
          return json_({ ok: true, updated: true });
        }
      }
      sf.appendRow(rowVals);
      return json_({ ok: true, added: true });
    }

    if (body.action === 'rsvp') {
      var sr = sheet_('RSVPs', RSVP_COLS);
      var rv = sr.getDataRange().getValues();
      var adults = int_(body.adults), children = int_(body.children);
      var vals = [now, name, phone, String(body.month || ''), clip_(body.topic, 80), adults, children, adults + children];
      for (var r = 1; r < rv.length; r++) {
        if (digits_(rv[r][2]) === pd && String(rv[r][3]) === String(body.month)) {
          if (adults + children === 0) { sr.deleteRow(r + 1); return json_({ ok: true, removed: true }); }
          sr.getRange(r + 1, 1, 1, vals.length).setValues([vals]);
          return json_({ ok: true, updated: true });
        }
      }
      if (adults + children > 0) sr.appendRow(vals);
      return json_({ ok: true, added: true });
    }

    if (body.action === 'seva' || body.action === 'unseva') {
      var ss = sheet_('Seva', SEVA_COLS);
      var sv = ss.getDataRange().getValues();
      for (var s = sv.length - 1; s >= 1; s--) {
        if (digits_(sv[s][2]) === pd && String(sv[s][3]) === String(body.month) && String(sv[s][5]) === String(body.role)) {
          if (body.action === 'unseva') ss.deleteRow(s + 1);
          return json_({ ok: true, duplicate: body.action === 'seva' });
        }
      }
      if (body.action === 'seva') {
        ss.appendRow([now, name, phone, String(body.month || ''), clip_(body.topic, 80), clip_(body.role, 40), clip_(body.roleName, 80)]);
      }
      return json_({ ok: true });
    }

    if (body.action === 'ask') {
      sheet_('Questions', ASK_COLS).appendRow([now, name, phone, String(body.month || ''), clip_(body.kind, 30), clip_(body.text, 1000)]);
      return json_({ ok: true, added: true });
    }

    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function removeRows_(tab, cols, match) {
  var sh = sheet_(tab, cols);
  var v = sh.getDataRange().getValues();
  var n = 0;
  for (var i = v.length - 1; i >= 1; i--) if (match(v[i])) { sh.deleteRow(i + 1); n++; }
  return json_({ ok: true, removed: n });
}

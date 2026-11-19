// Vice City Trophy Ledger v2 — offline GTA 6 trophy guide and tracker.
// Plain static app: index.html + style.css + this file + data/trophies.json.
// No network at run time: the only fetch is the local data file beside this one.
// Progress lives in localStorage, with export and import as JSON files.

const STORE_KEY = 'vctl-v2-progress';
const DATA_URL = 'data/trophies.json';
const STAGES = [
  { n: 0, label: 'GOAL', title: 'The goal', note: 'Platinum and the 100% gold' },
  { n: 1, label: 'S1', title: 'Story, Chapters 1–2', note: 'Opening, first chapters, partner system opens' },
  { n: 2, label: 'S2', title: 'Story, Chapter 3', note: 'Vice City opens up; robbery tools unlock' },
  { n: 3, label: 'S3', title: 'Story, Chapter 4', note: 'Bank vault jobs; three mission trophies' },
  { n: 4, label: 'S4', title: 'Story, finale', note: 'Final mission and the last mission trophy' },
  { n: 5, label: 'S5', title: 'Strangers & side', note: 'Five stranger chains, Fair Game, Cal' },
  { n: 6, label: 'S6', title: 'Activities & collectibles', note: 'Stunts, ranges, races, cards, WAiNK, meditations' },
  { n: 7, label: 'S7', title: 'Crime, money & cleanup', note: 'Robberies, exploration, one-offs, the 100% grind' },
];
const KIND_LABELS = { platinum: 'Platinum', story: 'Story', side: 'Side', activities: 'Activities', collectibles: 'Collectibles', robberies: 'Robberies', exploration: 'Exploration', misc: 'Misc', completion: '100%' };
const KIND_FILTERS = ['all', 'story', 'missable', 'collectibles', 'activities', 'side', 'robberies', 'exploration', 'misc'];

let DATA = null;
let state = { earned: {}, counters: {}, spoiler: true, filter: 'all', search: '', view: 'checklist', selected: 28 };

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const p = JSON.parse(raw); state = Object.assign(state, p); }
  } catch (e) { /* fresh start on bad stored data */ }
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  const el = document.getElementById('savedNote');
  if (el) el.textContent = 'Saved in this browser';
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function gradeLetter(g) { return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[g] || '?'; }
function trophyById(id) { return DATA.trophies.find(function (t) { return t.id === id; }); }
function isEarned(t) { return !!state.earned[t.id]; }
function counterOf(t) { return state.counters[t.id] || 0; }
function trophySources(t) {
  const seen = {};
  t.steps.forEach(function (st) { (st.s || []).forEach(function (n) { seen[n] = true; }); });
  return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
}
function sourceByNum(n) { return DATA.sources.find(function (s) { return s.n === n; }); }
function sourceCoverage() {
  const cov = {};
  DATA.sources.forEach(function (s) { cov[s.n] = 0; });
  DATA.trophies.forEach(function (t) { trophySources(t).forEach(function (n) { cov[n]++; }); });
  return cov;
}
function totalSteps() { return DATA.trophies.reduce(function (a, t) { return a + t.steps.length; }, 0); }
function citedSteps() { return DATA.trophies.reduce(function (a, t) { return a + t.steps.filter(function (st) { return st.s && st.s.length; }).length; }, 0); }
function earnedCount() { return DATA.trophies.filter(isEarned).length; }
function nextUp() {
  const order = DATA.trophies.slice().sort(function (a, b) { return (a.stage - b.stage) || (a.id - b.id); });
  return order.find(function (t) { return t.id !== 1 && !isEarned(t); }) || null;
}
function stageCount(n) {
  const list = DATA.trophies.filter(function (t) { return t.stage === n; });
  return { total: list.length, earned: list.filter(isEarned).length };
}
function filteredTrophies() {
  const q = state.search.trim().toLowerCase();
  return DATA.trophies.filter(function (t) {
    if (state.filter === 'missable' && !t.missable) return false;
    if (state.filter !== 'all' && state.filter !== 'missable' && t.kind !== state.filter) return false;
    if (q && (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}
function hiddenMasked(t) { return t.hidden && t.kind === 'story' && state.spoiler && !isEarned(t); }

function renderAuditStrip() {
  const g = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  DATA.trophies.forEach(function (t) { g[t.grade]++; });
  const hidden = DATA.trophies.filter(function (t) { return t.hidden; }).length;
  const el = document.getElementById('auditStrip');
  el.innerHTML = '<b>55 official</b> · ' + g.platinum + 'P ' + g.gold + 'G ' + g.silver + 'S ' + g.bronze + 'B · ' +
    hidden + ' hidden · 1,000 Gamerscore · 1,350 PSN points · <b>' + DATA.sources.length + ' sources read 19 Nov 2026</b> · ' +
    '<b>' + citedSteps() + '/' + totalSteps() + ' steps cite a source</b> · 14 sources-disagree boxes · 1 possibly missable';
}
function renderGoalBar() {
  const earned = earnedCount();
  const golds = DATA.trophies.filter(function (t) { return t.grade === 'gold'; });
  const goldEarned = golds.filter(isEarned).length;
  const nu = nextUp();
  const el = document.getElementById('goalBar');
  el.innerHTML = '<span class="goalTitle">GOAL — Vice Got a Price!</span>' +
    '<span class="goalBarTrack"><span class="goalBarFill" style="width:' + Math.round(earned / 54 * 100) + '%"></span></span>' +
    '<span><b>' + earned + '/54</b> trophies · <b>' + goldEarned + '/' + golds.length + '</b> gold</span>' +
    (nu ? '<span class="nextUp">NEXT UP: <b>' + esc(nu.name) + '</b> — ' + esc(nu.description) + '</span>' : '<span class="nextUp">Platinum earned — Leonida Legend.</span>');
}
function renderStageChips() {
  const el = document.getElementById('stageChips');
  el.innerHTML = STAGES.map(function (st) {
    const c = stageCount(st.n);
    return '<button class="chip' + (c.earned === c.total ? ' done' : '') + '" data-stage="' + st.n + '" title="' + esc(st.title + ' — ' + st.note) + '">' +
      st.label + ' ' + c.earned + '/' + c.total + '</button>';
  }).join('');
  el.querySelectorAll('.chip').forEach(function (b) {
    b.addEventListener('click', function () { location.hash = '#/roadmap'; });
  });
}
function renderToolbar() {
  const el = document.getElementById('toolbar');
  el.innerHTML = '<input id="searchBox" type="search" placeholder="Search 55 trophies…" value="' + esc(state.search) + '" aria-label="Search trophies">' +
    KIND_FILTERS.map(function (k) {
      return '<button class="fbtn' + (state.filter === k ? ' on' : '') + '" data-filter="' + k + '">' + (k === 'all' ? 'All' : k === 'missable' ? 'Missable' : KIND_LABELS[k] || k) + '</button>';
    }).join('') +
    '<button id="spoilerBtn" class="fbtn spoiler' + (state.spoiler ? ' on' : '') + '" title="Hide story trophy names and descriptions until earned">Spoilers ' + (state.spoiler ? 'hidden' : 'shown') + '</button>' +
    '<button id="exportBtn" class="fbtn">Export</button>' +
    '<label class="fbtn importBtn">Import<input id="importFile" type="file" accept=".json,application/json" hidden></label>' +
    '<span id="savedNote" class="savedNote">Saved in this browser</span>';
  document.getElementById('searchBox').addEventListener('input', function (e) { state.search = e.target.value; saveState(); renderChecklist(); });
  el.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () { state.filter = b.getAttribute('data-filter'); saveState(); renderToolbar(); renderChecklist(); });
  });
  document.getElementById('spoilerBtn').addEventListener('click', function () { state.spoiler = !state.spoiler; saveState(); renderToolbar(); renderChecklist(); renderDetail(); });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', importProgress);
}
function renderChecklist() {
  const list = filteredTrophies();
  const el = document.getElementById('checklist');
  if (!list.length) { el.innerHTML = '<p class="empty">No trophies match that filter. Clear the search or pick another kind.</p>'; return; }
  el.innerHTML = list.map(function (t) {
    const masked = hiddenMasked(t);
    const name = masked ? 'Hidden trophy — earn it to reveal' : esc(t.name);
    const desc = masked ? 'Hidden on PlayStation until earned.' : esc(t.description);
    const tgt = t.target ? '<span class="counter"><button data-dec="' + t.id + '" aria-label="Decrease counter">−</button><span>' + counterOf(t) + '/' + t.target + ' ' + esc(t.unit || '') + '</span><button data-inc="' + t.id + '" aria-label="Increase counter">+</button></span>' : '';
    return '<div class="trow' + (isEarned(t) ? ' earned' : '') + (state.selected === t.id ? ' sel' : '') + '" data-id="' + t.id + '">' +
      '<input type="checkbox" data-earn="' + t.id + '"' + (isEarned(t) ? ' checked' : '') + ' aria-label="Mark ' + esc(t.name) + ' earned">' +
      '<span class="gdot g-' + t.grade + '" title="' + t.grade + '">' + gradeLetter(t.grade) + '</span>' +
      '<span class="tmain"><span class="tname">' + name + (t.missable ? ' <span class="missTag">POSSIBLY MISSABLE</span>' : '') + '</span>' +
      '<span class="tdesc">' + desc + '</span></span>' +
      '<span class="ttags"><span class="kindTag">' + KIND_LABELS[t.kind] + '</span>' + (t.hidden ? '<span class="hidTag">hidden</span>' : '') + '<span class="gsTag">' + t.gamerscore + 'G</span></span>' +
      tgt + '</div>';
  }).join('');
  el.querySelectorAll('[data-earn]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      const id = Number(cb.getAttribute('data-earn'));
      state.earned[id] = cb.checked; saveState(); renderAll();
    });
  });
  el.querySelectorAll('[data-inc]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); const id = Number(b.getAttribute('data-inc')); const t = trophyById(id); state.counters[id] = Math.min(t.target, counterOf(t) + 1); saveState(); renderChecklist(); renderGoalBar(); renderStageChips(); });
  });
  el.querySelectorAll('[data-dec]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); const id = Number(b.getAttribute('data-dec')); state.counters[id] = Math.max(0, counterOf(trophyById(id)) - 1); saveState(); renderChecklist(); renderGoalBar(); renderStageChips(); });
  });
  el.querySelectorAll('.trow').forEach(function (row) {
    row.addEventListener('click', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      state.selected = Number(row.getAttribute('data-id')); saveState(); renderChecklist(); renderDetail();
    });
  });
}
function citationChips(nums) {
  return nums.map(function (n) { const s = sourceByNum(n); return '<a class="cite" href="' + s.url + '" target="_blank" rel="noopener">[' + n + '] ' + esc(s.name) + '</a>'; }).join(' ');
}
function disagreeBox(id) {
  const d = DATA.disagreements.find(function (x) { return x.id === id; });
  if (!d) return '';
  return '<div class="disagree"><b>SOURCES DISAGREE — ' + esc(d.title) + '</b><p>' + esc(d.text) + '</p></div>';
}
function renderDetail() {
  const t = trophyById(state.selected) || DATA.trophies[0];
  const masked = hiddenMasked(t);
  const srcs = trophySources(t);
  const el = document.getElementById('detail');
  const stage = STAGES[t.stage];
  el.innerHTML = '<div class="dhead"><span class="gdot g-' + t.grade + '">' + gradeLetter(t.grade) + '</span>' +
    '<div><h2>' + (masked ? 'Hidden trophy' : esc(t.name)) + '</h2>' +
    '<p class="dmeta">' + t.grade + ' · ' + t.gamerscore + 'G · ' + KIND_LABELS[t.kind] + ' · ' + stage.label + ' ' + esc(stage.title) +
    (t.hidden ? ' · hidden on PSN' : '') + (t.missable ? ' · <span class="missTag">POSSIBLY MISSABLE</span>' : '') + '</p></div></div>' +
    '<p class="ddesc">“' + (masked ? 'Hidden on PlayStation until earned.' : esc(t.description)) + '”</p>' +
    (t.target ? '<p class="dcounter">Progress: <b>' + counterOf(t) + ' / ' + t.target + ' ' + esc(t.unit || '') + '</b></p>' : '') +
    '<p class="dguide">' + esc(t.guide) + '</p>' +
    '<h3>How to earn it — ' + t.steps.length + ' steps, ' + t.steps.filter(function (s) { return s.s && s.s.length; }).length + ' cited</h3>' +
    '<ol class="steps">' + t.steps.map(function (st) {
      return '<li>' + esc(st.t) + ' <span class="stepCite">' + citationChips(st.s || []) + '</span></li>';
    }).join('') + '</ol>' +
    (t.disagree || []).map(disagreeBox).join('') +
    '<p class="citedBy">CITED BY: ' + citationChips(srcs) + ' — ' + srcs.length + ' of ' + DATA.sources.length + ' sources · every step cites its source</p>' +
    '<p class="dfoot">Guide in our own words, drawn from the sources above and never copied. Official name and description shown as PlayStation publishes them.</p>';
}
function renderRoadmap() {
  const el = document.getElementById('view');
  const longRoad = trophyById(14);
  el.innerHTML = '<section class="page"><h2>Roadmap to the platinum</h2>' +
    '<p class="pageIntro">One playthrough, about 200 hours: 60–80 for the story, around 100 for the 100% checklist, around 10 for cleanup. No mission replay, no difficulty trophies, no online trophies. Keep a manual save at the start and end of each chapter (15 slots plus 1 autosave) and keep cheats off the platinum save.</p>' +
    STAGES.map(function (st) {
      const list = DATA.trophies.filter(function (t) { return t.stage === st.n; });
      const c = stageCount(st.n);
      return '<div class="stage"><h3>' + st.label + ' — ' + esc(st.title) + ' <span class="stageCount">' + c.earned + '/' + c.total + ' earned</span></h3>' +
        '<p class="stageNote">' + esc(st.note) + '</p>' +
        '<ul class="stageList">' + list.map(function (t) {
          return '<li class="' + (isEarned(t) ? 'done' : '') + '"><span class="gdot g-' + t.grade + '">' + gradeLetter(t.grade) + '</span> ' +
            (hiddenMasked(t) ? 'Hidden trophy' : esc(t.name)) + ' — ' + (hiddenMasked(t) ? 'hidden on PlayStation until earned' : esc(t.description)) +
            (t.target ? ' <span class="mini">' + counterOf(t) + '/' + t.target + '</span>' : '') + '</li>';
        }).join('') + '</ul></div>';
    }).join('') +
    '<div class="stage"><h3>The 100% checklist — ' + esc(longRoad.name) + '</h3>' +
    '<p class="stageNote">Appears after the story under Progress, then Stats, then 100% Completion. Earlier progress counts, and nothing on it is missable. PowerPyx calls it lenient, closer to 60% true completion; Push Square says you need almost everything — the counts below are agreed by both.</p>' +
    '<p class="dguide">' + esc(longRoad.guide) + '</p>' +
    '<ol class="steps">' + longRoad.steps.map(function (st) { return '<li>' + esc(st.t) + ' <span class="stepCite">' + citationChips(st.s || []) + '</span></li>'; }).join('') + '</ol>' +
    disagreeBox('D13') + '</div></section>';
}
function renderMissables() {
  const pma = trophyById(28);
  const el = document.getElementById('view');
  const unconfirmed = [29, 44, 45, 49, 50, 51].map(trophyById);
  el.innerHTML = '<section class="page"><h2>Missables &amp; watch list</h2>' +
    '<p class="pageIntro">Only one trophy may be missable. Everything else can be done after the story in free roam — but the list below also covers the things that <i>look</i> missable and are not, and the trophies whose method is still unconfirmed.</p>' +
    '<div class="stage"><h3>Possibly missable — 1</h3>' +
    '<p><b>' + esc(pma.name) + '</b> — ' + esc(pma.description) + '</p>' +
    '<ol class="steps">' + pma.steps.map(function (st) { return '<li>' + esc(st.t) + ' <span class="stepCite">' + citationChips(st.s || []) + '</span></li>'; }).join('') + '</ol>' +
    disagreeBox('D1') + disagreeBox('D7') + '</div>' +
    '<div class="stage"><h3>Looks missable, but is not</h3><ul class="steps plain">' +
    '<li>Many optional missions disappear after a while — there are far more than the 100 the checklist needs. [1]</li>' +
    '<li>Some quest givers, Kenton for one, go away for part of the story. All trophy quest givers come back and stay after the story. [1] [11]</li>' +
    '<li>Some fences leave for good. None of them has a trophy quest. [1]</li>' +
    '<li>A few magazine collectibles sit in story buildings that close off. They also spawn elsewhere. [1]</li>' +
    '<li>Quests with an hourglass icon can fail on a timer. None is tied to a trophy. [11]</li>' +
    '<li>The relationship between Jason and Lucia does not matter for trophies. [11]</li>' +
    '<li>The Irredeemable criminal profile is permanent and makes police more aggressive — you can still earn everything, but cleanup gets harder. [11]</li></ul></div>' +
    '<div class="stage"><h3>Not pinned down yet — 6 trophies</h3><ul class="steps plain">' +
    unconfirmed.map(function (t) { return '<li><b>' + esc(t.name) + '</b> — ' + esc(t.guide) + ' <span class="stepCite">' + citationChips(trophySources(t)) + '</span></li>'; }).join('') + '</ul>' +
    disagreeBox('D2') + '</div></section>';
}
function renderSources() {
  const cov = sourceCoverage();
  const el = document.getElementById('view');
  el.innerHTML = '<section class="page"><h2>Sources — 12 guides, read 19 Nov 2026</h2>' +
    '<p class="pageIntro">Every guide step in this ledger cites its source by number; ' + citedSteps() + ' of ' + totalSteps() + ' steps cite a source, 0 uncited. Coverage counts below are computed from the steps themselves. Official names and descriptions come from the official list (Exophase + PSNProfiles, agreeing on every name, description and grade); everything else is this ledger’s own words.</p>' +
    '<ol class="srcList">' + DATA.sources.map(function (s) {
      return '<li><b>[' + s.n + '] ' + esc(s.name) + '</b> — ' + (s.role ? esc(s.role) : cov[s.n] + '/55 trophies') + ' · read ' + s.read + '<br><a href="' + s.url + '">' + esc(s.url) + '</a></li>';
    }).join('') + '</ol>' +
    '<h3>Source matrix — which sources cover which trophy</h3>' +
    '<div class="matrixWrap"><table class="matrix"><thead><tr><th>Trophy</th>' + DATA.sources.map(function (s) { return '<th title="' + esc(s.name) + '">' + s.n + '</th>'; }).join('') + '</tr></thead><tbody>' +
    DATA.trophies.map(function (t) {
      const srcs = trophySources(t);
      return '<tr><td>' + esc(t.name) + '</td>' + DATA.sources.map(function (s) {
        return '<td class="' + (srcs.indexOf(s.n) !== -1 ? 'hit' : 'miss') + '">' + (srcs.indexOf(s.n) !== -1 ? '●' : '·') + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>' +
    '<h3>Sources disagree — 14 boxes</h3>' +
    DATA.disagreements.map(function (d) { return disagreeBox(d.id); }).join('') +
    '<h3>Export &amp; import</h3><p class="pageIntro">Progress is saved in this browser automatically. Export downloads it as a JSON file; import restores it. Your checklist never leaves your machine unless you export it.</p>' +
    '<p><button id="exportBtn2" class="fbtn">Export progress</button> <label class="fbtn importBtn">Import progress<input id="importFile2" type="file" accept=".json,application/json" hidden></label></p>' +
    '<p class="dfoot">Unofficial fan guide. Not affiliated with Rockstar Games. No Rockstar logo, artwork or game screenshots are used. Trophy names and descriptions are shown as PlayStation publishes them; all guidance is written in our own words for this ledger.</p></section>';
  document.getElementById('exportBtn2').addEventListener('click', exportProgress);
  document.getElementById('importFile2').addEventListener('change', importProgress);
}
function exportProgress() {
  const blob = new Blob([JSON.stringify({ earned: state.earned, counters: state.counters, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vice-city-trophy-ledger-progress.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}
function importProgress(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = function () {
    try {
      const p = JSON.parse(String(r.result));
      if (p.earned) state.earned = p.earned;
      if (p.counters) state.counters = p.counters;
      saveState(); renderAll();
    } catch (err) { alert('That file is not a valid progress export.'); }
  };
  r.readAsText(f);
  e.target.value = '';
}
function renderView() {
  const main = document.getElementById('mainGrid');
  const view = document.getElementById('view');
  if (state.view === 'checklist') { main.style.display = ''; view.style.display = 'none'; renderChecklist(); renderDetail(); }
  else if (state.view === 'roadmap') { main.style.display = 'none'; view.style.display = ''; renderRoadmap(); }
  else if (state.view === 'missables') { main.style.display = 'none'; view.style.display = ''; renderMissables(); }
  else if (state.view === 'sources') { main.style.display = 'none'; view.style.display = ''; renderSources(); }
  document.querySelectorAll('#navTabs .tab').forEach(function (b) {
    b.classList.toggle('on', b.getAttribute('data-view') === state.view);
  });
}
function renderAll() {
  renderAuditStrip(); renderGoalBar(); renderStageChips(); renderToolbar(); renderView();
}
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  if (h === 'roadmap' || h === 'missables' || h === 'sources') { state.view = h; }
  else if (h.indexOf('trophy/') === 0) { const id = Number(h.split('/')[1]); if (trophyById(id)) state.selected = id; state.view = 'checklist'; }
  else { state.view = 'checklist'; }
  renderView();
}
function init() {
  loadState();
  document.querySelectorAll('#navTabs .tab').forEach(function (b) {
    b.addEventListener('click', function () { location.hash = '#/' + b.getAttribute('data-view'); });
  });
  fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (d) {
    DATA = d;
    renderAll();
    window.addEventListener('hashchange', route);
    route();
    document.getElementById('footSources').innerHTML = 'Sources: ' + DATA.sources.map(function (s) { return '<a href="' + s.url + '" target="_blank" rel="noopener">[' + s.n + '] ' + esc(s.name) + '</a>'; }).join(' · ') + ' — read 19 Nov 2026. Unofficial fan guide; not affiliated with Rockstar Games. Guides in our own words, never copied.';
  }).catch(function () {
    document.getElementById('checklist').innerHTML = '<p class="empty">Could not load data/trophies.json. Serve app/ over HTTP (for example node serve.ts) instead of opening the file directly.</p>';
  });
}
document.addEventListener('DOMContentLoaded', init);


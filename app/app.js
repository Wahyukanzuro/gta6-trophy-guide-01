/* Vice City Trophy Ledger — offline tracker. Data lives in data/trophies.json.
   Progress lives only in this browser (localStorage). No network calls. */
(function () {
  "use strict";

  var STORE_KEY = "vctl-progress-v1";
  var DEFAULT_TROPHY = 28; // Positive Mental Attitude — the one possibly missable trophy.

  var STAGES = [
    { n: 1, title: "Stage 1 — The story", hours: "60–80 hours",
      text: "Play the story. All 13 story trophies pop automatically, and free roam carries on after the credits. Do the Chapter 1 balcony meditation for Positive Mental Attitude before Chapter 1 ends — it is the one trophy that can be missed.",
      ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28, 20] },
    { n: 2, title: "Stage 2 — The 100% checklist", hours: "~100 hours",
      text: "After the credits, open Progress > Stats > 100% Completion. Everything you did before already counts. This is the long grind: A Long Road and the big counters.",
      ids: [14, 15, 17, 18, 19, 30, 31, 32, 35, 40, 42, 43, 52, 55, 21, 36] },
    { n: 3, title: "Stage 3 — Strangers & character lines", hours: "~10 hours",
      text: "Character quest lines and stranger strands. None of them are needed for 100%, and all stay available after the story.",
      ids: [16, 22, 23, 24, 25, 26, 27, 29] },
    { n: 4, title: "Stage 4 — Robberies & odd jobs", hours: "as you go",
      text: "The robbery set and the hidden odd jobs. Vaults, gang operations, and the five hidden trophies whose methods are not confirmed yet.",
      ids: [33, 34, 37, 38, 39, 41, 44, 45, 46, 47, 48, 49, 50, 51, 53, 54] }
  ];

  var KIND_LABELS = {
    story: "Story", side: "Side", activities: "Activities",
    collectibles: "Collectibles", robberies: "Robberies", exploration: "Exploration"
  };

  var data = null;          // parsed trophies.json
  var byId = {};
  var selectedId = DEFAULT_TROPHY;
  var state = { earned: {}, counters: {}, spoilerHidden: true, revealed: {} };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === "object") {
        if (saved.earned) state.earned = saved.earned;
        if (saved.counters) state.counters = saved.counters;
        if (typeof saved.spoilerHidden === "boolean") state.spoilerHidden = saved.spoilerHidden;
        if (saved.revealed) state.revealed = saved.revealed;
      }
    } catch (e) { /* corrupt saved state — start fresh */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      var note = $("savedNote");
      if (note) note.textContent = "progress saved " + new Date().toLocaleTimeString();
    } catch (e) { /* storage unavailable (private mode) — app still works in memory */ }
  }

  function isEarned(t) { return !!state.earned[t.id]; }
  function isMasked(t) {
    return state.spoilerHidden && t.kind === "story" && !isEarned(t) && !state.revealed[t.id];
  }
  function counterOf(t) {
    if (t.target == null) return null;
    var v = state.counters[t.id];
    if (v == null) v = 0;
    return Math.max(0, Math.min(t.target, v));
  }
  function sourceName(id) {
    var s = data.sources.filter(function (x) { return x.id === id; })[0];
    return s ? s.name : ("Source " + id);
  }

  /* ---------- checklist ---------- */

  function filteredTrophies() {
    var q = ($("search").value || "").trim().toLowerCase();
    var kind = $("kindFilter").value;
    var grade = $("gradeFilter").value;
    var hideEarned = $("hideEarned").checked;
    return data.trophies.filter(function (t) {
      if (hideEarned && isEarned(t)) return false;
      if (grade !== "all" && t.grade !== grade) return false;
      if (kind === "missable") { if (!t.missable) return false; }
      else if (kind !== "all" && t.kind !== kind) return false;
      if (q) {
        var hay = (t.name + " " + t.description + " " + t.guide + " " +
          t.steps.map(function (s) { return s.text; }).join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderList() {
    var list = filteredTrophies();
    var earnedCount = data.trophies.filter(isEarned).length;
    $("listMeta").textContent = "Showing " + list.length + " of 55 trophies · " +
      earnedCount + " earned (" + Math.round(earnedCount / 55 * 100) + "%) · " +
      data.trophies.reduce(function (a, t) { return a + (isEarned(t) ? t.gamerscore : 0); }, 0) +
      " / 1,000 Gamerscore";
    var html = list.map(function (t) {
      var masked = isMasked(t);
      var c = counterOf(t);
      var tags = '<span class="tag">' + esc(KIND_LABELS[t.kind] || t.kind) + "</span>";
      if (masked) {
        // A masked row leaks nothing: no grade, no Gamerscore, no rarity, no counter.
        tags += '<span class="tag hidden-tag">Hidden</span>';
      } else {
        tags += '<span class="tag">' + esc(gradeLabel(t.grade)) + "</span>";
        if (t.hidden) tags += '<span class="tag hidden-tag">Hidden</span>';
        if (t.missable) tags += '<span class="tag missable">Possibly missable</span>';
        if (t.gamerscore) tags += "<span>" + t.gamerscore + "G</span>";
        if (t.rarity) tags += "<span>Rarity " + esc(t.rarity) + "</span>";
        if (c != null) tags += '<span class="trophy-count">' + c + " / " + t.target + " " + esc(t.targetLabel || "") + "</span>";
      }
      return '<li class="trophy-item' + (t.id === selectedId ? " selected" : "") +
        (isEarned(t) ? " earned" : "") + '" data-id="' + t.id + '">' +
        '<input type="checkbox" class="trophy-check" data-id="' + t.id + '"' +
        (isEarned(t) ? " checked" : "") + ' aria-label="Mark ' + esc(masked ? "hidden story trophy" : t.name) + ' earned">' +
        '<div class="trophy-body"><div class="trophy-name">' +
        (masked ? '<span class="grade-dot" style="background:#c9bfa9"></span><span class="masked">Hidden story trophy</span>'
          : '<span class="grade-dot ' + esc(t.grade) + '"></span>' + esc(t.name)) +
        '</div><div class="trophy-desc">' +
        (masked ? "Hidden until earned — reveal it to read the guide." : esc(t.description)) +
        '</div><div class="trophy-tags">' + tags + "</div></div>" +
        '<button type="button" class="trophy-open" data-id="' + t.id + '">Guide</button></li>';
    }).join("");
    $("trophyList").innerHTML = html || '<li class="trophy-item">No trophies match these filters.</li>';
  }

  /* ---------- detail pane ---------- */

  function renderDetail() {
    var t = byId[selectedId] || data.trophies[0];
    var pane = $("detailPane");
    if (!t) { pane.innerHTML = '<p class="detail-empty">Pick a trophy from the list to read its guide.</p>'; return; }
    var masked = isMasked(t);
    var c = counterOf(t);
    var html = "";
    if (masked) {
      html += "<h2>Hidden story trophy</h2>" +
        '<p class="official-desc">Hidden until earned. Turn the spoiler setting off, or reveal this one trophy.</p>' +
        '<p class="reveal-note">This is the spoiler setting at work: story trophies stay masked until you earn them or reveal one. The guide is there — it is just hidden from you on purpose.</p>' +
        '<div class="detail-actions"><button type="button" class="btn primary" id="revealBtn">Reveal this trophy</button>' +
        '<button type="button" class="btn" id="earnBtn">Mark earned</button></div>';
      pane.innerHTML = html;
      $("revealBtn").addEventListener("click", function () {
        state.revealed[t.id] = true; saveState(); renderAll();
      });
      $("earnBtn").addEventListener("click", function () {
        state.earned[t.id] = true; saveState(); renderAll();
      });
      return;
    }
    html += "<h2>" + esc(t.name) + "</h2>" +
      '<p class="official-desc">&ldquo;' + esc(t.description) + "&rdquo;</p>" +
      '<div class="detail-meta"><span><span class="grade-dot ' + esc(t.grade) + '"></span><strong>' +
      esc(gradeLabel(t.grade)) + "</strong></span>" +
      "<span>" + t.gamerscore + "G</span>" +
      "<span>Rarity " + esc(t.rarity) + "</span>" +
      "<span>" + (t.hidden ? "Hidden" : "Visible") + " on PSN</span>" +
      "<span>" + esc(KIND_LABELS[t.kind] || t.kind) + "</span>" +
      "<span>Roadmap stage " + t.roadmap + "</span></div>";
    if (c != null) {
      html += '<div class="counter-box"><button type="button" id="counterMinus" aria-label="Decrease counter">&minus;</button>' +
        '<span class="counter-num">' + c + " / " + t.target + '</span>' +
        '<span class="counter-label">' + esc(t.targetLabel || "") + '</span>' +
        '<button type="button" id="counterPlus" aria-label="Increase counter">+</button></div>';
    }
    html += '<p class="detail-guide">' + esc(t.guide) + "</p>";
    html += '<ol class="steps">' + t.steps.map(function (s) {
      var cites = s.sources.map(function (id) {
        return '<span class="cite">[' + id + "] " + esc(sourceName(id)) + "</span>";
      }).join(" ");
      return "<li>" + esc(s.text) + " " + cites + "</li>";
    }).join("") + "</ol>";
    if (t.disagreement) {
      html += '<div class="disagree"><strong>Sources disagree</strong>' + esc(t.disagreement) + "</div>";
    }
    html += '<p class="detail-sources">Sources for this guide: ' +
      t.sources.map(function (id) { return "[" + id + "] " + esc(sourceName(id)); }).join(" · ") + ".</p>";
    html += '<div class="detail-actions"><button type="button" class="btn primary" id="earnBtn">' +
      (isEarned(t) ? "Mark not earned" : "Mark earned") + "</button></div>";
    pane.innerHTML = html;
    var minus = $("counterMinus"), plus = $("counterPlus");
    if (minus) minus.addEventListener("click", function () {
      state.counters[t.id] = Math.max(0, counterOf(t) - 1); saveState(); renderAll();
    });
    if (plus) plus.addEventListener("click", function () {
      state.counters[t.id] = Math.min(t.target, counterOf(t) + 1); saveState(); renderAll();
    });
    $("earnBtn").addEventListener("click", function () {
      if (isEarned(t)) delete state.earned[t.id]; else state.earned[t.id] = true;
      saveState(); renderAll();
    });
  }

  /* ---------- roadmap ---------- */

  function renderRoadmap() {
    $("roadmapStages").innerHTML = STAGES.map(function (st) {
      var chips = st.ids.map(function (id) {
        var t = byId[id];
        if (!t) return "";
        return '<span class="chip' + (isEarned(t) ? " earned" : "") + (t.missable ? " missable" : "") +
          '" data-id="' + t.id + '">' + esc(t.name) + "</span>";
      }).join("");
      return '<div class="stage"><h3>' + esc(st.title) + " — " + esc(st.hours) + "</h3><p>" +
        esc(st.text) + "</p><div class=\"stage-chips\">" + chips + "</div></div>";
    }).join("");
  }

  /* ---------- missables ---------- */

  function renderMissables() {
    var pma = byId[28];
    $("missableMain").innerHTML = "<h3>" + esc(pma.name) +
      ' <span class="tag missable">Possibly missable</span></h3>' +
      "<p>" + esc(pma.guide) + "</p>" +
      "<p>" + esc(pma.disagreement) + "</p>" +
      '<p><button type="button" class="btn primary" id="openPma">Open the full guide</button></p>' +
      "<p>Keep a manual save at the start of every chapter (15 manual slots, plus 1 autosave). " +
      "If you miss the Chapter 1 meditation, that save is the only way back — there is no mission replay.</p>";
    $("openPma").addEventListener("click", function () {
      selectedId = 28; setView("checklist"); renderAll();
    });

    var unconfirmed = data.trophies.filter(function (t) {
      return t.disagreement && /unconfirmed/i.test(t.disagreement);
    });
    $("unconfirmedList").innerHTML = unconfirmed.map(function (t) {
      return '<div class="unconfirmed-item"><strong>' + esc(t.name) + "</strong> — " +
        esc(t.description) + "<p>" + esc(t.disagreement) + "</p></div>";
    }).join("");

    var story = data.trophies.filter(function (t) { return t.kind === "story"; });
    $("storyMaskList").innerHTML = '<div class="mask-list">' + story.map(function (t) {
      return '<span class="mask-chip">' + (isMasked(t) ? "Hidden story trophy" : esc(t.name)) + "</span>";
    }).join("") + "</div>";
  }

  /* ---------- sources ---------- */

  function renderSources() {
    $("sourceList").innerHTML = data.sources.map(function (s) {
      var covered = data.trophies.filter(function (t) { return t.sources.indexOf(s.id) !== -1; }).length;
      return "<li><strong>" + esc(s.name) + "</strong> — cited for <strong>" + covered +
        " of 55</strong> trophies<br><span class=\"src-url\">" + esc(s.url) + "</span><br>" +
        '<span class="src-covers">' + esc(s.covers) + " · Read " + esc(s.read) + "</span></li>";
    }).join("");

    var head = "<tr><th>Trophy</th>" + data.sources.map(function (s) {
      return "<th>[" + s.id + "]</th>";
    }).join("") + "</tr>";
    var rows = data.trophies.map(function (t) {
      var cells = data.sources.map(function (s) {
        return t.sources.indexOf(s.id) !== -1 ? '<td class="hit">&#9679;</td>' : "<td></td>";
      }).join("");
      return '<tr><td class="name">' + esc(t.name) + "</td>" + cells + "</tr>";
    }).join("");
    var totals = "<tr><td class=\"name\">Trophies covered</td>" + data.sources.map(function (s) {
      var n = data.trophies.filter(function (t) { return t.sources.indexOf(s.id) !== -1; }).length;
      return "<td><strong>" + n + "</strong></td>";
    }).join("") + "</tr>";
    $("sourceMatrix").innerHTML = "<thead>" + head + "</thead><tbody>" + rows + totals + "</tbody>";
  }

  /* ---------- views ---------- */

  function setView(name) {
    var views = ["checklist", "roadmap", "missables", "sources"];
    views.forEach(function (v) {
      $("view-" + v).hidden = (v !== name);
    });
    document.querySelectorAll(".view-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === name);
    });
    if (location.hash !== "#/" + name) {
      history.replaceState(null, "", "#/" + name);
    }
  }

  function viewFromHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    return ["checklist", "roadmap", "missables", "sources"].indexOf(h) !== -1 ? h : "checklist";
  }

  function renderAll() {
    renderList();
    renderDetail();
    renderRoadmap();
    renderMissables();
    renderSources();
  }

  /* ---------- export / import ---------- */

  function exportObject() {
    return {
      app: "vice-city-trophy-ledger",
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: Object.keys(state.earned).map(Number).sort(function (a, b) { return a - b; }),
      counters: state.counters,
      spoilerHidden: state.spoilerHidden,
      revealed: Object.keys(state.revealed).map(Number).sort(function (a, b) { return a - b; })
    };
  }

  function openIo() {
    $("ioText").value = JSON.stringify(exportObject(), null, 2);
    $("ioStatus").textContent = "";
    $("ioModal").hidden = false;
    $("ioText").focus();
  }
  function closeIo() { $("ioModal").hidden = true; }

  function applyImport(text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { return "That is not valid JSON."; }
    if (!obj || obj.app !== "vice-city-trophy-ledger") return "That file is not a Vice City Trophy Ledger export.";
    var earned = {};
    (obj.earned || []).forEach(function (id) { if (byId[id]) earned[id] = true; });
    var counters = {};
    Object.keys(obj.counters || {}).forEach(function (k) {
      var t = byId[Number(k)];
      if (t && t.target != null) counters[k] = Math.max(0, Math.min(t.target, Number(obj.counters[k]) || 0));
    });
    var revealed = {};
    (obj.revealed || []).forEach(function (id) { if (byId[id]) revealed[id] = true; });
    state.earned = earned;
    state.counters = counters;
    if (typeof obj.spoilerHidden === "boolean") state.spoilerHidden = obj.spoilerHidden;
    state.revealed = revealed;
    saveState();
    $("spoilerToggle").checked = state.spoilerHidden;
    renderAll();
    return "Imported " + Object.keys(earned).length + " earned trophies.";
  }

  /* ---------- init ---------- */

  function init() {
    loadState();
    $("spoilerToggle").checked = state.spoilerHidden;

    document.querySelectorAll(".view-btn").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
    });
    window.addEventListener("hashchange", function () { setView(viewFromHash()); });

    ["search", "kindFilter", "gradeFilter", "hideEarned"].forEach(function (id) {
      $(id).addEventListener("input", renderList);
      $(id).addEventListener("change", renderList);
    });
    $("spoilerToggle").addEventListener("change", function () {
      state.spoilerHidden = $("spoilerToggle").checked;
      saveState(); renderAll();
    });

    $("trophyList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-id]");
      if (!btn) return;
      if (e.target.classList.contains("trophy-check")) return;
      selectedId = Number(btn.getAttribute("data-id"));
      renderAll();
      $("detailPane").scrollIntoView({ block: "nearest" });
    });
    $("trophyList").addEventListener("change", function (e) {
      if (!e.target.classList.contains("trophy-check")) return;
      var id = Number(e.target.getAttribute("data-id"));
      if (e.target.checked) state.earned[id] = true; else delete state.earned[id];
      saveState(); renderAll();
    });

    $("exportBtn").addEventListener("click", openIo);
    $("importBtn").addEventListener("click", openIo);
    $("ioClose").addEventListener("click", closeIo);
    $("ioModal").addEventListener("click", function (e) { if (e.target === $("ioModal")) closeIo(); });
    $("ioDownload").addEventListener("click", function () {
      var blob = new Blob([$("ioText").value], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "vice-city-trophy-ledger-progress.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      $("ioStatus").textContent = "Downloaded.";
    });
    $("ioCopy").addEventListener("click", function () {
      $("ioText").select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText($("ioText").value).then(function () {
          $("ioStatus").textContent = "Copied.";
        }, function () { $("ioStatus").textContent = "Copy failed — select the text manually."; });
      } else { document.execCommand("copy"); $("ioStatus").textContent = "Copied."; }
    });
    $("ioApply").addEventListener("click", function () {
      $("ioStatus").textContent = applyImport($("ioText").value);
    });
    $("importFile").addEventListener("change", function () {
      var f = $("importFile").files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        $("ioText").value = String(r.result);
        $("ioStatus").textContent = applyImport(String(r.result));
      };
      r.readAsText(f);
    });
    $("ioChoose").addEventListener("click", function () { $("importFile").click(); });
    // The Import button opens the modal; the file picker is the fallback inside it.
    $("importBtn").addEventListener("click", function () {
      $("ioStatus").textContent = "Paste an export below, or use the Download / Copy buttons to move progress between browsers.";
    });

    fetch("data/trophies.json")
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        data = d;
        data.trophies.forEach(function (t) { byId[t.id] = t; });
        setView(viewFromHash());
        renderAll();
      })
      .catch(function (err) {
        $("listMeta").textContent = "Could not load data/trophies.json (" + err.message + "). " +
          "Open this page from a web server (for example: python3 -m http.server) instead of file://.";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();

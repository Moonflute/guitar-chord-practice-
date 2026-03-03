// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    activeTab: "chord",
    // Chord
    rootNote: "G", selectedChordIdx: 0, position: "root6", showMode: "fingers", chordCategory: "All",
    // Scale
    scaleRange: 0, scaleShowMode: "name",
    // Chord quiz
    cqChordIdx: null, cqRoot: null, cqPos: null, cqRevealed: false,
    cqScore: { correct: 0, total: 0 },
    // Scale quiz
    sqRangeIdx: 0, sqDirection: "asc", sqShowMode: "name",
    sqSequence: [], sqCurrent: 0,
    sqCorrectIds: new Set(), sqMistakes: 0,
    // Note quiz
    nqSi: null, nqFret: null, nqNote: null, nqRevealed: false,
    nqScore: { correct: 0, total: 0 },
};

const SCALE_RANGES = [
    { label: "개방현 ~ 3프렛", start: 0, end: 3 },
    { label: "3 ~ 7프렛", start: 3, end: 7 },
    { label: "4 ~ 8프렛", start: 4, end: 8 },
    { label: "7 ~ 10프렛", start: 7, end: 10 },
];
const INTERVAL_KR = { "1": "루트", "b3": "단3도", "3": "장3도", "5": "완전5도", "b5": "감5도", "b7": "단7도", "7": "장7도", "9": "9th", "2": "장2도" };

// ─── Boot ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupChordMode();
    setupScaleMode();
    setupChordQuiz();
    setupScaleQuiz();
    setupNoteQuiz();
    switchTab("chord");
});

// ─── Tabs ────────────────────────────────────────────────────────────────────
function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(b =>
        b.addEventListener("click", () => switchTab(b.dataset.tab)));
}
function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === `panel-${tab}`));
    if (tab === "chord") renderChordMode();
    if (tab === "scale") renderScaleMode();
    if (tab === "chordquiz") initChordQuiz();
    if (tab === "scalequiz") renderSqUI();
    if (tab === "notequiz") initNoteQuiz();
}

// ═══════════════════════════════════════════════════════════════════════════
// CHORD MODE
// ═══════════════════════════════════════════════════════════════════════════
function setupChordMode() {
    document.querySelectorAll(".root-btn").forEach(b =>
        b.addEventListener("click", () => {
            state.rootNote = b.dataset.note;
            document.querySelectorAll(".root-btn").forEach(x => x.classList.toggle("active", x === b));
            renderChordMode();
        }));
    document.querySelector(`.root-btn[data-note="${state.rootNote}"]`)?.classList.add("active");
    document.querySelectorAll(".cat-btn").forEach(b =>
        b.addEventListener("click", () => { state.chordCategory = b.dataset.cat; document.querySelectorAll(".cat-btn").forEach(x => x.classList.toggle("active", x === b)); renderChordList(); }));
    document.querySelectorAll(".pos-btn").forEach(b =>
        b.addEventListener("click", () => { state.position = b.dataset.pos; document.querySelectorAll(".pos-btn").forEach(x => x.classList.toggle("active", x === b)); renderChordMode(); }));
    document.querySelectorAll(".show-btn").forEach(b =>
        b.addEventListener("click", () => { state.showMode = b.dataset.show; document.querySelectorAll(".show-btn").forEach(x => x.classList.toggle("active", x === b)); renderChordMode(); }));
    document.getElementById("btn-strum").addEventListener("click", () => strumChord("strum"));
    document.getElementById("btn-arpeggio").addEventListener("click", () => strumChord("arpeggio"));
    renderChordList();
}

function renderChordList() {
    const list = document.getElementById("chord-list");
    list.innerHTML = "";
    const filtered = state.chordCategory === "All" ? CHORD_DATA : CHORD_DATA.filter(c => c.category === state.chordCategory);
    filtered.forEach(chord => {
        const idx = CHORD_DATA.indexOf(chord);
        const btn = document.createElement("button");
        btn.className = "chord-item" + (idx === state.selectedChordIdx ? " active" : "");
        btn.innerHTML = `<span class="chord-symbol">${chord.symbol}</span><span class="chord-name">${chord.name}</span>`;
        btn.addEventListener("click", () => { state.selectedChordIdx = idx; document.querySelectorAll(".chord-item").forEach(b => b.classList.remove("active")); btn.classList.add("active"); renderChordMode(); });
        list.appendChild(btn);
    });
}

function renderChordMode() {
    const chord = CHORD_DATA[state.selectedChordIdx]; if (!chord) return;
    const absF = getChordFrets(chord, state.rootNote, state.position);
    document.getElementById("chord-title").textContent = `${state.rootNote}${chord.symbol}`;
    document.getElementById("chord-subtitle").textContent = chord.name + (state.position === "root6" ? " (6현 근음)" : " (5현 근음)");
    renderChordFretboard(document.getElementById("chord-diagram"), absF, chord[state.position].fingers, chord[state.position].intervals, state.showMode);
    renderChordInfoPanel(chord, absF, chord[state.position].intervals);
}

function renderChordInfoPanel(chord, absF, ivs) {
    const noteSet = [];
    absF.forEach((f, si) => { if (f !== "X") { const n = getNoteName(si, f); if (!noteSet.includes(n)) noteSet.push(n); } });
    document.getElementById("chord-notes").innerHTML = noteSet.map(n => `<span class="note-tag">${n}</span>`).join("");
    const ivSet = [...new Set(ivs.filter(i => i !== "X"))];
    document.getElementById("chord-intervals").innerHTML = ivSet.map(iv => `<span class="iv-tag" style="border-color:${getIntervalColor(iv)}">${iv} <small>${INTERVAL_KR[iv] || ""}</small></span>`).join("");
}

function strumChord(mode) {
    const chord = CHORD_DATA[state.selectedChordIdx]; if (!chord) return;
    const notes = getChordFrets(chord, state.rootNote, state.position).map((f, si) => f !== "X" ? { stringIdx: si, fret: f } : null).filter(Boolean);
    mode === "arpeggio" ? sound.playArpeggio(notes) : sound.playChord(notes, "down");
}

// ═══════════════════════════════════════════════════════════════════════════
// SCALE MODE
// ═══════════════════════════════════════════════════════════════════════════
function setupScaleMode() {
    document.querySelectorAll(".range-btn").forEach(b =>
        b.addEventListener("click", () => { state.scaleRange = Number(b.dataset.range); document.querySelectorAll(".range-btn").forEach(x => x.classList.toggle("active", x === b)); renderScaleMode(); }));
    document.getElementById("scale-show-toggle").addEventListener("change", e => { state.scaleShowMode = e.target.checked ? "solfege" : "name"; renderScaleMode(); });
}

function renderScaleMode() {
    const rng = SCALE_RANGES[state.scaleRange];
    document.getElementById("scale-title").textContent = `음표 위치 – ${rng.label}`;
    document.getElementById("scale-subtitle").textContent = `자연음 (C D E F G A B) · 강조 범위: ${rng.label} · 클릭하면 소리 재생`;
    renderScaleNotes(document.getElementById("scale-diagram"), rng.start, rng.end, state.scaleShowMode, dot => {
        sound.playScaleNote(dot.si, dot.fret);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CHORD QUIZ
// ═══════════════════════════════════════════════════════════════════════════
function setupChordQuiz() {
    document.getElementById("cq-next").addEventListener("click", initChordQuiz);
    document.getElementById("cq-reveal").addEventListener("click", revealCq);
    document.getElementById("cq-reset").addEventListener("click", () => { state.cqScore = { correct: 0, total: 0 }; updateCqScore(); });
    document.getElementById("cq-play").addEventListener("click", () => {
        if (state.cqChordIdx === null) return;
        const chord = CHORD_DATA[state.cqChordIdx];
        const notes = getChordFrets(chord, state.cqRoot, state.cqPos).map((f, si) => f !== "X" ? { stringIdx: si, fret: f } : null).filter(Boolean);
        sound.playChord(notes, "down");
    });
}

function initChordQuiz() {
    const root = NOTE_NAMES[Math.floor(Math.random() * 12)];
    const idx = Math.floor(Math.random() * CHORD_DATA.length);
    const pos = Math.random() > 0.5 ? "root6" : "root5";
    state.cqChordIdx = idx; state.cqRoot = root; state.cqPos = pos; state.cqRevealed = false;
    const chord = CHORD_DATA[idx], correct = `${root}${chord.symbol}`;
    const opts = [correct]; const seen = new Set([correct]);
    while (opts.length < 4) { const r = NOTE_NAMES[Math.floor(Math.random() * 12)]; const c = CHORD_DATA[Math.floor(Math.random() * CHORD_DATA.length)]; const s = `${r}${c.symbol}`; if (!seen.has(s)) { seen.add(s); opts.push(s); } }
    opts.sort(() => Math.random() - 0.5);
    const absF = getChordFrets(chord, root, pos);
    renderChordFretboard(document.getElementById("cq-diagram"), absF, chord[pos].fingers, chord[pos].intervals, "fingers");
    const grid = document.getElementById("cq-options"); grid.innerHTML = "";
    opts.forEach(opt => { const btn = document.createElement("button"); btn.className = "cq-opt-btn"; btn.textContent = opt; btn.addEventListener("click", () => checkCq(btn, opt, correct)); grid.appendChild(btn); });
    document.getElementById("cq-result").textContent = ""; document.getElementById("cq-result").className = "cq-result";
    updateCqScore();
}

function checkCq(btn, chosen, correct) {
    if (state.cqRevealed) return;
    state.cqRevealed = true; state.cqScore.total++;
    if (chosen === correct) { btn.classList.add("correct"); document.getElementById("cq-result").textContent = "🎉 정답!"; document.getElementById("cq-result").className = "cq-result correct"; state.cqScore.correct++; }
    else { btn.classList.add("wrong"); document.getElementById("cq-result").textContent = `❌ 오답! 정답: ${correct}`; document.getElementById("cq-result").className = "cq-result wrong"; document.querySelectorAll(".cq-opt-btn").forEach(b => { if (b.textContent === correct) b.classList.add("correct"); }); }
    updateCqScore();
}

function revealCq() {
    if (state.cqRevealed || state.cqChordIdx === null) return;
    state.cqRevealed = true;
    const correct = `${state.cqRoot}${CHORD_DATA[state.cqChordIdx].symbol}`;
    document.getElementById("cq-result").textContent = `정답: ${correct}`;
    document.querySelectorAll(".cq-opt-btn").forEach(b => { if (b.textContent === correct) b.classList.add("correct"); });
}
function updateCqScore() {
    const { correct, total } = state.cqScore;
    document.getElementById("cq-score").textContent = total > 0 ? `${correct}/${total} (${Math.round(correct / total * 100)}%)` : "0/0";
}

// ═══════════════════════════════════════════════════════════════════════════
// SCALE QUIZ  –  click ALL natural notes in range in pitch order
// ═══════════════════════════════════════════════════════════════════════════
function setupScaleQuiz() {
    document.querySelectorAll(".sq-range-btn").forEach(b =>
        b.addEventListener("click", () => { state.sqRangeIdx = Number(b.dataset.range); document.querySelectorAll(".sq-range-btn").forEach(x => x.classList.toggle("active", x === b)); }));
    document.getElementById("sq-start").addEventListener("click", startSq);
    document.getElementById("sq-solfege-toggle").addEventListener("change", e => {
        state.sqShowMode = e.target.checked ? "solfege" : "name";
        if (state.sqSequence.length > 0) renderSqBoard();
    });
}

function renderSqUI() {
    document.getElementById("sq-diagram").innerHTML =
        '<div style="padding:40px;text-align:center;color:var(--text-muted)">[새 퀴즈 시작]을 클릭하세요.</div>';
    updateSqScore();
}

function startSq() {
    const rng = SCALE_RANGES[state.sqRangeIdx];
    const dir = document.getElementById("sq-dir-select").value;
    state.sqDirection = dir;

    // All natural notes in range, sorted by pitch
    const notes = getNaturalNotesInRange(rng.start, rng.end);
    notes.sort((a, b) => dir === "asc" ? a.pitch - b.pitch : b.pitch - a.pitch);

    state.sqSequence = notes.map(n => ({
        si: n.si, fret: n.fret, noteName: n.noteName, pitch: n.pitch,
        id: `${n.si}-${n.fret}`,
        color: NOTE_COLORS_SCALE[n.noteName], label: n.noteName,
    }));
    state.sqCurrent = 0;
    state.sqCorrectIds = new Set();
    state.sqMistakes = 0;

    renderSqBoard();
}

function renderSqBoard() {
    const rng = SCALE_RANGES[state.sqRangeIdx];
    const correctIds = state.sqCorrectIds;
    const correctDots = state.sqSequence.filter(d => correctIds.has(d.id));

    function onGridClick(si, fret) {
        if (state.sqCurrent >= state.sqSequence.length) return;
        const expected = state.sqSequence[state.sqCurrent];
        if (si === expected.si && fret === expected.fret) {
            correctIds.add(expected.id);
            sound.playScaleNote(si, fret);
            state.sqCurrent++;
            renderSqBoard();
        } else {
            state.sqMistakes++;
            const diag = document.getElementById("sq-diagram");
            diag.classList.add("shake");
            setTimeout(() => diag.classList.remove("shake"), 500);
            renderSqBoard();
        }
    }

    renderEmptyQuizFretboard(
        document.getElementById("sq-diagram"),
        correctDots, rng.start, rng.end, onGridClick, state.sqShowMode
    );
    updateSqScore();
}

function updateSqScore() {
    const done = state.sqCorrectIds?.size || 0;
    const total = state.sqSequence?.length || 0;
    const el = document.getElementById("sq-score");
    if (total === 0) { el.textContent = "퀴즈를 시작하세요"; return; }
    if (done >= total) { el.textContent = `🎉 완료! 실수 ${state.sqMistakes}회`; return; }
    el.textContent = `${done} / ${total} 완료 · 실수 ${state.sqMistakes}회`;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTE QUIZ  –  random position, guess the note name
// ═══════════════════════════════════════════════════════════════════════════
function setupNoteQuiz() {
    document.getElementById("nq-next").addEventListener("click", initNoteQuiz);
    document.getElementById("nq-reveal").addEventListener("click", revealNq);
    document.getElementById("nq-reset").addEventListener("click", () => { state.nqScore = { correct: 0, total: 0 }; updateNqScore(); });
    document.getElementById("nq-play").addEventListener("click", () => {
        if (state.nqSi === null) return;
        sound.playScaleNote(state.nqSi, state.nqFret);
    });
}

function initNoteQuiz() {
    const si = Math.floor(Math.random() * 6);
    const fret = Math.floor(Math.random() * 13); // 0-12
    const nv = (OPEN_STRING_NOTES[si] + fret) % 12;
    const correct = NOTE_NAMES[nv];

    state.nqSi = si; state.nqFret = fret; state.nqNote = correct; state.nqRevealed = false;

    // 4 options
    const opts = [correct]; const seen = new Set([correct]);
    while (opts.length < 4) { const n = NOTE_NAMES[Math.floor(Math.random() * 12)]; if (!seen.has(n)) { seen.add(n); opts.push(n); } }
    opts.sort(() => Math.random() - 0.5);

    renderNoteQuizFretboard(document.getElementById("nq-diagram"), si, fret, false, correct);

    const grid = document.getElementById("nq-options"); grid.innerHTML = "";
    opts.forEach(opt => { const btn = document.createElement("button"); btn.className = "cq-opt-btn"; btn.textContent = opt; btn.addEventListener("click", () => checkNq(btn, opt, correct)); grid.appendChild(btn); });

    document.getElementById("nq-result").textContent = ""; document.getElementById("nq-result").className = "cq-result";
    updateNqScore();
}

function checkNq(btn, chosen, correct) {
    if (state.nqRevealed) return;
    state.nqRevealed = true; state.nqScore.total++;
    renderNoteQuizFretboard(document.getElementById("nq-diagram"), state.nqSi, state.nqFret, true, correct);
    if (chosen === correct) {
        btn.classList.add("correct"); document.getElementById("nq-result").textContent = "🎉 정답!"; document.getElementById("nq-result").className = "cq-result correct"; state.nqScore.correct++;
        sound.playScaleNote(state.nqSi, state.nqFret);
    } else {
        btn.classList.add("wrong"); document.getElementById("nq-result").textContent = `❌ 오답! 정답: ${correct}`; document.getElementById("nq-result").className = "cq-result wrong";
        document.querySelectorAll("#nq-options .cq-opt-btn").forEach(b => { if (b.textContent === correct) b.classList.add("correct"); });
    }
    updateNqScore();
}

function revealNq() {
    if (state.nqRevealed || state.nqSi === null) return;
    state.nqRevealed = true;
    renderNoteQuizFretboard(document.getElementById("nq-diagram"), state.nqSi, state.nqFret, true, state.nqNote);
    document.getElementById("nq-result").textContent = `정답: ${state.nqNote}`;
    document.querySelectorAll("#nq-options .cq-opt-btn").forEach(b => { if (b.textContent === state.nqNote) b.classList.add("correct"); });
}

function updateNqScore() {
    const { correct, total } = state.nqScore;
    document.getElementById("nq-score").textContent = total > 0 ? `${correct}/${total} (${Math.round(correct / total * 100)}%)` : "0/0";
}

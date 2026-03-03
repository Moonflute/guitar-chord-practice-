// ─── Note constants ─────────────────────────────────────────────────────────
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_MAP = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const OPEN_STRING_NOTES = [4, 9, 2, 7, 11, 4]; // strings 6→1 (E A D G B E)
const OPEN_STRING_FREQ = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
const OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // for pitch ordering

// Solfege (Korean) mapping
const NOTE_SOLFEGE = { C: "도", D: "레", E: "미", F: "파", G: "솔", A: "라", B: "시" };
const DEGREE_KR = { "1": "도", "2": "레", "3": "미", "4": "파", "5": "솔", "6": "라", "7": "시" };

// ─── Interval helpers ────────────────────────────────────────────────────────
const INTERVAL_COLORS = {
    "1": "#C44038", "2": "#D4870A", "3": "#8B6914", "4": "#2D6B4A",
    "5": "#1A6B8A", "6": "#7A2A9A", "7": "#C44088",
    "b3": "#1A6B8A", "b5": "#7A2A9A", "b7": "#9A2A6A", "9": "#D4870A"
};
function getIntervalColor(iv) { return INTERVAL_COLORS[iv] || "#8B4513"; }

// ─── Root fret (returns 0 for open string) ──────────────────────────────────
function getRootFret(rootNote, stringIdx) {
    return (rootNote - OPEN_STRING_NOTES[stringIdx] + 12) % 12;
}

// ─── Chord frets ─────────────────────────────────────────────────────────────
function getChordFrets(chordDef, rootNoteName, position) {
    const rootNote = NOTE_MAP[rootNoteName];
    const pos = chordDef[position];
    const stringIdx = position === "root6" ? 0 : 1;
    const rootFret = getRootFret(rootNote, stringIdx);

    return pos.frets_rel.map(rel => {
        if (rel === "X") return "X";
        return rootFret + Number(rel);
    });
}

// ─── Note helpers ────────────────────────────────────────────────────────────
function getNoteName(si, fret) {
    return NOTE_NAMES[(OPEN_STRING_NOTES[si] + fret) % 12];
}
function getNoteFreq(si, fret) {
    return OPEN_STRING_FREQ[si] * Math.pow(2, fret / 12);
}
function getNotePitch(si, fret) {
    return OPEN_MIDI[si] + fret;
}

// ─── Scale: natural note positions in a fret range ─────────────────────────
const NATURAL_NOTES = new Set(["C", "D", "E", "F", "G", "A", "B"]);

function getNaturalNotesInRange(startFret, endFret) {
    const notes = [];
    for (let si = 0; si < 6; si++) {
        const lo = startFret === 0 ? 0 : startFret;
        for (let fret = lo; fret <= endFret; fret++) {
            const nv = (OPEN_STRING_NOTES[si] + fret) % 12;
            const name = NOTE_NAMES[nv];
            if (!NATURAL_NOTES.has(name)) continue;
            notes.push({ si, fret, noteName: name, pitch: getNotePitch(si, fret) });
        }
    }
    return notes;
}

// For barre detection (used by fretboard.js)
function detectBarre(fingers, absoluteFrets) {
    const f1 = [];
    fingers.forEach((f, i) => {
        if (f === 1 && absoluteFrets[i] !== "X") f1.push({ si: i, fret: absoluteFrets[i] });
    });
    if (f1.length < 2) return null;
    const fret = f1[0].fret;
    if (f1.every(p => p.fret === fret)) return { fret, from: f1[0].si, to: f1[f1.length - 1].si };
    return null;
}

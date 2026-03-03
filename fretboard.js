/**
 * fretboard.js – Horizontal fretboard SVG renderer.
 * Low E (string 6) at bottom, high E (string 1) at top.
 */

function svgEl(tag, attrs = {}, text = "") {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text) el.textContent = text;
    return el;
}

const INLAY_FRETS = [3, 5, 7, 9, 12];
const STRING_LABELS = ["6(E)", "5(A)", "4(D)", "3(G)", "2(B)", "1(e)"];
const FINGER_COLORS = { 1: "#C44038", 2: "#1A6B9A", 3: "#2D6B4A", 4: "#8B5A14" };

const NOTE_COLORS_SCALE = {
    "C": "#C44038", "C#": "#A83A80", "D": "#D4870A", "D#": "#8B6914",
    "E": "#2D6B4A", "F": "#1A6B8A", "F#": "#2A4A9A", "G": "#7A2A9A",
    "G#": "#9A2A5A", "A": "#8A4A1A", "A#": "#5A7A2A", "B": "#3A6A7A"
};

const CFG = { fretW: 58, openW: 42, strH: 46, padTop: 34, padBot: 12, padRight: 16, dotR: 16 };

/**
 * Core renderer.
 * dots: [{si, fret, color, label, id, finger?}]
 * si: 0=str6(lowE)…5=str1(highE), drawn bottom→top
 * dimmedIds: Set – dashed ghost circles
 * contextIds: Set – small gray context dots (no label)
 * correctIds: Set – green filled
 * targetIds:  Set – amber filled
 * onClick: (dot)=>void
 */
function renderHorizontalFretboard(container, {
    startFret = 1, endFret = 12, showOpen = true,
    dots = [], muted = [],
    dimmedIds = new Set(), contextIds = new Set(),
    correctIds = new Set(), targetIds = new Set(),
    onClick = null,
} = {}) {
    container.innerHTML = "";
    const numFrets = endFret - startFret + 1;
    const openZone = showOpen ? CFG.openW : 0;
    const nutX = openZone;
    const W = nutX + numFrets * CFG.fretW + CFG.padRight;
    const H = CFG.padTop + 5 * CFG.strH + CFG.padBot;

    const svg = svgEl("svg", { width: W, height: H, class: "h-fretboard" });

    // si=0 → bottom (string6, low E), si=5 → top (string1, high E)
    const strY = si => CFG.padTop + (5 - si) * CFG.strH;
    const fretCX = fret => nutX + (fret - startFret + 0.5) * CFG.fretW;
    const fretLX = fret => nutX + (fret - startFret) * CFG.fretW;

    // Open zone tint
    if (showOpen) {
        svg.appendChild(svgEl("rect", { x: 0, y: CFG.padTop, width: nutX, height: 5 * CFG.strH, fill: "#F5EDE0", opacity: 0.5 }));
    }

    // Strings
    for (let si = 0; si < 6; si++) {
        const y = strY(si);
        svg.appendChild(svgEl("line", { x1: 0, y1: y, x2: W - CFG.padRight, y2: y, stroke: "#C4A882", "stroke-width": 0.8 + si * 0.4 }));
        svg.appendChild(svgEl("text", { x: 3, y: y + 4, fill: "#B89880", "font-size": 9, "font-family": "Inter,sans-serif" }, STRING_LABELS[si]));
    }

    // Nut
    svg.appendChild(svgEl("rect", { x: nutX - 3, y: CFG.padTop, width: 4, height: 5 * CFG.strH, fill: "#9A7A5A", rx: 1 }));

    // Fret lines
    for (let f = startFret; f <= endFret; f++) {
        svg.appendChild(svgEl("line", { x1: fretLX(f), y1: CFG.padTop, x2: fretLX(f), y2: CFG.padTop + 5 * CFG.strH, stroke: "#D4C4A8", "stroke-width": 1.2 }));
    }
    svg.appendChild(svgEl("line", { x1: nutX + numFrets * CFG.fretW, y1: CFG.padTop, x2: nutX + numFrets * CFG.fretW, y2: CFG.padTop + 5 * CFG.strH, stroke: "#C4B49A", "stroke-width": 1.5 }));

    // Inlay markers
    for (const f of INLAY_FRETS) {
        if (f < startFret || f > endFret) continue;
        const cx = fretCX(f);
        svg.appendChild(svgEl("text", { x: cx, y: CFG.padTop - 7, "text-anchor": "middle", fill: "#9A7A5A", "font-size": 11, "font-weight": "600", "font-family": "Outfit,sans-serif" }, String(f)));
        const midY = (strY(2) + strY(3)) / 2;
        if (f === 12) {
            svg.appendChild(svgEl("circle", { cx, cy: (strY(1) + strY(2)) / 2, r: 3.5, fill: "#D4C4A8" }));
            svg.appendChild(svgEl("circle", { cx, cy: (strY(3) + strY(4)) / 2, r: 3.5, fill: "#D4C4A8" }));
        } else {
            svg.appendChild(svgEl("circle", { cx, cy: midY, r: 3.5, fill: "#D4C4A8" }));
        }
    }

    // Mute symbols
    for (const si of muted) {
        const ox = showOpen ? openZone / 2 : nutX - 14;
        svg.appendChild(svgEl("text", { x: ox, y: strY(si) + 5, "text-anchor": "middle", fill: "#C44038", "font-size": 14, "font-weight": "bold" }, "×"));
    }

    // Barre bar (finger=1 on multiple strings same fret)
    const f1dots = dots.filter(d => d.finger === 1 && d.fret > 0);
    if (f1dots.length >= 2 && f1dots.every(d => d.fret === f1dots[0].fret)) {
        const bFret = f1dots[0].fret;
        const cx = fretCX(bFret);
        const siArr = f1dots.map(d => d.si);
        svg.appendChild(svgEl("rect", {
            x: cx - CFG.dotR, y: strY(Math.max(...siArr)) - CFG.dotR,
            width: CFG.dotR * 2, height: strY(Math.min(...siArr)) - strY(Math.max(...siArr)) + CFG.dotR * 2,
            rx: CFG.dotR, fill: "#C44038", opacity: 0.88
        }));
        // Barre label at top string
        const topSi = Math.max(...siArr);
        svg.appendChild(svgEl("text", { x: cx, y: strY(topSi) + 1, "text-anchor": "middle", "dominant-baseline": "middle", fill: "#fff", "font-size": 10, "font-weight": "700", "font-family": "Inter,sans-serif" }, "1"));
    }

    // Dots
    for (const dot of dots) {
        const { si, fret, color, label, id, finger } = dot;

        // Skip barre members except rendering handled above
        const isBarreMember = finger === 1 && f1dots.length >= 2 && f1dots.every(d => d.fret === fret) && fret > 0;

        const cx = fret === 0 ? (showOpen ? openZone / 2 : null) : (fret >= startFret && fret <= endFret ? fretCX(fret) : null);
        if (cx === null) continue;
        const cy = strY(si);

        // Context dots: small gray circle, no label
        if (contextIds.has(id)) {
            svg.appendChild(svgEl("circle", { cx, cy, r: CFG.dotR * 0.55, fill: "none", stroke: "#D4C4A8", "stroke-width": 1 }));
            if (onClick) {
                const hit = svgEl("circle", { cx, cy, r: CFG.dotR * 0.55 + 4, fill: "transparent" });
                hit.style.cursor = "pointer";
                hit.addEventListener("click", () => onClick(dot));
                svg.appendChild(hit);
            }
            continue;
        }

        // Dimmed: dashed ghost circle (quiz hidden)
        if (dimmedIds.has(id) && !correctIds.has(id) && !targetIds.has(id)) {
            svg.appendChild(svgEl("circle", { cx, cy, r: CFG.dotR, fill: "rgba(196,168,130,0.15)", stroke: "#C4A882", "stroke-width": 1.5, "stroke-dasharray": "3,2" }));
            if (onClick) {
                const hit = svgEl("circle", { cx, cy, r: CFG.dotR + 4, fill: "transparent" });
                hit.style.cursor = "pointer";
                hit.addEventListener("click", () => onClick(dot));
                svg.appendChild(hit);
            }
            continue;
        }

        // Normal / correct / target
        if (isBarreMember) continue;
        const fill = correctIds.has(id) ? "#2D6B4A" : targetIds.has(id) ? "#C4874A" : (color || "#8B4513");
        svg.appendChild(svgEl("circle", { cx, cy, r: CFG.dotR, fill, opacity: 0.93 }));
        if (fret === 0) {
            svg.appendChild(svgEl("circle", { cx, cy, r: CFG.dotR, fill: "none", stroke: fill, "stroke-width": 2 }));
            svg.appendChild(svgEl("circle", { cx, cy, r: CFG.dotR - 3, fill, opacity: 0.65 }));
        }
        if (label) {
            svg.appendChild(svgEl("text", {
                x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "middle",
                fill: "#fff", "font-size": String(label).length > 2 ? 8 : 10, "font-weight": "700", "font-family": "Inter,sans-serif"
            }, String(label)));
        }
        if (onClick) {
            const hit = svgEl("circle", { cx, cy, r: CFG.dotR + 4, fill: "transparent" });
            hit.style.cursor = "pointer";
            hit.addEventListener("click", () => onClick(dot));
            svg.appendChild(hit);
        }
    }

    container.appendChild(svg);
}

// ── Chord rendering (full 12-fret) ────────────────────────────────────────
function renderChordFretboard(container, absoluteFrets, fingers, intervals, showMode) {
    const muted = [], dots = [];
    absoluteFrets.forEach((fret, si) => {
        if (fret === "X") { muted.push(si); return; }
        const finger = fingers[si];
        if (finger === "X") return;
        const label = showMode === "intervals" ? intervals[si] : String(finger);
        const color = FINGER_COLORS[finger] || "#8B4513";
        dots.push({ si, fret, color, label, id: `${si}-${fret}`, finger: Number(finger) });
    });
    renderHorizontalFretboard(container, { startFret: 1, endFret: 12, showOpen: true, dots, muted });
}

// ── Scale note view: full 1-12, amber highlight band for selected range ──────
function renderScaleNotes(container, hlStart, hlEnd, showMode, onNoteClick) {
    const NATURAL = new Set(["C", "D", "E", "F", "G", "A", "B"]);
    const dots = [];
    for (let si = 0; si < 6; si++) {
        for (let fret = 0; fret <= 12; fret++) {
            const nv = (OPEN_STRING_NOTES[si] + fret) % 12;
            const name = NOTE_NAMES[nv];
            if (!NATURAL.has(name)) continue;
            const inRange = fret >= hlStart && fret <= hlEnd;
            const label = showMode === "solfege" ? (NOTE_SOLFEGE[name] || name) : name;
            dots.push({ si, fret, id: `${si}-${fret}`, color: NOTE_COLORS_SCALE[name], label, noteName: name, inRange });
        }
    }

    // Build SVG with highlight band manually (we need to insert band before dots)
    const openZone = CFG.openW;
    const nutX = openZone;
    const numFrets = 12;
    const W = nutX + numFrets * CFG.fretW + CFG.padRight;
    const H = CFG.padTop + 5 * CFG.strH + CFG.padBot;
    const svg = svgEl("svg", { width: W, height: H, class: "h-fretboard" });

    const strY = si => CFG.padTop + (5 - si) * CFG.strH;
    const fretCX = fret => nutX + (fret - 1 + 0.5) * CFG.fretW;
    const fretLX = fret => nutX + (fret - 1) * CFG.fretW;

    // Amber highlight band
    const bx1 = hlStart === 0 ? 0 : fretLX(hlStart);
    const bx2 = fretLX(hlEnd + 1);
    svg.appendChild(svgEl("rect", {
        x: bx1 - 1, y: CFG.padTop - 4,
        width: bx2 - bx1 + 1, height: 5 * CFG.strH + 8,
        fill: "rgba(196,135,74,0.10)",
        stroke: "rgba(196,135,74,0.5)",
        "stroke-width": 1.5, rx: 4
    }));

    // Open zone tint
    svg.appendChild(svgEl("rect", { x: 0, y: CFG.padTop, width: nutX, height: 5 * CFG.strH, fill: "#F5EDE0", opacity: 0.5 }));

    // Strings
    for (let si = 0; si < 6; si++) {
        const y = strY(si);
        svg.appendChild(svgEl("line", { x1: 0, y1: y, x2: W - CFG.padRight, y2: y, stroke: "#C4A882", "stroke-width": 0.8 + si * 0.4 }));
        svg.appendChild(svgEl("text", { x: 3, y: y + 4, fill: "#B89880", "font-size": 9, "font-family": "Inter,sans-serif" }, STRING_LABELS[si]));
    }

    // Nut
    svg.appendChild(svgEl("rect", { x: nutX - 3, y: CFG.padTop, width: 4, height: 5 * CFG.strH, fill: "#9A7A5A", rx: 1 }));

    // Fret lines
    for (let f = 1; f <= 12; f++) {
        svg.appendChild(svgEl("line", { x1: fretLX(f), y1: CFG.padTop, x2: fretLX(f), y2: CFG.padTop + 5 * CFG.strH, stroke: "#D4C4A8", "stroke-width": 1.2 }));
    }
    svg.appendChild(svgEl("line", { x1: nutX + 12 * CFG.fretW, y1: CFG.padTop, x2: nutX + 12 * CFG.fretW, y2: CFG.padTop + 5 * CFG.strH, stroke: "#C4B49A", "stroke-width": 1.5 }));

    // Inlay markers
    for (const f of INLAY_FRETS) {
        if (f < 1 || f > 12) continue;
        const cx = fretCX(f);
        const mid = (strY(2) + strY(3)) / 2;
        svg.appendChild(svgEl("text", { x: cx, y: CFG.padTop - 7, "text-anchor": "middle", fill: "#9A7A5A", "font-size": 11, "font-weight": "600", "font-family": "Outfit,sans-serif" }, String(f)));
        if (f === 12) {
            svg.appendChild(svgEl("circle", { cx, cy: (strY(1) + strY(2)) / 2, r: 3.5, fill: "#D4C4A8" }));
            svg.appendChild(svgEl("circle", { cx, cy: (strY(3) + strY(4)) / 2, r: 3.5, fill: "#D4C4A8" }));
        } else {
            svg.appendChild(svgEl("circle", { cx, cy: mid, r: 3.5, fill: "#D4C4A8" }));
        }
    }

    // Dots
    for (const dot of dots) {
        const cx = dot.fret === 0 ? openZone / 2 : fretCX(dot.fret);
        if (dot.fret > 12) continue;
        const cy = strY(dot.si);
        const dim = !dot.inRange;
        svg.appendChild(svgEl("circle", { cx, cy, r: CFG.dotR, fill: dot.color, opacity: dim ? 0.3 : 0.92 }));
        if (!dim) {
            svg.appendChild(svgEl("text", {
                x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "middle",
                fill: "#fff", "font-size": String(dot.label).length > 2 ? 8 : 10,
                "font-weight": "700", "font-family": "Inter,sans-serif"
            }, String(dot.label)));
        }
        if (onNoteClick && dot.inRange) {
            const hit = svgEl("circle", { cx, cy, r: CFG.dotR + 4, fill: "transparent", style: "cursor:pointer" });
            hit.addEventListener("click", () => onNoteClick(dot));
            svg.appendChild(hit);
        }
    }

    container.innerHTML = "";
    container.appendChild(svg);
}

// ── Note quiz single-dot view ──────────────────────────────────────────────
function renderNoteQuizFretboard(container, si, fret, revealed, noteName) {
    const color = revealed ? (NOTE_COLORS_SCALE[noteName] || "#8B4513") : "#9A7A5A";
    const label = revealed ? noteName : "?";
    renderHorizontalFretboard(container, {
        startFret: 1, endFret: 12, showOpen: true,
        dots: [{ si, fret, color, label, id: "target" }]
    });
}

// ── Scale quiz: full 1-12 fretboard, range highlighted, empty then fill green ─
function renderEmptyQuizFretboard(container, correctDots, startFret, endFret, onGridClick, showMode = "name") {
    const showOpen = startFret === 0;
    const openZone = CFG.openW;   // always show open zone
    const nutX = openZone;
    const numFrets = 12;           // always show frets 1-12
    const W = nutX + numFrets * CFG.fretW + CFG.padRight;
    const H = CFG.padTop + 5 * CFG.strH + CFG.padBot;
    const svg = svgEl("svg", { width: W, height: H, class: "h-fretboard" });

    const strY = si => CFG.padTop + (5 - si) * CFG.strH;
    const fretCX = fret => nutX + (fret - 1 + 0.5) * CFG.fretW;
    const fretLX = fret => nutX + (fret - 1) * CFG.fretW;

    // Amber highlight band for selected range
    const bx1 = startFret === 0 ? 0 : fretLX(startFret);
    const bx2 = fretLX(endFret + 1);
    svg.appendChild(svgEl("rect", {
        x: bx1 - 1, y: CFG.padTop - 4,
        width: bx2 - bx1 + 1, height: 5 * CFG.strH + 8,
        fill: "rgba(196,135,74,0.10)",
        stroke: "rgba(196,135,74,0.5)",
        "stroke-width": 1.5, rx: 4
    }));

    // Open zone tint (always shown)
    svg.appendChild(svgEl("rect", { x: 0, y: CFG.padTop, width: nutX, height: 5 * CFG.strH, fill: "#F5EDE0", opacity: 0.5 }));
    // Strings
    for (let si = 0; si < 6; si++) {
        const y = strY(si);
        svg.appendChild(svgEl("line", { x1: 0, y1: y, x2: W - CFG.padRight, y2: y, stroke: "#C4A882", "stroke-width": 0.8 + si * 0.4 }));
        svg.appendChild(svgEl("text", { x: 3, y: y + 4, fill: "#B89880", "font-size": 9, "font-family": "Inter,sans-serif" }, STRING_LABELS[si]));
    }
    // Nut
    svg.appendChild(svgEl("rect", { x: nutX - 3, y: CFG.padTop, width: 4, height: 5 * CFG.strH, fill: "#9A7A5A", rx: 1 }));
    // Fret lines (all 12)
    for (let f = 1; f <= 12; f++) {
        svg.appendChild(svgEl("line", { x1: fretLX(f), y1: CFG.padTop, x2: fretLX(f), y2: CFG.padTop + 5 * CFG.strH, stroke: "#D4C4A8", "stroke-width": 1.2 }));
    }
    svg.appendChild(svgEl("line", { x1: nutX + 12 * CFG.fretW, y1: CFG.padTop, x2: nutX + 12 * CFG.fretW, y2: CFG.padTop + 5 * CFG.strH, stroke: "#C4B49A", "stroke-width": 1.5 }));
    // Inlay markers (all 12)
    for (const f of INLAY_FRETS) {
        if (f < 1 || f > 12) continue;
        const cx = fretCX(f);
        const mid = (strY(2) + strY(3)) / 2;
        svg.appendChild(svgEl("text", { x: cx, y: CFG.padTop - 7, "text-anchor": "middle", fill: "#9A7A5A", "font-size": 11, "font-weight": "600", "font-family": "Outfit,sans-serif" }, String(f)));
        if (f === 12) {
            svg.appendChild(svgEl("circle", { cx, cy: (strY(1) + strY(2)) / 2, r: 3.5, fill: "#D4C4A8" }));
            svg.appendChild(svgEl("circle", { cx, cy: (strY(3) + strY(4)) / 2, r: 3.5, fill: "#D4C4A8" }));
        } else {
            svg.appendChild(svgEl("circle", { cx, cy: mid, r: 3.5, fill: "#D4C4A8" }));
        }
    }
    // Correct dots
    const correctSet = new Map(correctDots.map(d => [d.id, d]));
    for (const dot of correctDots) {
        const cx = dot.fret === 0 ? (showOpen ? openZone / 2 : null) : fretCX(dot.fret);
        if (!cx) continue;
        const cy = strY(dot.si);
        const lbl = showMode === "solfege" ? (NOTE_SOLFEGE[dot.noteName] || dot.noteName) : dot.noteName;
        svg.appendChild(svgEl("circle", { cx, cy, r: CFG.dotR, fill: "#2D6B4A", opacity: 0.93 }));
        svg.appendChild(svgEl("text", {
            x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "middle",
            fill: "#fff", "font-size": String(lbl).length > 2 ? 8 : 10, "font-weight": "700", "font-family": "Inter,sans-serif"
        }, lbl));
    }
    // Clickable cells (invisible rects)
    for (let si = 0; si < 6; si++) {
        if (showOpen) {
            const hit = svgEl("rect", { x: 0, y: strY(si) - CFG.strH / 2, width: nutX, height: CFG.strH, fill: "transparent", style: "cursor:pointer" });
            hit.addEventListener("click", () => onGridClick(si, 0));
            svg.appendChild(hit);
        }
        for (let fret = Math.max(1, startFret); fret <= endFret; fret++) {
            if (correctSet.has(`${si}-${fret}`)) continue;
            const cx = fretCX(fret);
            const hit = svgEl("rect", {
                x: cx - CFG.fretW / 2, y: strY(si) - CFG.strH / 2,
                width: CFG.fretW, height: CFG.strH,
                fill: "transparent", style: "cursor:pointer"
            });
            hit.addEventListener("click", () => onGridClick(si, fret));
            svg.appendChild(hit);
        }
    }
    container.innerHTML = "";
    container.appendChild(svg);
}

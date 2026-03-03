class GuitarSound {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
    }

    _init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
    }

    /**
     * Karplus-Strong plucked string synthesis.
     * stringIdx: 0-5 (string6 to string1), fret: 0-24
     * startTime: offset in seconds from now
     */
    playNote(stringIdx, fret, startTime = 0) {
        this._init();
        const freq = getNoteFreq(stringIdx, fret);
        const ctx = this.ctx;
        const sampleRate = ctx.sampleRate;
        const duration = 3.5;
        const N = Math.max(1, Math.round(sampleRate / freq));
        const totalSamples = Math.floor(sampleRate * duration);

        const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
        const data = buffer.getChannelData(0);

        // Init ring buffer with band-limited noise
        const ring = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            ring[i] = Math.random() * 2 - 1;
        }
        // Low-pass the initial burst for warmer tone
        for (let i = 1; i < N; i++) {
            ring[i] = 0.5 * (ring[i] + ring[i - 1]);
        }

        // KS with damping
        const damping = 0.4985;
        for (let i = 0; i < totalSamples; i++) {
            const idx = i % N;
            const next = (i + 1) % N;
            data[i] = ring[idx];
            ring[idx] = damping * (ring[idx] + ring[next]);
        }

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        // Slight fade-in to remove click
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + startTime + 0.005);

        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(ctx.currentTime + startTime);
    }

    /**
     * Strum a chord.
     * notes: array of {stringIdx, fret}
     * direction: "down" | "up"
     */
    playChord(notes, direction = "down", strumDelay = 0.035) {
        this._init();
        const ordered = direction === "down"
            ? [...notes]
            : [...notes].reverse();

        ordered.forEach(({ stringIdx, fret }, i) => {
            this.playNote(stringIdx, fret, i * strumDelay);
        });
    }

    /**
     * Play an arpeggio (one note at a time).
     */
    playArpeggio(notes, noteDelay = 0.18) {
        this._init();
        notes.forEach(({ stringIdx, fret }, i) => {
            this.playNote(stringIdx, fret, i * noteDelay);
        });
    }

    /**
     * Play a single scale note (for quiz feedback etc.)
     */
    playScaleNote(stringIdx, fret) {
        this.playNote(stringIdx, fret, 0);
    }
}

const sound = new GuitarSound();

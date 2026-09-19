export const KEY_SIGNATURES = [
    'C Major',
    'G Major',
    'D Major',
    'A Major',
    'E Major',
    'B Major',
    'F# Major',
    'F Major',
    'Bb Major',
    'Eb Major',
    'Ab Major'
];

export const KEY_SCALE_NAMES = {
    'C Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
    'G Major': ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G'],
    'D Major': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#', 'D'],
    'A Major': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#', 'A'],
    'E Major': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#', 'E'],
    'B Major': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B'],
    'F# Major': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#', 'F#'],
    'F Major': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E', 'F'],
    'Bb Major': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
    'Eb Major': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D', 'Eb'],
    'Ab Major': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab']
};

export const KEY_TONIC_PC = {
    'C Major': 0,
    'G Major': 7,
    'D Major': 2,
    'A Major': 9,
    'E Major': 4,
    'B Major': 11,
    'F# Major': 6,
    'F Major': 5,
    'Bb Major': 10,
    'Eb Major': 3,
    'Ab Major': 8
};

export const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];

export const INSTRUMENT_LOW_FREQ = {
    'Soprano': 261.63,
    'Alto': 220.00,
    'Tenor': 174.61,
    'Baritone': 146.83,
    'Bass': 110.00,
    'Violin': 523.25,
    'Viola': 293.66,
    'Cello': 146.83,
    'Double Bass': 82.41,
    'Flute': 587.33,
    'Clarinet': 261.63,
    'Oboe': 440.00,
    'Bassoon': 116.54,
    'Trumpet': 293.66,
    'French Horn': 261.63,
    'Trombone': 130.81,
    'Baritone Horn': 146.83,
    'Tuba': 87.31,
    'Soprano Saxophone': 415.30,
    'Alto Saxophone': 261.63,
    'Tenor Saxophone': 196.00,
    'Baritone Saxophone': 130.81,
    'Guitar': 196.00,
    'Ukulele': 196.00,
    'Piano': 220.00
};

export const DISPLAY_MODES = ['Solfege', 'Pitch'];

export function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
}

export function nearestTonicMidi(preferredMidi, tonicPc) {
    const currentPc = ((Math.round(preferredMidi) % 12) + 12) % 12;
    let delta = tonicPc - currentPc;
    if (delta > 6) delta -= 12;
    if (delta <= -6) delta += 12;
    return Math.round(preferredMidi) + delta;
}

export function normalizeKeySignature(keySignature) {
    return KEY_SCALE_NAMES[keySignature] ? keySignature : 'C Major';
}

export function defaultKeyForInstrument(instrument) {
    return instrument === 'Tenor' ? 'F Major' : 'C Major';
}

export function getInstrumentLowFreq(instrument) {
    return INSTRUMENT_LOW_FREQ[instrument] || INSTRUMENT_LOW_FREQ.Soprano;
}

export function displayModeLabel(mode) {
    return mode === 'Pitch' ? 'Pitch Names' : 'Solfege';
}

export function normalizeDisplayMode(mode) {
    return mode === 'Pitch' ? 'Pitch' : 'Solfege';
}

export function computeScaleForInstrumentAndKey(lowDoFreqHint, keySignature) {
    const key = normalizeKeySignature(keySignature);
    const names = KEY_SCALE_NAMES[key];
    const tonicPc = KEY_TONIC_PC[key];
    const preferredMidi = freqToMidi(lowDoFreqHint);
    const lowDoMidi = nearestTonicMidi(preferredMidi, tonicPc);
    const frequencies = MAJOR_SCALE_SEMITONES
        .slice()
        .reverse()
        .map((semitone) => midiToFreq(lowDoMidi + semitone));
    const pitchNames = MAJOR_SCALE_SEMITONES.map((semitone, index) => {
        const midi = lowDoMidi + semitone;
        const octave = Math.floor(midi / 12) - 1;
        return names[index] + octave;
    });
    return {
        key,
        frequencies,
        pitchNames,
        lowDoMidi,
        lowDoFreq: midiToFreq(lowDoMidi)
    };
}

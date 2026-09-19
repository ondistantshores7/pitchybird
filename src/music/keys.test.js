import assert from 'assert';
import {
    computeScaleForInstrumentAndKey,
    defaultKeyForInstrument,
    displayModeLabel,
    getInstrumentLowFreq,
    nearestTonicMidi,
    normalizeDisplayMode,
    normalizeKeySignature
} from './keys.js';

const sopranoLow = getInstrumentLowFreq('Soprano');
assert.ok(Math.abs(sopranoLow - 261.63) < 0.01);

const cMajor = computeScaleForInstrumentAndKey(sopranoLow, 'C Major');
assert.strictEqual(cMajor.pitchNames[0], 'C4');
assert.strictEqual(cMajor.pitchNames[1], 'D4');
assert.strictEqual(cMajor.pitchNames[6], 'B4');
assert.strictEqual(cMajor.pitchNames[7], 'C5');
assert.ok(Math.abs(cMajor.frequencies[7] - 261.63) < 0.5);
assert.ok(Math.abs(cMajor.frequencies[0] - 523.25) < 0.5);

const gMajor = computeScaleForInstrumentAndKey(sopranoLow, 'G Major');
assert.strictEqual(gMajor.pitchNames[0], 'G3');
assert.strictEqual(gMajor.pitchNames[6], 'F#4');
assert.strictEqual(gMajor.pitchNames[7], 'G4');

const fMajor = computeScaleForInstrumentAndKey(sopranoLow, 'F Major');
assert.strictEqual(fMajor.pitchNames[0], 'F4');
assert.strictEqual(fMajor.pitchNames[3], 'Bb4');

assert.strictEqual(defaultKeyForInstrument('Tenor'), 'F Major');
assert.strictEqual(defaultKeyForInstrument('Soprano'), 'C Major');
assert.strictEqual(normalizeKeySignature('Nope'), 'C Major');
assert.strictEqual(displayModeLabel('Pitch'), 'Pitch Names');
assert.strictEqual(displayModeLabel('Solfege'), 'Solfege');
assert.strictEqual(normalizeDisplayMode('Pitch'), 'Pitch');
assert.strictEqual(normalizeDisplayMode('whatever'), 'Solfege');
assert.strictEqual(nearestTonicMidi(60, 7), 55);

console.log('keys.test.js passed');

// Pitchy Bird — Flappy Bird, but you sing (or play) the pitch to fly.
// Local Phaser 3.55 is loaded by index.html before this file.

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BAR_COUNT = 8;
const HIGH_SCORE_KEY = 'pitchyBirdHighScores';
const SETTINGS_KEY = 'pitchyBirdSettings';

const SOLFEGE_LOW_TO_HIGH = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];
const SOLFEGE_HIGH_TO_LOW = ['Do', 'Ti', 'La', 'Sol', 'Fa', 'Mi', 'Re', 'Do'];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJOR_INTERVALS_UP = [0, 2, 4, 5, 7, 9, 11, 12];
const KEYBOARD_LOW_TO_HIGH = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'];

const BAR_COLORS = [
    0xFF5555, // Low Do
    0xFFBF80, // Re
    0xFFEF80, // Mi
    0x80FF97, // Fa
    0x80C4FF, // Sol
    0xBB80FF, // La
    0xFF80D5, // Ti
    0xFF5555  // High Do
];

const KEY_SIGNATURES = [
    { name: 'C Major', semitones: 0 },
    { name: 'G Major', semitones: 7 },
    { name: 'D Major', semitones: 2 },
    { name: 'A Major', semitones: 9 },
    { name: 'E Major', semitones: 4 },
    { name: 'B Major', semitones: 11 },
    { name: 'F# Major', semitones: 6 },
    { name: 'F Major', semitones: 5 }
];

const INSTRUMENTS = [
    { name: 'Soprano', lowDoMidi: 60 },
    { name: 'Alto', lowDoMidi: 55 },
    { name: 'Tenor', lowDoMidi: 48 },
    { name: 'Baritone', lowDoMidi: 43 },
    { name: 'Bass', lowDoMidi: 40 },
    { name: 'Flute', lowDoMidi: 72 },
    { name: 'Clarinet', lowDoMidi: 60 },
    { name: 'Oboe', lowDoMidi: 67 },
    { name: 'Bassoon', lowDoMidi: 46 },
    { name: 'Soprano Saxophone', lowDoMidi: 67 },
    { name: 'Alto Saxophone', lowDoMidi: 58 },
    { name: 'Tenor Saxophone', lowDoMidi: 53 },
    { name: 'Baritone Saxophone', lowDoMidi: 46 },
    { name: 'Trumpet', lowDoMidi: 62 },
    { name: 'French Horn', lowDoMidi: 55 },
    { name: 'Trombone', lowDoMidi: 48 },
    { name: 'Baritone Horn', lowDoMidi: 50 },
    { name: 'Tuba', lowDoMidi: 41 },
    { name: 'Violin', lowDoMidi: 67 },
    { name: 'Viola', lowDoMidi: 60 },
    { name: 'Cello', lowDoMidi: 48 },
    { name: 'Double Bass', lowDoMidi: 40 },
    { name: 'Guitar', lowDoMidi: 52 },
    { name: 'Ukulele', lowDoMidi: 60 },
    { name: 'Piano', lowDoMidi: 48 }
];

const DIFFICULTIES = {
    easy: {
        id: 'easy',
        label: 'EASY',
        blurb: 'Wide gaps, slow trees, lots of snap.',
        color: 0x3dff7a,
        speed: 95,
        maxSpeed: 145,
        spacing: 470,
        minSpacing: 360,
        gapBars: 2.4,
        minGapBars: 1.85,
        snapSemitones: 0.75,
        follow: 0.24,
        gravity: 240,
        rampMs: 60000,
        delayMs: 20000,
        noteMin: 2,
        noteMax: 5,
        perfectCents: 45,
        silenceGrace: 300,
        pairCount: 6
    },
    medium: {
        id: 'medium',
        label: 'MEDIUM',
        blurb: 'Classic pitch flappy. One-ish bar windows.',
        color: 0xffe14a,
        speed: 130,
        maxSpeed: 205,
        spacing: 400,
        minSpacing: 280,
        gapBars: 1.65,
        minGapBars: 1.25,
        snapSemitones: 0.45,
        follow: 0.18,
        gravity: 380,
        rampMs: 45000,
        delayMs: 12000,
        noteMin: 1,
        noteMax: 6,
        perfectCents: 35,
        silenceGrace: 200,
        pairCount: 7
    },
    hard: {
        id: 'hard',
        label: 'HARD',
        blurb: 'Tight gaps, faster pipes, less forgiveness.',
        color: 0xff8a3d,
        speed: 170,
        maxSpeed: 270,
        spacing: 340,
        minSpacing: 230,
        gapBars: 1.2,
        minGapBars: 1.02,
        snapSemitones: 0.3,
        follow: 0.15,
        gravity: 480,
        rampMs: 35000,
        delayMs: 6000,
        noteMin: 0,
        noteMax: 7,
        perfectCents: 28,
        silenceGrace: 140,
        pairCount: 7
    },
    expert: {
        id: 'expert',
        label: 'EXPERT',
        blurb: 'Exact notes. Tiny windows. No mercy.',
        color: 0xff4d4d,
        speed: 210,
        maxSpeed: 340,
        spacing: 300,
        minSpacing: 190,
        gapBars: 0.98,
        minGapBars: 0.88,
        snapSemitones: 0.2,
        follow: 0.12,
        gravity: 560,
        rampMs: 28000,
        delayMs: 0,
        noteMin: 0,
        noteMax: 7,
        perfectCents: 20,
        silenceGrace: 90,
        pairCount: 8
    }
};

const NEON = '#39FF14';
const TEXT_SHADOW = {
    offsetX: 1,
    offsetY: 1,
    color: NEON,
    blur: 2,
    stroke: true,
    fill: true
};

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
}

function noteNameFromMidi(midi) {
    const rounded = Math.round(midi);
    const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
    const octave = Math.floor(rounded / 12) - 1;
    return name + octave;
}

function centsOff(freq, target) {
    if (freq <= 0 || target <= 0) return 999;
    return 1200 * Math.log2(freq / target);
}

function getInstrument(name) {
    return INSTRUMENTS.find(item => item.name === name) || INSTRUMENTS[0];
}

function getKey(name) {
    return KEY_SIGNATURES.find(item => item.name === name) || KEY_SIGNATURES[0];
}

function pickLowDoMidi(instrumentName, keyName) {
    const instrument = getInstrument(instrumentName);
    const key = getKey(keyName);
    let low = instrument.lowDoMidi + key.semitones;
    const comfort = instrument.lowDoMidi + 6;
    const center = low + 6;
    if (center - comfort > 4) low -= 12;
    if (comfort - center > 4) low += 12;
    return low;
}

// High-to-low frequencies so index 0 is the top bar (high Do).
function scaleFrequenciesHighToLow(instrumentName, keyName) {
    const lowDo = pickLowDoMidi(instrumentName, keyName);
    return MAJOR_INTERVALS_UP.slice().reverse().map(interval => midiToFreq(lowDo + interval));
}

function pitchNamesHighToLow(instrumentName, keyName) {
    const lowDo = pickLowDoMidi(instrumentName, keyName);
    return MAJOR_INTERVALS_UP.slice().reverse().map(interval => noteNameFromMidi(lowDo + interval));
}

function loadHighScores() {
    try {
        const raw = localStorage.getItem(HIGH_SCORE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            easy: parsed.easy || 0,
            medium: parsed.medium || 0,
            hard: parsed.hard || 0,
            expert: parsed.expert || 0
        };
    } catch (err) {
        return { easy: 0, medium: 0, hard: 0, expert: 0 };
    }
}

function saveHighScore(difficultyId, score) {
    const scores = loadHighScores();
    if (score > (scores[difficultyId] || 0)) {
        scores[difficultyId] = score;
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
        return true;
    }
    return false;
}

function loadSettings() {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    } catch (err) {
        return {};
    }
}

function saveSettings(partial) {
    const next = Object.assign(loadSettings(), partial);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

function neonText(scene, x, y, content, size) {
    return scene.add.text(x, y, content, {
        fontSize: size + 'px',
        fontFamily: '"VT323", monospace',
        color: '#FFFFFF',
        align: 'center',
        shadow: TEXT_SHADOW
    });
}

function detectPitch(buffer, sampleRate, minFreq, maxFreq) {
    const decim = 3;
    const n = Math.floor(buffer.length / decim);
    if (n < 32) return { freq: -1, rms: 0 };

    const samples = new Float32Array(n);
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
        const v = (buffer[i * decim] - 128) / 128;
        samples[i] = v;
        sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / n);
    if (rms < 0.02) return { freq: -1, rms };

    const sr = sampleRate / decim;
    const minLag = Math.max(2, Math.floor(sr / maxFreq));
    const maxLag = Math.min(Math.floor(n * 0.5), Math.floor(sr / minFreq));
    if (maxLag <= minLag + 2) return { freq: -1, rms };

    let bestLag = -1;
    let bestCorr = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        const count = n - lag;
        for (let i = 0; i < count; i++) {
            corr += samples[i] * samples[i + lag];
        }
        corr /= count;
        if (corr > bestCorr) {
            bestCorr = corr;
            bestLag = lag;
        }
    }

    if (bestLag < 0 || bestCorr < 0.01) return { freq: -1, rms };

    let refined = bestLag;
    if (bestLag > minLag && bestLag < maxLag) {
        const corrAt = (lag) => {
            let corr = 0;
            const count = n - lag;
            for (let i = 0; i < count; i++) corr += samples[i] * samples[i + lag];
            return corr / count;
        };
        const x1 = corrAt(bestLag - 1);
        const x2 = bestCorr;
        const x3 = corrAt(bestLag + 1);
        const denom = 2 * (2 * x2 - x3 - x1);
        if (Math.abs(denom) > 1e-6) {
            refined = bestLag + (x1 - x3) / denom;
        }
    }

    return { freq: sr / refined, rms };
}

function foldIntoRange(freq, minFreq, maxFreq) {
    if (freq <= 0) return -1;
    let folded = freq;
    while (folded < minFreq && folded > 0) folded *= 2;
    while (folded > maxFreq) folded /= 2;
    if (folded < minFreq * 0.82 || folded > maxFreq * 1.18) return -1;
    return folded;
}

class Background {
    constructor(scene) {
        this.scene = scene;
        this.bars = [];
        this.labels = [];
        this.keyHints = [];
        this.highlight = null;
        this.create();
    }

    create() {
        const width = this.scene.sys.game.config.width;
        const height = this.scene.sys.game.config.height;
        const barHeight = height / BAR_COUNT;

        for (let i = 0; i < BAR_COUNT; i++) {
            const y = height - (i + 1) * barHeight;
            const bar = this.scene.add.rectangle(0, y, width, barHeight, BAR_COLORS[i]);
            bar.setOrigin(0, 0);
            bar.setAlpha(0.72);
            bar.setDepth(0);
            bar.setScrollFactor(0);
            bar.setInteractive({ useHandCursor: true });
            bar.on('pointerdown', () => {
                this.scene.clickNoteIndex = BAR_COUNT - 1 - i;
            });
            this.bars.push(bar);

            const label = neonText(this.scene, 186, y + barHeight / 2, SOLFEGE_LOW_TO_HIGH[i], 28);
            label.setOrigin(0, 0.5);
            label.setDepth(2);
            this.labels.push(label);

            const hint = neonText(this.scene, 248, y + barHeight / 2, KEYBOARD_LOW_TO_HIGH[i], 18);
            hint.setOrigin(0, 0.5);
            hint.setAlpha(0.55);
            hint.setDepth(2);
            this.keyHints.push(hint);
        }

        this.highlight = this.scene.add.rectangle(width / 2, 0, width, barHeight, 0xffffff, 0.16);
        this.highlight.setDepth(1);
        this.highlight.setVisible(false);
    }

    updateLabels(displayMode, pitchNamesHighToLowList) {
        for (let i = 0; i < BAR_COUNT; i++) {
            const highToLowIndex = BAR_COUNT - 1 - i;
            const name = displayMode === 'Pitch'
                ? (pitchNamesHighToLowList[highToLowIndex] || '—')
                : SOLFEGE_LOW_TO_HIGH[i];
            this.labels[i].setText(name);
        }
    }

    setTargetNote(noteIndexFromTop) {
        if (noteIndexFromTop == null || noteIndexFromTop < 0) {
            this.highlight.setVisible(false);
            return;
        }
        const barHeight = this.scene.sys.game.config.height / BAR_COUNT;
        this.highlight.y = (noteIndexFromTop + 0.5) * barHeight;
        this.highlight.setVisible(true);
    }

    setHintsVisible(visible) {
        this.keyHints.forEach(hint => hint.setVisible(visible));
    }
}

class Bird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bird1');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(0.45);
        this.setDepth(20);
        this.setCollideWorldBounds(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(false);
        this.body.setVelocity(0, 0);
        const src = this.texture.getSourceImage();
        this.body.setSize(src.width * 0.42, src.height * 0.42);
        this.body.setOffset(src.width * 0.29, src.height * 0.29);
        if (!scene.anims.exists('flap')) {
            scene.anims.create({
                key: 'flap',
                frames: [{ key: 'bird1' }, { key: 'bird2' }, { key: 'bird3' }, { key: 'bird2' }],
                frameRate: 10,
                repeat: -1
            });
        }
        this.play('flap');
    }
}

class ObstaclePair {
    constructor(scene, x, noteIndex) {
        this.scene = scene;
        this.x = x;
        this.noteIndex = noteIndex;
        this.passed = false;
        this.speed = scene.currentObstacleSpeed;

        this.top = scene.physics.add.image(x, 0, 'cloud');
        this.bottom = scene.physics.add.image(x, scene.sys.game.config.height, 'pipe');
        [this.top, this.bottom].forEach(sprite => {
            sprite.body.setAllowGravity(false);
            sprite.body.setImmovable(true);
            sprite.body.moves = false;
            sprite.setDepth(5);
        });

        this.gapLabel = neonText(scene, x, 0, '', 22);
        this.gapLabel.setOrigin(0.5);
        this.gapLabel.setDepth(6);

        this.configure();
    }

    configure() {
        const scene = this.scene;
        const height = scene.sys.game.config.height;
        const barHeight = scene.barHeight;
        const gapHeight = scene.currentGapBars * barHeight;
        const gapCenter = (this.noteIndex + 0.5) * barHeight;
        const topH = Math.max(18, gapCenter - gapHeight / 2);
        const bottomH = Math.max(18, height - (gapCenter + gapHeight / 2));
        const width = scene.obstacleWidth;

        const cloudImg = this.top.texture.getSourceImage();
        this.top.setOrigin(0.5, 0);
        this.top.setDisplaySize(Math.max(90, width * 1.8), topH);
        this.top.setPosition(this.x, 0);
        this.top.body.setSize(cloudImg.width * 0.38, cloudImg.height * 0.72);
        this.top.body.updateFromGameObject();

        const pipeImg = this.bottom.texture.getSourceImage();
        this.bottom.setOrigin(0.5, 1);
        this.bottom.setDisplaySize(width, bottomH);
        this.bottom.setPosition(this.x, height);
        this.bottom.body.setSize(pipeImg.width * 0.34, pipeImg.height * 0.82);
        this.bottom.body.updateFromGameObject();

        const label = scene.displayMode === 'Pitch'
            ? scene.pitchNames[this.noteIndex]
            : SOLFEGE_HIGH_TO_LOW[this.noteIndex];
        this.gapLabel.setText(label);
        this.gapLabel.setPosition(this.x, gapCenter);
        this.gapLabel.setColor('#FFFFFF');
    }

    setX(x) {
        this.x = x;
        this.top.x = x;
        this.bottom.x = x;
        this.gapLabel.x = x;
        if (this.top.body) this.top.body.updateFromGameObject();
        if (this.bottom.body) this.bottom.body.updateFromGameObject();
    }

    reset(x, noteIndex) {
        this.noteIndex = noteIndex;
        this.passed = false;
        this.speed = this.scene.currentObstacleSpeed;
        this.setX(x);
        this.configure();
        this.top.setActive(true).setVisible(true);
        this.bottom.setActive(true).setVisible(true);
        this.gapLabel.setVisible(true);
    }

    stop() {
        this.speed = 0;
    }

    destroy() {
        this.top.destroy();
        this.bottom.destroy();
        this.gapLabel.destroy();
    }
}

class Dropdown {
    constructor(scene, x, y, width, height, options, selected, onSelect) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.options = options;
        this.selected = selected;
        this.onSelect = onSelect;
        this.open = false;
        this.optionHits = [];
        this.build();
    }

    build() {
        this.panel = this.scene.add.rectangle(this.x, this.y, this.width, this.height, 0x222222, 1)
            .setDepth(300)
            .setScrollFactor(0);
        this.label = neonText(this.scene, this.x, this.y, this.selected + ' ▼', 18)
            .setOrigin(0.5)
            .setDepth(301)
            .setScrollFactor(0);
        this.hit = this.scene.add.rectangle(this.x, this.y, this.width, this.height, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true })
            .setDepth(302)
            .setScrollFactor(0)
            .on('pointerdown', (pointer, _x, _y, event) => {
                if (event) event.stopPropagation();
                this.toggle();
            });

        this.list = this.scene.add.container(this.x, this.y + this.height / 2);
        this.list.setDepth(303);
        this.list.setVisible(false);
        this.list.setScrollFactor(0);

        this.options.forEach((option, index) => {
            const oy = (index + 0.5) * (this.height * 0.85);
            const bg = this.scene.add.rectangle(0, oy, this.width, this.height * 0.85, 0x2c2c2c, 1);
            const text = neonText(this.scene, 0, oy, option, 16).setOrigin(0.5);
            const hit = this.scene.add.rectangle(0, oy, this.width, this.height * 0.85, 0xffffff, 0.001)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => bg.setFillStyle(0x3a3a3a))
                .on('pointerout', () => bg.setFillStyle(0x2c2c2c))
                .on('pointerdown', (pointer, _x, _y, event) => {
                    if (event) event.stopPropagation();
                    this.select(option);
                });
            this.list.add([bg, text, hit]);
            this.optionHits.push(hit);
        });

        this.outside = (pointer) => {
            if (!this.open) return;
            const top = this.y - this.height / 2;
            const bottom = this.y + this.height / 2 + this.options.length * this.height * 0.85;
            const left = this.x - this.width / 2;
            const right = this.x + this.width / 2;
            if (pointer.x < left || pointer.x > right || pointer.y < top || pointer.y > bottom) {
                this.close();
            }
        };
        this.scene.input.on('pointerdown', this.outside);
    }

    toggle() {
        this.open ? this.close() : this.openList();
    }

    openList() {
        this.open = true;
        this.list.setVisible(true);
        this.label.setText(this.selected + ' ▲');
    }

    close() {
        this.open = false;
        this.list.setVisible(false);
        this.label.setText(this.selected + ' ▼');
    }

    select(option) {
        this.selected = option;
        this.close();
        if (this.onSelect) this.onSelect(option);
    }

    setSelected(option) {
        this.selected = option;
        this.label.setText(this.selected + (this.open ? ' ▲' : ' ▼'));
    }

    getSelected() {
        return this.selected;
    }

    destroy() {
        this.scene.input.off('pointerdown', this.outside);
        this.panel.destroy();
        this.label.destroy();
        this.hit.destroy();
        this.list.destroy(true);
    }
}

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.image('bird1', 'assets/Bird_01.png');
        this.load.image('bird2', 'assets/Bird_02.png');
        this.load.image('bird3', 'assets/Bird_03.png');
        this.load.image('pipe', 'assets/pipe.png');
        this.load.image('cloud', 'assets/Cloud.png');
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffff66, 1);
        g.fillCircle(8, 8, 7);
        g.generateTexture('spark', 16, 16);
        g.clear();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('dot', 8, 8);
        this.scene.start('StartScreen');
    }
}

class StartScreen extends Phaser.Scene {
    constructor() {
        super('StartScreen');
    }

    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        const saved = loadSettings();

        this.add.rectangle(0, 0, width, height, 0x050505).setOrigin(0, 0);
        this.starting = false;
        this.input.keyboard.removeAllListeners();
        this.selectedInstrument = saved.instrument || 'Soprano';
        this.selectedDifficulty = saved.difficulty || 'medium';
        this.registry.set('selectedInstrument', this.selectedInstrument);
        this.registry.set('selectedDifficulty', this.selectedDifficulty);

        this.previewBird = this.add.sprite(width / 2, 78, 'bird1').setScale(0.38);
        if (!this.anims.exists('flap')) {
            this.anims.create({
                key: 'flap',
                frames: [{ key: 'bird1' }, { key: 'bird2' }, { key: 'bird3' }, { key: 'bird2' }],
                frameRate: 10,
                repeat: -1
            });
        }
        this.previewBird.play('flap');
        this.tweens.add({
            targets: this.previewBird,
            y: 90,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        neonText(this, width / 2, 128, 'PITCHY BIRD', 64).setOrigin(0.5);
        neonText(this, width / 2, 168, 'Sing the note. Fly the gap.', 22).setOrigin(0.5).setAlpha(0.9);

        neonText(this, width / 2, 200, 'INSTRUMENT', 16).setOrigin(0.5).setAlpha(0.7);
        this.instrumentIndex = Math.max(0, INSTRUMENTS.findIndex(item => item.name === this.selectedInstrument));
        this.drawInstrumentPicker(width);

        neonText(this, width / 2, 268, 'DIFFICULTY', 16).setOrigin(0.5).setAlpha(0.7);
        this.difficultyButtons = [];
        const ids = ['easy', 'medium', 'hard', 'expert'];
        ids.forEach((id, index) => {
            const preset = DIFFICULTIES[id];
            const bx = 115 + index * 190;
            const by = 318;
            const card = this.add.rectangle(bx, by, 170, 72, 0x1a1a1a, 1).setInteractive({ useHandCursor: true });
            const label = neonText(this, bx, by - 12, preset.label, 26).setOrigin(0.5);
            label.setColor(Phaser.Display.Color.IntegerToColor(preset.color).rgba);
            const scores = loadHighScores();
            const best = neonText(this, bx, by + 16, 'Best ' + (scores[id] || 0), 16).setOrigin(0.5).setAlpha(0.8);
            card.on('pointerdown', () => this.selectDifficulty(id));
            this.difficultyButtons.push({ id, card, label, best });
        });
        this.blurbText = neonText(this, width / 2, 372, DIFFICULTIES[this.selectedDifficulty].blurb, 18)
            .setOrigin(0.5)
            .setAlpha(0.9);
        this.refreshDifficultyButtons();

        const fly = this.add.rectangle(width / 2, 430, 240, 64, 0x222222, 1)
            .setInteractive({ useHandCursor: true });
        const flyLabel = neonText(this, width / 2, 430, "LET'S FLY!", 30).setOrigin(0.5);
        fly.on('pointerover', () => fly.setFillStyle(0x333333));
        fly.on('pointerout', () => fly.setFillStyle(0x222222));
        fly.on('pointerdown', () => this.beginGame());

        this.tweens.add({
            targets: flyLabel,
            scaleX: 1.06,
            scaleY: 1.06,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        neonText(this, width / 2, 488, 'Hold a pitch, a key, or a color bar to fly.', 16)
            .setOrigin(0.5)
            .setAlpha(0.75);
        neonText(this, width / 2, 512, 'A–K / 1–8 = notes. Click a bar. SPACE hears the next gap.', 16)
            .setOrigin(0.5)
            .setAlpha(0.75);

        const scores = loadHighScores();
        neonText(
            this,
            width / 2,
            552,
            `Highs  Easy ${scores.easy}   Med ${scores.medium}   Hard ${scores.hard}   Expert ${scores.expert}`,
            16
        ).setOrigin(0.5).setAlpha(0.6);

        this.input.keyboard.on('keydown-ENTER', () => this.beginGame());
        this.input.keyboard.on('keydown-SPACE', () => this.beginGame());
    }

    drawInstrumentPicker(width) {
        const prev = this.add.rectangle(width / 2 - 150, 230, 44, 40, 0x222222, 1)
            .setInteractive({ useHandCursor: true });
        neonText(this, width / 2 - 150, 230, '<', 28).setOrigin(0.5);
        const next = this.add.rectangle(width / 2 + 150, 230, 44, 40, 0x222222, 1)
            .setInteractive({ useHandCursor: true });
        neonText(this, width / 2 + 150, 230, '>', 28).setOrigin(0.5);
        this.add.rectangle(width / 2, 230, 230, 40, 0x222222, 1);
        this.instrumentText = neonText(this, width / 2, 230, this.selectedInstrument, 20).setOrigin(0.5);
        prev.on('pointerdown', () => this.cycleInstrument(-1));
        next.on('pointerdown', () => this.cycleInstrument(1));
        this.input.keyboard.on('keydown-LEFT', () => this.cycleInstrument(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.cycleInstrument(1));
    }

    cycleInstrument(dir) {
        this.instrumentIndex = (this.instrumentIndex + dir + INSTRUMENTS.length) % INSTRUMENTS.length;
        this.selectedInstrument = INSTRUMENTS[this.instrumentIndex].name;
        this.instrumentText.setText(this.selectedInstrument);
        this.registry.set('selectedInstrument', this.selectedInstrument);
        this.playDo();
    }

    selectDifficulty(id) {
        this.selectedDifficulty = id;
        this.registry.set('selectedDifficulty', id);
        this.blurbText.setText(DIFFICULTIES[id].blurb);
        this.refreshDifficultyButtons();
    }

    refreshDifficultyButtons() {
        this.difficultyButtons.forEach(btn => {
            const active = btn.id === this.selectedDifficulty;
            btn.card.setFillStyle(active ? 0x2a2a2a : 0x1a1a1a);
            btn.card.setStrokeStyle(active ? 3 : 1, DIFFICULTIES[btn.id].color, active ? 1 : 0.35);
        });
    }

    playDo() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const freq = midiToFreq(pickLowDoMidi(this.selectedInstrument, 'C Major'));
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (err) {
            // Autoplay / audio context can fail before a gesture; ignore.
        }
    }

    async beginGame() {
        if (this.starting) return;
        this.starting = true;
        saveSettings({
            instrument: this.selectedInstrument,
            difficulty: this.selectedDifficulty
        });
        this.registry.set('selectedInstrument', this.selectedInstrument);
        this.registry.set('selectedDifficulty', this.selectedDifficulty);

        if (!this.registry.get('micStream') && !this.registry.get('micDenied')) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.registry.set('micStream', stream);
                this.registry.set('micDenied', false);
            } catch (err) {
                this.registry.set('micDenied', true);
            }
        }

        this.scene.start('GameScene', {
            instrument: this.selectedInstrument,
            difficulty: this.selectedDifficulty,
            selectedKeySignature: loadSettings().keySignature || 'C Major'
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.instrument = (data && data.instrument) || this.registry.get('selectedInstrument') || 'Soprano';
        this.difficultyId = (data && data.difficulty) || this.registry.get('selectedDifficulty') || 'medium';
        this.preset = DIFFICULTIES[this.difficultyId] || DIFFICULTIES.medium;
        this.selectedKeySignature = (data && data.selectedKeySignature) || loadSettings().keySignature || 'C Major';
        this.displayMode = loadSettings().displayMode || 'Solfege';
        this.isGameOver = false;
        this.playing = false;
        this.score = 0;
        this.perfects = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.lastNoteIndex = null;
        this.smoothLogFreq = null;
        this.silenceMs = 0;
        this.ignoreMicUntil = 0;
        this.heldNoteIndex = null;
        this.audioContext = null;
        this.analyserNode = null;
        this.dataArray = null;
        this.pairs = [];
    }

    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        this.barHeight = height / BAR_COUNT;
        this.obstacleWidth = 58;
        this.widthScale = width / GAME_WIDTH;
        this.currentObstacleSpeed = this.preset.speed * this.widthScale;
        this.currentObstacleSpacing = this.preset.spacing * this.widthScale;
        this.currentGapBars = this.preset.gapBars;
        this.gameStartTime = this.time.now;
        this.currentY = height / 2;
        this.targetY = height / 2;
        this.physics.world.gravity.y = 0;
        this.input.keyboard.removeAllListeners();

        this.rebuildScale();
        this.background = new Background(this);
        this.background.updateLabels(this.displayMode, this.pitchNames);
        this.background.setHintsVisible(true);

        this.createPairs();
        const startNote = this.pairs[0] ? this.pairs[0].noteIndex : 3;
        const startY = (startNote + 0.5) * this.barHeight;
        this.bird = new Bird(this, width * 0.22, startY);
        this.bird.body.setAllowGravity(false);
        this.bird.setVelocity(0, 0);
        this.currentY = startY;
        this.targetY = startY;
        this.paused = false;
        this.clickNoteIndex = startNote;

        this.createParticles();
        this.setupCollisions();
        this.createHud();
        this.initAudio();
        this.bindInput();
        this.startCountdown();
    }

    rebuildScale() {
        this.vocalRangeFrequencies = scaleFrequenciesHighToLow(this.instrument, this.selectedKeySignature);
        this.pitchNames = pitchNamesHighToLow(this.instrument, this.selectedKeySignature);
        this.minDetectFreq = this.vocalRangeFrequencies[this.vocalRangeFrequencies.length - 1] * 0.75;
        this.maxDetectFreq = this.vocalRangeFrequencies[0] * 1.3;
    }

    createParticles() {
        this.noteParticles = this.add.particles('spark');
        this.noteEmitter = this.noteParticles.createEmitter({
            follow: this.bird,
            followOffset: { x: -28, y: 0 },
            speed: { min: 40, max: 120 },
            angle: { min: 150, max: 210 },
            scale: { start: 0.45, end: 0.05 },
            alpha: { start: 0.9, end: 0 },
            lifespan: { min: 400, max: 900 },
            quantity: 1,
            frequency: 70,
            on: false
        });
        this.noteParticles.setDepth(8);

        this.burstParticles = this.add.particles('spark');
        this.burstEmitter = this.burstParticles.createEmitter({
            speed: { min: 120, max: 320 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0.05 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            quantity: 18,
            on: false
        });
    }

    createPairs() {
        this.pairs.forEach(pair => pair.destroy());
        this.pairs = [];
        const startX = this.sys.game.config.width + 280;
        for (let i = 0; i < this.preset.pairCount; i++) {
            const note = this.pickNoteIndex();
            const pair = new ObstaclePair(this, startX + i * this.currentObstacleSpacing, note);
            this.pairs.push(pair);
        }
    }

    pickNoteIndex() {
        const min = this.preset.noteMin;
        const max = this.preset.noteMax;
        let note = Phaser.Math.Between(min, max);
        if (note === this.lastNoteIndex && max > min) {
            note = note === max ? min : note + 1;
        }
        this.lastNoteIndex = note;
        return note;
    }

    setupCollisions() {
        this.pairs.forEach(pair => {
            this.physics.add.overlap(this.bird, pair.top, this.handleCollision, null, this);
            this.physics.add.overlap(this.bird, pair.bottom, this.handleCollision, null, this);
        });
    }

    createHud() {
        const width = this.sys.game.config.width;
        this.add.rectangle(8, 8, 158, 72, 0x000000, 0.62).setOrigin(0, 0).setDepth(119);
        this.scoreText = neonText(this, 18, 12, 'Score 0', 28).setDepth(120);
        this.bestText = neonText(this, 18, 40, 'Best ' + (loadHighScores()[this.difficultyId] || 0), 18)
            .setDepth(120)
            .setAlpha(0.85);
        this.diffText = neonText(this, 18, 60, this.preset.label, 18).setDepth(120);
        this.diffText.setColor(Phaser.Display.Color.IntegerToColor(this.preset.color).rgba);

        this.sungText = neonText(this, width / 2, 18, 'Sing!', 30).setOrigin(0.5, 0).setDepth(120);
        this.nextText = neonText(this, width / 2, 48, '', 18).setOrigin(0.5, 0).setDepth(120).setAlpha(0.9);
        this.micText = neonText(this, width / 2, this.sys.game.config.height - 22, '', 16)
            .setOrigin(0.5, 1)
            .setDepth(120)
            .setAlpha(0.75);

        this.keyDropdown = new Dropdown(
            this,
            width - 100,
            24,
            180,
            34,
            KEY_SIGNATURES.map(item => item.name),
            this.selectedKeySignature,
            (key) => this.handleKeySignatureChange(key)
        );

        this.modeButton = this.add.rectangle(width - 100, 64, 180, 32, 0x222222, 1)
            .setInteractive({ useHandCursor: true })
            .setDepth(120);
        this.modeText = neonText(this, width - 100, 64, 'Mode: ' + this.displayMode, 16)
            .setOrigin(0.5)
            .setDepth(121);
        this.modeButton.on('pointerdown', () => {
            this.displayMode = this.displayMode === 'Solfege' ? 'Pitch' : 'Solfege';
            saveSettings({ displayMode: this.displayMode });
            this.modeText.setText('Mode: ' + this.displayMode);
            this.background.updateLabels(this.displayMode, this.pitchNames);
            this.pairs.forEach(pair => pair.configure());
        });
    }

    bindInput() {
        this.noteKeys = this.input.keyboard.addKeys('A,S,D,F,G,H,J,K,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,UP,DOWN,SPACE,P');
        this.input.keyboard.addCapture('SPACE');
        this.input.keyboard.on('keydown-SPACE', (event) => {
            this.playUpcomingNote();
            if (event && event.preventDefault) event.preventDefault();
        });
        this.input.keyboard.on('keydown-P', () => this.togglePause());
    }

    pollHeldNoteIndex() {
        const mapping = [
            ['K', 'EIGHT', 0],
            ['J', 'SEVEN', 1],
            ['H', 'SIX', 2],
            ['G', 'FIVE', 3],
            ['F', 'FOUR', 4],
            ['D', 'THREE', 5],
            ['S', 'TWO', 6],
            ['A', 'ONE', 7]
        ];
        for (let i = 0; i < mapping.length; i++) {
            const letter = mapping[i][0];
            const digit = mapping[i][1];
            const idx = mapping[i][2];
            if ((this.noteKeys[letter] && this.noteKeys[letter].isDown) ||
                (this.noteKeys[digit] && this.noteKeys[digit].isDown)) {
                return idx;
            }
        }
        if (this.noteKeys.UP && this.noteKeys.UP.isDown) {
            return Phaser.Math.Clamp(Math.round(this.bird.y / this.barHeight - 0.5) - 1, 0, 7);
        }
        if (this.noteKeys.DOWN && this.noteKeys.DOWN.isDown) {
            return Phaser.Math.Clamp(Math.round(this.bird.y / this.barHeight - 0.5) + 1, 0, 7);
        }
        if (this.clickNoteIndex != null) return this.clickNoteIndex;
        if (this.heldNoteIndex != null) return this.heldNoteIndex;
        return null;
    }

    startCountdown() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        this.countdownDim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35).setDepth(199);
        this.countdownText = neonText(this, width / 2, height / 2, '3', 96).setOrigin(0.5).setDepth(200);
        const beats = ['3', '2', '1', 'SING!'];
        const beatMs = 850;
        beats.forEach((label, i) => {
            this.time.delayedCall(i * beatMs, () => {
                if (this.isGameOver || !this.countdownText) return;
                this.countdownText.setText(label);
                this.countdownText.setScale(1.18);
                this.tweens.add({ targets: this.countdownText, scale: 1, duration: 280 });
            });
        });
        this.time.delayedCall(beats.length * beatMs, () => {
            if (this.isGameOver) return;
            this.playing = true;
            this.gameStartTime = this.time.now;
            if (this.countdownText) this.countdownText.destroy();
            if (this.countdownDim) this.countdownDim.destroy();
            this.countdownText = null;
            this.countdownDim = null;
        });
    }

    async initAudio() {
        try {
            let stream = this.registry.get('micStream');
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.registry.set('micStream', stream);
                this.registry.set('micDenied', false);
            }
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                this.input.once('pointerdown', () => this.audioContext.resume());
            }
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 2048;
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyserNode);
            this.dataArray = new Uint8Array(this.analyserNode.fftSize);
            this.micText.setText('Mic on  ·  click a bar, A–K / 1–8  ·  SPACE previews  ·  P pauses');
        } catch (err) {
            this.registry.set('micDenied', true);
            this.micText.setText('No mic — click a color bar or A–K / 1–8  ·  SPACE previews  ·  P pauses');
        }
    }

    handleKeySignatureChange(keyName) {
        this.selectedKeySignature = keyName;
        saveSettings({ keySignature: keyName });
        this.rebuildScale();
        this.background.updateLabels(this.displayMode, this.pitchNames);
        this.pairs.forEach(pair => pair.configure());
        this.playTone(this.vocalRangeFrequencies[7], 0.35, 0.18);
    }

    playUpcomingNote() {
        const upcoming = this.getUpcomingPair();
        if (!upcoming) return;
        const freq = this.vocalRangeFrequencies[upcoming.noteIndex];
        this.ignoreMicUntil = this.time.now + 420;
        this.playTone(freq, 0.45, 0.16);
        const label = this.displayMode === 'Pitch'
            ? this.pitchNames[upcoming.noteIndex]
            : SOLFEGE_HIGH_TO_LOW[upcoming.noteIndex];
        this.flashPopup(upcoming.x, upcoming.gapLabel.y - 28, label, '#9CFF8A');
    }

    playTone(frequency, duration, volume) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') this.audioContext.resume();
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(volume, this.audioContext.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + duration + 0.02);
        } catch (err) {
            // ignore
        }
    }

    togglePause() {
        if (this.isGameOver || (!this.playing && !this.paused)) return;
        if (!this.paused) {
            this.paused = true;
            this.physics.pause();
            this.pauseOverlay = this.add.rectangle(
                this.sys.game.config.width / 2,
                this.sys.game.config.height / 2,
                this.sys.game.config.width,
                this.sys.game.config.height,
                0x000000,
                0.55
            ).setDepth(250);
            this.pauseText = neonText(this, this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'PAUSED', 56)
                .setOrigin(0.5)
                .setDepth(251);
            return;
        }
        this.paused = false;
        this.physics.resume();
        if (this.pauseOverlay) this.pauseOverlay.destroy();
        if (this.pauseText) this.pauseText.destroy();
        this.pauseOverlay = null;
        this.pauseText = null;
    }

    getUpcomingPair() {
        const birdX = this.bird.x;
        let best = null;
        this.pairs.forEach(pair => {
            if (pair.x + 20 > birdX && (!best || pair.x < best.x)) best = pair;
        });
        return best;
    }

    update(_time, delta) {
        if (this.isGameOver || this.paused) return;

        this.updatePitchControl(delta);
        this.updateUpcomingHud();

        if (!this.playing) return;

        this.updateDifficulty();
        const dt = delta / 1000;
        this.pairs.forEach(pair => {
            pair.setX(pair.x - this.currentObstacleSpeed * dt);
            if (pair.x < -80) {
                const farthest = this.pairs.reduce((max, item) => Math.max(max, item.x), 0);
                pair.reset(farthest + this.currentObstacleSpacing, this.pickNoteIndex());
            }
            if (!pair.passed && pair.x + 10 < this.bird.x) {
                this.awardPass(pair);
            }
        });
    }

    updatePitchControl(delta) {
        const height = this.sys.game.config.height;
        let controlFreq = -1;
        let singing = false;
        const held = this.pollHeldNoteIndex();

        if (held != null) {
            controlFreq = this.vocalRangeFrequencies[held];
            singing = true;
        } else if (this.time.now >= this.ignoreMicUntil && this.analyserNode && this.dataArray && this.audioContext) {
            this.analyserNode.getByteTimeDomainData(this.dataArray);
            const detected = detectPitch(this.dataArray, this.audioContext.sampleRate, this.minDetectFreq, this.maxDetectFreq);
            const folded = foldIntoRange(detected.freq, this.minDetectFreq, this.maxDetectFreq);
            if (folded > 0) {
                if (this.smoothLogFreq == null) this.smoothLogFreq = Math.log2(folded);
                else this.smoothLogFreq += (Math.log2(folded) - this.smoothLogFreq) * 0.38;
                controlFreq = Math.pow(2, this.smoothLogFreq);
                singing = true;
            }
        }

        if (singing && controlFreq > 0) {
            this.silenceMs = 0;
            this.bird.body.setAllowGravity(false);
            this.bird.setVelocityY(0);
            if (this.noteEmitter && !this.noteEmitter.on) this.noteEmitter.start();

            const closest = this.findClosestNoteIndex(controlFreq);
            const snapped = this.isWithinSemitones(controlFreq, this.vocalRangeFrequencies[closest], this.preset.snapSemitones);
            if (snapped) {
                this.targetY = (closest + 0.5) * this.barHeight;
            } else {
                const high = Math.log2(this.vocalRangeFrequencies[0]);
                const low = Math.log2(this.vocalRangeFrequencies[this.vocalRangeFrequencies.length - 1]);
                const logp = Phaser.Math.Clamp(Math.log2(controlFreq), low, high);
                this.targetY = ((logp - high) / (low - high)) * height;
            }
            this.currentY += (this.targetY - this.currentY) * this.preset.follow;
            this.bird.y = Phaser.Math.Clamp(this.currentY, this.bird.displayHeight / 2, height - this.bird.displayHeight / 2);

            const sung = this.displayMode === 'Pitch'
                ? this.pitchNames[closest]
                : SOLFEGE_HIGH_TO_LOW[closest];
            this.sungText.setText(sung);
        } else {
            this.silenceMs += delta;
            this.smoothLogFreq = null;
            if (this.noteEmitter && this.noteEmitter.on) this.noteEmitter.stop();
            this.sungText.setText(this.playing ? 'Hold' : 'Sing!');
            this.bird.body.setAllowGravity(false);
            this.bird.setVelocity(0, 0);
            this.currentY = this.bird.y;
        }
    }

    updateUpcomingHud() {
        const upcoming = this.getUpcomingPair();
        this.background.setTargetNote(upcoming ? upcoming.noteIndex : null);
        if (!upcoming) {
            this.nextText.setText('');
            return;
        }
        const label = this.displayMode === 'Pitch'
            ? this.pitchNames[upcoming.noteIndex]
            : SOLFEGE_HIGH_TO_LOW[upcoming.noteIndex];
        this.nextText.setText('Next  ' + label);
    }

    updateDifficulty() {
        const elapsed = this.time.now - this.gameStartTime;
        if (elapsed <= this.preset.delayMs) return;
        const progress = Math.min(1, (elapsed - this.preset.delayMs) / this.preset.rampMs);
        const speed0 = this.preset.speed * this.widthScale;
        const speed1 = this.preset.maxSpeed * this.widthScale;
        const space0 = this.preset.spacing * this.widthScale;
        const space1 = this.preset.minSpacing * this.widthScale;
        this.currentObstacleSpeed = speed0 + (speed1 - speed0) * progress;
        this.currentObstacleSpacing = space0 - (space0 - space1) * progress;
        this.currentGapBars = this.preset.gapBars - (this.preset.gapBars - this.preset.minGapBars) * progress;
    }

    findClosestNoteIndex(pitch) {
        const logPitch = Math.log2(pitch);
        let closest = 0;
        let best = Infinity;
        for (let i = 0; i < this.vocalRangeFrequencies.length; i++) {
            const diff = Math.abs(logPitch - Math.log2(this.vocalRangeFrequencies[i]));
            if (diff < best) {
                best = diff;
                closest = i;
            }
        }
        return closest;
    }

    isWithinSemitones(freq, target, semitones) {
        return Math.abs(centsOff(freq, target)) <= semitones * 100;
    }

    awardPass(pair) {
        pair.passed = true;
        this.score += 1;
        const targetFreq = this.vocalRangeFrequencies[pair.noteIndex];
        const sungFreq = this.heldNoteIndex != null
            ? this.vocalRangeFrequencies[this.heldNoteIndex]
            : (this.smoothLogFreq ? Math.pow(2, this.smoothLogFreq) : 0);
        const perfect = sungFreq > 0 && Math.abs(centsOff(sungFreq, targetFreq)) <= this.preset.perfectCents;
        if (perfect) {
            this.score += 1;
            this.perfects += 1;
            this.combo += 1;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            this.flashPopup(this.bird.x + 40, this.bird.y - 30, this.combo > 1 ? 'PERFECT x' + this.combo : 'PERFECT', '#9CFF8A');
        } else {
            this.combo = 0;
            this.flashPopup(this.bird.x + 40, this.bird.y - 24, '+1', '#FFFFFF');
        }
        this.scoreText.setText('Score ' + this.score);
        this.playTone(targetFreq, 0.12, 0.08);
    }

    flashPopup(x, y, text, color) {
        const popup = neonText(this, x, y, text, 22).setOrigin(0.5).setDepth(130);
        popup.setColor(color);
        this.tweens.add({
            targets: popup,
            y: y - 40,
            alpha: 0,
            duration: 700,
            onComplete: () => popup.destroy()
        });
    }

    handleCollision() {
        if (this.isGameOver || !this.playing) return;
        this.isGameOver = true;
        this.playing = false;
        this.pairs.forEach(pair => pair.stop());
        if (this.noteEmitter) this.noteEmitter.stop();
        this.burstEmitter.explode(40, this.bird.x, this.bird.y);
        this.cameras.main.shake(240, 0.012);
        this.bird.setVelocity(0, 0);
        this.bird.body.setAllowGravity(false);
        this.bird.anims.pause();
        this.time.delayedCall(650, () => this.showGameOver());
    }

    showGameOver() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        const isNewBest = saveHighScore(this.difficultyId, this.score);
        const best = loadHighScores()[this.difficultyId] || 0;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72).setDepth(200);
        neonText(this, width / 2, height / 2 - 130, 'GAME OVER', 58).setOrigin(0.5).setDepth(201);
        neonText(this, width / 2, height / 2 - 72, 'Score ' + this.score + (isNewBest ? '   NEW BEST' : ''), 32)
            .setOrigin(0.5)
            .setDepth(201);
        neonText(this, width / 2, height / 2 - 38, 'Best ' + best + '   Perfects ' + this.perfects + '   Combo ' + this.bestCombo, 20)
            .setOrigin(0.5)
            .setDepth(201)
            .setAlpha(0.9);

        this.addMenuButton(width / 2, height / 2 + 20, 220, 54, 'TRY AGAIN', () => {
            this.scene.restart({
                instrument: this.instrument,
                difficulty: this.difficultyId,
                selectedKeySignature: this.selectedKeySignature
            });
        });
        this.addMenuButton(width / 2, height / 2 + 90, 260, 54, 'CHANGE SETUP', () => {
            this.scene.start('StartScreen');
        });
    }

    addMenuButton(x, y, w, h, label, onClick) {
        const btn = this.add.rectangle(x, y, w, h, 0x222222, 1)
            .setInteractive({ useHandCursor: true })
            .setDepth(201);
        neonText(this, x, y, label, 22).setOrigin(0.5).setDepth(202);
        btn.on('pointerover', () => btn.setFillStyle(0x333333));
        btn.on('pointerout', () => btn.setFillStyle(0x222222));
        btn.on('pointerup', onClick);
        return btn;
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'renderDiv',
    backgroundColor: '#050505',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: 'renderDiv'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 380 },
            debug: false
        }
    },
    render: {
        pixelArt: true,
        antialias: false,
        antialiasGL: false
    },
    scene: [BootScene, StartScreen, GameScene]
};

window.phaserGame = new Phaser.Game(config);

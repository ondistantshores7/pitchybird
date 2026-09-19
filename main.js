import {
    KEY_SIGNATURES,
    computeScaleForInstrumentAndKey,
    defaultKeyForInstrument,
    displayModeLabel,
    getInstrumentLowFreq,
    normalizeDisplayMode
} from './src/music/keys.js';

// Dynamically load the VT323 font from Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

class Background {
    constructor(scene) {
        this.scene = scene;
        this.createBackgrounds();
    }
    createBackgrounds() {
        const gameWidth = this.scene.sys.game.config.width;
        const gameHeight = this.scene.sys.game.config.height;
        const barHeight = gameHeight / 8;
        const vibrantColors = [
            0xFF5555, 0xFFBF80, 0xFFEF80, 0x80FF97,
            0x80C4FF, 0xBB80FF, 0xFF80D5, 0xFF5555
        ];
        this.solfegeNames = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];
        this.pitchNameLabels = []; // To store the text objects for pitch names
        this.backgroundTexts = []; // To store all text objects for easy update
        for (let i = 0; i < 8; i++) {
            const y = gameHeight - (i + 1) * barHeight;
            const bar = this.scene.add.rectangle(0, y, gameWidth, barHeight, vibrantColors[i]);
            bar.setOrigin(0, 0);
            bar.setAlpha(0.7);
            bar.setDepth(0);
            bar.setScrollFactor(0);
            // Initially display Solfege names
            const text = this.scene.add.text(10, y + barHeight / 2, this.solfegeNames[i], {
                fontSize: '30px',
                fontFamily: '"VT323", monospace',
                fill: '#FFFFFF',
                align: 'left',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#39FF14',
                    blur: 2,
                    stroke: true,
                    fill: true
                }
            });
            text.setOrigin(0, 0.5);
            text.setDepth(1);
            text.setScrollFactor(0);
            this.backgroundTexts.push(text);
        }
    }
    updateTextDisplay(displayMode, pitchNames = []) {
        const gameHeight = this.scene.sys.game.config.height;
        const barHeight = gameHeight / 8;
        this.backgroundTexts.forEach(text => text.destroy());
        this.backgroundTexts = [];
        const namesToDisplay = displayMode === 'Pitch' ? pitchNames : this.solfegeNames;
        for (let i = 0; i < 8; i++) {
            const y = gameHeight - (i + 1) * barHeight;
            const name = namesToDisplay[i] || (displayMode === 'Pitch' ? 'N/A' : this.solfegeNames[i]);
            const text = this.scene.add.text(10, y + barHeight / 2, name, {
                fontSize: '30px',
                fontFamily: '"VT323", monospace',
                fill: '#FFFFFF',
                align: 'left',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#39FF14',
                    blur: 2,
                    stroke: true,
                    fill: true
                }
            });
            text.setOrigin(0, 0.5);
            text.setDepth(1);
            text.setScrollFactor(0);
            this.backgroundTexts.push(text);
        }
    }
}

class Bird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bird1'); // 'bird1' should be preloaded
        scene.add.existing(this); // Add to display list
        scene.physics.add.existing(this); // Add to physics system
        console.log('[Bird Constructor] After scene.physics.add.existing(this), this.body is:', this.body);
        if (!this.body) {
            console.error("Bird body not created after scene.physics.add.existing! Attempting fallback.");
            // This should not happen if physics is enabled for the scene.
            // As a fallback, try to enable physics directly if body is missing.
            scene.physics.world.enableBody(this, Phaser.Physics.Arcade.DYNAMIC_BODY);
            console.log('[Bird Constructor] After fallback scene.physics.world.enableBody, this.body is:', this.body);
        }
        this.setScale(0.45); // Scale first
        this.setCollideWorldBounds(true);
        // Set body size *before* scaling, then scale the sprite.
        // The physics body will scale with the sprite.
        if (this.body) {
            // Adjusted to be a bit smaller and more centered.
            // The original texture is 128x128. A 0.5 scale factor makes it 64x64.
            // We want the body to be slightly smaller than the visual sprite.
            // Let's try 50% of the *original* texture's dimensions for the body.
            this.body.setSize(this.texture.getSourceImage().width * 0.5, this.texture.getSourceImage().height * 0.5);
            // Offset to center this smaller body within the original texture space.
            // (Original Width - Body Width) / 2
            const offsetX = (this.texture.getSourceImage().width - (this.texture.getSourceImage().width * 0.5)) / 2;
            const offsetY = (this.texture.getSourceImage().height - (this.texture.getSourceImage().height * 0.5)) / 2;
            this.body.setOffset(offsetX, offsetY);
        } else {
            console.error("Bird body is null during setSize/setOffset!");
        }
        // The setScale(0.45) is already present at line 62, which scales the sprite and its body.
        // No need to call setScale again here unless we want a different final scale.
        // Let's ensure gravity is enabled after all body configurations.
        if (this.body) { // Ensure body exists before setting gravity
            this.body.setAllowGravity(true);
        }
        this.setDepth(10);
        this.setScrollFactor(0);
        this.createAnimations();
        this.play('flap');
    }
    createAnimations() {
        this.scene.anims.create({
            key: 'flap',
            frames: [{
                key: 'bird1'
            }, {
                key: 'bird2'
            }, {
                key: 'bird3'
            }, {
                key: 'bird2'
            }],
            frameRate: 10,
            repeat: -1
        });
    }
}
class Obstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, width, height, speed, gameScene, fromTop = null) {
        const initialFromTop = fromTop !== null ?
            fromTop :
            (gameScene.lastObstacleFromTop === null ?
                Math.random() > 0.5 :
                !gameScene.lastObstacleFromTop
            );
        const textureKey = initialFromTop ? 'cloud' : 'pipe'; // This line is okay, textureKey is decided

        // Determine initialY based on whether it's a top or bottom obstacle
        const initialY = initialFromTop ? 0 : gameScene.sys.game.config.height;
        // If it's a pipe, fromTop must be false. If it's a cloud, fromTop must be true.
        // This simplifies the logic as initialFromTop is now directly tied to the chosen texture.
        const finalFromTop = initialFromTop; // Use the passed initialFromTop directly
        super(scene, x, initialY, textureKey); // textureKey is already determined
        scene.add.existing(this);

        // ← DYNAMIC body
        scene.physics.add.existing(this);
        this.body.setImmovable(true);
        this.body.allowGravity = false;
        // Obstacle movement will be handled manually in GameScene's update loop based on speed * deltaTime
        // So, we don't set velocityX here, but store the speed.
        this.scene = scene;
        this.obstacleWidth = width;
        this.speed = speed; // This is now pixels per second
        this.gameHeight = scene.sys.game.config.height;
        this.gameScene = gameScene;
        this.fromTop = finalFromTop; // Use the corrected fromTop
        gameScene.lastObstacleFromTop = this.fromTop;
        this.setDepth(5);
        this.configurePipe(this.fromTop, height);
    }
    configurePipe(fromTop, height) {
        this.fromTop = fromTop; // Ensure this.fromTop is set
        const key = this.fromTop ? 'cloud' : 'pipe';
        this.setTexture(key);
        const img = this.texture.getSourceImage();
        let scaleX = this.obstacleWidth / img.width;
        let scaleY = height / img.height;
        if (key === 'cloud') scaleX *= 4.5;
        this.setScale(scaleX, scaleY);
        // The physics body should now correctly match the scaled sprite
        this.body.setSize(this.displayWidth, this.displayHeight, false); // Set body dimensions to match scaled sprite
        this.body.setOffset(0, 0); // Key change: Offset is (0,0) relative to sprite's implicit top-left
        if (this.fromTop) { // Cloud
            this.setOrigin(0.5, 0); // Origin is top-center
            this.y = 0; // Position sprite's origin at the top of the screen
        } else { // Pipe
            this.setOrigin(0.5, 1); // Origin is bottom-center
            this.y = this.gameHeight; // Position sprite's origin at the bottom of the screen
        }
        // updateFromGameObject will now correctly align the physics body (with offset 0,0)
        // to the sprite's calculated top-left position based on its origin.
        this.body.updateFromGameObject();
    }
    reset() {
        // reposition off to the right
        const farthestX = this.gameScene.obstaclesGroup.getChildren()
            .reduce((max, o) => Math.max(max, o.x), 0);
        this.x = farthestX + this.gameScene.currentObstacleSpacing;

        // re‐decide top/bottom
        const elapsed = this.scene.time.now - this.gameScene.gameStartTime;
        const past = elapsed > this.gameScene.difficultyIncreaseTime;
        if (past && !this.gameScene.lastObstacleFromTop) {
            this.fromTop = true;
        } else if (past && this.gameScene.pairRequired) {
            this.fromTop = false;
            this.gameScene.pairRequired = false;
        } else {
            this.fromTop = !this.gameScene.lastObstacleFromTop;
            if (this.fromTop && past) this.gameScene.pairRequired = true;
        }
        this.gameScene.lastObstacleFromTop = this.fromTop;

        // choose a new height and type (cloud/pipe)
        const bar = this.gameScene.barHeight;
        let newH;
        // Determine if it's a cloud or a tree based on this.fromTop which is decided earlier in reset()
        if (this.fromTop) { // It's a cloud
            // Clouds: La (6th bar), Ti (7th bar), High Do (8th bar from bottom)
            // Height in terms of barHeight units from the top:
            const cloudLevels = [1, 2]; // Corresponds to High Do, Ti heights from top. Max height ends at top of La bar.
            newH = cloudLevels[Math.floor(Math.random() * cloudLevels.length)] * bar;
        } else { // It's a tree (pipe)
            // Trees (pipes): Re(1), Mi(2), Fa(3), Sol(4) (0-indexed from bottom)
            // Height in terms of barHeight units from the bottom:
            const treeLevels = [2, 3, 4, 5]; // Corresponds to Re, Mi, Fa, Sol heights from bottom
            newH = treeLevels[Math.floor(Math.random() * treeLevels.length)] * bar;
        }
        this.configurePipe(this.fromTop, newH);

        // reset physics body so it moves again
        this.body.reset(this.x, this.y);
        // speed is already correctly set during construction and reset uses the gameScene's current speed
        this.speed = this.gameScene.currentObstacleSpeed * (this.fromTop ? 1.2 : 1); // Ensure speed is updated if clouds move faster
        this.setActive(true);
        this.setVisible(true);
    }
}
class KeySignatureDropdown {
    constructor(scene, x, y, width, height, options, defaultOption, callback, maxVisible = 8) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.options = options;
        this.selectedOption = options.includes(defaultOption) ? defaultOption : options[0];
        this.callback = callback;
        this.isOpen = false;
        this.optionRowHeight = this.height * 0.8;
        this.maxVisible = Math.max(1, Math.min(maxVisible, options.length));
        this.scrollY = 0;
        this.maxScroll = Math.max(0, options.length * this.optionRowHeight - this.maxVisible * this.optionRowHeight);
        this.createDropdown();
    }
    createDropdown() {
        this.dropdownButton = this.scene.add.graphics();
        this.dropdownButton.fillStyle(0x222222, 1);
        this.dropdownButton.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        this.dropdownButton.setDepth(300);
        this.dropdownButton.setScrollFactor(0);
        this.dropdownText = this.scene.add.text(this.x, this.y, `${this.selectedOption} ▼`, {
            fontSize: '18px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        });
        this.dropdownText.setOrigin(0.5);
        this.dropdownText.setDepth(301);
        this.dropdownText.setScrollFactor(0);
        this.hitArea = this.scene.add.rectangle(this.x, this.y, this.width, this.height)
            .setInteractive({
                useHandCursor: true
            })
            .on('pointerdown', () => this.toggleDropdown());
        this.hitArea.setOrigin(0.5);
        this.hitArea.setAlpha(0.001);
        this.hitArea.setDepth(302);
        this.hitArea.setScrollFactor(0);

        this.panelHeight = this.maxVisible * this.optionRowHeight;
        this.optionsContainer = this.scene.add.container(this.x, this.y + this.height / 2);
        this.optionsContainer.setVisible(false);
        this.optionsContainer.setDepth(310);
        this.optionsContainer.setScrollFactor(0);

        const panelBg = this.scene.add.rectangle(0, this.panelHeight / 2, this.width, this.panelHeight, 0x1a1a1a);
        panelBg.setOrigin(0.5);
        this.optionsContainer.add(panelBg);

        this.optionsContent = this.scene.add.container(0, 0);
        this.optionsContainer.add(this.optionsContent);
        this.options.forEach((option, index) => {
            const optionY = index * this.optionRowHeight + this.optionRowHeight / 2;
            const optionGraphics = this.scene.add.graphics();
            optionGraphics.fillStyle(0x2c2c2c, 1);
            optionGraphics.fillRect(-this.width / 2, optionY - this.optionRowHeight / 2, this.width, this.optionRowHeight);
            this.optionsContent.add(optionGraphics);
            const optionText = this.scene.add.text(0, optionY, option, {
                fontSize: '16px',
                fontFamily: '"VT323", monospace',
                color: '#FFFFFF',
                align: 'center',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#39FF14',
                    blur: 1,
                    stroke: true,
                    fill: true
                }
            });
            optionText.setOrigin(0.5);
            this.optionsContent.add(optionText);
            const optionHitArea = this.scene.add.rectangle(0, optionY, this.width, this.optionRowHeight)
                .setInteractive({
                    useHandCursor: true
                })
                .on('pointerdown', (pointer) => {
                    if (this.isPointerInPanel(pointer)) this.selectOption(option);
                });
            optionHitArea.setOrigin(0.5);
            optionHitArea.setAlpha(0.001);
            this.optionsContent.add(optionHitArea);
        });

        this.maskGraphics = this.scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });
        this.maskGraphics.fillStyle(0xffffff);
        this.maskGraphics.fillRect(this.x - this.width / 2, this.y + this.height / 2, this.width, this.panelHeight);
        this.optionsContent.setMask(this.maskGraphics.createGeometryMask());

        this.onPointerDown = (pointer) => {
            if (!this.isOpen) return;
            if (!this.getFullBounds().contains(pointer.x, pointer.y)) {
                this.closeDropdown();
            }
        };
        this.scene.input.on('pointerdown', this.onPointerDown);
        this.onWheel = (pointer, _gameObjects, _deltaX, deltaY) => {
            if (!this.isOpen || this.maxScroll <= 0) return;
            if (!this.getPanelBounds().contains(pointer.x, pointer.y)) return;
            this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.4, 0, this.maxScroll);
            this.optionsContent.y = -this.scrollY;
        };
        this.scene.input.on('wheel', this.onWheel);
    }
    getPanelBounds() {
        return new Phaser.Geom.Rectangle(
            this.x - this.width / 2,
            this.y + this.height / 2,
            this.width,
            this.panelHeight
        );
    }
    getFullBounds() {
        return new Phaser.Geom.Rectangle(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height + this.panelHeight
        );
    }
    isPointerInPanel(pointer) {
        return this.getPanelBounds().contains(pointer.x, pointer.y);
    }
    toggleDropdown() {
        this.isOpen = !this.isOpen;
        this.optionsContainer.setVisible(this.isOpen);
        this.dropdownText.setText(this.isOpen ? `${this.selectedOption} ▲` : `${this.selectedOption} ▼`);
    }
    selectOption(option) {
        this.selectedOption = option;
        this.dropdownText.setText(`${this.selectedOption} ▼`);
        this.isOpen = false;
        this.optionsContainer.setVisible(false);
        if (this.callback) this.callback(option);
    }
    closeDropdown() {
        this.isOpen = false;
        this.optionsContainer.setVisible(false);
        this.dropdownText.setText(`${this.selectedOption} ▼`);
    }
    setSelectedOption(option) {
        if (this.options.includes(option)) {
            this.selectedOption = option;
            this.dropdownText.setText(`${this.selectedOption} ${this.isOpen ? '▲' : '▼'}`);
        } else {
            console.warn(`KeySignatureDropdown: Option "${option}" not found.`);
        }
    }
    getSelectedOption() {
        return this.selectedOption;
    }
    destroy() {
        if (this.onPointerDown) this.scene.input.off('pointerdown', this.onPointerDown);
        if (this.onWheel) this.scene.input.off('wheel', this.onWheel);
        if (this.dropdownButton) this.dropdownButton.destroy();
        if (this.dropdownText) this.dropdownText.destroy();
        if (this.optionsContainer) this.optionsContainer.destroy(true);
        if (this.hitArea) this.hitArea.destroy();
        if (this.maskGraphics) this.maskGraphics.destroy();
    }
}

class DisplayModeToggle {
    constructor(scene, x, y, width, height, initialMode, callback) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.mode = normalizeDisplayMode(initialMode);
        this.callback = callback;
        this.createToggle();
    }
    createToggle() {
        this.button = this.scene.add.graphics();
        this.button.fillStyle(0x222222, 1);
        this.button.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        this.button.setDepth(300);
        this.button.setScrollFactor(0);
        this.label = this.scene.add.text(this.x, this.y, this.getButtonText(), {
            fontSize: '18px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        });
        this.label.setOrigin(0.5);
        this.label.setDepth(301);
        this.label.setScrollFactor(0);
        this.hitArea = this.scene.add.rectangle(this.x, this.y, this.width, this.height)
            .setInteractive({
                useHandCursor: true
            })
            .on('pointerdown', () => this.toggle());
        this.hitArea.setOrigin(0.5);
        this.hitArea.setAlpha(0.001);
        this.hitArea.setDepth(302);
        this.hitArea.setScrollFactor(0);
    }
    getButtonText() {
        return displayModeLabel(this.mode);
    }
    toggle() {
        this.mode = this.mode === 'Solfege' ? 'Pitch' : 'Solfege';
        this.label.setText(this.getButtonText());
        if (this.callback) this.callback(this.mode);
    }
    setMode(mode) {
        this.mode = normalizeDisplayMode(mode);
        this.label.setText(this.getButtonText());
    }
    getMode() {
        return this.mode;
    }
    destroy() {
        if (this.button) this.button.destroy();
        if (this.label) this.label.destroy();
        if (this.hitArea) this.hitArea.destroy();
    }
}

class StartScreen extends Phaser.Scene {
    constructor() {
        super('StartScreen');
    }
    preload() {
        this.load.image('bird1', 'https://play.rosebud.ai/assets/Bird_01.png?5daF');
        this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
    }
    create() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        const blackBg = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x000000);
        blackBg.setOrigin(0, 0);
        const neonGreenColor = 0x39FF14;
        const titleText = this.add.text(gameWidth / 2, gameHeight * 0.25, "Pitchy Bird", {
            fontSize: 'calc(3.75em + 6vmin)',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#39FF14',
                blur: 3,
                stroke: true,
                fill: true
            }
        });
        titleText.setOrigin(0.5);
        titleText.setDepth(10);
        this.floatingFeathers = this.add.particles('bird1');
        this.floatingEmitter = this.floatingFeathers.createEmitter({
            x: {
                min: 0,
                max: gameWidth
            },
            y: {
                min: 0,
                max: gameHeight
            },
            speed: {
                min: 20,
                max: 50
            },
            angle: {
                min: 0,
                max: 360
            },
            scale: {
                start: 0.1,
                end: 0.05
            },
            rotate: {
                min: 0,
                max: 360
            },
            tint: 0xFFFF00,
            alpha: {
                start: 0.8,
                end: 0.3
            },
            lifespan: {
                min: 4000,
                max: 8000
            },
            quantity: 2,
            frequency: 150,
            blendMode: 'ADD'
        });
        this.input.on('pointermove', (pointer) => {
            this.pointer = this.pointer || {
                x: pointer.x,
                y: pointer.y
            };
            const dx = pointer.x - this.pointer.x;
            const dy = pointer.y - this.pointer.y;
            this.pointer.x = pointer.x;
            this.pointer.y = pointer.y;
            if (dx !== 0 || dy !== 0) {
                const magnitude = Math.sqrt(dx * dx + dy * dy);
                if (magnitude > 5) {
                    this.floatingEmitter.explode(4, pointer.x, pointer.y);
                    this.floatingEmitter.setSpeed(100 + magnitude);
                    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 180) % 360;
                    this.floatingEmitter.setAngle({
                        min: angle - 30,
                        max: angle + 30
                    });
                    setTimeout(() => {
                        this.floatingEmitter.setSpeed({
                            min: 20,
                            max: 50
                        });
                        this.floatingEmitter.setAngle({
                            min: 0,
                            max: 360
                        });
                    }, 300);
                }
            }
        });
        const dropdownWidth = 320;
        const dropdownHeight = 50;
        const dropdownY = gameHeight / 2;
        const dropdown = this.add.graphics();
        dropdown.fillStyle(0x222222, 1);
        // dropdown.lineStyle(3, neonGreenColor, 1); // Removed line style
        dropdown.fillRect(gameWidth / 2 - dropdownWidth / 2, dropdownY - dropdownHeight / 2, dropdownWidth, dropdownHeight);
        // dropdown.strokeRect(gameWidth / 2 - dropdownWidth / 2, dropdownY - dropdownHeight / 2, dropdownWidth, dropdownHeight); // Removed stroke
        const dropdownHitArea = this.add.rectangle(gameWidth / 2, dropdownY, dropdownWidth, dropdownHeight);
        dropdownHitArea.setOrigin(0.5);
        dropdownHitArea.setInteractive({
            useHandCursor: true
        });
        dropdownHitArea.setAlpha(0.001);
        const dropdownText = this.add.text(gameWidth / 2, dropdownY, "Select Instrument ▼", {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        });
        dropdownText.setOrigin(0.5);
        const instrumentOptions = [
            "Soprano", "Alto", "Tenor", "Baritone", "Bass",
            "Flute", "Clarinet", "Oboe", "Bassoon",
            "Soprano Saxophone", "Alto Saxophone", "Tenor Saxophone", "Baritone Saxophone",
            "Trumpet", "French Horn", "Trombone", "Baritone Horn", "Tuba",
            "Violin", "Viola", "Cello", "Double Bass",
            "Guitar", "Ukulele", "Piano"
        ];
        const optionHeight = 40;
        const visibleOptionsCount = 5;
        const optionsContainerHeight = visibleOptionsCount * optionHeight;
        const optionsContainer = this.add.container(gameWidth / 2, dropdownY + dropdownHeight / 2);
        optionsContainer.setSize(dropdownWidth, optionsContainerHeight);
        optionsContainer.setVisible(false);
        optionsContainer.setDepth(100);
        const optionsContent = this.add.container(0, 0);
        optionsContainer.add(optionsContent);
        const optionTextElements = [];
        const totalContentHeight = instrumentOptions.length * optionHeight;
        let scrollY = 0;
        const maxScroll = Math.max(0, totalContentHeight - optionsContainerHeight);
        let selectedInstrument = "Soprano";
        instrumentOptions.forEach((instrument, index) => {
            const optionY = index * optionHeight;
            const optionGraphics = this.add.graphics();
            optionGraphics.fillStyle(0x2c2c2c, 1);
            optionGraphics.fillRect(-dropdownWidth / 2, optionY, dropdownWidth, optionHeight);
            // optionGraphics.lineStyle(2, neonGreenColor, 1); // Removed line style
            // optionGraphics.strokeRect(-dropdownWidth / 2, optionY, dropdownWidth, optionHeight); // Removed stroke
            optionGraphics.setDepth(150);
            optionGraphics.optionIndex = index;
            optionsContent.add(optionGraphics);
            const option = this.add.rectangle(0, optionY + optionHeight / 2, dropdownWidth, optionHeight, 0x30B060);
            option.alpha = 0.001;
            option.setOrigin(0.5);
            option.setDepth(150);
            option.setInteractive({
                useHandCursor: true
            });
            const optionText = this.add.text(gameWidth / 2, dropdownY + dropdownHeight + optionY + optionHeight / 2, instrument, {
                fontSize: '16px',
                fontFamily: '"VT323", monospace',
                color: '#FFFFFF',
                align: 'center',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#39FF14',
                    blur: 1,
                    stroke: true,
                    fill: true
                }
            });
            optionText.setOrigin(0.5);
            optionText.setDepth(999);
            optionText.setVisible(false);
            optionTextElements.push(optionText);
            option.on('pointerover', () => {
                const hoveredGraphics = this.add.graphics();
                hoveredGraphics.fillStyle(0x383838, 1);
                hoveredGraphics.fillRect(-dropdownWidth / 2, optionY, dropdownWidth, optionHeight);
                // hoveredGraphics.lineStyle(2, neonGreenColor, 1); // Removed line style
                // hoveredGraphics.strokeRect(-dropdownWidth / 2, optionY, dropdownWidth, optionHeight); // Removed stroke
                const children = optionsContent.getAll();
                for (let i = 0; i < children.length; i++) {
                    if (children[i].optionIndex === index && children[i].type === 'Graphics') {
                        optionsContent.remove(children[i], true);
                        break;
                    }
                }
                hoveredGraphics.optionIndex = index;
                hoveredGraphics.setDepth(150);
                optionsContent.add(hoveredGraphics);
            });
            option.on('pointerout', () => {
                const normalGraphics = this.add.graphics();
                normalGraphics.fillStyle(0x2c2c2c, 1);
                normalGraphics.fillRect(-dropdownWidth / 2, optionY, dropdownWidth, optionHeight);
                // normalGraphics.lineStyle(2, neonGreenColor, 1); // Removed line style
                // normalGraphics.strokeRect(-dropdownWidth / 2, optionY, dropdownWidth, optionHeight); // Removed stroke
                const children = optionsContent.getAll();
                for (let i = 0; i < children.length; i++) {
                    if (children[i].optionIndex === index && children[i].type === 'Graphics') {
                        optionsContent.remove(children[i], true);
                        break;
                    }
                }
                normalGraphics.optionIndex = index;
                normalGraphics.setDepth(150);
                optionsContent.add(normalGraphics);
            });
            option.on('pointerdown', () => {
                selectedInstrument = instrument;
                dropdownText.setText(instrument + " ▼");
                optionsContainer.setVisible(false);
                scrollbarBg.setVisible(false);
                scrollbarHandle.setVisible(false);
                optionTextElements.forEach(text => text.setVisible(false));
                this.registry.set('selectedInstrument', instrument);
                if (!this.userPickedKey && this.keySignatureDropdown) {
                    const key = defaultKeyForInstrument(instrument);
                    this.keySignatureDropdown.setSelectedOption(key);
                    this.registry.set('selectedKeySignature', key);
                }
                this.featherEmitter.explode(15, dropdown.x, dropdown.y);
                const doFrequency = this.getDoFrequencyForInstrument(instrument);
                this.playDoNote(doFrequency);
            });
            optionsContent.add([option]);
            option.optionText = optionText;
        });
        const mask = this.make.graphics();
        mask.fillStyle(0xffffff);
        mask.fillRect(gameWidth / 2 - dropdownWidth / 2, dropdownY + dropdownHeight, dropdownWidth, optionsContainerHeight);
        const geometryMask = mask.createGeometryMask();
        optionsContent.setMask(geometryMask);
        const scrollbarBgWidth = 12;
        const scrollbarBg = this.add.rectangle(dropdownWidth / 2 - scrollbarBgWidth, 0, scrollbarBgWidth, optionsContainerHeight, 0x1a1a1a);
        scrollbarBg.setOrigin(0.5, 0);
        scrollbarBg.setAlpha(0.8);
        scrollbarBg.setVisible(false);
        optionsContainer.add(scrollbarBg);
        const scrollbarHandleWidth = 8;
        const scrollbarHandleHeight = Math.max(20, (optionsContainerHeight / totalContentHeight) * optionsContainerHeight);
        const scrollbarHandle = this.add.rectangle(scrollbarBg.x, 0, scrollbarHandleWidth, scrollbarHandleHeight, neonGreenColor);
        scrollbarHandle.setOrigin(0.5, 0);
        scrollbarHandle.setAlpha(0.9);
        scrollbarHandle.setVisible(false);
        optionsContainer.add(scrollbarHandle);
        scrollbarHandle.setInteractive({
            useHandCursor: true,
            draggable: true
        });
        scrollbarHandle.on('drag', (pointer, dragX, dragY) => {
            if (!optionsContainer.visible || !scrollbarHandle.visible || !scrollbarHandle.input || !scrollbarHandle.input.dragStartPoint) return;
            const trackTopY = 0;
            const trackBottomY = optionsContainerHeight - scrollbarHandle.height;
            let newHandleY = (pointer.y - optionsContainer.y) - scrollbarHandle.input.dragStartPoint.y + scrollbarHandle.input.dragStartY;
            newHandleY = Phaser.Math.Clamp(newHandleY, trackTopY, trackBottomY);
            scrollbarHandle.y = newHandleY;
            const scrollProgress = (trackBottomY - trackTopY === 0) ? 0 : (newHandleY - trackTopY) / (trackBottomY - trackTopY);
            scrollY = scrollProgress * maxScroll;
            optionsContent.y = -scrollY;
            optionTextElements.forEach((text, index) => {
                const optionAbsoluteY = index * optionHeight;
                const visibleY = optionsContainer.y + optionAbsoluteY + optionHeight / 2 + optionsContent.y;
                const isWithinVisibleArea = visibleY >= optionsContainer.y && visibleY <= optionsContainer.y + optionsContainerHeight;
                text.setVisible(optionsContainer.visible && isWithinVisibleArea);
                text.setY(visibleY);
            });
        });
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (optionsContainer.visible) {
                const optionsContainerBounds = {
                    x: gameWidth / 2 - dropdownWidth / 2,
                    y: dropdownY + dropdownHeight,
                    width: dropdownWidth,
                    height: optionsContainerHeight
                };
                if (pointer.x >= optionsContainerBounds.x && pointer.x <= optionsContainerBounds.x + optionsContainerBounds.width &&
                    pointer.y >= optionsContainerBounds.y && pointer.y <= optionsContainerBounds.y + optionsContainerHeight) {
                    scrollY += deltaY * 0.5;
                    scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
                    optionsContent.y = -scrollY;
                    optionTextElements.forEach((text, index) => {
                        const optionY = index * optionHeight;
                        const visibleY = optionsContainer.y + optionY + optionHeight / 2 - scrollY;
                        const isWithinVisibleArea = visibleY >= optionsContainer.y && visibleY <= optionsContainer.y + optionsContainerHeight;
                        text.setVisible(optionsContainer.visible && isWithinVisibleArea);
                        text.setY(visibleY);
                    });
                    const trackTopY = 0;
                    const trackBottomY = optionsContainerHeight - scrollbarHandle.height;
                    const scrollProgress = maxScroll === 0 ? 0 : scrollY / maxScroll;
                    scrollbarHandle.y = trackTopY + scrollProgress * (trackBottomY - trackTopY);
                }
            }
        });
        const optionsBorder = this.add.rectangle(0, optionsContainerHeight / 2, dropdownWidth + 6, optionsContainerHeight + 6, neonGreenColor);
        optionsBorder.setOrigin(0.5);
        optionsBorder.setDepth(-2);
        optionsContainer.add(optionsBorder);
        const optionsBackground = this.add.rectangle(0, optionsContainerHeight / 2, dropdownWidth + 4, optionsContainerHeight + 4, 0x222222);
        optionsBackground.setOrigin(0.5);
        optionsBackground.setDepth(-1);
        optionsContainer.add(optionsBackground);
        optionsContainer.each(child => {
            if (child.type === 'Text') {
                child.setDepth(200);
                child.setVisible(true);
            }
        });
        optionsContainer.setSize(dropdownWidth, instrumentOptions.length * optionHeight);
        dropdownHitArea.on('pointerdown', () => {
            const newVisibility = !optionsContainer.visible;
            optionsContainer.setVisible(newVisibility);
            scrollbarBg.setVisible(newVisibility);
            scrollbarHandle.setVisible(newVisibility);
            this.featherEmitter.explode(10, dropdown.x, dropdown.y);
            optionTextElements.forEach((text, index) => {
                const optionY = index * optionHeight;
                const visibleY = dropdownY + dropdownHeight + optionY + optionHeight / 2 - scrollY;
                const isWithinVisibleArea = visibleY >= dropdownY + dropdownHeight && visibleY <= dropdownY + dropdownHeight + optionsContainerHeight;
                text.setVisible(newVisibility && isWithinVisibleArea);
                text.setY(visibleY);
            });
            optionsContainer.setPosition(gameWidth / 2, dropdownY + dropdownHeight);
            scrollY = 0;
            optionsContent.y = 0;
            scrollbarHandle.y = 0;
            optionsContainer.setDepth(100);
            optionsContent.each(child => {
                child.setVisible(true);
                if (child.type === 'Text') child.setDepth(200);
                else if (child.type === 'Rectangle') {
                    child.setDepth(150);
                    child.setVisible(true);
                    if (child !== optionsBorder && child !== optionsBackground) {
                        child.setFillStyle(0x444444);
                        child.setAlpha(0.95);
                    }
                }
            });
        });
        this.input.on('pointerdown', (pointer) => {
            const optionsRect = {
                x: gameWidth / 2 - dropdownWidth / 2,
                y: dropdownY + dropdownHeight,
                width: dropdownWidth,
                height: optionsContainerHeight
            };
            const dropdownRect = {
                x: gameWidth / 2 - dropdownWidth / 2,
                y: dropdownY - dropdownHeight / 2,
                width: dropdownWidth,
                height: dropdownHeight
            };
            const clickedOptions = pointer.x >= optionsRect.x && pointer.x <= optionsRect.x + optionsRect.width && pointer.y >= optionsRect.y && pointer.y <= optionsRect.y + optionsRect.height;
            const clickedDropdown = pointer.x >= dropdownRect.x && pointer.x <= dropdownRect.x + dropdownRect.width && pointer.y >= dropdownRect.y && pointer.y <= dropdownRect.y + dropdownRect.height;
            if (optionsContainer.visible && !clickedOptions && !clickedDropdown) {
                optionsContainer.setVisible(false);
                scrollbarBg.setVisible(false);
                scrollbarHandle.setVisible(false);
                optionTextElements.forEach(text => text.setVisible(false));
            }
        });
        const controlY = dropdownY + 70;
        const startButtonY = controlY + 90;
        this.createKeyAndDisplayControls(gameWidth, controlY);
        const buttonWidth = 220;
        const buttonHeight = 80;
        const buttonGraphics = this.add.graphics();
        const createButton = (isHover = false) => {
            buttonGraphics.clear();
            buttonGraphics.fillStyle(0x000000, 0.5);
            buttonGraphics.fillRect(gameWidth / 2 - buttonWidth / 2 + 4, startButtonY - buttonHeight / 2 + 4, buttonWidth, buttonHeight);
            buttonGraphics.fillStyle(isHover ? 0x444444 : 0x222222, 1);
            buttonGraphics.fillRect(gameWidth / 2 - buttonWidth / 2, startButtonY - buttonHeight / 2, buttonWidth, buttonHeight);
            // buttonGraphics.lineStyle(3, neonGreenColor, 1); // Removed line style
            // buttonGraphics.strokeRect(gameWidth / 2 - buttonWidth / 2, startButtonY - buttonHeight / 2, buttonWidth, buttonHeight); // Removed stroke
        };
        createButton();
        const button = this.add.rectangle(gameWidth / 2, startButtonY, buttonWidth, buttonHeight);
        button.setOrigin(0.5);
        button.setInteractive({
            useHandCursor: true
        });
        button.setAlpha(0.001);
        const text = this.add.text(gameWidth / 2, startButtonY, "Let's Fly!", {
            fontSize: '28px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#39FF14',
                blur: 3,
                stroke: true,
                fill: true
            }
        });
        text.setOrigin(0.5);
        this.featherParticles = this.add.particles('bird1');
        this.featherEmitter = this.featherParticles.createEmitter({
            x: button.x,
            y: button.y,
            speed: {
                min: 100,
                max: 200
            },
            angle: {
                min: -150,
                max: -30
            },
            scale: {
                start: 0.1,
                end: 0.01
            },
            rotate: {
                min: 0,
                max: 360
            },
            tint: 0xFFFF00,
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: 2000,
            quantity: 20,
            on: false
        });
        button.on('pointerover', () => {
            this.featherEmitter.explode(30, button.x, button.y);
            createButton(true);
            text.setColor('#FFFFFF');
            text.setShadow(2, 2, '#5CFF5C', 3, true, true);
            this.buttonPulseTween = this.tweens.add({
                targets: text,
                scaleX: {
                    from: 1,
                    to: 1.05
                },
                scaleY: {
                    from: 1,
                    to: 1.05
                },
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
        button.on('pointerout', () => {
            createButton(false);
            text.setColor('#FFFFFF');
            text.setShadow(2, 2, '#39FF14', 3, true, true);
            if (this.buttonPulseTween) {
                this.buttonPulseTween.stop();
                text.setScale(1);
            }
        });
        button.on('pointerdown', () => {
            this.tweens.add({
                targets: [buttonGraphics, text],
                y: '+= 4',
                duration: 50,
                ease: 'Power1',
                yoyo: true,
                onComplete: () => {
                    const instrument = this.registry.get('selectedInstrument') || 'Soprano';
                    const selectedKey = this.registry.get('userSelectedKeySignature') ||
                        (this.keySignatureDropdown && this.keySignatureDropdown.getSelectedOption()) ||
                        defaultKeyForInstrument(instrument);
                    const displayMode = this.displayModeToggle ? this.displayModeToggle.getMode() : 'Solfege';
                    this.registry.set('selectedInstrument', instrument);
                    this.registry.set('selectedKeySignature', selectedKey);
                    this.registry.set('displayMode', displayMode);
                    this.scene.start('GameScene', {
                        instrument: instrument,
                        selectedKeySignature: selectedKey,
                        displayMode
                    });
                }
            });
            this.featherEmitter.explode(50, button.x, button.y);
        });
    }
    createKeyAndDisplayControls(gameWidth, controlY) {
        const controlWidth = 190;
        const controlHeight = 44;
        const keyX = gameWidth / 2 - 105;
        const displayX = gameWidth / 2 + 105;
        const instrument = this.registry.get('selectedInstrument') || 'Soprano';
        const savedKey = this.registry.get('userSelectedKeySignature') ||
            this.registry.get('selectedKeySignature') ||
            defaultKeyForInstrument(instrument);
        const savedDisplayMode = normalizeDisplayMode(this.registry.get('displayMode'));
        this.userPickedKey = !!this.registry.get('userSelectedKeySignature');

        const labelStyle = {
            fontSize: '14px',
            fontFamily: '"VT323", monospace',
            color: '#39FF14',
            align: 'center'
        };
        this.add.text(keyX, controlY - 32, 'KEY', labelStyle).setOrigin(0.5);
        this.add.text(displayX, controlY - 32, 'DISPLAY', labelStyle).setOrigin(0.5);

        this.keySignatureDropdown = new KeySignatureDropdown(
            this,
            keyX,
            controlY,
            controlWidth,
            controlHeight,
            KEY_SIGNATURES,
            savedKey,
            (selectedKey) => {
                this.userPickedKey = true;
                this.registry.set('userSelectedKeySignature', selectedKey);
                this.registry.set('selectedKeySignature', selectedKey);
                const currentInstrument = this.registry.get('selectedInstrument') || 'Soprano';
                this.playDoNote(computeScaleForInstrumentAndKey(
                    getInstrumentLowFreq(currentInstrument),
                    selectedKey
                ).lowDoFreq);
            },
            5
        );

        this.displayModeToggle = new DisplayModeToggle(
            this,
            displayX,
            controlY,
            controlWidth,
            controlHeight,
            savedDisplayMode,
            (mode) => this.registry.set('displayMode', mode)
        );
    }
    getDoFrequencyForInstrument(instrument) {
        const key = this.registry.get('userSelectedKeySignature') ||
            this.registry.get('selectedKeySignature') ||
            defaultKeyForInstrument(instrument);
        return computeScaleForInstrumentAndKey(getInstrumentLowFreq(instrument), key).lowDoFreq;
    }
    playDoNote(frequency) {
        if (!this.audioContext) this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.0);
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        const noteIndicator = this.add.circle(this.sys.game.config.width / 2, this.sys.game.config.height * 0.25 + 80, 30, 0x555555);
        noteIndicator.setAlpha(0.8);
        const noteText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height * 0.25 + 80, "Do", {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        });
        noteText.setOrigin(0.5);
        this.tweens.add({
            targets: [noteIndicator],
            scale: {
                from: 1,
                to: 1.5
            },
            alpha: {
                from: 0.8,
                to: 0
            },
            duration: 1000,
            onComplete: () => {
                noteIndicator.destroy();
                noteText.destroy();
            }
        });
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.0);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.instrument = 'Soprano';
        this.audioContext = null;
        this.analyserNode = null;
        this.dataArray = null;
        this.currentY = 0;
        this.targetY = 0;
        this.lowDoLogFreq = 0;
        this.highDoLogFreq = 0;
        this.keySignatureDropdown = null;
        this.selectedKeySignature = 'C Major';
        this.displayMode = 'Solfege'; // 'Solfege' or 'Pitch'
        this.displayModeButton = null;
        this.displayModeText = null;
        this.displayModeToggle = null;
        this.displayModeHitArea = null;
        this.pitchNames = [];
        this.vocalRangeFrequencies = [523.25, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63];
        this.obstacles = [];
        this.baseGameWidth = 800; // Reference width for scaling
        this.widthScaleFactor = 1; // Will be calculated in create
        this.initialObstacleSpeed = 120; // pixels per second at baseGameWidth
        this.maxObstacleSpeed = 300; // pixels per second at baseGameWidth
        this.currentObstacleSpeed = this.initialObstacleSpeed;
        this.obstacleWidth = 60; // Consider scaling this too if needed
        this.gameStartTime = 0;
        this.difficultyIncreaseTime = 20000;
        this.initialObstacleSpacing = 400; // at baseGameWidth
        this.minObstacleSpacing = 150; // at baseGameWidth
        this.currentObstacleSpacing = this.initialObstacleSpacing;
        this.initialMinHeight = 0.1;
        this.initialMaxHeight = 0.5;
        this.finalMinHeight = 0.2;
        this.finalMaxHeight = 0.7;
        this.currentMinHeight = this.initialMinHeight;
        this.currentMaxHeight = this.initialMaxHeight;
        this.lastObstacleFromTop = null;
        this.isGameOver = false;
        this.score = 0;
        this.scoreText = null;
        this.obstaclesGroup = null; // Added for grouping obstacles
    }
    preload() {
        this.load.image('background', 'https://play.rosebud.ai/assets/Background.png?Mzty');
        this.load.image('bird1', 'https://play.rosebud.ai/assets/Bird_01.png?5daF');
        this.load.image('bird2', 'https://play.rosebud.ai/assets/Bird_02.png?Z0Lm');
        this.load.image('bird3', 'https://play.rosebud.ai/assets/Bird_03.png?xLfa');
        this.load.image('pipe', 'https://play.rosebud.ai/assets/Pipe.png?2SXh');
        this.load.image('gameOver', 'https://play.rosebud.ai/assets/GameOver.png?wADk');
        this.load.image('musicNotes', 'https://play.rosebud.ai/assets/Music Notes.png?QW4u');
        this.load.image('cloud', 'https://play.rosebud.ai/assets/Cloud.png?oeuQ');
    }
    create(data) {
        this.isGameOver = false;
        this.score = 0;
        this.gameStartTime = this.time.now;
        // Calculate scale factor based on actual game width vs base width
        this.widthScaleFactor = this.sys.game.config.width / this.baseGameWidth;
        // Apply scale factor to speed and spacing
        this.initialObstacleSpeedScaled = this.initialObstacleSpeed * this.widthScaleFactor;
        this.maxObstacleSpeedScaled = this.maxObstacleSpeed * this.widthScaleFactor;
        this.currentObstacleSpeed = this.initialObstacleSpeedScaled;
        this.initialObstacleSpacingScaled = this.initialObstacleSpacing * this.widthScaleFactor;
        this.minObstacleSpacingScaled = this.minObstacleSpacing * this.widthScaleFactor;
        this.currentObstacleSpacing = this.initialObstacleSpacingScaled;
        this.currentMinHeight = this.initialMinHeight;
        this.currentMaxHeight = this.initialMaxHeight;
        this.lastObstacleFromTop = null;
        this.hasPairedObstacles = false; // Reset this flag as well
        if (data && data.instrument) {
            this.instrument = data.instrument;
        }
        if (data && data.selectedKeySignature) {
            this.selectedKeySignature = data.selectedKeySignature;
        } else if (this.registry.get('userSelectedKeySignature')) {
            this.selectedKeySignature = this.registry.get('userSelectedKeySignature');
        } else if (this.registry.get('selectedKeySignature')) {
            this.selectedKeySignature = this.registry.get('selectedKeySignature');
        } else {
            this.selectedKeySignature = defaultKeyForInstrument(this.instrument);
        }
        if (data && data.displayMode) {
            this.displayMode = normalizeDisplayMode(data.displayMode);
        } else if (this.registry.get('displayMode')) {
            this.displayMode = normalizeDisplayMode(this.registry.get('displayMode'));
        } else {
            this.displayMode = normalizeDisplayMode(this.displayMode);
        }
        this.registry.set('selectedInstrument', this.instrument);
        this.registry.set('selectedKeySignature', this.selectedKeySignature);
        this.registry.set('displayMode', this.displayMode);
        this.applyInstrumentAndKey();
        // Destroy existing game objects if they exist from a previous run
        if (this.bird) this.bird.destroy();
        if (this.obstaclesGroup) {
            // Ensure the group exists and has children before attempting to clear
            if (this.obstaclesGroup.children && this.obstaclesGroup.children.size > 0) {
                this.obstaclesGroup.clear(true, true);
            }
            this.obstaclesGroup.destroy();
            this.obstaclesGroup = null;
        }
        this.obstaclesGroup = this.physics.add.staticGroup(); // Ensure group is created BEFORE use
        if (this.scoreText) this.scoreText.destroy();
        if (this.keySignatureDropdown) { // Check if it exists before trying to destroy
            this.keySignatureDropdown.destroy(); // Use the new destroy method
            this.keySignatureDropdown = null;
        }
        if (this.scoreTimer) this.scoreTimer.remove();
        if (this.featherParticles) this.featherParticles.destroy();
        if (this.musicNoteParticles) this.musicNoteParticles.destroy();
        if (this.displayModeToggle) {
            this.displayModeToggle.destroy();
            this.displayModeToggle = null;
        }
        if (this.displayModeButton) this.displayModeButton.destroy();
        if (this.displayModeText) this.displayModeText.destroy();
        if (this.displayModeHitArea) this.displayModeHitArea.destroy();
        this.background = new Background(this);
        this.background.updateTextDisplay(this.displayMode, this.pitchNames);
        this.bird = new Bird(this, this.sys.game.config.width * 0.25, 150); // Adjusted initial Y position
        this.currentY = this.bird.y;
        this.targetY = this.bird.y;
        const solfegeLogFrequencies = this.vocalRangeFrequencies.map(freq => Math.log2(freq));
        this.lowDoLogFreq = solfegeLogFrequencies[solfegeLogFrequencies.length - 1];
        this.highDoLogFreq = solfegeLogFrequencies[0];
        this.barHeight = this.sys.game.config.height / 8;
        // this.obstaclesGroup is already reliably initialized earlier (around line 999)
        this.obstacles = [];
        this.createObstacles();
        this.createBirdParticles();
        this.createMusicNoteParticles();
        this.initAudio(); // Ensure audio is re-initialized
        this.input.once('pointerdown', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, this);
        this.setupCollisions(); // Re-setup collisions for new bird and obstacles
        this.createScoreText(); // Re-create score text
        this.scoreTimer = this.time.addEvent({
            delay: 1000,
            callback: this.incrementScore,
            callbackScope: this,
            loop: true
        });
        this.keySignatureDropdown = new KeySignatureDropdown(
            this,
            this.sys.game.config.width - 100,
            30,
            180,
            36,
            KEY_SIGNATURES,
            this.selectedKeySignature,
            (selectedKey) => this.handleKeySignatureChange(selectedKey),
            6
        );
        this.keySignatureDropdown.setSelectedOption(this.selectedKeySignature);
        this.createDisplayModeButton();
    }
    applyInstrumentAndKey() {
        const scale = computeScaleForInstrumentAndKey(
            getInstrumentLowFreq(this.instrument),
            this.selectedKeySignature
        );
        this.vocalRangeFrequencies = scale.frequencies;
        this.pitchNames = scale.pitchNames;
        this.lowDoLogFreq = Math.log2(scale.frequencies[scale.frequencies.length - 1]);
        this.highDoLogFreq = Math.log2(scale.frequencies[0]);
        if (this.background) {
            this.background.updateTextDisplay(this.displayMode, this.pitchNames);
        }
    }
    generatePitchNames() {
        this.applyInstrumentAndKey();
    }
    createDisplayModeButton() {
        const buttonWidth = 180;
        const buttonHeight = 36;
        const buttonX = this.sys.game.config.width - 100;
        const buttonY = 30 + 36 + 10;
        this.displayModeToggle = new DisplayModeToggle(
            this,
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight,
            this.displayMode,
            (mode) => {
                this.displayMode = mode;
                this.registry.set('displayMode', mode);
                this.background.updateTextDisplay(this.displayMode, this.pitchNames);
            }
        );
    }
    createObstacles() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        this.pairRequired = false;
        const initialObstacles = 7; // Increased by roughly 30% (from 4 to 5)
        this.obstacles = [];
        for (let i = 0; i < initialObstacles; i++) {
            const x = gameWidth + (i * this.initialObstacleSpacingScaled);
            // Determine if it's a cloud or a tree
            // The Obstacle constructor will now enforce that 'pipe' is from bottom and 'cloud' is from top.
            // So, we just need to decide if this obstacle *instance* should be a cloud or a pipe.
            const isCloud = Math.random() < 0.4; // 40% chance for a cloud
            let obstacleHeight;
            let fromTopDetermination = isCloud; // True if cloud, false if pipe (tree)
            if (isCloud) {
                // Clouds: La (6th bar), Ti (7th bar), High Do (8th bar from bottom)
                // Bar indices (0-7 from bottom): La=5, Ti=6, Do=7
                // Height in terms of barHeight units from the top:
                // For La (5th index from bottom, so 3rd from top for a top obstacle): (8 - 5) * barHeight = 3 * barHeight
                // For Ti (6th index from bottom, so 2nd from top): (8 - 6) * barHeight = 2 * barHeight
                // For High Do (7th index from bottom, so 1st from top): (8 - 7) * barHeight = 1 * barHeight
                const cloudLevels = [1, 2]; // Corresponds to High Do, Ti heights from top. Max height ends at top of La bar.
                obstacleHeight = cloudLevels[Math.floor(Math.random() * cloudLevels.length)] * this.barHeight;
            } else { // It's a tree (pipe)
                // Trees (pipes): Re(1), Mi(2), Fa(3), Sol(4) (0-indexed from bottom)
                // Height in terms of barHeight units from the bottom:
                const treeLevels = [2, 3, 4, 5];
                obstacleHeight = treeLevels[Math.floor(Math.random() * treeLevels.length)] * this.barHeight;
                // For pipes, y position in constructor doesn't matter as much as configurePipe will set it.
            }
            // The y position for pipes should be gameHeight, for clouds it's 0. The constructor handles this.
            const yPos = fromTopDetermination ? 0 : this.sys.game.config.height;
            // Obstacle speed is now directly in pixels per second, Obstacle class handles per-frame movement
            const obstacleSpeed = fromTopDetermination ? this.currentObstacleSpeed * 1.2 : this.currentObstacleSpeed;
            const obstacle = new Obstacle(this, x, yPos, this.obstacleWidth, obstacleHeight, obstacleSpeed, this, fromTopDetermination); // yPos is correctly set here
            this.obstacles.push(obstacle);
            this.obstaclesGroup.add(obstacle); // The obstacle's body should be configured by its constructor and configurePipe
            this.lastObstacleFromTop = fromTopDetermination; // Update for the next obstacle generation logic
            if (!obstacle.body) {
                console.error("Obstacle added to group WITHOUT a body:", obstacle.texture.key, "at x:", obstacle.x);
            }
        }
    }
    createScoreText() {
        this.scoreText = this.add.text(20, 20, 'Time: 0', {
            fontSize: '24px',
            fontFamily: '"VT323", monospace',
            fill: '#FFFFFF',
            align: 'left',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        });
        this.scoreText.setOrigin(0, 0);
        this.scoreText.setDepth(100);
        this.scoreText.setScrollFactor(0);
    }
    incrementScore() {
        if (this.isGameOver) return;
        this.score++;
        this.scoreText.setText('Time: ' + this.score);
    }
    createBirdParticles() {
        this.featherParticles = this.add.particles('bird1');
        this.featherEmitter = this.featherParticles.createEmitter({
            x: 0,
            y: 0,
            speed: {
                min: 100,
                max: 200
            },
            angle: {
                min: 0,
                max: 360
            },
            scale: {
                start: 0.1,
                end: 0.01
            },
            rotate: {
                min: 0,
                max: 360
            },
            tint: 0xFFFF00,
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: 1000,
            quantity: 30,
            on: false
        });
        this.confettiEmitter = this.featherParticles.createEmitter({
            x: this.sys.game.config.width / 2,
            y: this.sys.game.config.height / 2,
            speed: {
                min: 200,
                max: 400
            },
            angle: {
                min: 0,
                max: 360
            },
            scale: {
                start: 0.2,
                end: 0.05
            },
            rotate: {
                min: 0,
                max: 360
            },
            tint: 0xFFFF00,
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: 3000,
            quantity: 100,
            frequency: -1,
            blendMode: 'ADD'
        });
    }
    createMusicNoteParticles() {
        this.musicNoteParticles = this.add.particles('musicNotes');
        this.musicNoteEmitter = this.musicNoteParticles.createEmitter({
            follow: this.bird, // Bird's screen position will be stable
            followOffset: {
                x: -30, // Offset from bird's screen position
                y: 0
            },
            scrollFactorX: 0, // Particles should also ignore camera scroll
            scrollFactorY: 0,
            speed: {
                min: 50,
                max: 150
            },
            angle: {
                min: 160,
                max: 200
            },
            scale: {
                start: 0.08,
                end: 0.01
            },
            rotate: {
                min: -180,
                max: 180
            },
            alpha: {
                start: 0.9,
                end: 0
            },
            lifespan: {
                min: 1000,
                max: 2000
            },
            quantity: 1,
            frequency: 50,
            on: false,
            blendMode: 'ADD'
        });
        this.musicNoteParticles.setDepth(5);
        this.musicNoteParticles.setScrollFactor(0); // The particle manager itself
    }
    setupCollisions() {
        if (!this.bird || !this.obstacles) {
            console.error("Bird or obstacles array is missing!");
            return;
        }

        this.obstacles.forEach((obstacle, i) => {
            if (obstacle.body) {
                this.physics.add.collider(
                    this.bird,
                    obstacle,
                    this.handleCollision,
                    null,
                    this
                );
                console.log(`🔗 Collider registered for obstacle[${i}]`);
            } else {
                console.warn(`❌ obstacle[${i}] has no body; skipping collider.`);
            }
        });
    }
    handleCollision(bird, obstacle) {
        console.log("COLLISION DETECTED between Bird and Obstacle (texture:", obstacle.texture.key, ")");
        console.log("Bird Body:", bird.body.x, bird.body.y, bird.body.width, bird.body.height, "enabled:", bird.body.enable);
        console.log("Obstacle Body:", obstacle.body.x, obstacle.body.y, obstacle.body.width, obstacle.body.height, "enabled:", obstacle.body.enable, "pos:", obstacle.x, obstacle.y);
        if (!obstacle.body || !obstacle.body.enable || !bird.body || !bird.body.enable) {
            console.warn("Collision with an entity whose body is not valid or not enabled. Bird:", bird.body, "Obstacle:", obstacle.body);
            return;
        }
        if (this.isGameOver) return;
        console.log("Processing Game Over logic due to collision.");
        this.isGameOver = true;
        this.scoreTimer.remove();
        const explosionX = typeof bird.x === 'number' ? bird.x : this.sys.game.config.width / 2;
        const explosionY = typeof bird.y === 'number' ? bird.y : this.sys.game.config.height / 2;
        this.confettiEmitter.explode(100, explosionX, explosionY);
        bird.body.setAllowGravity(false);
        bird.setVelocity(0, 0); // Set both X and Y velocity to 0
        bird.anims.stop();
        // No need to iterate and set speed for static obstacles unless they have other dynamic properties
        this.cameras.main.shake(300, 0.02);
        bird.setVisible(false); // Hide bird instead of destroying, allows for restart
        this.time.delayedCall(1000, this.displayGameOver, [], this);
    }
    displayGameOver() {
        const overlay = this.add.rectangle(this.sys.game.config.width / 2, this.sys.game.config.height / 2, this.sys.game.config.width, this.sys.game.config.height, 0x000000);
        overlay.setAlpha(0.7);
        overlay.setDepth(200);
        const finalScoreText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 90, 'Final Time: ' + this.score + 's', {
            fontSize: '36px',
            fontFamily: '"VT323", monospace',
            fill: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#39FF14',
                blur: 3,
                stroke: true,
                fill: true
            }
        });
        finalScoreText.setOrigin(0.5);
        finalScoreText.setDepth(201);
        const retryButtonWidth = 180;
        const retryButtonHeight = 60;
        const retryButtonX = this.sys.game.config.width / 2;
        const retryButtonY = this.sys.game.config.height / 2 + 0;
        const retryNormalColor = 0x333333;
        const retryHoverColor = 0x444444;
        const retryPressedColor = 0x222222;
        const retryGraphics = this.add.graphics();
        retryGraphics.setDepth(201);
        const drawRetryButton = (color, shadowOffsetY = 3) => {
            retryGraphics.clear();
            retryGraphics.fillStyle(0x000000, 0.4);
            retryGraphics.fillRect(retryButtonX - retryButtonWidth / 2 + shadowOffsetY, retryButtonY - retryButtonHeight / 2 + shadowOffsetY, retryButtonWidth, retryButtonHeight);
            retryGraphics.fillStyle(color, 1);
            retryGraphics.fillRect(retryButtonX - retryButtonWidth / 2, retryButtonY - retryButtonHeight / 2, retryButtonWidth, retryButtonHeight);
            // retryGraphics.lineStyle(3, 0x00FF00, 1); // Removed line style
            // retryGraphics.strokeRect(retryButtonX - retryButtonWidth / 2, retryButtonY - retryButtonHeight / 2, retryButtonWidth, retryButtonHeight); // Removed stroke
        };
        drawRetryButton(retryNormalColor);
        const retryText = this.add.text(retryButtonX, retryButtonY, 'Try Again', {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setDepth(202);
        const retryHitArea = this.add.rectangle(retryButtonX, retryButtonY, retryButtonWidth, retryButtonHeight)
            .setInteractive({
                useHandCursor: true
            })
            .setOrigin(0.5);
        retryHitArea.on('pointerover', () => drawRetryButton(retryHoverColor));
        retryHitArea.on('pointerout', () => drawRetryButton(retryNormalColor));
        retryHitArea.on('pointerdown', () => {
            drawRetryButton(retryPressedColor, 2);
            this.tweens.add({
                targets: [retryGraphics, retryText],
                y: '+=2',
                duration: 50,
                ease: 'Power1',
                yoyo: true
            });
        });
        retryHitArea.on('pointerup', () => {
            drawRetryButton(retryHoverColor);
            // Use the *actual* current key signature for the restart
            const keySignatureForRestart = this.selectedKeySignature;
            const doFrequency = this.getDoFrequencyForKey(keySignatureForRestart);
            this.playDoNoteForKey(doFrequency);
            this.scene.restart({
                instrument: this.instrument,
                selectedKeySignature: keySignatureForRestart,
                displayMode: this.displayMode
            });
        });
        const changeButtonWidth = 250;
        const changeButtonHeight = 60;
        const changeButtonX = this.sys.game.config.width / 2;
        const changeButtonY = this.sys.game.config.height / 2 + 70;
        const changeNormalColor = 0x333333;
        const changeHoverColor = 0x444444;
        const changePressedColor = 0x222222;
        const changeGraphics = this.add.graphics();
        changeGraphics.setDepth(201);
        const drawChangeButton = (color, shadowOffsetY = 3) => {
            changeGraphics.clear();
            changeGraphics.fillStyle(0x000000, 0.4);
            changeGraphics.fillRect(changeButtonX - changeButtonWidth / 2 + shadowOffsetY, changeButtonY - changeButtonHeight / 2 + shadowOffsetY, changeButtonWidth, changeButtonHeight);
            changeGraphics.fillStyle(color, 1);
            changeGraphics.fillRect(changeButtonX - changeButtonWidth / 2, changeButtonY - changeButtonHeight / 2, changeButtonWidth, changeButtonHeight);
            // changeGraphics.lineStyle(3, 0x00FF00, 1); // Removed line style
            // changeGraphics.strokeRect(changeButtonX - changeButtonWidth / 2, changeButtonY - changeButtonHeight / 2, changeButtonWidth, changeButtonHeight); // Removed stroke
        };
        drawChangeButton(changeNormalColor);
        const changeText = this.add.text(changeButtonX, changeButtonY, 'Change Instrument', {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setDepth(202);
        const changeHitArea = this.add.rectangle(changeButtonX, changeButtonY, changeButtonWidth, changeButtonHeight)
            .setInteractive({
                useHandCursor: true
            })
            .setOrigin(0.5);
        changeHitArea.on('pointerover', () => drawChangeButton(changeHoverColor));
        changeHitArea.on('pointerout', () => drawChangeButton(changeNormalColor));
        changeHitArea.on('pointerdown', () => {
            drawChangeButton(changePressedColor, 2);
            this.tweens.add({
                targets: [changeGraphics, changeText],
                y: '+=2',
                duration: 50,
                ease: 'Power1',
                yoyo: true
            });
        });
        changeHitArea.on('pointerup', () => {
            drawChangeButton(changeHoverColor);
            this.scene.start('StartScreen');
        });
    }
    adjustVocalRange(instrument) {
        this.instrument = instrument;
        this.applyInstrumentAndKey();
    }
    async initAudio() {
        try {
            // Stop and close any existing audio context and stream
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }
            if (this.audioContext) {
                if (this.audioContext.state !== 'closed') {
                    await this.audioContext.close();
                }
                this.audioContext = null;
                this.analyserNode = null;
                this.dataArray = null;
            }
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            this.audioContext = new(window.AudioContext || window.webkitAudioContext)();

            // Check if context is suspended (usually due to browser auto-play policies)
            if (this.audioContext.state === 'suspended') {
                console.log("AudioContext is suspended. Waiting for user interaction to resume.");
                // We already have a pointerdown listener in create() to resume it.
            }
            this.analyserNode = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyserNode);
            this.analyserNode.fftSize = 2048; // Standard FFT size for pitch detection
            this.dataArray = new Uint8Array(this.analyserNode.fftSize); // For time-domain data
            console.log("Audio initialized successfully.");
        } catch (err) {
            console.error('Error initializing audio:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert('Microphone access denied. Please allow microphone access to play.');
            } else {
                alert('Could not initialize audio. Please ensure a microphone is connected and permissions are granted.');
            }
        }
    }
    update() {
        if (this.isGameOver) {
            if (this.musicNoteEmitter && this.musicNoteEmitter.on) this.musicNoteEmitter.stop();
            return;
        }
        if (this.audioContext && this.analyserNode && this.dataArray) {
            this.analyserNode.getByteTimeDomainData(this.dataArray);
            let sumOfSquares = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                let val = (this.dataArray[i] - 128) / 128;
                sumOfSquares += val * val;
            }
            let rms = Math.sqrt(sumOfSquares / this.dataArray.length);
            let pitch = this.autoCorrelate(this.dataArray, this.audioContext.sampleRate);
            if (pitch > 0) {
                this.bird.body.setAllowGravity(false);
                if (this.musicNoteEmitter) {
                    if (!this.musicNoteEmitter.on) this.musicNoteEmitter.start();
                    const clampedRms = Phaser.Math.Clamp(rms, 0.02, 0.3);
                    const minFreq = 20;
                    const maxFreq = 100;
                    const freqRange = maxFreq - minFreq;
                    const targetFreq = maxFreq - ((clampedRms - 0.02) / (0.3 - 0.02)) * freqRange;
                    this.musicNoteEmitter.frequency = targetFreq;
                    const minQuantity = 1;
                    const maxQuantity = 3;
                    const quantityRange = maxQuantity - minQuantity;
                    let targetQuantity = minQuantity + ((clampedRms - 0.02) / (0.3 - 0.02)) * quantityRange;
                    targetQuantity = Math.round(targetQuantity);
                    this.musicNoteEmitter.setQuantity(typeof targetQuantity === 'number' && targetQuantity >= 0 ? targetQuantity : minQuantity);
                }
                let logPitch = Math.log2(pitch);
                let closestNoteIndex = this.findClosestNoteIndex(pitch);
                const gameHeight = this.sys.game.config.height;
                const isCloseToNote = this.isPitchWithinTolerance(pitch, closestNoteIndex, 0.25); // 0.25 semitone tolerance
                const highestLogFreq = Math.log2(this.vocalRangeFrequencies[0]); // Highest note (Do8)
                const lowestLogFreq = Math.log2(this.vocalRangeFrequencies[this.vocalRangeFrequencies.length - 1]); // Lowest note (Do7)
                const barHeight = gameHeight / 8; // Each solfege bar height
                if (isCloseToNote) {
                    // Snap to the center of the solfege bar
                    this.targetY = (closestNoteIndex + 0.5) * barHeight;
                } else {
                    // If not close to a specific note, interpolate position within the full vocal range
                    // Ensure logPitch is clamped within the defined vocal range for interpolation
                    const clampedLogPitch = Phaser.Math.Clamp(logPitch, lowestLogFreq, highestLogFreq);
                    let relativePosition = (clampedLogPitch - highestLogFreq) / (lowestLogFreq - highestLogFreq);
                    // The relativePosition will be 0 for highest note and 1 for lowest note.
                    // Higher pitch (closer to highestLogFreq) means smaller relativePosition, so closer to top of screen.
                    // Lower pitch (closer to lowestLogFreq) means larger relativePosition, so closer to bottom of screen.
                    this.targetY = relativePosition * gameHeight;
                }
                // Smoothly move the bird towards the targetY
                this.currentY += (this.targetY - this.currentY) * 0.1; // Adjust 0.1 for faster/slower smoothing
                this.bird.y = Phaser.Math.Clamp(this.currentY, this.bird.displayHeight / 2, gameHeight - this.bird.displayHeight / 2);
                this.bird.setVelocityY(0); // Override gravity while singing
            } else {
                this.bird.body.setAllowGravity(true);
                if (this.musicNoteEmitter && this.musicNoteEmitter.on) this.musicNoteEmitter.stop();
            }
        } else {
            this.bird.body.setAllowGravity(true);
            if (this.musicNoteEmitter && this.musicNoteEmitter.on) this.musicNoteEmitter.stop();
        }
        // Obstacles are static, their update method might not do much anymore regarding movement.
        // If obstacles need to be recycled, a different mechanism is needed.
        // this.obstacles.forEach(obstacle => obstacle.update());
        // Instead of obstacles moving, we can move the camera
        // This gives the illusion of the bird moving forward.
        // Let's define a scroll speed.
        // === OBSTACLE MOVEMENT & RECYCLING ===
        const deltaTime = this.sys.game.loop.delta / 1000; // Time in seconds since last frame
        this.obstacles.forEach(obstacle => {
            // 1) slide it left by its current speed (pixels per second) * deltaTime
            obstacle.x -= obstacle.speed * deltaTime; // obstacle.speed is set in Obstacle constructor and reset
            // 2) sync the physics body to the new position
            if (obstacle.body) { // Check if body exists
                obstacle.body.updateFromGameObject();
            }
            // 3) if it’s off the left edge, recycle it to the right
            if (obstacle.x < -obstacle.displayWidth) {
                // obstacle.reset() will internally calculate the farthestX and set the new position.
                // So, no need to calculate farthestX or set obstacle.x here explicitly.
                obstacle.reset(); // recalc height & flip top/bottom, and repositions
                if (obstacle.body) { // Check if body exists after reset
                    obstacle.body.updateFromGameObject(); // Ensure physics body is synced after reset
                }
            }
        });
        this.updateDifficulty();
    }
    getFarthestObstacleX() {
        let farthestX = 0;
        this.obstaclesGroup.getChildren().forEach(obstacle => {
            if (obstacle.x > farthestX) {
                farthestX = obstacle.x;
            }
        });
        return farthestX;
    }
    updateDifficulty() {
        const elapsedTime = this.time.now - this.gameStartTime;
        if (elapsedTime > this.difficultyIncreaseTime) {
            const progressFactor = Math.min(1, (elapsedTime - this.difficultyIncreaseTime) / 40000); // 40 seconds to reach max difficulty
            this.currentObstacleSpacing = this.initialObstacleSpacingScaled - (progressFactor * (this.initialObstacleSpacingScaled - this.minObstacleSpacingScaled));
            this.currentMinHeight = this.initialMinHeight + (progressFactor * (this.finalMinHeight - this.initialMinHeight));
            this.currentMaxHeight = this.initialMaxHeight + (progressFactor * (this.finalMaxHeight - this.initialMaxHeight));
            this.currentObstacleSpeed = this.initialObstacleSpeedScaled + (progressFactor * (this.maxObstacleSpeedScaled - this.initialObstacleSpeedScaled));
            if (elapsedTime > this.difficultyIncreaseTime && !this.hasPairedObstacles) this.hasPairedObstacles = true;
        }
    }
    autoCorrelate(buffer, sampleRate) {
        let SIZE = buffer.length;
        let sumOfSquares = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = (buffer[i] - 128) / 128;
            sumOfSquares += val * val;
        }
        let rms = Math.sqrt(sumOfSquares / SIZE);
        if (rms < 0.01) return -1;
        let r1 = 0,
            r2 = SIZE - 1,
            threshold = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs((buffer[i] - 128) / 128) > threshold) {
                r1 = i;
                break;
            }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs((buffer[SIZE - i] - 128) / 128) > threshold) {
                r2 = SIZE - i;
                break;
            }
        }
        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;
        if (SIZE < 2) return -1;
        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] += ((buffer[j] - 128) / 128) * ((buffer[j + i] - 128) / 128);
            }
        }
        let d = 0;
        while (d < c.length - 1 && c[d] > c[d + 1]) d++;
        let maxval = -1,
            maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        if (maxpos === -1 || maxpos >= SIZE - 1) return -1;
        let T0 = maxpos;
        let x1 = c[T0 - 1],
            x2 = c[T0],
            x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a !== 0) T0 = T0 - b / (2 * a);
        if (T0 === 0) return -1;
        return sampleRate / T0;
    }
    findClosestNoteIndex(pitch) {
        const logPitch = Math.log2(pitch);
        const logFreqs = this.vocalRangeFrequencies.map(f => Math.log2(f));
        let closestIndex = 0;
        let smallestDiff = Math.abs(logPitch - logFreqs[0]);
        for (let i = 1; i < logFreqs.length; i++) {
            const diff = Math.abs(logPitch - logFreqs[i]);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestIndex = i;
            }
        }
        return closestIndex;
    }
    isPitchWithinTolerance(pitch, noteIndex, tolerancePercent) {
        const targetFreq = this.vocalRangeFrequencies[noteIndex];
        const lowerBound = targetFreq * (1 - tolerancePercent);
        const upperBound = targetFreq * (1 + tolerancePercent);
        return (pitch >= lowerBound && pitch <= upperBound);
    }
    getDoFrequencyForKey(keySignature) {
        return computeScaleForInstrumentAndKey(
            getInstrumentLowFreq(this.instrument),
            keySignature
        ).lowDoFreq;
    }
    playDoNoteForKey(frequency) {
        if (!this.audioContext) this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    handleKeySignatureChange(selectedKey) {
        this.selectedKeySignature = selectedKey;
        this.registry.set('selectedKeySignature', selectedKey);
        this.registry.set('userSelectedKeySignature', selectedKey);
        this.applyInstrumentAndKey();
        this.playDoNoteForKey(this.getDoFrequencyForKey(selectedKey));
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'renderDiv',
    resolution: window.devicePixelRatio || 1,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        parent: 'renderDiv',
        zoom: 1
    },
    scene: [StartScreen, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 600 // Base gravity, bird movement primarily pitch-controlled
            },
            debug: false,
            // Consider enabling timeScale for physics if direct speed manipulation isn't enough,
            // but for Flappy Bird style, direct speed control is usually better.
            // timeScale: 1 // Default is 1. Adjusting this can slow down or speed up all physics.
        }
    },
    render: {
        pixelArt: true,
        antialias: false,
        antialiasGL: false
    }
};

window.phaserGame = new Phaser.Game(config);
// Dynamically load the VT323 font from Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);
// Conceptual imports - these would be active if files were separate
// import Background from './Background.js'; // GameScene uses Background
// import Bird from './Bird.js';         // GameScene uses Bird
// import Obstacle from './Obstacle.js';   // GameScene uses Obstacle
// Class definitions will follow.
// Order: Helper classes first (Background, Bird, Obstacle), then Scenes (StartScreen, GameScene)
class Background {
    constructor(scene) {
        this.scene = scene;
        this.createBackgrounds();
    }
    createBackgrounds() {
        const gameWidth = this.scene.sys.game.config.width;
        const gameHeight = this.scene.sys.game.config.height;
        const barHeight = gameHeight / 8; // 8 equal-height bars for the octave
        // More vibrant colors with less pastel feel
        const vibrantColors = [
            0xFF5555, // More Red (High Do)
            0xFFBF80, // Brighter Orange (Re)
            0xFFEF80, // Brighter Yellow (Mi)
            0x80FF97, // Brighter Green (Fa)
            0x80C4FF, // Brighter Blue (Sol)
            0xBB80FF, // Brighter Purple (La)
            0xFF80D5, // Brighter Pink (Ti)
            0xFF5555 // More Red (Low Do)
        ];
        // Use the vibrant colors
        const colors = vibrantColors;
        const solfegeNames = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];
        for (let i = 0; i < 8; i++) {
            const y = gameHeight - (i + 1) * barHeight;
            // Create rectangle with more transparent color
            const bar = this.scene.add.rectangle(0, y, gameWidth, barHeight, colors[i]);
            bar.setOrigin(0, 0);
            bar.setAlpha(0.7); // Slightly more transparent to balance the increased vibrancy
            // Create text with Arial font - centered vertically in each bar
            const text = this.scene.add.text(10, y + barHeight / 2, solfegeNames[i], {
                fontSize: '30px',
                fontFamily: '"VT323", monospace',
                fontStyle: 'normal',
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
        }
    }
}
class Bird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bird1');

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(0.45); // Reduced by 10% from 0.5
        this.setCollideWorldBounds(true);
        this.body.setAllowGravity(true); // Enable gravity by default
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
    // flap() method removed - control is via pitch now
}
class Obstacle extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, speed, gameScene, fromTop = null) {
        super(scene, x, 0); // Initial y position will be set by configurePipe
        this.scene = scene;
        this.obstacleWidth = width;
        this.obstacleHeight = height;
        this.speed = speed;
        this.gameHeight = scene.sys.game.config.height;
        this.gameScene = gameScene;
        if (fromTop !== null) {
            this.fromTop = fromTop;
        } else {
            if (this.gameScene.lastObstacleFromTop === null) {
                this.fromTop = Math.random() > 0.5;
            } else {
                this.fromTop = !this.gameScene.lastObstacleFromTop;
            }
        }
        this.gameScene.lastObstacleFromTop = this.fromTop;
        // Create either cloud graphics or tree image
        if (this.fromTop) {
            this.obstacleSprite = this.scene.add.image(0, 0, 'cloud');
            this.add(this.obstacleSprite); // Add image to container
        } else {
            this.obstacleSprite = scene.add.image(0, 0, 'pipe');
            this.add(this.obstacleSprite); // Add image to container
        }
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body for the container
        // Configure appearance and physics body
        this.configurePipe(this.fromTop, this.obstacleHeight);
        this.startX = x;
        // Set the size of the container's physics body
        this.body.setSize(this.obstacleWidth, this.obstacleHeight);
    }
    createCloudSprite(width, height) {
        const cloudImage = this.scene.add.image(0, 0, 'cloud');
        // The image will be scaled in configurePipe
        return cloudImage;
    }
    configurePipe(fromTop, height) {
        this.fromTop = fromTop;
        this.obstacleHeight = height;
        if (this.fromTop) { // Cloud
            // Cloud image
            const textureWidthCloud = this.obstacleSprite.texture.getSourceImage().width;
            const textureHeightCloud = this.obstacleSprite.texture.getSourceImage().height;
            const scaleX = this.obstacleWidth / textureWidthCloud;
            // Preserve aspect ratio: Calculate scaleY based on scaleX and original aspect ratio
            const scaleY = scaleX * (textureWidthCloud / textureHeightCloud) * (150 / 350) * 3; // (original aspect ratio of image) * 3 for increased size
            this.obstacleSprite.setScale(scaleX, scaleY);
            this.obstacleSprite.setOrigin(0.5, 0); // Origin at the top center for the cloud image
            this.y = 0; // Position container at the top
            this.body.setOffset(-this.obstacleWidth / 2, 0); // Body offset for top origin
            this.obstacleHeight = this.obstacleSprite.displayHeight; // Update obstacleHeight to match new visual size
        } else { // Tree
            const textureWidth = this.obstacleSprite.texture.getSourceImage().width;
            const textureHeight = this.obstacleSprite.texture.getSourceImage().height;
            this.obstacleSprite.setScale(this.obstacleWidth / textureWidth, this.obstacleHeight / textureHeight);
            this.obstacleSprite.setOrigin(0.5, 1); // Origin at the bottom center for the image
            this.y = this.gameHeight;
            // Adjust the physics body offset for bottom origin
            // The image is centered horizontally in the container (x=0)
            // The image's bottom is at y=0 in the container
            this.body.setOffset(-this.obstacleWidth / 2, -this.obstacleHeight);
        }
        // Set the size of the physics body for the container
        this.body.setSize(this.obstacleWidth, this.obstacleHeight); // obstacleHeight is now updated for clouds
        this.body.enable = true; // Ensure body is enabled
        // For static bodies, setting container x/y and body offset/size is usually enough.
        // The physics system will use the container's transform.
        // If issues persist, we might need to manually set body.position.x/y
        // but let's try without explicit reset first.
    }
    update() {
        // Move obstacle from right to left
        this.x -= this.speed;
        // For static bodies, updating the container's x position should be sufficient.
        // The physics body will follow the container's transform.
        // Reset when off screen
        if (this.x < -this.obstacleWidth) { // Check against obstacleWidth (container width)
            this.reset();
        }
    }
    reset() {
        // Get the current obstacle spacing from game scene for positioning
        const spacing = this.gameScene.currentObstacleSpacing;

        // Reset to position on the right side, using the current spacing for consistent difficulty
        this.x = this.scene.sys.game.config.width + spacing;
        // Check if we're past the 20-second mark
        const elapsedTime = this.scene.time.now - this.gameScene.gameStartTime;
        const pastDifficultyIncreaseTime = elapsedTime > this.gameScene.difficultyIncreaseTime;

        // Determine if this obstacle should be from top or bottom
        // After 20 seconds, if the last obstacle was from bottom, make this one from top
        if (pastDifficultyIncreaseTime && !this.gameScene.lastObstacleFromTop) {
            // Last was from bottom, make this one from top
            this.fromTop = true;
        } else if (pastDifficultyIncreaseTime && this.gameScene.pairRequired) {
            // If we need to create a pair (bottom one after a top one), do it
            this.fromTop = false;
            this.gameScene.pairRequired = false;
        } else {
            // Before 20 seconds, or normal alternating pattern after 20 seconds
            // Alternate from the last obstacle type
            this.fromTop = !this.gameScene.lastObstacleFromTop;

            // If this is a top obstacle and we're past 20 seconds, set flag to create matching bottom one
            if (this.fromTop && pastDifficultyIncreaseTime) {
                this.gameScene.pairRequired = true;
            }
        }

        // Update the game scene's tracking of last obstacle type
        this.gameScene.lastObstacleFromTop = this.fromTop;

        // Use the game scene's current height ranges for the obstacles
        const minGap = 150; // Minimum space for the bird (pixels)
        const availableHeightForObstacle = this.gameHeight - minGap;
        // Use the game scene's current height ranges, but clamp based on minGap
        const minObstacleHeight = this.gameHeight * this.gameScene.currentMinHeight;
        const maxObstacleHeightAllowed = Math.min(this.gameHeight * this.gameScene.currentMaxHeight, availableHeightForObstacle);
        // Ensure min height doesn't exceed max allowed height
        const clampedMinHeight = Math.min(minObstacleHeight, maxObstacleHeightAllowed);
        // Calculate new height, ensuring it respects the minGap constraint
        const rawHeight = Phaser.Math.Between(clampedMinHeight, maxObstacleHeightAllowed);
        // Snap the height to the nearest multiple of barHeight
        const barHeight = this.gameScene.barHeight;
        const snappedHeight = Math.round(rawHeight / barHeight) * barHeight;
        // Ensure the snapped height doesn't go below the minimum or above the maximum allowed
        const newHeight = Phaser.Math.Clamp(snappedHeight, clampedMinHeight, maxObstacleHeightAllowed);
        // Reconfigure the existing pipe instance
        // If it's a top obstacle (cloud), destroy old graphics and create new ones
        if (this.fromTop) {
            // If it's a top obstacle (cloud)
            if (this.obstacleSprite && this.obstacleSprite.texture.key !== 'cloud') {
                // If it was a tree, destroy and create cloud image
                this.obstacleSprite.destroy();
                this.obstacleSprite = this.scene.add.image(0, 0, 'cloud');
                this.addAt(this.obstacleSprite, 0);
            } else if (!this.obstacleSprite) {
                // If no sprite exists, create cloud image
                this.obstacleSprite = this.scene.add.image(0, 0, 'cloud');
                this.addAt(this.obstacleSprite, 0);
            }
            // The scaling will be handled in configurePipe
        } else {
            // If it's a bottom obstacle (tree)
            if (this.obstacleSprite && this.obstacleSprite.texture.key !== 'pipe') {
                // If it was a cloud, destroy and create tree image
                this.obstacleSprite.destroy();
                this.obstacleSprite = this.scene.add.image(0, 0, 'pipe');
                this.addAt(this.obstacleSprite, 0);
            } else if (!this.obstacleSprite) {
                // If no sprite exists, create tree image
                this.obstacleSprite = this.scene.add.image(0, 0, 'pipe');
                this.addAt(this.obstacleSprite, 0);
            }
        }
        // Reconfigure the existing obstacle instance
        this.configurePipe(this.fromTop, newHeight);
        // For static bodies, setting container x/y and body offset/size (done in configurePipe)
        // should be sufficient. The physics system will use the container's transform.
        // No explicit body.reset() needed here for static container bodies after repositioning.
    }
}
// KeySignatureDropdown.js
class KeySignatureDropdown {
    constructor(scene, x, y, width, height, options, defaultOption, callback) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.options = options;
        this.selectedOption = defaultOption;
        this.callback = callback;
        this.isOpen = false;
        this.createDropdown();
    }
    createDropdown() {
        const gameWidth = this.scene.sys.game.config.width;
        const neonGreenColor = 0x00FF00; // Brighter retro green
        this.dropdownButton = this.scene.add.graphics();
        this.dropdownButton.fillStyle(0x222222, 1); // Darker, solid fill for 8-bit
        this.dropdownButton.lineStyle(3, 0x00FF00, 1); // Thicker, brighter border
        this.dropdownButton.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        this.dropdownButton.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        this.dropdownButton.setDepth(300);
        this.dropdownText = this.scene.add.text(this.x, this.y, `${this.selectedOption} ▼`, {
            fontSize: '18px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
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
        const hitArea = this.scene.add.rectangle(this.x, this.y, this.width, this.height)
            .setInteractive({
                useHandCursor: true
            })
            .on('pointerdown', () => this.toggleDropdown());
        hitArea.setOrigin(0.5);
        hitArea.setAlpha(0.001);
        this.optionsContainer = this.scene.add.container(this.x, this.y + this.height / 2);
        this.optionsContainer.setVisible(false);
        this.optionsContainer.setDepth(300);
        this.options.forEach((option, index) => {
            const optionY = (index + 1) * this.height * 0.8;
            const optionGraphics = this.scene.add.graphics();
            optionGraphics.fillStyle(0x2c2c2c, 1); // Slightly darker solid fill for options
            optionGraphics.fillRect(-this.width / 2, optionY - (this.height * 0.8) / 2, this.width, this.height * 0.8);
            optionGraphics.lineStyle(2, 0x00FF00, 1); // Add border to options
            optionGraphics.strokeRect(-this.width / 2, optionY - (this.height * 0.8) / 2, this.width, this.height * 0.8);
            this.optionsContainer.add(optionGraphics);
            const optionText = this.scene.add.text(0, optionY, option, {
                fontSize: '16px',
                fontFamily: '"VT323", monospace',
                fontStyle: 'normal',
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
            this.optionsContainer.add(optionText);
            const optionHitArea = this.scene.add.rectangle(0, optionY, this.width, this.height * 0.8)
                .setInteractive({
                    useHandCursor: true
                })
                .on('pointerdown', () => this.selectOption(option));
            optionHitArea.setOrigin(0.5);
            optionHitArea.setAlpha(0.001);
            this.optionsContainer.add(optionHitArea);
        });
        this.scene.input.on('pointerdown', (pointer) => {
            if (this.isOpen) {
                const dropdownBounds = new Phaser.Geom.Rectangle(
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height + (this.options.length * this.height * 0.8)
                );
                if (!dropdownBounds.contains(pointer.x, pointer.y)) {
                    this.closeDropdown();
                }
            }
        });
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
        if (this.callback) {
            this.callback(option);
        }
        console.log("Selected Key Signature:", option);
    }
    closeDropdown() {
        this.isOpen = false;
        this.optionsContainer.setVisible(false);
        this.dropdownText.setText(`${this.selectedOption} ▼`);
    }
    getSelectedOption() {
        return this.selectedOption;
    }
}
class StartScreen extends Phaser.Scene {
    constructor() {
        super('StartScreen');
    }
    preload() {
        // Preload bird image for feather particles
        this.load.image('bird1', 'https://play.rosebud.ai/assets/Bird_01.png?5daF');
        // Create audio context for tone generation
        this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
    }
    create() {
        // Create a black background
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        // Black background
        const blackBg = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x000000);
        blackBg.setOrigin(0, 0);
        // Define neon green color for consistency
        const neonGreenColor = 0x39FF14;
        // Add "Pitchy Bird" title
        const titleText = this.add.text(gameWidth / 2, gameHeight * 0.25, "Pitchy Bird", {
            fontSize: 'calc(3.75em + 6vmin)', // Responsive font size
            fontFamily: '"VT323", monospace', // Pixel font with a clean, geometric feel
            fontStyle: 'normal', // Ensure normal style
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
        titleText.setDepth(10); // Ensure it's above other UI elements
        const darkBackgroundColor = 0x333333;
        // Create floating yellow feathers in the background
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
            tint: 0xFFFF00, // Brighter yellow color
            alpha: {
                start: 0.8,
                end: 0.3
            },
            lifespan: {
                min: 4000,
                max: 8000
            },
            quantity: 2, // Doubled the quantity
            frequency: 150, // Emitting more frequently (was 300ms)
            blendMode: 'ADD'
        });
        // Track cursor position for feather interaction
        this.input.on('pointermove', (pointer) => {
            // Track previous pointer position
            this.pointer = this.pointer || {
                x: pointer.x,
                y: pointer.y
            };

            // Calculate movement vector
            const dx = pointer.x - this.pointer.x;
            const dy = pointer.y - this.pointer.y;

            // Update stored pointer position
            this.pointer.x = pointer.x;
            this.pointer.y = pointer.y;

            // If there's significant movement, create a "wind" effect
            if (dx !== 0 || dy !== 0) {
                const magnitude = Math.sqrt(dx * dx + dy * dy);

                if (magnitude > 5) { // Only react to more significant movements
                    // Create new particles at the cursor position when moving
                    this.floatingEmitter.explode(4, pointer.x, pointer.y);

                    // Modify emitter properties in ways that are supported
                    // Adjust speed and direction based on cursor movement
                    this.floatingEmitter.setSpeed(100 + magnitude);

                    // Set the angle opposite to the movement direction
                    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 180) % 360;
                    this.floatingEmitter.setAngle({
                        min: angle - 30,
                        max: angle + 30
                    });

                    // Reset emitter properties after a delay
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

        // Create a dropdown menu for instrument selection
        const dropdownWidth = 320; // Wider dropdown menu
        const dropdownHeight = 50;
        const dropdownY = gameHeight / 2; // Position above the main button, moved down

        // Create the dropdown background with rounded corners
        const dropdown = this.add.graphics();
        dropdown.fillStyle(0x222222, 1); // Darker, solid fill
        dropdown.lineStyle(3, neonGreenColor, 1); // Thicker border
        dropdown.fillRect(
            gameWidth / 2 - dropdownWidth / 2,
            dropdownY - dropdownHeight / 2,
            dropdownWidth,
            dropdownHeight
        );
        dropdown.strokeRect(
            gameWidth / 2 - dropdownWidth / 2,
            dropdownY - dropdownHeight / 2,
            dropdownWidth,
            dropdownHeight
        );

        // Make the dropdown interactive
        const dropdownHitArea = this.add.rectangle(
            gameWidth / 2,
            dropdownY,
            dropdownWidth,
            dropdownHeight
        );
        dropdownHitArea.setOrigin(0.5);
        dropdownHitArea.setInteractive({
            useHandCursor: true
        });
        dropdownHitArea.setAlpha(0.001); // Invisible hit area

        // Add label text inside the dropdown
        const dropdownText = this.add.text(gameWidth / 2, dropdownY, "Select Instrument ▼", {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
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

        // Available instrument options
        const instrumentOptions = [
            // Voices
            "Soprano", "Alto", "Tenor", "Baritone", "Bass",

            // Band Instruments
            "Flute", "Clarinet", "Oboe", "Bassoon",
            "Soprano Saxophone", "Alto Saxophone", "Tenor Saxophone", "Baritone Saxophone",
            "Trumpet", "French Horn", "Trombone", "Baritone Horn", "Tuba",

            // Orchestra Instruments
            "Violin", "Viola", "Cello", "Double Bass",

            // Other
            "Guitar", "Ukulele", "Piano"
        ];

        // Define option height
        const optionHeight = 40;

        // Set a fixed height for the dropdown (showing ~5 options at once)
        const visibleOptionsCount = 5;
        const optionsContainerHeight = visibleOptionsCount * optionHeight;

        // Create the dropdown options container (initially hidden)
        const optionsContainer = this.add.container(gameWidth / 2, dropdownY + dropdownHeight / 2);
        optionsContainer.setSize(dropdownWidth, optionsContainerHeight); // Fixed height container
        optionsContainer.setVisible(false);
        optionsContainer.setDepth(100); // Set high depth for the entire container

        // Create a container for the actual options that can be moved for scrolling
        const optionsContent = this.add.container(0, 0);
        optionsContainer.add(optionsContent);
        // Create an array to store all option text elements for easier management
        const optionTextElements = [];
        // Track scroll position and total height
        const totalContentHeight = instrumentOptions.length * optionHeight;
        let scrollY = 0;
        const maxScroll = Math.max(0, totalContentHeight - optionsContainerHeight);

        // Create options
        let selectedInstrument = "Soprano"; // Default selection

        instrumentOptions.forEach((instrument, index) => {
            // Create option background
            const optionY = index * optionHeight;
            // Create option with rounded corners
            const optionGraphics = this.add.graphics();
            optionGraphics.fillStyle(0x2c2c2c, 1); // Darker option fill
            optionGraphics.fillRect(
                -dropdownWidth / 2,
                optionY,
                dropdownWidth,
                optionHeight
            );
            optionGraphics.lineStyle(2, neonGreenColor, 1); // Thicker border for options
            optionGraphics.strokeRect(
                -dropdownWidth / 2,
                optionY,
                dropdownWidth,
                optionHeight
            );
            optionGraphics.setDepth(150);
            optionsContent.add(optionGraphics);

            // Store the graphics object in a property for easier access
            optionGraphics.optionIndex = index;

            // Create hit area for interaction
            const option = this.add.rectangle(
                0,
                optionY + optionHeight / 2,
                dropdownWidth,
                optionHeight,
                0x30B060
            );
            option.alpha = 0.001; // Invisible hit area
            option.setOrigin(0.5);
            option.setDepth(150);
            option.setInteractive({
                useHandCursor: true
            });
            // Add option text with absolute positioning for better visibility
            const optionText = this.add.text(
                gameWidth / 2, // Absolute position instead of container-relative
                dropdownY + dropdownHeight + optionY + optionHeight / 2,
                instrument, {
                    fontSize: '16px',
                    fontFamily: '"VT323", monospace',
                    fontStyle: 'normal',
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
                }
            );
            optionText.setShadow(1, 1, '#39FF14', 1, true, true);
            optionText.setOrigin(0.5);
            optionText.setDepth(999); // Absolute highest depth value
            optionText.setVisible(false); // Initially hidden
            // Add to tracking array
            optionTextElements.push(optionText);

            // Add hover effect with index references to find the correct graphics
            option.on('pointerover', () => {
                // Create a new graphics object for the hover state
                const hoveredGraphics = this.add.graphics();

                // Draw highlighted rectangle
                hoveredGraphics.fillStyle(0x383838, 1); // Slightly lighter solid fill for hover
                hoveredGraphics.fillRect(
                    -dropdownWidth / 2,
                    optionY,
                    dropdownWidth,
                    optionHeight
                );
                hoveredGraphics.lineStyle(2, 0x39FF14, 1); // Consistent thicker border
                hoveredGraphics.strokeRect(
                    -dropdownWidth / 2,
                    optionY,
                    dropdownWidth,
                    optionHeight
                );

                // Replace the old graphics with the new one
                const children = optionsContent.getAll();

                // Find the existing graphics object by optionIndex and remove it
                for (let i = 0; i < children.length; i++) {
                    if (children[i].optionIndex === index && children[i].type === 'Graphics') {
                        optionsContent.remove(children[i], true); // Remove and destroy
                        break;
                    }
                }

                // Add the new graphics and store the index
                hoveredGraphics.optionIndex = index;
                hoveredGraphics.setDepth(150);
                optionsContent.add(hoveredGraphics);
            });

            option.on('pointerout', () => {
                // Create a new graphics object for the normal state
                const normalGraphics = this.add.graphics();

                // Draw normal rectangle
                normalGraphics.fillStyle(0x2c2c2c, 1); // Normal option fill (darker)
                normalGraphics.fillRect(
                    -dropdownWidth / 2,
                    optionY,
                    dropdownWidth,
                    optionHeight
                );
                normalGraphics.lineStyle(2, neonGreenColor, 1); // Consistent thicker border
                normalGraphics.strokeRect(
                    -dropdownWidth / 2,
                    optionY,
                    dropdownWidth,
                    optionHeight
                );

                // Replace the old graphics with the new one
                const children = optionsContent.getAll();

                // Find the existing graphics object by optionIndex and remove it
                for (let i = 0; i < children.length; i++) {
                    if (children[i].optionIndex === index && children[i].type === 'Graphics') {
                        optionsContent.remove(children[i], true); // Remove and destroy
                        break;
                    }
                }

                // Add the new graphics and store the index
                normalGraphics.optionIndex = index;
                normalGraphics.setDepth(150);
                optionsContent.add(normalGraphics);
            });

            // Selection behavior
            option.on('pointerdown', () => {
                selectedInstrument = instrument;
                dropdownText.setText(instrument + " ▼");
                optionsContainer.setVisible(false);
                scrollbarBg.setVisible(false);
                scrollbarHandle.setVisible(false);
                // Hide all option texts when selection is made
                optionTextElements.forEach(text => {
                    text.setVisible(false);
                });
                // Store selection for game scene
                this.registry.set('selectedInstrument', instrument);
                // Play selection effect
                this.featherEmitter.explode(15, dropdown.x, dropdown.y);

                // Get the Do frequency for this instrument
                const doFrequency = this.getDoFrequencyForInstrument(instrument);

                // Play the Do note
                this.playDoNote(doFrequency);

                console.log("Selected instrument:", instrument);
            });

            // Add only the rectangle to the container, NOT the text
            optionsContent.add([option]);

            // Store reference to the text in the option for easier management
            option.optionText = optionText;
        });

        // Create a mask for the options container to clip content
        const mask = this.make.graphics();
        mask.fillStyle(0xffffff);
        mask.fillRect(
            gameWidth / 2 - dropdownWidth / 2,
            dropdownY + dropdownHeight,
            dropdownWidth,
            optionsContainerHeight
        );
        // Apply the mask only to the content container (not text)
        const geometryMask = mask.createGeometryMask();
        optionsContent.setMask(geometryMask);
        // Create scrollbar background - positioned within the optionsContainer
        const scrollbarBgWidth = 12; // Slightly wider for better visibility
        const scrollbarBg = this.add.rectangle(
            dropdownWidth / 2 - scrollbarBgWidth, // Positioned to the right edge, within optionsContainer
            0, // Align with the top of the optionsContainer for scrolling
            scrollbarBgWidth,
            optionsContainerHeight,
            0x1a1a1a // Darker, less obtrusive scrollbar background
        );
        scrollbarBg.setOrigin(0.5, 0); // Origin at top-center
        scrollbarBg.setAlpha(0.8); // Slightly more opaque
        scrollbarBg.setVisible(false);
        optionsContainer.add(scrollbarBg); // Add to optionsContainer
        // Create scrollbar handle - also positioned within optionsContainer
        const scrollbarHandleWidth = 8; // Slightly narrower handle
        const scrollbarHandleHeight = Math.max(20, (optionsContainerHeight / totalContentHeight) * optionsContainerHeight); // Min height
        const scrollbarHandle = this.add.rectangle(
            scrollbarBg.x, // Centered on the scrollbar background
            0, // Initial Y position, aligned with the top of the scrollbar track
            scrollbarHandleWidth,
            scrollbarHandleHeight,
            neonGreenColor
        );
        scrollbarHandle.setOrigin(0.5, 0); // Origin at top-center
        scrollbarHandle.setAlpha(0.9); // More opaque handle
        scrollbarHandle.setVisible(false);
        optionsContainer.add(scrollbarHandle); // Add to optionsContainer
        // Implement dragging for the scrollbar
        scrollbarHandle.setInteractive({
            useHandCursor: true,
            draggable: true
        });
        // Drag event for the scrollbar handle
        scrollbarHandle.on('drag', (pointer, dragX, dragY) => {
            if (!optionsContainer.visible || !scrollbarHandle.visible || !scrollbarHandle.input || !scrollbarHandle.input.dragStartPoint) return;
            // Calculate boundaries for the handle within the scrollbar background track
            // The scrollbar background's origin is (0.5, 0) and it's positioned at y=0 within optionsContainer.
            // So the track top is effectively 0 (or scrollbarHandle.height / 2 if origin was 0.5, 0.5 for handle)
            // Since handle origin is (0.5,0), its y is its top.
            const trackTopY = 0;
            const trackBottomY = optionsContainerHeight - scrollbarHandle.height;
            // dragY is the pointer's current y in world space.
            // optionsContainer.y is the world y of the optionsContainer's top.
            // scrollbarHandle.input.dragStartPoint.y is where the drag started on the handle *within the handle itself*.
            // scrollbarHandle.input.dragStartY is the handle's y within optionsContainer at drag start.
            let newHandleY = (pointer.y - optionsContainer.y) - scrollbarHandle.input.dragStartPoint.y + scrollbarHandle.input.dragStartY;
            newHandleY = Phaser.Math.Clamp(newHandleY, trackTopY, trackBottomY);
            scrollbarHandle.y = newHandleY;
            // Calculate new scroll position based on handle position
            // scrollProgress is 0 when handle is at trackTopY, 1 when at trackBottomY
            const scrollProgress = (trackBottomY - trackTopY === 0) ? 0 : (newHandleY - trackTopY) / (trackBottomY - trackTopY);
            scrollY = scrollProgress * maxScroll;
            // Update content position
            optionsContent.y = -scrollY;
            // Update text positions based on scroll
            optionTextElements.forEach((text, index) => {
                const optionAbsoluteY = index * optionHeight; // Y relative to optionsContent
                // Calculate visible Y relative to the main scene, considering optionsContainer's position and current scroll
                // optionsContainer.y is the absolute y of the top of the options container (where items start appearing)
                // optionsContent.y is the current scroll offset (-scrollY)
                const visibleY = optionsContainer.y + optionAbsoluteY + optionHeight / 2 + optionsContent.y;
                // Only make visible if within the visible area of the dropdown
                const isWithinVisibleArea =
                    visibleY >= optionsContainer.y &&
                    visibleY <= optionsContainer.y + optionsContainerHeight;
                text.setVisible(optionsContainer.visible && isWithinVisibleArea);
                text.setY(visibleY);
            });
        });
        // Set up scroll wheel handling with improved hit detection
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (optionsContainer.visible) {
                // Calculate pointer position relative to options container
                const optionsContainerBounds = {
                    x: gameWidth / 2 - dropdownWidth / 2,
                    y: dropdownY + dropdownHeight, // This is the absolute Y of the optionsContainer
                    width: dropdownWidth,
                    height: optionsContainerHeight
                };
                // Only scroll if pointer is over the options area
                if (pointer.x >= optionsContainerBounds.x &&
                    pointer.x <= optionsContainerBounds.x + optionsContainerBounds.width &&
                    pointer.y >= optionsContainerBounds.y &&
                    pointer.y <= optionsContainerBounds.y + optionsContainerHeight) {
                    // Update scroll position
                    scrollY += deltaY * 0.5; // Adjust scroll speed
                    scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
                    // Update content position
                    optionsContent.y = -scrollY;
                    // Update text positions based on scroll
                    optionTextElements.forEach((text, index) => {
                        const optionY = index * optionHeight;
                        const visibleY = optionsContainer.y + optionY + optionHeight / 2 - scrollY;
                        // Only make visible if within the visible area
                        const isWithinVisibleArea =
                            visibleY >= optionsContainer.y &&
                            visibleY <= optionsContainer.y + optionsContainerHeight;
                        text.setVisible(optionsContainer.visible && isWithinVisibleArea);
                        text.setY(visibleY);
                    });
                    // Update scrollbar handle position (local Y within optionsContainer) based on scrollY
                    const trackTopY = 0;
                    const trackBottomY = optionsContainerHeight - scrollbarHandle.height;
                    const scrollProgress = maxScroll === 0 ? 0 : scrollY / maxScroll;
                    scrollbarHandle.y = trackTopY + scrollProgress * (trackBottomY - trackTopY);
                }
            }
        });
        // Fix layering by correctly ordering the elements
        // First add the white border (at the bottom layer)
        const optionsBorder = this.add.rectangle(
            0,
            optionsContainerHeight / 2,
            dropdownWidth + 6,
            optionsContainerHeight + 6,
            neonGreenColor
        );
        optionsBorder.setOrigin(0.5);
        optionsBorder.setDepth(-2); // Lowest depth
        optionsContainer.add(optionsBorder);
        // Then add the green background on top of the border
        const optionsBackground = this.add.rectangle(
            0,
            optionsContainerHeight / 2,
            dropdownWidth + 4,
            optionsContainerHeight + 4,
            0x222222 // Darker background for options container
        );
        optionsBackground.setOrigin(0.5);
        optionsBackground.setDepth(-1); // Middle depth
        optionsContainer.add(optionsBackground);
        // Ensure all text elements are at a very high depth
        optionsContainer.each(child => {
            if (child.type === 'Text') {
                child.setDepth(200); // Ensure text has highest depth
                child.setVisible(true); // Make sure text is explicitly visible
            }
        });
        // Make sure the container and its children are properly interactive
        optionsContainer.setSize(dropdownWidth, instrumentOptions.length * optionHeight);

        // Toggle dropdown on click
        dropdownHitArea.on('pointerdown', () => {
            const newVisibility = !optionsContainer.visible;
            optionsContainer.setVisible(newVisibility);
            scrollbarBg.setVisible(newVisibility);
            scrollbarHandle.setVisible(newVisibility);
            this.featherEmitter.explode(10, dropdown.x, dropdown.y);

            // Update visibility and position of all option texts
            optionTextElements.forEach((text, index) => {
                const optionY = index * optionHeight;
                // Calculate the visible position accounting for scroll
                const visibleY = dropdownY + dropdownHeight + optionY + optionHeight / 2 - scrollY;

                // Only make visible if within the visible area of the dropdown
                const isWithinVisibleArea =
                    visibleY >= dropdownY + dropdownHeight &&
                    visibleY <= dropdownY + dropdownHeight + optionsContainerHeight;

                text.setVisible(newVisibility && isWithinVisibleArea);
                text.setY(visibleY);
            });

            // Position container properly
            optionsContainer.setPosition(gameWidth / 2, dropdownY + dropdownHeight);
            // Reset scroll position when opening dropdown
            scrollY = 0;
            optionsContent.y = 0;
            // Reset handle to top of its track (relative to scrollbarBg)
            // scrollbarBg is centered in optionsContainer. Handle origin is 0.5, 0.
            // So, top of track is at scrollbarBg.y - scrollbarBg.height/2 + scrollbarHandle.height/2
            // Since scrollbarBg.y is 0 and handle origin is (0.5,0), its top is at y=0.
            scrollbarHandle.y = 0; // Align handle to the top of its track
            // Make sure options container is on top of everything else
            optionsContainer.setDepth(100);

            // Refresh each option's visibility and z-order
            optionsContent.each(child => {
                child.setVisible(true);
                if (child.type === 'Text') {
                    child.setDepth(200); // Much higher depth for text
                } else if (child.type === 'Rectangle') {
                    // Make sure option backgrounds are visible but below text
                    child.setDepth(150);
                    child.setVisible(true); // Explicitly make visible
                    // Ensure rectangle has proper fill color
                    if (child !== optionsBorder && child !== optionsBackground) {
                        child.setFillStyle(0x444444);
                        child.setAlpha(0.95); // Ensure proper transparency
                    }
                }
            });

            // Debug helper
            console.log("Dropdown clicked - options visible:", optionsContainer.visible);
        });

        // Close dropdown when clicking elsewhere
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

            // Check if click is outside both the dropdown button and the options list
            const clickedOptions = pointer.x >= optionsRect.x &&
                pointer.x <= optionsRect.x + optionsRect.width &&
                pointer.y >= optionsRect.y &&
                pointer.y <= optionsRect.y + optionsRect.height;

            const clickedDropdown = pointer.x >= dropdownRect.x &&
                pointer.x <= dropdownRect.x + dropdownRect.width &&
                pointer.y >= dropdownRect.y &&
                pointer.y <= dropdownRect.y + dropdownRect.height;

            if (optionsContainer.visible && !clickedOptions && !clickedDropdown) {
                optionsContainer.setVisible(false);
                scrollbarBg.setVisible(false);
                scrollbarHandle.setVisible(false);
                // Hide all option texts when dropdown is closed
                optionTextElements.forEach(text => {
                    text.setVisible(false);
                });

                console.log("Clicked outside - hiding options");
            }
        });
        // Create a professional looking button with gradient and rounded corners
        const buttonWidth = 220;
        const buttonHeight = 80;

        // Button graphics with gradient fill and rounded corners
        const buttonGraphics = this.add.graphics();

        // Create a professional gradient button
        const createButton = (isHover = false) => {
            buttonGraphics.clear();
            // Button shadow 
            buttonGraphics.fillStyle(0x000000, 0.5); // Darker shadow for 8-bit
            buttonGraphics.fillRect( // Sharp corners for shadow
                gameWidth / 2 - buttonWidth / 2 + 4, // Adjusted shadow offset
                gameHeight / 2 + 100 - buttonHeight / 2 + 4, // Adjusted shadow offset
                buttonWidth,
                buttonHeight
            );
            // Main button body - solid retro colors
            if (isHover) {
                buttonGraphics.fillStyle(0x444444, 1); // Lighter dark gray for hover
            } else {
                buttonGraphics.fillStyle(0x222222, 1); // Darker solid fill for normal button
            }
            // Fill the main button with sharp corners
            buttonGraphics.fillRect(
                gameWidth / 2 - buttonWidth / 2,
                gameHeight / 2 + 100 - buttonHeight / 2,
                buttonWidth,
                buttonHeight
            );
            // Button border - solid white for 8-bit
            buttonGraphics.lineStyle(3, neonGreenColor, 1); // Thicker border for button
            buttonGraphics.strokeRect(
                gameWidth / 2 - buttonWidth / 2,
                gameHeight / 2 + 100 - buttonHeight / 2,
                buttonWidth,
                buttonHeight
            );
        };

        // Create initial button
        createButton();

        // Create hit area for the button
        const button = this.add.rectangle(
            gameWidth / 2,
            gameHeight / 2 + 100,
            buttonWidth,
            buttonHeight
        );
        button.setOrigin(0.5);
        button.setInteractive({
            useHandCursor: true
        });
        button.setAlpha(0.001); // Invisible hit area

        // Add "Let's Fly!" text inside the button
        const text = this.add.text(gameWidth / 2, gameHeight / 2 + 100, "Let's Fly!", {
            fontSize: '28px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
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

        // Create particle system for button hover effect
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
            tint: 0xFFFF00, // Brighter yellow color
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: 2000,
            quantity: 20,
            on: false // Start disabled
        });
        // Button events with improved visual feedback
        button.on('pointerover', () => {
            // Create feather confetti effect
            this.featherEmitter.explode(30, button.x, button.y);

            // Update button appearance
            createButton(true);
            // Enhanced text appearance on hover
            text.setColor('#FFFFFF');
            text.setShadow(2, 2, '#5CFF5C', 3, true, true);
            // Create a more subtle and professional pulsing effect
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
            // Restore normal button appearance
            createButton(false);
            // Restore normal text appearance
            text.setColor('#FFFFFF');
            text.setShadow(2, 2, '#39FF14', 3, true, true);
            // Stop the pulsing animation
            if (this.buttonPulseTween) {
                this.buttonPulseTween.stop();
                text.setScale(1);
            }
        });
        button.on('pointerdown', () => {
            // Click effect - briefly "press" the button
            this.tweens.add({
                targets: [buttonGraphics, text],
                y: '+= 4',
                duration: 50,
                ease: 'Power1',
                yoyo: true,
                onComplete: () => {
                    // Start the game scene with the selected instrument
                    const instrument = this.registry.get('selectedInstrument') || 'Soprano';
                    this.scene.start('GameScene', {
                        instrument: instrument
                    });
                }
            });

            // Additional click feedback with emitter
            this.featherEmitter.explode(50, button.x, button.y);
        });
    }

    // Method to get the 'Do' (lowest note) frequency for the selected instrument
    getDoFrequencyForInstrument(instrument) {
        // Get the appropriate frequency array for the instrument
        let freqArray;

        switch (instrument) {
            case 'Soprano':
                freqArray = [523.25, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63];
                break;
            case 'Alto':
                freqArray = [440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 233.08, 220.00];
                break;
            case 'Tenor':
                freqArray = [349.23, 329.63, 293.66, 261.63, 233.08, 220.00, 196.00, 174.61];
                break;
            case 'Baritone':
                freqArray = [293.66, 261.63, 233.08, 220.00, 196.00, 174.61, 164.81, 146.83];
                break;
            case 'Bass':
                freqArray = [220.00, 196.00, 174.61, 164.81, 146.83, 130.81, 116.54, 110.00];
                break;
            case 'Violin':
                freqArray = [1174.66, 987.77, 880.00, 783.99, 698.46, 659.26, 587.33, 523.25];
                break;
            case 'Viola':
                freqArray = [659.26, 587.33, 523.25, 440.00, 392.00, 349.23, 329.63, 293.66];
                break;
            case 'Cello':
                freqArray = [293.66, 261.63, 233.08, 220.00, 196.00, 174.61, 164.81, 146.83];
                break;
            case 'Double Bass':
                freqArray = [233.08, 196.00, 174.61, 146.83, 130.81, 110.00, 98.00, 82.41];
                break;
            case 'Flute':
                freqArray = [1396.91, 1174.66, 987.77, 880.00, 783.99, 698.46, 659.26, 587.33];
                break;
            case 'Clarinet':
                freqArray = [698.46, 622.25, 523.25, 466.16, 415.30, 349.23, 311.13, 261.63];
                break;
            case 'Oboe':
                freqArray = [880.00, 783.99, 698.46, 659.26, 587.33, 523.25, 466.16, 440.00];
                break;
            case 'Bassoon':
                freqArray = [293.66, 261.63, 233.08, 196.00, 174.61, 146.83, 130.81, 116.54];
                break;
            case 'Trumpet':
                freqArray = [659.26, 587.33, 523.25, 466.16, 415.30, 369.99, 329.63, 293.66];
                break;
            case 'French Horn':
                freqArray = [587.33, 523.25, 466.16, 415.30, 369.99, 329.63, 293.66, 261.63];
                break;
            case 'Trombone':
                freqArray = [329.63, 293.66, 261.63, 233.08, 196.00, 174.61, 146.83, 130.81];
                break;
            case 'Baritone Horn':
                freqArray = [293.66, 261.63, 233.08, 220.00, 196.00, 174.61, 155.56, 146.83];
                break;
            case 'Tuba':
                freqArray = [196.00, 174.61, 164.81, 146.83, 130.81, 116.54, 98.00, 87.31];
                break;
            case 'Soprano Saxophone':
                freqArray = [880.00, 783.99, 698.46, 659.26, 587.33, 523.25, 466.16, 415.30];
                break;
            case 'Alto Saxophone':
                freqArray = [587.33, 523.25, 466.16, 415.30, 369.99, 329.63, 293.66, 261.63];
                break;
            case 'Tenor Saxophone':
                freqArray = [392.00, 349.23, 329.63, 293.66, 261.63, 233.08, 207.65, 196.00];
                break;
            case 'Baritone Saxophone':
                freqArray = [261.63, 233.08, 220.00, 196.00, 174.61, 164.81, 146.83, 130.81];
                break;
            case 'Guitar':
                freqArray = [392.00, 349.23, 329.63, 293.66, 261.63, 246.94, 220.00, 196.00];
                break;
            case 'Ukulele':
                freqArray = [392.00, 349.23, 329.63, 293.66, 261.63, 246.94, 220.00, 196.00];
                break;
            case 'Piano':
                freqArray = [523.25, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 220.00];
                break;
            default:
                // Default to soprano range
                freqArray = [523.25, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63];
        }

        // Return the lowest Do frequency (index 7)
        return freqArray[7];
    }

    // Method to play the Do note
    playDoNote(frequency) {
        if (!this.audioContext) {
            this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
        }

        // Create an oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Set the type and frequency
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Create fade in/out to avoid clicks
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.0);

        // Connect and start
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Create a visual indicator that the note is playing
        const noteIndicator = this.add.circle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height * 0.25 + 80, // Positioned below the title
            30,
            0x555555 // Darker gray for contrast with cyan text
        );
        noteIndicator.setAlpha(0.8);
        // Add text to the indicator
        const noteText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height * 0.25 + 80, // Positioned below the title
            "Do", {
                fontSize: '20px',
                fontFamily: '"VT323", monospace',
                fontStyle: 'normal',
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
            }
        );
        noteText.setOrigin(0.5);

        // Create a pulsing effect
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

        // Start and stop the oscillator
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.0);
    }
}
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.instrument = 'Soprano'; // Default instrument
        this.audioContext = null;
        this.analyserNode = null;
        this.dataArray = null;
        this.currentY = 0; // Smoothed Y position
        this.targetY = 0; // Target Y based on pitch
        this.lowDoLogFreq = 0;
        this.highDoLogFreq = 0;
        this.keySignatureDropdown = null; // Property to hold the dropdown
        this.selectedKeySignature = 'C Major'; // Default key signature
        // Default: Soprano C4 (261.63Hz) to C5 (523.25Hz)
        // Frequencies for Do, Re, Mi, Fa, Sol, La, Ti, High Do (C4 to C5)
        // Note: Order is High Do -> Low Do for mapping (index 0 = high)
        this.vocalRangeFrequencies = [
            523.25, // C5 (High Do)
            466.16, // A#4/Bb4 (Ti - approx) - Using A# for simplicity, true B4 is 493.88
            440.00, // A4 (La)
            392.00, // G4 (Sol)
            349.23, // F4 (Fa)
            329.63, // E4 (Mi)
            293.66, // D4 (Re)
            261.63 // C4 (Low Do)
        ];
    }
    preload() {
        this.load.image('background', 'https://play.rosebud.ai/assets/Background.png?Mzty');
        this.load.image('bird1', 'https://play.rosebud.ai/assets/Bird_01.png?5daF'); // Updated to new Bird_01 asset
        this.load.image('bird2', 'https://play.rosebud.ai/assets/Bird_02.png?Z0Lm'); // Updated to new Bird_02 asset
        this.load.image('bird3', 'https://play.rosebud.ai/assets/Bird_03.png?xLfa'); // Updated to new Bird_03 asset

        // Set up variables for obstacle management
        this.obstacles = [];
        this.obstacleTimer = null;
        this.lastObstacleTime = 0;
        this.obstacleSpeed = 3;
        this.obstacleWidth = 60;

        // Game difficulty progression parameters
        this.gameStartTime = 0;
        this.difficultyIncreaseTime = 20000; // 20 seconds before difficulty increase starts
        this.initialObstacleSpacing = 800; // Initial wide spacing between obstacles
        this.minObstacleSpacing = 300; // Minimum spacing after difficulty increase
        this.currentObstacleSpacing = this.initialObstacleSpacing;

        // Initial gaps for the obstacles (start with larger gaps)
        this.initialMinHeight = 0.1; // 10% of screen height for initial bar height (smaller bars)
        this.initialMaxHeight = 0.5; // 50% of screen height for initial bar height
        this.finalMinHeight = 0.2; // 20% of screen height after difficulty increase
        this.finalMaxHeight = 0.7; // 70% of screen height after difficulty increase
        this.currentMinHeight = this.initialMinHeight;
        this.currentMaxHeight = this.initialMaxHeight;
        // Track last created obstacle type for alternating pattern
        this.lastObstacleFromTop = null;
        // Game state tracking
        this.isGameOver = false;
        this.score = 0;
        this.scoreText = null;

        // Load pipe asset for obstacles
        this.load.image('pipe', 'https://play.rosebud.ai/assets/Pipe.png?2SXh'); // Latest Pipe URL
        // Load GameOver asset
        this.load.image('gameOver', 'https://play.rosebud.ai/assets/GameOver.png?wADk');
        this.load.image('musicNotes', 'https://play.rosebud.ai/assets/Music Notes.png?QW4u'); // Load music note asset
        this.load.image('cloud', 'https://play.rosebud.ai/assets/Cloud.png?oeuQ'); // Load cloud asset
    }
    create(data) {
        // Get the selected instrument if passed
        if (data && data.instrument) {
            this.instrument = data.instrument;
            console.log(`Selected instrument: ${this.instrument}`);
            // Adjust vocal range based on selected instrument
            this.adjustVocalRange(this.instrument);
        }
        if (data && data.selectedKeySignature) {
            this.selectedKeySignature = data.selectedKeySignature;
            this.registry.set('selectedKeySignature', this.selectedKeySignature); // Ensure registry is also updated
            console.log(`Game started/restarted with key signature: ${this.selectedKeySignature}`);
            // Potentially adjust music logic based on key signature here if needed on create
        } else {
            // If no key signature is passed (e.g., first game start), use default or from registry
            this.selectedKeySignature = this.registry.get('selectedKeySignature') || 'C Major';
        }
        // Start tracking game time for difficulty progression
        this.gameStartTime = this.time.now;
        // Create the background
        this.background = new Background(this);
        // Create the bird
        this.bird = new Bird(this, 400, 300);
        // Initialize bird's Y position tracking
        this.currentY = this.bird.y;
        this.targetY = this.bird.y;
        // Calculate log frequencies for mapping pitch to height
        const solfegeLogFrequencies = this.vocalRangeFrequencies.map(freq => Math.log2(freq));
        this.lowDoLogFreq = solfegeLogFrequencies[solfegeLogFrequencies.length - 1]; // Low Do
        this.highDoLogFreq = solfegeLogFrequencies[0]; // High Do
        // Calculate bar height for snapping obstacles
        this.barHeight = this.sys.game.config.height / 8;
        // Create obstacles system
        this.createObstacles();
        // Create bird feather particles for collision effects
        this.createBirdParticles();
        this.createMusicNoteParticles(); // Create the music note emitter
        // Initialize audio input
        this.initAudio();
        // Set up collision detection
        this.setupCollisions();
        // Create score text display
        this.createScoreText();
        // Start the score timer
        this.scoreTimer = this.time.addEvent({
            delay: 1000,
            callback: this.incrementScore,
            callbackScope: this,
            loop: true
        });
        // Create key signature dropdown
        const keySignatures = ['C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F Major'];
        this.keySignatureDropdown = new KeySignatureDropdown(
            this,
            this.sys.game.config.width - 100, // Position top-right
            30, // Y position
            180, // Width
            36, // Height (slightly smaller for pixel aesthetic)
            keySignatures,
            this.selectedKeySignature, // Use current/default key signature for dropdown
            (selectedKey) => {
                this.handleKeySignatureChange(selectedKey);
            }
        );
        this.keySignatureDropdown.dropdownButton.setDepth(250); // Ensure dropdown is above score but below game over
        this.keySignatureDropdown.dropdownText.setDepth(251);
        this.keySignatureDropdown.optionsContainer.setDepth(250);
    }
    createObstacles() {
        // Create initial obstacles
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Flag to track when we need to create a paired obstacle
        this.pairRequired = false;

        // Create obstacles with initial wide spacing
        const initialObstacles = 4;

        for (let i = 0; i < initialObstacles; i++) {
            // Determine position based on spacing
            const x = gameWidth + (i * this.initialObstacleSpacing);

            // Apply the same gap logic as in reset() for initial obstacles
            const minGap = 150; // Same minimum gap
            const availableHeightForObstacle = gameHeight - minGap;
            // Use initial height ranges, but clamp based on minGap
            const minObstacleHeight = gameHeight * this.initialMinHeight;
            const maxObstacleHeightAllowed = Math.min(gameHeight * this.initialMaxHeight, availableHeightForObstacle);
            // Ensure min height doesn't exceed max allowed height
            const clampedMinHeight = Math.min(minObstacleHeight, maxObstacleHeightAllowed);
            // Calculate initial raw height, respecting the minGap constraint
            const rawHeight = Phaser.Math.Between(clampedMinHeight, maxObstacleHeightAllowed);
            // Snap the initial height to the nearest multiple of barHeight
            const snappedHeight = Math.round(rawHeight / this.barHeight) * this.barHeight;
            // Ensure the snapped height doesn't go below the minimum or above the maximum allowed
            const obstacleHeight = Phaser.Math.Clamp(snappedHeight, clampedMinHeight, maxObstacleHeightAllowed);
            // For initial obstacles, explicitly alternate top and bottom
            const fromTop = i % 2 === 0;

            const obstacle = new Obstacle(
                this,
                x,
                0, // Y is set in configurePipe
                this.obstacleWidth,
                obstacleHeight, // Use the snapped height
                this.obstacleSpeed,
                this, // Pass the GameScene instance correctly
                fromTop // Explicitly specify top/bottom alternating pattern
            );

            this.obstacles.push(obstacle);
        }
    }

    createScoreText() {
        // Score text style
        const scoreStyle = {
            fontSize: '24px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
            fill: '#FFFFFF',
            align: 'right',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        };

        // Add score text to top-right corner
        this.scoreText = this.add.text(
            this.sys.game.config.width - 20,
            20,
            'Time: 0',
            scoreStyle
        );
        this.scoreText.setOrigin(1, 0); // Align to top-right
        this.scoreText.setDepth(100); // Ensure score is above other elements
    }

    incrementScore() {
        if (this.isGameOver) return;
        this.score++;
        this.scoreText.setText('Time: ' + this.score);
    }

    createBirdParticles() {
        // Create feather particle emitter for collisions
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
            tint: 0xFFFF00, // Yellow feathers
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: 1000,
            quantity: 30,
            on: false // Start disabled
        });

        // Create confetti emitter for game over
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
            tint: 0xFFFF00, // Match bird feather color (yellow)
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: 3000,
            quantity: 100,
            frequency: -1, // Fire only on demand
            blendMode: 'ADD'
        });
    }
    createMusicNoteParticles() {
        // Create music note particle emitter for pitch detection feedback
        this.musicNoteParticles = this.add.particles('musicNotes');
        this.musicNoteEmitter = this.musicNoteParticles.createEmitter({
            // Emit from behind the bird (adjust offset as needed)
            follow: this.bird,
            followOffset: {
                x: -30,
                y: 0
            }, // Position behind the bird
            speed: {
                min: 50,
                max: 150
            }, // Notes fly backwards
            angle: {
                min: 160,
                max: 200
            }, // Angle pointing backwards
            scale: {
                start: 0.08,
                end: 0.01
            }, // Start small, fade out
            rotate: {
                min: -180,
                max: 180
            }, // Random rotation
            alpha: {
                start: 0.9,
                end: 0
            }, // Fade out
            lifespan: {
                min: 1000, // Increased min lifespan
                max: 2000 // Increased max lifespan
            }, // How long notes live
            quantity: 1, // Emit one note at a time
            frequency: 50, // Decreased frequency (more notes per second)
            on: false, // Start disabled
            blendMode: 'ADD' // Optional: 'ADD' blend mode for brighter notes
        });
        this.musicNoteParticles.setDepth(5); // Set depth on the particle manager, not the emitter
    }
    setupCollisions() {
        // Set up collision handling between bird and obstacles
        this.obstacles.forEach(obstacle => {
            // Collider now targets the Obstacle instance directly
            this.physics.add.collider(this.bird, obstacle, this.handleCollision, null, this);
        });
    }

    handleCollision(bird, obstacle) {
        // Only trigger game over once
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Stop timer
        this.scoreTimer.remove();

        // Create confetti explosion
        this.confettiEmitter.explode(100, bird.x, bird.y);
        // Stop bird movement and gravity
        bird.body.setAllowGravity(false);
        bird.setVelocity(0);
        bird.anims.stop();
        // Stop obstacles
        this.obstacles.forEach(obs => {
            obs.speed = 0;
        });
        // Add screen shake effect
        this.cameras.main.shake(300, 0.02);

        // Hide bird
        bird.setVisible(false);

        // Display Game Over screen and final score
        // Wait 1 second before showing Game Over screen
        this.time.delayedCall(1000, this.displayGameOver, [], this);
    }

    displayGameOver() {
        // Create a semi-transparent overlay
        const overlay = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x000000
        );
        overlay.setAlpha(0.7);
        overlay.setDepth(200);

        // Display Game Over image - REMOVED
        // Display Final Score
        const finalScoreStyle = {
            fontSize: '36px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
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
        };
        const finalScoreText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 90, // Further Adjusted Y position
            'Final Time: ' + this.score + 's',
            finalScoreStyle
        );
        finalScoreText.setOrigin(0.5);
        finalScoreText.setDepth(201);
        // --- Modern "Try Again" Button ---
        const retryButtonWidth = 180;
        const retryButtonHeight = 60;
        const retryButtonX = this.sys.game.config.width / 2;
        const retryButtonY = this.sys.game.config.height / 2 + 0; // Further Adjusted Y position
        // const retryCornerRadius = 15; // No rounded corners
        const retryNormalColor = 0x333333;
        const retryHoverColor = 0x444444;
        const retryPressedColor = 0x222222;
        const retryGraphics = this.add.graphics();
        retryGraphics.setDepth(201);
        const drawRetryButton = (color, shadowOffsetY = 3) => { // Reduced shadow offset
            retryGraphics.clear();
            // Shadow - sharp rectangle
            retryGraphics.fillStyle(0x000000, 0.4);
            retryGraphics.fillRect(
                retryButtonX - retryButtonWidth / 2 + shadowOffsetY,
                retryButtonY - retryButtonHeight / 2 + shadowOffsetY,
                retryButtonWidth, retryButtonHeight
            );
            // Main button - solid color
            retryGraphics.fillStyle(color, 1);
            retryGraphics.fillRect(
                retryButtonX - retryButtonWidth / 2,
                retryButtonY - retryButtonHeight / 2,
                retryButtonWidth, retryButtonHeight
            );
            // Brighter, thicker border
            retryGraphics.lineStyle(3, 0x00FF00, 1); // Thicker, brighter green border
            retryGraphics.strokeRect(retryButtonX - retryButtonWidth / 2, retryButtonY - retryButtonHeight / 2, retryButtonWidth, retryButtonHeight);
        };
        drawRetryButton(retryNormalColor); // Initial draw
        const retryText = this.add.text(retryButtonX, retryButtonY, 'Try Again', {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
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
            drawRetryButton(retryPressedColor, 2); // Pressed state
            this.tweens.add({
                targets: [retryGraphics, retryText],
                y: '+=2',
                duration: 50,
                ease: 'Power1',
                yoyo: true
            });
        });
        retryHitArea.on('pointerup', () => {
            drawRetryButton(retryHoverColor); // Back to hover state if still over
            this.scene.restart({
                instrument: this.instrument,
                selectedKeySignature: this.selectedKeySignature
            }); // Restart scene
        });
        // --- Modern "Change Instrument" Button ---
        const changeButtonWidth = 250;
        const changeButtonHeight = 60;
        const changeButtonX = this.sys.game.config.width / 2;
        const changeButtonY = this.sys.game.config.height / 2 + 70; // Further Adjusted Y position
        // const changeCornerRadius = 15; // No rounded corners
        const changeNormalColor = 0x333333;
        const changeHoverColor = 0x444444;
        const changePressedColor = 0x222222;
        const changeGraphics = this.add.graphics();
        changeGraphics.setDepth(201);
        const drawChangeButton = (color, shadowOffsetY = 3) => { // Reduced shadow offset
            changeGraphics.clear();
            // Shadow - sharp rectangle
            changeGraphics.fillStyle(0x000000, 0.4);
            changeGraphics.fillRect(
                changeButtonX - changeButtonWidth / 2 + shadowOffsetY,
                changeButtonY - changeButtonHeight / 2 + shadowOffsetY,
                changeButtonWidth, changeButtonHeight
            );
            // Main button - solid color
            changeGraphics.fillStyle(color, 1);
            changeGraphics.fillRect(
                changeButtonX - changeButtonWidth / 2,
                changeButtonY - changeButtonHeight / 2,
                changeButtonWidth, changeButtonHeight
            );
            // Brighter, thicker border
            changeGraphics.lineStyle(3, 0x00FF00, 1); // Thicker, brighter green border
            changeGraphics.strokeRect(changeButtonX - changeButtonWidth / 2, changeButtonY - changeButtonHeight / 2, changeButtonWidth, changeButtonHeight);
        };
        drawChangeButton(changeNormalColor); // Initial draw
        const changeText = this.add.text(changeButtonX, changeButtonY, 'Change Instrument', {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
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
            drawChangeButton(changePressedColor, 2); // Pressed state
            this.tweens.add({
                targets: [changeGraphics, changeText],
                y: '+=2',
                duration: 50,
                ease: 'Power1',
                yoyo: true
            });
        });
        changeHitArea.on('pointerup', () => {
            drawChangeButton(changeHoverColor); // Back to hover state if still over
            this.scene.start('StartScreen'); // Go back to start screen
        });
    }
    adjustVocalRange(instrument) {
        // Adjust frequency ranges based on selected instrument
        switch (instrument) {
            case 'Soprano':
                this.vocalRangeFrequencies = [
                    523.25, // C5 (High Do)
                    466.16, // A#4/Bb4 (Ti)
                    440.00, // A4 (La)
                    392.00, // G4 (Sol)
                    349.23, // F4 (Fa)
                    329.63, // E4 (Mi)
                    293.66, // D4 (Re)
                    261.63 // C4 (Low Do)
                ];
                break;
            case 'Alto':
                this.vocalRangeFrequencies = [
                    440.00, // A4 (High Do - approx)
                    392.00, // G4 (Ti - approx)
                    349.23, // F4 (La)
                    329.63, // E4 (Sol)
                    293.66, // D4 (Fa)
                    261.63, // C4 (Mi)
                    233.08, // Bb3 (Re)
                    220.00 // A3 (Low Do - approx)
                ];
                break;
            case 'Tenor':
                this.vocalRangeFrequencies = [
                    349.23, // F4 (High Do - approx)
                    329.63, // E4 (Ti)
                    293.66, // D4 (La)
                    261.63, // C4 (Sol)
                    233.08, // Bb3 (Fa)
                    220.00, // A3 (Mi)
                    196.00, // G3 (Re)
                    174.61 // F3 (Low Do - approx)
                ];
                break;
            case 'Baritone':
                this.vocalRangeFrequencies = [
                    293.66, // D4 (High Do - approx)
                    261.63, // C4 (Ti)
                    233.08, // Bb3 (La)
                    220.00, // A3 (Sol)
                    196.00, // G3 (Fa)
                    174.61, // F3 (Mi)
                    164.81, // E3 (Re)
                    146.83 // D3 (Low Do - approx)
                ];
                break;
            case 'Bass':
                this.vocalRangeFrequencies = [
                    220.00, // A3 (High Do - approx)
                    196.00, // G3 (Ti)
                    174.61, // F3 (La)
                    164.81, // E3 (Sol)
                    146.83, // D3 (Fa)
                    130.81, // C3 (Mi)
                    116.54, // Bb2 (Re)
                    110.00 // A2 (Low Do - approx)
                ];
                break;
            case 'Violin':
                this.vocalRangeFrequencies = [
                    1174.66, // D6 (High)
                    987.77, // B5
                    880.00, // A5
                    783.99, // G5
                    698.46, // F5
                    659.26, // E5
                    587.33, // D5
                    523.25 // C5 (Low)
                ];
                break;
            case 'Cello':
                this.vocalRangeFrequencies = [
                    293.66, // D4 (High)
                    261.63, // C4
                    233.08, // Bb3
                    220.00, // A3
                    196.00, // G3
                    174.61, // F3
                    164.81, // E3
                    146.83 // D3 (Low)
                ];
                break;
            case 'Flute':
                this.vocalRangeFrequencies = [
                    1396.91, // F6 (High)
                    1174.66, // D6
                    987.77, // B5
                    880.00, // A5
                    783.99, // G5
                    698.46, // F5
                    659.26, // E5
                    587.33 // D5 (Low)
                ];
                break;
            case 'Clarinet':
                this.vocalRangeFrequencies = [
                    698.46, // F5 (High)
                    622.25, // Eb5
                    523.25, // C5
                    466.16, // Bb4
                    415.30, // Ab4
                    349.23, // F4
                    311.13, // Eb4
                    261.63 // C4 (Low)
                ];
                break;
            case 'Trumpet':
                this.vocalRangeFrequencies = [
                    659.26, // E5 (High)
                    587.33, // D5
                    523.25, // C5
                    466.16, // Bb4
                    415.30, // Ab4
                    369.99, // F#4
                    329.63, // E4
                    293.66 // D4 (Low)
                ];
                break;
            case 'Guitar':
                this.vocalRangeFrequencies = [
                    392.00, // G4 (High)
                    349.23, // F4
                    329.63, // E4
                    293.66, // D4
                    261.63, // C4
                    246.94, // B3
                    220.00, // A3
                    196.00 // G3 (Low)
                ];
                break;
            case 'Ukulele':
                this.vocalRangeFrequencies = [
                    392.00, // G4 (High)
                    349.23, // F4
                    329.63, // E4
                    293.66, // D4
                    261.63, // C4
                    246.94, // B3
                    220.00, // A3
                    196.00 // G3 (Low)
                ];
                break;
            case 'Trombone':
                this.vocalRangeFrequencies = [
                    329.63, // E4 (High)
                    293.66, // D4
                    261.63, // C4
                    233.08, // Bb3
                    196.00, // G3
                    174.61, // F3
                    146.83, // D3
                    130.81 // C3 (Low)
                ];
                break;
            case 'Baritone Horn':
                this.vocalRangeFrequencies = [
                    293.66, // D4 (High)
                    261.63, // C4
                    233.08, // Bb3
                    220.00, // A3
                    196.00, // G3
                    174.61, // F3
                    155.56, // Eb3
                    146.83 // D3 (Low)
                ];
                break;
            case 'Tuba':
                this.vocalRangeFrequencies = [
                    196.00, // G3 (High)
                    174.61, // F3
                    164.81, // E3
                    146.83, // D3
                    130.81, // C3
                    116.54, // Bb2
                    98.00, // G2
                    87.31 // F2 (Low)
                ];
                break;
            case 'Soprano Saxophone':
                this.vocalRangeFrequencies = [
                    880.00, // A5 (High)
                    783.99, // G5
                    698.46, // F5
                    659.26, // E5
                    587.33, // D5
                    523.25, // C5
                    466.16, // Bb4
                    415.30 // Ab4 (Low)
                ];
                break;
            case 'Alto Saxophone':
                this.vocalRangeFrequencies = [
                    587.33, // D5 (High)
                    523.25, // C5
                    466.16, // Bb4
                    415.30, // Ab4
                    369.99, // F#4
                    329.63, // E4
                    293.66, // D4
                    261.63 // C4 (Low)
                ];
                break;
            case 'Tenor Saxophone':
                this.vocalRangeFrequencies = [
                    392.00, // G4 (High)
                    349.23, // F4
                    329.63, // E4
                    293.66, // D4
                    261.63, // C4
                    233.08, // Bb3
                    207.65, // Ab3
                    196.00 // G3 (Low)
                ];
                break;
            case 'Baritone Saxophone':
                this.vocalRangeFrequencies = [
                    261.63, // C4 (High)
                    233.08, // Bb3
                    220.00, // A3
                    196.00, // G3
                    174.61, // F3
                    164.81, // E3
                    146.83, // D3
                    130.81 // C3 (Low)
                ];
                break;
            case 'Oboe':
                this.vocalRangeFrequencies = [
                    880.00, // A5 (High)
                    783.99, // G5
                    698.46, // F5
                    659.26, // E5
                    587.33, // D5
                    523.25, // C5
                    466.16, // Bb4
                    440.00 // A4 (Low)
                ];
                break;
            case 'French Horn':
                this.vocalRangeFrequencies = [
                    587.33, // D5 (High)
                    523.25, // C5
                    466.16, // Bb4
                    415.30, // Ab4
                    369.99, // F#4
                    329.63, // E4
                    293.66, // D4
                    261.63 // C4 (Low)
                ];
                break;
            case 'Bassoon':
                this.vocalRangeFrequencies = [
                    293.66, // D4 (High)
                    261.63, // C4
                    233.08, // Bb3
                    196.00, // G3
                    174.61, // F3
                    146.83, // D3
                    130.81, // C3
                    116.54 // Bb2 (Low)
                ];
                break;
            case 'Viola':
                this.vocalRangeFrequencies = [
                    659.26, // E5 (High)
                    587.33, // D5
                    523.25, // C5
                    440.00, // A4
                    392.00, // G4
                    349.23, // F4
                    329.63, // E4
                    293.66 // D4 (Low)
                ];
                break;
            case 'Double Bass':
                this.vocalRangeFrequencies = [
                    233.08, // Bb3 (High)
                    196.00, // G3
                    174.61, // F3
                    146.83, // D3
                    130.81, // C3
                    110.00, // A2
                    98.00, // G2
                    82.41 // E2 (Low)
                ];
                break;
            case 'Piano':
                this.vocalRangeFrequencies = [
                    523.25, // C5 (High)
                    440.00, // A4
                    392.00, // G4
                    349.23, // F4
                    329.63, // E4
                    293.66, // D4
                    261.63, // C4
                    220.00 // A3 (Low)
                ];
                break;
            default:
                // Use soprano range as default
                break;
        }
    }
    initAudio() {
        navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            })
            .then(stream => {
                this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
                this.analyserNode = this.audioContext.createAnalyser();
                const source = this.audioContext.createMediaStreamSource(stream);
                source.connect(this.analyserNode);
                this.analyserNode.fftSize = 2048; // Standard FFT size for pitch detection
                this.dataArray = new Uint8Array(this.analyserNode.fftSize);
                console.log("Microphone access granted.");
            })
            .catch(err => {
                console.error('ERROR accessing microphone:', err);
                alert('Microphone access denied. Please allow microphone access to play.');
            });
    }
    update() {
        // If game is over, do nothing in update loop
        if (this.isGameOver) {
            if (this.musicNoteEmitter && this.musicNoteEmitter.on) {
                this.musicNoteEmitter.stop(); // Ensure emitter is off on game over
            }
            return;
        }
        // Only process audio if initialized and game is running
        if (this.audioContext && this.analyserNode && this.dataArray) {
            this.analyserNode.getByteTimeDomainData(this.dataArray);
            // Calculate RMS for volume
            let sumOfSquares = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                let val = (this.dataArray[i] - 128) / 128; // Normalize buffer values to -1 to 1
                sumOfSquares += val * val;
            }
            let rms = Math.sqrt(sumOfSquares / this.dataArray.length);
            let pitch = this.autoCorrelate(this.dataArray, this.audioContext.sampleRate);
            if (pitch > 0) { // Pitch detected
                this.bird.body.setAllowGravity(false); // Disable gravity while singing
                // Adjust music note emitter based on volume (RMS)
                if (this.musicNoteEmitter) {
                    if (!this.musicNoteEmitter.on) {
                        this.musicNoteEmitter.start();
                    }
                    // Map RMS (0 to ~0.5 typically) to frequency (e.g., 80ms down to 20ms)
                    // Clamp RMS to a reasonable range (e.g., 0.02 to 0.3) to avoid extreme values
                    const clampedRms = Phaser.Math.Clamp(rms, 0.02, 0.3);
                    const minFreq = 20; // Fastest emission frequency
                    const maxFreq = 100; // Slowest emission frequency
                    const freqRange = maxFreq - minFreq;
                    // Higher RMS means lower frequency (faster emission)
                    const targetFreq = maxFreq - ((clampedRms - 0.02) / (0.3 - 0.02)) * freqRange;
                    this.musicNoteEmitter.frequency = targetFreq; // Set frequency directly
                    // Optional: Map RMS to quantity (e.g., 1 to 3)
                    const minQuantity = 1;
                    const maxQuantity = 3;
                    const quantityRange = maxQuantity - minQuantity;
                    let targetQuantity = minQuantity + ((clampedRms - 0.02) / (0.3 - 0.02)) * quantityRange;
                    targetQuantity = Math.round(targetQuantity);
                    // Ensure quantity is a valid number and not less than 0
                    if (typeof targetQuantity === 'number' && targetQuantity >= 0) {
                        this.musicNoteEmitter.setQuantity(targetQuantity);
                    } else {
                        this.musicNoteEmitter.setQuantity(minQuantity); // Default to min if calculation is invalid
                    }
                }
                let logPitch = Math.log2(pitch);
                // Find the closest solfege note to the detected pitch
                let closestNoteIndex = this.findClosestNoteIndex(pitch);
                // Get game height for calculating position
                const gameHeight = this.sys.game.config.height;
                // Calculate if the pitch is close enough to snap to the center of a note
                const isCloseToNote = this.isPitchWithinTolerance(pitch, closestNoteIndex, 0.25); // 25% tolerance
                // Get the log frequencies for the highest and lowest notes
                const highestLogFreq = Math.log2(this.vocalRangeFrequencies[0]);
                const lowestLogFreq = Math.log2(this.vocalRangeFrequencies[7]);
                // Calculate the bar height (each of the 8 equal bars)
                const barHeight = gameHeight / 8;
                // Set target Y position
                if (isCloseToNote) {
                    // If within tolerance, snap to the center of the note's bar
                    // Note: index 0 = High Do (top bar), 7 = Low Do (bottom bar)
                    this.targetY = (closestNoteIndex + 0.5) * barHeight;
                } else {
                    // If not close enough to a note, use continuous positioning
                    // Calculate relative position (0 = highest note, 1 = lowest note)
                    let relativePosition;
                    if (logPitch >= highestLogFreq) {
                        relativePosition = 0;
                    } else if (logPitch <= lowestLogFreq) {
                        relativePosition = 1;
                    } else {
                        relativePosition = (logPitch - highestLogFreq) / (lowestLogFreq - highestLogFreq);
                    }
                    // Convert to screen coordinates
                    const topPadding = 0; // No padding needed since we're using the full 8 bars
                    const bottomPadding = 0;
                    const playableHeight = gameHeight - topPadding - bottomPadding;
                    this.targetY = topPadding + (relativePosition * playableHeight);
                }
                // Smooth the movement: currentY moves towards targetY
                this.currentY += (this.targetY - this.currentY) * 0.1; // Adjust 0.1 for more/less smoothing
                // Apply the smoothed position, clamping to screen bounds
                this.bird.y = Phaser.Math.Clamp(
                    this.currentY,
                    this.bird.displayHeight / 2, // Top bound
                    this.sys.game.config.height - this.bird.displayHeight / 2 // Bottom bound
                );
                this.bird.setVelocityY(0); // Stop vertical velocity from gravity accumulation
            } else { // No pitch detected or pitch too low/high
                this.bird.body.setAllowGravity(true); // Re-enable gravity
                // Stop music note emitter if it exists and is currently on
                if (this.musicNoteEmitter && this.musicNoteEmitter.on) {
                    this.musicNoteEmitter.stop();
                }
            }
        } else {
            // Ensure gravity is on if audio isn't ready
            this.bird.body.setAllowGravity(true);
            // Stop music note emitter if it exists and is currently on
            if (this.musicNoteEmitter && this.musicNoteEmitter.on) {
                this.musicNoteEmitter.stop();
            }
        }

        // Update obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.update();
        });

        // Update game difficulty based on elapsed time
        this.updateDifficulty();
    }

    updateDifficulty() {
        // Calculate elapsed time
        const elapsedTime = this.time.now - this.gameStartTime;
        // Only start increasing difficulty after the set time
        if (elapsedTime > this.difficultyIncreaseTime) {
            // Calculate progress factor (0 to 1) over the next 40 seconds after initial delay
            // This creates a 60-second total progression curve
            const progressFactor = Math.min(1, (elapsedTime - this.difficultyIncreaseTime) / 40000);
            // Gradually decrease spacing between obstacles (making them more frequent)
            this.currentObstacleSpacing = this.initialObstacleSpacing -
                (progressFactor * (this.initialObstacleSpacing - this.minObstacleSpacing));
            // Gradually increase obstacle heights (making gaps smaller)
            this.currentMinHeight = this.initialMinHeight +
                (progressFactor * (this.finalMinHeight - this.initialMinHeight));
            this.currentMaxHeight = this.initialMaxHeight +
                (progressFactor * (this.finalMaxHeight - this.initialMaxHeight));

            // Check for creating paired obstacles
            if (elapsedTime > this.difficultyIncreaseTime && !this.hasPairedObstacles) {
                // The reset method will now handle creating top and bottom pairs
                this.hasPairedObstacles = true;
            }
        }
    }
    // Pitch detection using auto-correlation (from provided example)
    autoCorrelate(buffer, sampleRate) {
        let SIZE = buffer.length;
        let sumOfSquares = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = (buffer[i] - 128) / 128; // Normalize buffer values to -1 to 1
            sumOfSquares += val * val;
        }
        let rms = Math.sqrt(sumOfSquares / SIZE);
        if (rms < 0.01) { // Not enough signal volume
            return -1;
        }
        let r1 = 0,
            r2 = SIZE - 1,
            threshold = 0.2;
        // Simple trim: find first/last index above threshold
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
        buffer = buffer.slice(r1, r2); // Use the trimmed section
        SIZE = buffer.length;
        if (SIZE < 2) return -1;
        let c = new Array(SIZE).fill(0);
        // Autocorrelation calculation
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + ((buffer[j] - 128) / 128) * ((buffer[j + i] - 128) / 128);
            }
        }
        // Find the first peak (fundamental frequency lag)
        let d = 0;
        while (d < c.length - 1 && c[d] > c[d + 1]) {
            d++;
        } // Find first minimum
        let maxval = -1,
            maxpos = -1;
        for (let i = d; i < SIZE; i++) { // Find peak after first minimum
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        if (maxpos === -1 || maxpos >= SIZE - 1) return -1; // No clear peak found
        let T0 = maxpos;
        // Parabolic interpolation for better accuracy
        let x1 = c[T0 - 1],
            x2 = c[T0],
            x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a !== 0) {
            T0 = T0 - b / (2 * a);
        }
        if (T0 === 0) return -1; // Avoid division by zero
        return sampleRate / T0;
    }

    // Helper method to find the closest solfege note index and show note information
    findClosestNoteIndex(pitch) {
        // Note names including sharps/flats (semitones)
        const solfegeNames = ['High Do', 'Ti', 'La', 'Sol', 'Fa', 'Mi', 'Re', 'Low Do'];
        const chromaticNames = ['C', 'B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];

        // Convert frequencies to logarithmic scale for better comparison
        const logPitch = Math.log2(pitch);
        const logFreqs = this.vocalRangeFrequencies.map(f => Math.log2(f));
        // Find the solfege note with the closest frequency to the detected pitch
        let closestIndex = 0;
        let smallestDiff = Math.abs(logPitch - logFreqs[0]);
        for (let i = 1; i < logFreqs.length; i++) {
            const diff = Math.abs(logPitch - logFreqs[i]);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestIndex = i;
            }
        }

        // Calculate how close we are to a semitone between main notes
        if (closestIndex < logFreqs.length - 1) {
            const lowerNote = logFreqs[closestIndex + 1]; // Lower in pitch = higher index
            const higherNote = logFreqs[closestIndex]; // Higher in pitch = lower index

            // Determine if we're closer to a semitone between the two notes
            const semitonePosition = (logPitch - lowerNote) / (higherNote - lowerNote);

            // If close to a quarter, half, or three-quarter position between notes
            // We could show what semitone we're on (optional)
            if (Math.abs(semitonePosition - 0.5) < 0.1) {
                // We're close to the semitone between these notes
                // console.log(`Close to semitone between ${solfegeNames[closestIndex+1]} and ${solfegeNames[closestIndex]}`);
            }
        }

        // For now, still return the closest main note index for other game purposes
        return closestIndex;
    }

    // Check if a pitch is within tolerance of a specific note
    isPitchWithinTolerance(pitch, noteIndex, tolerancePercent) {
        // Get the target frequency for this note
        const targetFreq = this.vocalRangeFrequencies[noteIndex];

        // Calculate the acceptable range (±tolerancePercent)
        const lowerBound = targetFreq * (1 - tolerancePercent);
        const upperBound = targetFreq * (1 + tolerancePercent);

        // Check if the pitch is within bounds
        return (pitch >= lowerBound && pitch <= upperBound);
    }
    // Method to get the 'Do' (lowest note) frequency for an instrument/key
    getDoFrequencyForKey(keySignature) {
        // Get the appropriate frequency array for the instrument/key
        // This is a simplified mapping. You'll need to define actual frequencies for each key.
        // For now, let's map key signatures to instrument "Do" notes as a placeholder.
        let freqArray;
        switch (keySignature) {
            case 'C Major': // Soprano Do
                freqArray = [523.25, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63];
                break;
            case 'G Major': // Alto Do (approx)
                freqArray = [440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 233.08, 220.00];
                break;
            case 'D Major': // Tenor Do (approx)
                freqArray = [349.23, 329.63, 293.66, 261.63, 233.08, 220.00, 196.00, 174.61];
                break;
            case 'A Major': // Baritone Do (approx)
                freqArray = [293.66, 261.63, 233.08, 220.00, 196.00, 174.61, 164.81, 146.83];
                break;
            case 'E Major': // Bass Do (approx)
                freqArray = [220.00, 196.00, 174.61, 164.81, 146.83, 130.81, 116.54, 110.00];
                break;
            case 'B Major': // Using Flute's D5 as a stand-in, higher pitch
                freqArray = [1396.91, 1174.66, 987.77, 880.00, 783.99, 698.46, 659.26, 587.33];
                break;
            case 'F Major': // Using Clarinet's C4 as a stand-in
                freqArray = [698.46, 622.25, 523.25, 466.16, 415.30, 349.23, 311.13, 261.63];
                break;
            default: // Default to C Major / Soprano Do
                freqArray = [523.25, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63];
        }
        return freqArray[7]; // Return the lowest Do frequency
    }
    // Method to play the Do note
    playDoNoteForKey(frequency) {
        if (!this.audioContext) {
            // If audio context isn't initialized from microphone, create a new one
            this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
        }
        if (!this.audioContext) return; // Still no audio context, can't play
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05); // Faster fade in
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5); // Shorter note duration
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5); // Stop after 0.5 seconds
    }
    handleKeySignatureChange(selectedKey) {
        console.log("Key signature changed to:", selectedKey);
        this.registry.set('selectedKeySignature', selectedKey);
        const doFrequency = this.getDoFrequencyForKey(selectedKey);
        this.playDoNoteForKey(doFrequency);
        // Restart the game, passing the current instrument and new key signature
        this.time.delayedCall(500, () => { // Delay restart slightly to allow sound to play
            this.scene.restart({
                instrument: this.instrument,
                selectedKeySignature: selectedKey
            });
        }, [], this);
    }
}
const config = {
    type: Phaser.AUTO,
    parent: 'renderDiv',
    resolution: window.devicePixelRatio || 1, // Use device pixel ratio for sharpness
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800, // Define the base logical width of your game
        height: 600, // Define the base logical height of your game
        parent: 'renderDiv', // Explicitly ensure it's targeting your div
        zoom: 1 // Ensure no default zoom is applied, FIT will handle scaling
    },
    scene: [StartScreen, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 600
            },
            debug: false
        }
    },
    render: {
        pixelArt: true,
        antialias: false,
        antialiasGL: false
    }
};

window.phaserGame = new Phaser.Game(config);
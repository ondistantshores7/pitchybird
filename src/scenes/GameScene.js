import { Bird } from '../objects/Bird.js';
import { Background } from '../objects/Background.js';
import { Obstacle } from '../objects/Obstacle.js';
import { AudioManager } from '../audio/AudioManager.js';
import {
    computeScaleForInstrumentAndKey,
    getInstrumentLowFreq,
    normalizeDisplayMode
} from '../music/keys.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.keySignature = data.keySignature || this.registry.get('selectedKeySignature') || 'C Major';
        this.displayMode = normalizeDisplayMode(data.displayMode || this.registry.get('displayMode'));
        this.score = 0;
        this.gameOver = false;
        this.obstacleSpeed = 200;
        this.obstacleGap = 200;
        this.obstacleFrequency = 2000;
        this.lastObstacleTime = 0;
        this.obstacles = [];
    }

    create() {
        const scale = computeScaleForInstrumentAndKey(
            getInstrumentLowFreq('Soprano'),
            this.keySignature
        );
        this.background = new Background(this, this.displayMode, scale.pitchNames);

        // Bird
        this.bird = new Bird(this, 100, this.sys.game.config.height / 2);
        this.add.existing(this.bird);
        this.bird.createAnimations();

        // Audio
        this.audioManager = new AudioManager(this);
        this.audioManager.init();

        // Score Text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        });

        // Game Over Text
        this.gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#39FF14',
                blur: 4,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setVisible(false);

        // Restart Button
        this.restartButton = this.add.graphics();
        this.restartButton.fillStyle(0x222222, 1);
        this.restartButton.lineStyle(3, 0x00FF00, 1);
        this.restartButton.fillRect(this.sys.game.config.width / 2 - 100, this.sys.game.config.height / 2 + 50, 200, 50);
        this.restartButton.strokeRect(this.sys.game.config.width / 2 - 100, this.sys.game.config.height / 2 + 50, 200, 50);
        this.restartButton.setVisible(false);

        this.restartText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 75, 'RESTART', {
            fontSize: '24px',
            fontFamily: '"VT323", monospace',
            color: '#FFFFFF',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#39FF14',
                blur: 2,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setVisible(false);

        const restartHitArea = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 75,
            200,
            50
        ).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.scene.restart({
                keySignature: this.keySignature,
                displayMode: this.displayMode
            });
        });
        restartHitArea.setOrigin(0.5);
        restartHitArea.setAlpha(0.001);
        restartHitArea.setVisible(false);

        // Input
        this.input.on('pointerdown', () => {
            if (!this.gameOver) {
                this.bird.flap();
            }
        });

        // Collision
        this.physics.add.collider(this.bird, this.obstacles, this.handleCollision, null, this);
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Update bird
        this.bird.update();

        // Spawn obstacles
        if (time > this.lastObstacleTime + this.obstacleFrequency) {
            this.spawnObstacle();
            this.lastObstacleTime = time;
        }

        // Update obstacles
        this.obstacles.forEach(obstacle => obstacle.update());

        // Check if bird is out of bounds
        if (this.bird.y < 0 || this.bird.y > this.sys.game.config.height) {
            this.handleGameOver();
        }

        // Update score
        this.obstacles.forEach(obstacle => {
            if (!obstacle.passed && obstacle.x + obstacle.width < this.bird.x) {
                obstacle.passed = true;
                this.score++;
                this.scoreText.setText('Score: ' + this.score);
            }
        });
    }

    spawnObstacle() {
        const obstacle = new Obstacle(this,
            this,
            this.sys.game.config.width + 100,
            0,
            100,
            this.obstacleGap,
            this.obstacleSpeed,
            this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1] : null
        );
        this.obstacles.push(obstacle);
    }

    handleCollision() {
        this.handleGameOver();
    }

    handleGameOver() {
        this.gameOver = true;
        this.gameOverText.setVisible(true);
        this.restartButton.setVisible(true);
        this.restartText.setVisible(true);
        this.restartButton.setInteractive({ useHandCursor: true });
    }
} 
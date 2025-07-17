import { KeySignatureDropdown } from '../ui/KeySignatureDropdown.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Title
        this.add.text(gameWidth / 2, gameHeight / 4, 'PITCHY BIRD', {
            fontSize: '64px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'bold',
            color: '#FFFFFF',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#39FF14',
                blur: 4,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Key Signature Dropdown
        const keySignatures = ['C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major'];
        this.keySignatureDropdown = new KeySignatureDropdown(
            this,
            gameWidth / 2,
            gameHeight / 2,
            200,
            40,
            keySignatures,
            'C Major',
            (option) => {
                console.log('Selected key signature:', option);
            }
        );

        // Start Button
        const startButton = this.add.graphics();
        startButton.fillStyle(0x222222, 1);
        startButton.lineStyle(3, 0x00FF00, 1);
        startButton.fillRect(gameWidth / 2 - 100, gameHeight / 2 + 50, 200, 50);
        startButton.strokeRect(gameWidth / 2 - 100, gameHeight / 2 + 50, 200, 50);

        const startText = this.add.text(gameWidth / 2, gameHeight / 2 + 75, 'START GAME', {
            fontSize: '24px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'bold',
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
        }).setOrigin(0.5);

        const startHitArea = this.add.rectangle(gameWidth / 2, gameHeight / 2 + 75, 200, 50)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('GameScene', { keySignature: this.keySignatureDropdown.getSelectedOption() });
            });
        startHitArea.setOrigin(0.5);
        startHitArea.setAlpha(0.001);
    }
} 
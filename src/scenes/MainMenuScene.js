import { KeySignatureDropdown } from '../ui/KeySignatureDropdown.js';
import {
    KEY_SIGNATURES,
    defaultKeyForInstrument,
    displayModeLabel,
    normalizeDisplayMode
} from '../music/keys.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        const savedKey = this.registry.get('userSelectedKeySignature') ||
            this.registry.get('selectedKeySignature') ||
            defaultKeyForInstrument(this.registry.get('selectedInstrument') || 'Soprano');
        this.displayMode = normalizeDisplayMode(this.registry.get('displayMode'));

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

        const labelStyle = {
            fontSize: '16px',
            fontFamily: '"VT323", monospace',
            color: '#39FF14',
            align: 'center'
        };
        this.add.text(gameWidth / 2 - 110, gameHeight / 2 - 36, 'KEY', labelStyle).setOrigin(0.5);
        this.add.text(gameWidth / 2 + 110, gameHeight / 2 - 36, 'DISPLAY', labelStyle).setOrigin(0.5);

        this.keySignatureDropdown = new KeySignatureDropdown(
            this,
            gameWidth / 2 - 110,
            gameHeight / 2,
            200,
            40,
            KEY_SIGNATURES,
            savedKey,
            (option) => {
                this.registry.set('userSelectedKeySignature', option);
                this.registry.set('selectedKeySignature', option);
            }
        );

        this.createDisplayModeToggle(gameWidth / 2 + 110, gameHeight / 2, 200, 40);

        const startButton = this.add.graphics();
        startButton.fillStyle(0x222222, 1);
        startButton.lineStyle(3, 0x00FF00, 1);
        startButton.fillRect(gameWidth / 2 - 100, gameHeight / 2 + 80, 200, 50);
        startButton.strokeRect(gameWidth / 2 - 100, gameHeight / 2 + 80, 200, 50);

        this.add.text(gameWidth / 2, gameHeight / 2 + 105, 'START GAME', {
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

        const startHitArea = this.add.rectangle(gameWidth / 2, gameHeight / 2 + 105, 200, 50)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                const keySignature = this.keySignatureDropdown.getSelectedOption();
                this.registry.set('selectedKeySignature', keySignature);
                this.registry.set('displayMode', this.displayMode);
                this.scene.start('GameScene', {
                    keySignature,
                    displayMode: this.displayMode
                });
            });
        startHitArea.setOrigin(0.5);
        startHitArea.setAlpha(0.001);
    }

    createDisplayModeToggle(x, y, width, height) {
        const button = this.add.graphics();
        button.fillStyle(0x222222, 1);
        button.lineStyle(3, 0x00FF00, 1);
        button.fillRect(x - width / 2, y - height / 2, width, height);
        button.strokeRect(x - width / 2, y - height / 2, width, height);

        const label = this.add.text(x, y, displayModeLabel(this.displayMode), {
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
        }).setOrigin(0.5);

        this.add.rectangle(x, y, width, height)
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .setAlpha(0.001)
            .on('pointerdown', () => {
                this.displayMode = this.displayMode === 'Solfege' ? 'Pitch' : 'Solfege';
                this.registry.set('displayMode', this.displayMode);
                label.setText(displayModeLabel(this.displayMode));
            });
    }
}

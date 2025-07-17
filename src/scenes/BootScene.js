export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    preload() {
        this.load.image('bird1', 'assets/bird1.png');
        this.load.image('bird2', 'assets/bird2.png');
        this.load.image('bird3', 'assets/bird3.png');
        this.load.image('pipe', 'assets/pipe.png');
        this.load.image('cloud', 'assets/cloud.png');
    }
    create() {
        this.scene.start('MainMenuScene');
    }
} 
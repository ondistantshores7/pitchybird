export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    preload() {
        this.load.image('bird1', 'assets/Bird_01.png');
        this.load.image('bird2', 'assets/Bird_02.png');
        this.load.image('bird3', 'assets/Bird_03.png');
        this.load.image('pipe', 'assets/pipe.png');
        this.load.image('cloud', 'assets/Cloud.png');
    }
    create() {
        this.scene.start('MainMenuScene');
    }
} 
import { config } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';

// Create game instance
const game = new Phaser.Game({
    ...config,
    scene: [BootScene, MainMenuScene, GameScene]
});

// Preload assets
game.preload = function() {
    // Bird sprites
    this.load.image('bird1', 'assets/Bird_01.png');
    this.load.image('bird2', 'assets/Bird_02.png');
    this.load.image('bird3', 'assets/Bird_03.png');
    
    // Obstacle sprites
    this.load.image('pipe', 'assets/pipe.png');
    this.load.image('cloud', 'assets/Cloud.png');
}; 
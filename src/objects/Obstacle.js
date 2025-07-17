export class Obstacle extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, speed, gameScene, fromTop = null) {
        super(scene, x, 0);
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
        
        if (this.fromTop) {
            this.obstacleSprite = this.scene.add.image(0, 0, 'cloud');
            this.add(this.obstacleSprite);
        } else {
            this.obstacleSprite = scene.add.image(0, 0, 'pipe');
            this.add(this.obstacleSprite);
        }
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        this.configurePipe(this.fromTop, this.obstacleHeight);
        this.startX = x;
        this.body.setSize(this.obstacleWidth, this.obstacleHeight);
    }

    configurePipe(fromTop, height) {
        this.fromTop = fromTop;
        this.obstacleHeight = height;
        
        if (this.fromTop) {
            const textureWidthCloud = this.obstacleSprite.texture.getSourceImage().width;
            const textureHeightCloud = this.obstacleSprite.texture.getSourceImage().height;
            const scaleX = this.obstacleWidth / textureWidthCloud;
            const scaleY = scaleX * (textureWidthCloud / textureHeightCloud) * (150 / 350) * 3;
            this.obstacleSprite.setScale(scaleX, scaleY);
            this.obstacleSprite.setOrigin(0.5, 0);
            this.y = 0;
            this.body.setOffset(-this.obstacleWidth / 2, 0);
            this.obstacleHeight = this.obstacleSprite.displayHeight;
        } else {
            const textureWidth = this.obstacleSprite.texture.getSourceImage().width;
            const textureHeight = this.obstacleSprite.texture.getSourceImage().height;
            this.obstacleSprite.setScale(this.obstacleWidth / textureWidth, this.obstacleHeight / textureHeight);
            this.obstacleSprite.setOrigin(0.5, 1);
            this.y = this.gameHeight;
            this.body.setOffset(-this.obstacleWidth / 2, -this.obstacleHeight);
        }
        
        this.body.setSize(this.obstacleWidth, this.obstacleHeight);
        this.body.enable = true;
    }

    update() {
        this.x -= this.speed;
        if (this.x < -this.obstacleWidth) {
            this.reset();
        }
    }

    reset() {
        const spacing = this.gameScene.currentObstacleSpacing;
        this.x = this.scene.sys.game.config.width + spacing;
        
        const elapsedTime = this.scene.time.now - this.gameScene.gameStartTime;
        const pastDifficultyIncreaseTime = elapsedTime > this.gameScene.difficultyIncreaseTime;

        if (pastDifficultyIncreaseTime && !this.gameScene.lastObstacleFromTop) {
            this.fromTop = true;
        } else if (pastDifficultyIncreaseTime && this.gameScene.pairRequired) {
            this.fromTop = false;
            this.gameScene.pairRequired = false;
        } else {
            this.fromTop = !this.gameScene.lastObstacleFromTop;
            if (this.fromTop && pastDifficultyIncreaseTime) {
                this.gameScene.pairRequired = true;
            }
        }

        this.gameScene.lastObstacleFromTop = this.fromTop;

        const minGap = 150;
        const availableHeightForObstacle = this.gameHeight - minGap;
        const minObstacleHeight = this.gameHeight * this.gameScene.currentMinHeight;
        const maxObstacleHeightAllowed = Math.min(this.gameHeight * this.gameScene.currentMaxHeight, availableHeightForObstacle);
        const clampedMinHeight = Math.min(minObstacleHeight, maxObstacleHeightAllowed);
        const rawHeight = Phaser.Math.Between(clampedMinHeight, maxObstacleHeightAllowed);
        const barHeight = this.gameScene.barHeight;
        const snappedHeight = Math.round(rawHeight / barHeight) * barHeight;
        const newHeight = Phaser.Math.Clamp(snappedHeight, clampedMinHeight, maxObstacleHeightAllowed);

        if (this.fromTop) {
            if (this.obstacleSprite && this.obstacleSprite.texture.key !== 'cloud') {
                this.obstacleSprite.destroy();
                this.obstacleSprite = this.scene.add.image(0, 0, 'cloud');
                this.addAt(this.obstacleSprite, 0);
            } else if (!this.obstacleSprite) {
                this.obstacleSprite = this.scene.add.image(0, 0, 'cloud');
                this.addAt(this.obstacleSprite, 0);
            }
        } else {
            if (this.obstacleSprite && this.obstacleSprite.texture.key !== 'pipe') {
                this.obstacleSprite.destroy();
                this.obstacleSprite = this.scene.add.image(0, 0, 'pipe');
                this.addAt(this.obstacleSprite, 0);
            } else if (!this.obstacleSprite) {
                this.obstacleSprite = this.scene.add.image(0, 0, 'pipe');
                this.addAt(this.obstacleSprite, 0);
            }
        }

        this.configurePipe(this.fromTop, newHeight);
    }
} 
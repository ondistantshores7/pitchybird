export class Bird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bird1');

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(0.45);
        this.setCollideWorldBounds(true);
        this.body.setAllowGravity(true);
        this.createAnimations();
        this.play('flap');
    }

    createAnimations() {
        this.scene.anims.create({
            key: 'flap',
            frames: [
                { key: 'bird1' },
                { key: 'bird2' },
                { key: 'bird3' },
                { key: 'bird2' }
            ],
            frameRate: 10,
            repeat: -1
        });
    }
} 
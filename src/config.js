export const config = {
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
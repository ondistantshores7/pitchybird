export class Background {
    constructor(scene) {
        this.scene = scene;
        this.createBackgrounds();
    }

    createBackgrounds() {
        const gameWidth = this.scene.sys.game.config.width;
        const gameHeight = this.scene.sys.game.config.height;
        const barHeight = gameHeight / 8;

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

        const solfegeNames = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];

        for (let i = 0; i < 8; i++) {
            const y = gameHeight - (i + 1) * barHeight;
            const bar = this.scene.add.rectangle(0, y, gameWidth, barHeight, vibrantColors[i]);
            bar.setOrigin(0, 0);
            bar.setAlpha(0.7);

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
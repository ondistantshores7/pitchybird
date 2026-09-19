export class Background {
    constructor(scene, displayMode = 'Solfege', pitchNames = []) {
        this.scene = scene;
        this.solfegeNames = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];
        this.backgroundTexts = [];
        this.createBackgrounds();
        this.updateTextDisplay(displayMode, pitchNames);
    }

    createBackgrounds() {
        const gameWidth = this.scene.sys.game.config.width;
        const gameHeight = this.scene.sys.game.config.height;
        const barHeight = gameHeight / 8;

        const vibrantColors = [
            0xFF5555,
            0xFFBF80,
            0xFFEF80,
            0x80FF97,
            0x80C4FF,
            0xBB80FF,
            0xFF80D5,
            0xFF5555
        ];

        for (let i = 0; i < 8; i++) {
            const y = gameHeight - (i + 1) * barHeight;
            const bar = this.scene.add.rectangle(0, y, gameWidth, barHeight, vibrantColors[i]);
            bar.setOrigin(0, 0);
            bar.setAlpha(0.7);
        }
    }

    updateTextDisplay(displayMode, pitchNames = []) {
        const gameHeight = this.scene.sys.game.config.height;
        const barHeight = gameHeight / 8;
        this.backgroundTexts.forEach(text => text.destroy());
        this.backgroundTexts = [];
        const namesToDisplay = displayMode === 'Pitch' ? pitchNames : this.solfegeNames;
        for (let i = 0; i < 8; i++) {
            const y = gameHeight - (i + 1) * barHeight;
            const name = namesToDisplay[i] || this.solfegeNames[i];
            const text = this.scene.add.text(10, y + barHeight / 2, name, {
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
            this.backgroundTexts.push(text);
        }
    }
}

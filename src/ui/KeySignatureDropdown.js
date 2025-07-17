export class KeySignatureDropdown {
    constructor(scene, x, y, width, height, options, defaultOption, callback) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.options = options;
        this.selectedOption = defaultOption;
        this.callback = callback;
        this.isOpen = false;
        this.createDropdown();
    }

    createDropdown() {
        const gameWidth = this.scene.sys.game.config.width;
        const neonGreenColor = 0x00FF00;

        this.dropdownButton = this.scene.add.graphics();
        this.dropdownButton.fillStyle(0x222222, 1);
        this.dropdownButton.lineStyle(3, 0x00FF00, 1);
        this.dropdownButton.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        this.dropdownButton.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        this.dropdownButton.setDepth(300);

        this.dropdownText = this.scene.add.text(this.x, this.y, `${this.selectedOption} ▼`, {
            fontSize: '18px',
            fontFamily: '"VT323", monospace',
            fontStyle: 'normal',
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
        });
        this.dropdownText.setOrigin(0.5);
        this.dropdownText.setDepth(301);

        const hitArea = this.scene.add.rectangle(this.x, this.y, this.width, this.height)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleDropdown());
        hitArea.setOrigin(0.5);
        hitArea.setAlpha(0.001);

        this.optionsContainer = this.scene.add.container(this.x, this.y + this.height / 2);
        this.optionsContainer.setVisible(false);
        this.optionsContainer.setDepth(300);

        this.options.forEach((option, index) => {
            const optionY = (index + 1) * this.height * 0.8;
            const optionGraphics = this.scene.add.graphics();
            optionGraphics.fillStyle(0x2c2c2c, 1);
            optionGraphics.fillRect(-this.width / 2, optionY - (this.height * 0.8) / 2, this.width, this.height * 0.8);
            optionGraphics.lineStyle(2, 0x00FF00, 1);
            optionGraphics.strokeRect(-this.width / 2, optionY - (this.height * 0.8) / 2, this.width, this.height * 0.8);
            this.optionsContainer.add(optionGraphics);

            const optionText = this.scene.add.text(0, optionY, option, {
                fontSize: '16px',
                fontFamily: '"VT323", monospace',
                fontStyle: 'normal',
                color: '#FFFFFF',
                align: 'center',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#39FF14',
                    blur: 1,
                    stroke: true,
                    fill: true
                }
            });
            optionText.setOrigin(0.5);
            this.optionsContainer.add(optionText);

            const optionHitArea = this.scene.add.rectangle(0, optionY, this.width, this.height * 0.8)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectOption(option));
            optionHitArea.setOrigin(0.5);
            optionHitArea.setAlpha(0.001);
            this.optionsContainer.add(optionHitArea);
        });

        this.scene.input.on('pointerdown', (pointer) => {
            if (this.isOpen) {
                const dropdownBounds = new Phaser.Geom.Rectangle(
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height + (this.options.length * this.height * 0.8)
                );
                if (!dropdownBounds.contains(pointer.x, pointer.y)) {
                    this.closeDropdown();
                }
            }
        });
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
        this.optionsContainer.setVisible(this.isOpen);
        this.dropdownText.setText(this.isOpen ? `${this.selectedOption} ▲` : `${this.selectedOption} ▼`);
    }

    selectOption(option) {
        this.selectedOption = option;
        this.dropdownText.setText(`${this.selectedOption} ▼`);
        this.isOpen = false;
        this.optionsContainer.setVisible(false);
        if (this.callback) {
            this.callback(option);
        }
        console.log("Selected Key Signature:", option);
    }

    closeDropdown() {
        this.isOpen = false;
        this.optionsContainer.setVisible(false);
        this.dropdownText.setText(`${this.selectedOption} ▼`);
    }

    getSelectedOption() {
        return this.selectedOption;
    }
} 
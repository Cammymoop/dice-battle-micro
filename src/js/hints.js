
const nums = ['1', '2', '3', '4', '5', '6']; 
const shortNames = [];

M.Hint = class extends Phaser.GameObjects.Container
{
    constructor(scene) {
        super(scene);
        this.rows = [];
        this.allImgs = [];
        this.maxWidth = 0;
    }

    setupExample() {
        this.addToDisplayList();
        this.addRow(["equal", "5", "", "arrow", "", "skull", "dice"]);
        this.addRow(["greater", "2", "", "arrow", "", "skull"]);
        this.build();
    }

    setup(hintData) {
        this.addToDisplayList();
        this.rows = [];
        for (let row of hintData) {
            this.addRow(row);
        }
        this.build();
    }

    addRow(contents) {
        this.rows.push(contents);
    }

    clearRows() {
        this.rows = [];
    }

    clearImgs() {
        for (let img of this.allImgs) {
            img.destroy();
        }
        this.allImgs = [];
    }

    build() {
        this.clearImgs();
        
        for (let i = 0; i < this.rows.length; i++) {
            // Place rows in reverse order from bottom to top, moving coords upward so the end result is in order
            const row = this.rows[this.rows.length - 1 - i];
            if (row.length < 1) {
                continue;
            }
            const row_width = row.length * 8;
            for (let j = 0; j < row.length; j++) {
                if (row[j] === '') {
                    continue;
                }
                const charImg = this.getImageForKey(row[j]);
                this.allImgs.push(charImg);
                this.add(charImg);
                charImg.x = (8 * j) - (row_width/2);
                charImg.y = -i * 10;
            }
        }
    }

    getImageForKey(charKey) {
        if (nums.includes(charKey)) {
            return this.newImage("number_icons", parseInt(charKey) - 1);
        } else {
            return this.newImage(charKey + "_icon");
        }
    }

    newImage(texKey, frame = '') {
        if (frame !== '') {
            return new Phaser.GameObjects.Image(this.scene, 0, 0, texKey, frame);
        } else {
            return new Phaser.GameObjects.Image(this.scene, 0, 0, texKey);
        }
    }
};

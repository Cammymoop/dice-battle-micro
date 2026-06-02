
const nums = ['1', '2', '3', '4', '5', '6']; 
const shortNames = [];

M.Hint = class extends Phaser.Container
{
    constructor(scene) {
        super(scene);
        this.rows = [];
        this.allImgs = [];
        this.maxWidth = 0;
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
        clearImgs();
        
        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            if (row.length < 1) {
                continue;
            }
            const row_width = row.length * 8;
            for (let j = 0; j < row.length; j++) {
                const charImg = getImageForKey(row[j]);
                allImgs.push(charImg);
                this.add(charImg);
                charImg.x = (8 * j) - (row_width/2);
                charImg.y = i * 10
            }
        }
    }

    getImageForKey(charKey) {
        if (nums.includes(charKey)) {
            return newImage("number_icons", parseInt(charKey) - 1);
        } else {
            return newImage(charKey);
        }
    }

    newImage(texKey, frame = '') {
        if (frame !== '') {
            return new Phaser.Image(this.scene, 0, 0, texKey, frame);
        } else {
            return new Phaser.Image(this.scene, 0, 0, texKey);
        }
    }
}

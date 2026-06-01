
M.Vec2 = Phaser.Math.Vector2;

// Extend Phaser game objects for vector usage
Phaser.GameObjects.GameObject.prototype.setPosVec = function (newPos) {
    this.x = newPos.x;
    this.y = newPos.y;
};

Phaser.GameObjects.GameObject.prototype.getPosVec = function () {
    return new M.Vec2(this.x, this.y);
};



class GameGame extends Phaser.Scene
{
    preload ()
    {
        //this.load.image('image', 'assets/image.png');
        this.load.image('background', 'assets/background.png');
        this.load.image('goblin', 'assets/goblin.png');
        this.load.image('red_circle', 'assets/red_circle.png');

        this.load.spritesheet('gob_small', 'assets/gob_small_pieces.png', {
            "frameWidth": 40, "frameHeight": 40
        });

        this.load.spritesheet('dices', 'assets/dices.png', {
            "frameWidth": 30,
            "frameHeight": 30,
            "startFrame": 0,
            "endFrame": 6,
        });
    }

    create ()
    {
        //const roll_anim = {
        //    "key": "roll", "frames": "dices",
        //    "framerate": 10,
        //    "repeat": -1,
        //};
        //this.anims.create(roll_anim);

        this.bg = this.add.image(-30, -22, 'background').setOrigin(0, 0);

        this.circle = this.add.image(-6000,0, "red_circle");

        const h_center = this.game.scale.gameSize.width / 2;
        const v_center = this.game.scale.gameSize.height / 2;
        const center = new M.Vec2(h_center, v_center);

        //this.gob = this.add.sprite(h_center, v_center - 30, 'gob_small');
        this.gob = new M.Goblin(this);
        this.gob.setPosVec(center.add(new M.Vec2(0, -20)));
        this.gob.addToDisplayUpdate();

        this.dice = this.add.sprite(h_center + 10, v_center + 38, 'dices');
        this.dice.rolling = true;
        this.dice.roll_time = 0;
        this.dice.total_roll_time = ROLL_TOTAL;
    }

    update (t, dt)
    {
        //if (Math.random() > 0.5) {
            //this.bg.tilePositionX -= 2;
        //} else {
            //this.bg.tilePositionY -= 2;
        //}

        if (this.dice.rolling) {
            this.dice.roll_time += dt;
            if (this.dice.roll_time > ROLL_ONCE) {
                this.dice.roll_time = 0;
                var rand_side = Math.floor(Math.random() * 5)
                var cur_side = parseInt(this.dice.frame.name)
                if (rand_side >= cur_side) {
                    rand_side += 1;
                }
                this.dice.setFrame(rand_side);
            }

            this.dice.total_roll_time -= dt;
            if (this.dice.total_roll_time < 0) {
                this.dice.total_roll_time = ROLL_TOTAL;
                this.dice.rolling = false;
                this.circle.setPosVec(this.dice.getPosVec());
            }
        }
    }
}

const ROLL_TOTAL = 1200;
const ROLL_ONCE = 70;

const config = {
    scale: { mode: Phaser.Scale.FIT },
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 240,
    height: 160,
    backgroundColor: '#304858',
    scene: GameGame,
    pixelArt: true,
    antialias: true,
};

const game = new Phaser.Game(config);
M.game = game;

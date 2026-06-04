
M.Vec2 = Phaser.Math.Vector2;

// Extend Phaser game objects for vector usage
Phaser.GameObjects.GameObject.prototype.setPosVec = function (newPos) {
    this.x = newPos.x;
    this.y = newPos.y;
};

Phaser.GameObjects.GameObject.prototype.addPosVec = function (newPos) {
    this.x += newPos.x;
    this.y += newPos.y;
};

Phaser.GameObjects.GameObject.prototype.getPosVec = function () {
    return new M.Vec2(this.x, this.y);
};

M.WaitScene = class extends Phaser.Scene
{
    preload()
    {
        //this.load.image('image', 'assets/image.png');
        this.load.image('background', 'assets/background.png');
        this.load.image('goblin', 'assets/goblin.png');

        this.load.image('explosion', 'assets/explosion.png');

        this.load.image('red_circle', 'assets/red_circle.png');
        this.load.image('target_arrow', 'assets/target_arrow.png');
        this.load.image('reroll', 'assets/reroll.png');

        this.load.image('yes', 'assets/yes.png');
        this.load.image('ohno', 'assets/ohno.png');

        this.load.image('stopwatch_frame', 'assets/stopwatch_frame.png');
        this.load.spritesheet('stopwatch_numbers', 'assets/stopwatch_numbers.png', {
            "frameWidth": 12, "frameHeight": 14,
        });

        this.load.image('arrow_icon', 'assets/arrow_icon.png');
        this.load.image('boom_icon', 'assets/boom_icon.png');
        this.load.image('dice_icon', 'assets/dice_icon.png');
        this.load.image('equal_icon', 'assets/equal_icon.png');
        this.load.image('greater_icon', 'assets/greater_icon.png');
        this.load.image('guard_break_icon', 'assets/guard_break_icon.png');
        this.load.image('less_icon', 'assets/less_icon.png');
        this.load.image('skull_icon', 'assets/skull_icon.png');
        this.load.spritesheet('number_icons', 'assets/number_icons.png', {
            "frameWidth": 8, "frameHeight": 8,
        });

        this.load.spritesheet('gob_small', 'assets/gob_small.png', {
            "frameWidth": 48, "frameHeight": 46,
        });
        this.load.spritesheet('bomb_gnome', 'assets/bomb_gnome.png', {
            "frameWidth": 42, "frameHeight": 50,
        });

        this.load.spritesheet('dices', 'assets/dices.png', {
            "frameWidth": 30, "frameHeight": 30,
        });
    }

    create()
    {
        this.difficulty = 0;
        this.textures.get("bomb_gnome").setFilter(Phaser.Textures.FilterMode.Nearest);
        this.textures.get("dices").setFilter(Phaser.Textures.FilterMode.Nearest);

        Phaser.Display.Canvas.CanvasInterpolation.setCrisp(this.game.canvas);
        window.parent.postMessage({op: "ready"});
    }

    update(t, dt)
    {
        if (this.input.activePointer.primaryDown) {
            this.startDiceGame();
        }
    }

    timeToStart(difficulty) {
        this.difficulty = difficulty;
        this.startDiceGame();
    }

    startDiceGame()
    {
        const data = { difficulty: this.difficulty };
        if (M.gameScene.scene.isActive()) {
            M.gameScene.scene.restart(data);
        } else {
            this.scene.switch("play", data);
        }
    }
}

M.waitingScene = new M.WaitScene("wait");
M.gameScene = new M.DiceGame({key: "play", active: false});

M.gameStarted = function () {
    window.parent.postMessage({op: "started", verb: "Defeat!"});
};

M.gameEnd = function (won) {
    window.parent.postMessage({op: "done", win: won});
};

M.handleMessage = function (msgData) {
    if (!msgData) {
        return;
    }
    if (msgData.op == "start") {
        waitingScene.timeToStart(msgData.difficulty);
    }
}
window.addEventListener("message", M.handleMessage);

const config = {
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 240,
    height: 160,
    backgroundColor: '#304858',
    scene: [
        M.waitingScene, M.gameScene,
    ],
    smoothPixelArt: true,
    //antialias: false,
    //antialiasGL: true,
};

const game = new Phaser.Game(config);
M.game = game;

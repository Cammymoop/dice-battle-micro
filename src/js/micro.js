
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
        this.load.image('red_circle', 'assets/red_circle.png');

        this.load.spritesheet('gob_small', 'assets/gob_small_pieces.png', {
            "frameWidth": 40, "frameHeight": 40,
        });

        this.load.spritesheet('bomb_gnome', 'assets/bomb_gnome.png', {
            "frameWidth": 40, "frameHeight": 48,
        });

        this.load.spritesheet('dices', 'assets/dices.png', {
            "frameWidth": 30,
            "frameHeight": 30,
            "startFrame": 0,
            "endFrame": 6,
        });
    }

    create()
    {
        window.parent.postMessage({op: "ready"});
    }

    update(t, dt)
    {
        if (this.input.activePointer.primaryDown) {
            this.startDiceGame();
        }
    }

    timeToStart(difficulty)
    {
        this.startDiceGame();
    }

    startDiceGame()
    {
        if (M.gameScene.scene.isActive()) {
            console.log("game scene is active, restarting it");
            //this.scene.switch("play");
            M.gameScene.scene.restart();
        } else {
            console.log("game scene is not active, switching");
            this.scene.switch("play");
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
    pixelArt: true,
    antialias: true,
};

const game = new Phaser.Game(config);
M.game = game;

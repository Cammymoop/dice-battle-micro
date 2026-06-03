
M.Enemy = class extends Phaser.GameObjects.Container
{
    constructor(scene) {
        super(scene);
        this.sprites = {}
        this.homePos = M.Vec2.ZERO;
        this.hint = null;
    }

    setHomePos(newHomePos) {
        this.setPosVec(newHomePos);
        this.homePos = new M.Vec2(newHomePos.x, newHomePos.y);
    }

    addToDisplayUpdate() {
        this.addToDisplayList();
        this.addToUpdateList();
    }

    setupHint(height, hintData) {
        this.addHintData(hintData);
        this.hint.y = -height;
    }

    addHintData(hintData) {
        if (this.hint) {
            this.remove(hint);
            this.hint.destroy();
        }
        this.hint = new M.Hint(this.scene);
        this.add(this.hint);
        console.log("setting up hint with data: " + hintData);
        this.hint.setup(hintData);
    }

    hideHint() {
        if (this.hint) {
            this.hint.visible = false;
        }
    }

    showHint() {
        if (this.hint) {
            this.hint.visible = true;
        }
    }

    removeSprite(spriteName) {
        if (!this.sprites[spriteName]) {
            return;
        }
        if (this.contains(this.sprites[spriteName])) {
            this.remove(this.sprites[spriteName]);
        }
        delete this.sprites[spriteName];
    }

    addSprite(spriteName, pos, textureKey, frameIdx) {
        if (!pos) {
            pos = {x: 0, y: 0};
        }
        if (this.sprites[spriteName]) {
            removeSprite(spriteName);
        }
        const spr = new Phaser.GameObjects.Sprite(this.scene, pos.x, pos.y, textureKey, frameIdx);
        this.sprites[spriteName] = spr;
        this.add(spr);
    }

    preUpdate (t, dt) {
        super.preUpdate(t, dt);
    }


}

M.Goblin = class extends M.Enemy
{
    constructor(scene) {
        super(scene);
        this.anim_interval = 160;
        this.anim_timer = 0;

        this.current_animation = 1;
        this.anim_state = { side: -1 }

        this.head_shift = 1;

        this.addSprite("body", M.Vec2.ZERO, "gob_small", 0);
        this.addSprite("head", M.Vec2.ZERO, "gob_small", 2);

        this.setupHint(20, [["greater", "2", "", "arrow", "", "skull"]]);
        this.hideHint();
    }

    preUpdate (t, dt) {

        this.anim_timer += dt;
        if (this.anim_timer > this.anim_interval) {
            this.anim_timer = 0;
            this.animUpdate();
        }
    }

    animUpdate () {
        switch (this.current_animation) {
            case 1:
                this.anim_state.side *= -1
                const head = this.sprites.head
                if (head) {
                    head.x = this.head_shift * this.anim_state.side
                    if (Math.random() < 0.05) {
                        head.scaleX *= -1;
                    }
                }
                break;
        }
        if (false && this.hint) {
            this.hint.visible = !this.hint.visible;
            console.log("hint visibility: " + this.hint.visible);
        }
    }

}

M.BombGnome = class extends M.Enemy
{
    constructor(scene) {
        super(scene);
        this.anim_interval = 320;
        this.anim_timer = 0;
        this.total_time = 0;

        this.current_animation = 1;
        this.anim_state = {};

        this.arm_speed = 200 + Math.random() * 20;
        this.arm_angle_delta = (Math.PI / 6);
        this.snap = Math.PI / 64;

        this.addSprite("body", M.Vec2.ZERO, "bomb_gnome", 0);
        this.addSprite("arm", M.Vec2.ZERO, "bomb_gnome", 2);
        this.addSprite("bomb", M.Vec2.ZERO, "bomb_gnome", 4);
        this.addSprite("head", M.Vec2.ZERO, "bomb_gnome", 6);

        this.setupHint(26, [
            ["greater", "1", "", "arrow", "", "skull", ""],
            ["greater", "4", "", "arrow", "", "skull", "boom"],
        ]);
        this.hideHint();
    }

    preUpdate (t, dt) {
        this.total_time += dt;
        this.animUpdate(dt);

        this.anim_timer += dt;
        if (this.anim_timer > this.anim_interval) {
            this.anim_timer = 0;
            this.animInterval();
        }
    }

    animUpdate (dt) {
        const arm = this.sprites.arm;
        if (arm) {
            const smoothAngle = this.arm_angle_delta * (
                Math.cos(this.total_time / this.arm_speed) / 2 - 0.5
            );
            arm.rotation = Math.round(smoothAngle / this.snap) * this.snap;
        }
    }

    animInterval () {
        switch (this.current_animation) {
            case 1:
                const head = this.sprites.head;
                if (head) {
                    head.y = head.y > 0 ? 0 : 1;
                }
                break;
        }
    }

}

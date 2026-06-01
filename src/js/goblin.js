
M.Enemy = class extends Phaser.GameObjects.Container
{
    constructor(scene) {
        super(scene);
        this.sprites = {}
    }

    addToDisplayUpdate() {
        this.addToDisplayList();
        this.addToUpdateList();
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
        this.addSprite("head", M.Vec2.ZERO, "gob_small", 1);
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
    }

}

console.log(M);

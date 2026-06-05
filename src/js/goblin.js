
M.Enemy = class extends Phaser.GameObjects.Container
{
    constructor(scene) {
        super(scene);
        this.sprites = {}
        this.spriteNames = [];
        this.homePos = M.Vec2.ZERO;
        this.hint = null;
        this.alive = true;
        this.gone = false;
        this.deathAnimating = false;
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
            this.remove(this.hint);
            this.hint.destroy();
        }
        this.hint = new M.Hint(this.scene);
        this.add(this.hint);
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
        if (this.exists(this.sprites[spriteName])) {
            this.sprites[spriteName].destroy();
            this.remove(this.sprites[spriteName]);
        }
        const nameIndex = this.spriteNames.indexOf(spriteName);
        if (nameIndex >= 0) {
            this.spriteNames.splice(nameIndex, 1);
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
        if (!this.spriteNames.includes(spriteName)) {
            this.spriteNames.push(spriteName);
        }
        const spr = new Phaser.GameObjects.Sprite(this.scene, pos.x, pos.y, textureKey, frameIdx);
        this.sprites[spriteName] = spr;
        this.add(spr);
    }

    tintSprites(newTint) {
        for (let spName of this.spriteNames) {
            this.sprites[spName].setTint(newTint);
        }
    }

    resetSpritesTint() {
        for (let spName of this.spriteNames) {
            this.sprites[spName].clearTint();
        }
    }

    preUpdate (t, dt) {
        super.preUpdate(t, dt);
    }

    attack(diceValue) {
        console.log("base enemy attacked: " + diceValue);
    }

}

M.Goblin = class extends M.Enemy
{
    constructor(scene, withShield = false) {
        super(scene);
        this.baseAnimInterval = 160;
        this.anim_interval = this.baseAnimInterval;
        this.anim_timer = 0;

        this.current_animation = 1;
        this.anim_state = { side: -1 }

        this.head_shift = 1;

        this.dyingTint = Phaser.Display.Color.IntegerToColor(0x003300);

        this.addSprite("body", M.Vec2.ZERO, "gob_small", 0);
        this.addSprite("shield", M.Vec2.ZERO, "gob_small", 2);
        this.addSprite("head", M.Vec2.ZERO, "gob_small", 4);

        this.shieldBreaking = false;
        this.shielded = withShield;
        if (!this.shielded) {
            this.enemyName = "Goblin";
            this.sprites.shield.visible = false;
        } else {
            this.enemyName = "ShieldGoblin";
        }

        this.refreshHint();
        this.hideHint();
    }

    refreshHint() {
        if (this.shielded) {
            this.setupHint(20, [["less", "4", "", "arrow", "", "guard_break"]]);
        } else {
            this.setupHint(20, [["greater", "2", "", "arrow", "", "skull"]]);
        }
    }

    preUpdate (t, dt) {

        this.anim_timer += dt;
        this.animProcess(dt);
        if (this.anim_timer > this.anim_interval) {
            this.anim_timer = 0;
            this.animUpdate();
        }
    }

    changeAnim(animNumber) {
        this.current_animation = animNumber;
        this.resetAnim();
    }

    resetAnim() {
        this.sprites.head.y = 0;
        this.anim_interval = this.baseAnimInterval;
        switch (this.current_animation) {
            case 1:
                this.sprites.head.setFrame(4);
                this.sprites.body.setFrame(0);
                this.sendToBack(this.sprites.body);
                break;
            case 2:
                this.sprites.head.setFrame(5);
                this.sprites.head.scaleX = 1;
                this.sprites.head.x = 0;
                this.sprites.body.setFrame(1);
                this.bringToTop(this.sprites.body);
                this.anim_state.death_timer = 0;
                this.anim_state.death_total_time = 400;
                break;
            case 3: // laugh
                this.sprites.head.setFrame(4);
                this.sprites.head.x = 0;
                this.anim_interval = 60;
                this.anim_timer = 30;
                this.anim_state.anim_timer = 0;
                this.anim_state.anim_total_time = 600;
                break;
            case 4: // shield break
                this.sprites.head.setFrame(5);
                this.bringToTop(this.sprites.body);
                this.anim_state.anim_timer = 0;
                this.anim_state.anim_total_time = 280;
                break;
        }
    }

    animProcess (dt) {
        switch (this.current_animation) {
            case 2:
                this.anim_state.death_timer += dt;
                const progress = this.anim_state.death_timer / this.anim_state.death_total_time;
                const tintProgress = Math.min(1, progress * 2.2);

                let tintColor = this.dyingTint;
                if (tintProgress < 1) {
                    const colorWhite = Phaser.Display.Color.IntegerToColor(0xffffff);
                    tintColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                        colorWhite, this.dyingTint, 1, tintProgress
                    );
                }
                this.tintSprites(tintColor.color);

                const scaleProgress = Math.max(0, (M.Ease.Cubic.In(progress) * 1.5) - 0.5);
                for (let spName of this.spriteNames) {
                    this.sprites[spName].scaleY = 1 - scaleProgress;
                }

                if (progress >= 1) {
                    this.finishDie();
                }
                break;
            case 3:
                this.anim_state.anim_timer += dt;
                if (this.anim_state.anim_timer > this.anim_state.anim_total_time) {
                    this.changeAnim(1);
                }
                break;
            case 4:
                this.anim_state.anim_timer += dt;
                if (this.anim_state.anim_timer > this.anim_state.anim_total_time) {
                    this.changeAnim(1);
                }
                break;
        }
    }

    animUpdate () {
        const head = this.sprites.head;
        switch (this.current_animation) {
            case 1:
                this.anim_state.side *= -1;
                head.x = this.head_shift * this.anim_state.side;
                if (Math.random() < 0.05) {
                    head.scaleX *= -1;
                    if (Math.random() < 0.7) {
                        const pitchScale = Math.random() * 0.3 + 0.9
                        this.scene.sound.play('gob2_sfx', {pitch: pitchScale});
                    }
                }
                break;
            case 3:
                if (head.y === 0) {
                    head.y = 1;
                } else {
                    head.y = 0;
                }
                break;
        }
    }

    attack(diceValue) {
        if (this.shielded) {
            if (diceValue <= 3 || diceValue > 6) {
                this.scene.sound.play('crack_sfx');
                this.breakShield();

                if (Math.random() < 0.2) {
                    this.scene.sound.play('gob_grunt_sfx');
                }
            } else {
                const laughNum = Math.floor(Math.random() * 2 + 1);
                this.scene.sound.play('laugh' + laughNum + '_sfx');
                this.changeAnim(3); // laugh
            }
        } else {
            if (diceValue <= 2) {
                const laughNum = Math.floor(Math.random() * 2 + 1);
                this.scene.sound.play('laugh' + laughNum + '_sfx');
                this.changeAnim(3); // laugh
            } else {
                this.scene.sound.play('punch_sfx');
                if (Math.random() < 0.75) {
                    this.scene.sound.play('gob_grunt_sfx');
                } else {
                    this.scene.sound.play('gob1_sfx');
                }
                this.startDie();
            }
        }
    }

    preattack(diceValue) {
        if (this.shielded && !this.shieldBreaking) {
            if (diceValue <= 3 || diceValue > 6) {
                this.shieldBreaking = true;
            }
        } else {
            if (diceValue > 2) {
                this.alive = false;
            }
        }
    }

    breakShield() {
        this.enemyName = "Goblin";
        this.shielded = false;
        this.sprites.shield.visible = false;
        this.refreshHint();
        this.changeAnim(4);
    }

    startDie() {
        this.alive = false;
        this.gone = true;
        this.deathAnimating = true;
        this.changeAnim(2);
    }

    finishDie() {
        this.deathAnimating = false;
        this.removeFromDisplayList();
        this.removeFromUpdateList();
    }
}

M.BombGnome = class extends M.Enemy
{
    constructor(scene) {
        super(scene);
        this.enemyName = "BombGnome";

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

        this.dyingTint = Phaser.Display.Color.IntegerToColor(0x330000);

        this.setupHint(26, [
            ["greater", "1", "", "arrow", "", "skull", ""],
            ["equal", "6", "", "arrow", "", "skull", "boom"],
        ]);
        this.hideHint();
    }

    preUpdate (t, dt) {
        this.total_time += dt;
        this.animProcess(dt);

        this.anim_timer += dt;
        if (this.anim_timer > this.anim_interval) {
            this.anim_timer = 0;
            this.animInterval();
        }
    }

    animProcess (dt) {
        let progress
        let tintProgress
        switch (this.current_animation) {
            case 1:
                const arm = this.sprites.arm
                const smoothAngle = this.arm_angle_delta * (
                    Math.cos(this.total_time / this.arm_speed) / 2 - 0.5
                );
                arm.rotation = Math.round(smoothAngle / this.snap) * this.snap;
                break;
            case 2:
                this.anim_state.death_timer += dt;
                progress = this.anim_state.death_timer / this.anim_state.death_total_time;

                tintProgress = Math.min(1, progress * 2.2);
                this.setDeathTint(tintProgress);

                this.setDeathScale(progress, 0.5);

                if (progress >= 1) {
                    this.finishDie();
                }
                break;
            case 3:
                this.anim_state.death_timer += dt;
                progress = this.anim_state.death_timer / this.anim_state.death_total_time;

                tintProgress = Math.min(1, progress * 4.2);
                this.setDeathTint(tintProgress);

                this.setDeathScale(progress, 1.2);

                const boomThreshold = 0.45;
                if (this.spriteNames.includes("boom")) {
                    if (progress < boomThreshold) {
                        const boomScaleProg = M.Ease.Back.Out(Math.min(1, progress * 3.0));
                        this.sprites.boom.scale = 0.75 + boomScaleProg * 0.25
                    } else {
                        this.removeSprite("boom");
                    }
                }

                if (progress >= 1) {
                    this.finishDie();
                }
                break;
        }
    }

    setDeathTint(tintProgress) {
        let tintColor = this.dyingTint;
        if (tintProgress < 1) {
            const colorWhite = Phaser.Display.Color.IntegerToColor(0xffffff);
            tintColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                colorWhite, this.dyingTint, 1, tintProgress
            );
        }
        this.tintSprites(tintColor.color);
        if (this.spriteNames.includes("boom")) {
            this.sprites.boom.clearTint();
        }
    }

    setDeathScale(deathProgress, shrinkOffset) {
        const clampedAdjusted = Math.max(0, Math.min(1, (deathProgress * (1 + shrinkOffset)) - 0.5))
        const scaleProgress = M.Ease.Cubic.In(clampedAdjusted);
        for (let spName of this.spriteNames) {
            this.sprites[spName].scaleY = 1 - scaleProgress;
        }
    }

    animInterval () {
        switch (this.current_animation) {
            case 1:
                const head = this.sprites.head;
                head.y = head.y > 0 ? 0 : 1;
                break;
        }
    }

    changeAnim(animNumber) {
        this.current_animation = animNumber;
        this.resetAnim();
    }

    resetAnim() {
        this.sprites.arm.rotation = 0;
        switch (this.current_animation) {
            case 1:
                this.sprites.body.setFrame(0);
                this.sprites.arm.setFrame(2);
                this.sprites.head.setFrame(6);
                break;
            case 2:
                this.sprites.body.setFrame(1);
                this.sprites.arm.setFrame(3);
                this.sprites.head.setFrame(7);

                this.anim_state.death_timer = 0;
                this.anim_state.death_total_time = 600;
                break;
            case 3:
                this.addSprite("boom", M.Vec2.ZERO, "explosion");
                this.sprites.boom.scale = 0.75;

                this.sprites.body.setFrame(1);
                this.sprites.arm.setFrame(3);
                this.sprites.bomb.visible = false;
                this.sprites.head.setFrame(7);

                this.anim_state.death_timer = 0;
                this.anim_state.death_total_time = 900;
                break;
        }
    }

    attack(diceValue) {
        if (diceValue <= 1) {
            this.scene.sound.play('hoo_sfx');
        } else if (diceValue >= 6) {
            this.startDie(true);
        } else {
            this.scene.sound.play('punch_sfx');
            this.startDie(false);
        }
    }

    preattack(diceValue) {
        if (diceValue > 1) {
            this.alive = false;
            if (diceValue >= 6) {
                this.scene.preExplode(this);
            }
        }
    }

    startDie(exploding) {
        this.alive = false;
        this.gone = true;
        this.deathAnimating = true;
        this.changeAnim(exploding ? 3 : 2);
        if (exploding) {
            setTimeout(() => this.scene.enemyExploded(this), 150);
            //this.scene.enemyExploded(this);
        } else {
            const gruntNum = Math.floor(Math.random() * 3 + 1);
            this.scene.sound.play('gnome_grunt' + gruntNum + '_sfx');
        }
    }

    finishDie() {
        this.deathAnimating = false;
        this.removeFromDisplayList();
        this.removeFromUpdateList();
    }
}

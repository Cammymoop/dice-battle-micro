
function randOffset(size) {
    return (Math.random() - 0.5) * 2 * size;
}

const ROLL_TOTAL = 400;
const ROLL_ONCE = 60;

M.DiceGame = class extends Phaser.Scene
{
    preload()
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

    create()
    {
        M.gameStarted();
        //const roll_anim = {
        //    "key": "roll", "frames": "dices",
        //    "framerate": 10,
        //    "repeat": -1,
        //};
        //this.anims.create(roll_anim);

        this.justClickedLMB = false;
        this.LMBWasClicked = false;

        this.bg = this.add.image(-30, -22, 'background').setOrigin(0, 0);

        this.circle = this.add.image(-6000, 0, "red_circle");

        //this.gob = this.add.sprite(h_center, v_center - 30, 'gob_small');
        this.gob = new M.Goblin(this);
        this.gob.setHomePos(this.screenCenterPos().add(new M.Vec2(-25, -12)));
        this.gob.addToDisplayUpdate();

        this.gnome = new M.BombGnome(this);
        this.gnome.setHomePos(this.screenCenterPos().add(new M.Vec2(25, -12)));
        this.gnome.addToDisplayUpdate();

        const numDice = 3;
        const diceSpacing = 52;
        const center = this.screenCenterPos();
        console.log("center (vertical): " + center.y);
        this.allDice = [];
        for (var i = 0; i < numDice; i++) {
            const xPos = center.x - ((numDice - 1) * diceSpacing * 0.5) + (i * diceSpacing);
            const dice = this.add.sprite(xPos, center.y + 48, 'dices');
            this.allDice.push(dice);

            dice.addPosVec(new M.Vec2(randOffset(6), randOffset(16)));
            dice.roll_target_pos = dice.getPosVec();
            dice.addPosVec(new M.Vec2(randOffset(12), 30));
            dice.roll_from_pos = dice.getPosVec();

            dice.rolling = true;
            dice.roll_anim_timer = 0;
            dice.roll_timer = 0;
            dice.total_roll_time = ROLL_TOTAL + Math.random() * 400;
        }
    }

    screenCenterPos() {
        const h_center = this.game.scale.gameSize.width / 2;
        const v_center = this.game.scale.gameSize.height / 2;
        return new M.Vec2(h_center, v_center);
    }

    update(t, dt) {
        for (var dice of this.allDice) {
            if (dice.rolling) {
                dice.roll_timer += dt;
                dice.roll_anim_timer += dt;

                if (dice.roll_anim_timer > ROLL_ONCE) {
                    dice.roll_anim_timer = 0;
                    var rand_side = Math.floor(Math.random() * 5);
                    var cur_side = parseInt(dice.frame.name);
                    if (rand_side >= cur_side) {
                        rand_side += 1;
                    }
                    dice.setFrame(rand_side);
                }

                const progress = dice.roll_timer / dice.total_roll_time;

                const elevation = Math.sin(progress * Math.PI) * 38;
                const rollVec = dice.roll_target_pos.clone().subtract(dice.roll_from_pos);
                dice.setPosVec(dice.roll_from_pos);
                dice.addPosVec(rollVec.scale(progress));
                dice.addPosVec(M.Vec2.UP.clone().scale(elevation));

                if (dice.roll_timer >= dice.total_roll_time) {
                    dice.total_roll_time = ROLL_TOTAL;
                    dice.rolling = false;
                    console.log("finished rolling, progress: " + progress);
                    console.log("target pos " + dice.roll_target_pos.x + ',' + dice.roll_target_pos.y);
                    console.log("current pos " + dice.x + ',' + dice.y);
                    this.setupRolledDice(dice);
                }
            }
        }

        const activePointer = this.input.activePointer;
        activePointer.updateWorldPoint(this.cameras.default);
        const pVec = new M.Vec2(activePointer.worldX, activePointer.worldY);

        const clicked = activePointer.primaryDown
        this.justClickedLMB = !this.LMBWasClicked && clicked
        this.LMBWasClicked = clicked

        if (this.justClickedLMB) {
            console.log("am click");
        }

        var closestDice = null;
        var minDist = 0;
        for (var dice of this.allDice) {
            if (dice.rolling) {
                continue;
            }
            var pointerDist = pVec.distance(dice.getPosVec());
            if (pointerDist > 49 || (!dice.emphasis && pointerDist > 45)) {
                continue;
            } else if (!closestDice || pointerDist < minDist) {
                minDist = pointerDist;
                closestDice = dice;
            }
        }
        this.changeEmphasisDice(closestDice);
        if (this.justClickedLMB) {
            if (closestDice) {
                this.changeActiveDice(closestDice);
            }
        }
    }

    setupRolledDice(dice) {
        dice.tint = 0xdddddd;
        dice.emphasis = false;
        dice.activeDice = false;
    }

    setDiceEmphasis(dice) {
        if (dice.emphasis) {
            return;
        }
        dice.emphasis = true;
        dice.clearTint();
        dice.y -= 4;
    }
    clearDiceEmphasis(dice) {
        if (!dice.emphasis) {
            return;
        }
        dice.emphasis = false;
        dice.y += 4;
        if (!dice.activeDice) {
            dice.tint = 0xdddddd;
        }
    }

    setDiceActive(dice) {
        dice.activeDice = true;
        dice.clearTint();
        this.circle.setPosVec(dice.getPosVec());
        if (dice.emphasis) {
            this.circle.y += 4;
        }
    }
    clearDiceActive(dice) {
        dice.activeDice = false;
    }

    changeEmphasisDice(newEmphasis) {
        for (var dice of this.allDice) {
            if (dice === newEmphasis) {
                this.setDiceEmphasis(dice);
            } else if (dice.emphasis) {
                this.clearDiceEmphasis(dice);
            }
        }
    }

    changeActiveDice(newActiveDice) {
        for (var dice of this.allDice) {
            if (dice === newActiveDice) {
                this.setDiceActive(dice);
            } else if (dice.activeDice) {
                this.clearDiceActive(dice);
            }
        }
    }
}

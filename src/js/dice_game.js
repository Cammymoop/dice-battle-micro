
function randOffset(size) {
    return Math.round((Math.random() - 0.5) * 2 * size);
}

function smoothRandOffset(size) {
    return (Math.random() - 0.5) * 2 * size;
}

M.Ease = Phaser.Math.Easing;

const ROLL_TOTAL = 400;
const ROLL_ONCE = 60;

const battles = [
    // difficulty tier 0
    [
        [5, "ShieldGoblin", "ShieldGoblin"],
    ],
    [
        [3, "Goblin", "Goblin"],
        [2, "BombGnome", "Goblin"],
        [2, "BombGnome", "BombGnome"],
    ],
    // difficulty tier 1
    [
        [3, "Goblin", "Goblin", "BombGnome"],
        [2, "Goblin", "Goblin"],
        [1, "Goblin"],
    ],
];

const battleBags = [[],[],];

const timerTimes = [16, 12, 8];

function arrShuffle(inArr) {
    return inArr.map((v) => ({v: v, r: Math.random()})).sort((a, b) => a.r - b.r).map(({v}) => v);
}

function getBattle(tier) {
    tier = Math.min(battles.length - 1, tier);
    if (battleBags[tier].length < 1) {
        battleBags[tier] = arrShuffle([...battles[tier]]);
    }
    return [...battleBags[tier].pop()];
}

const enemyTypes = {
    "Goblin": (s) => new M.Goblin(s),
    "ShieldGoblin": (s) => new M.Goblin(s, true),
    "BombGnome": (s) => new M.BombGnome(s),
};

M.DiceGame = class extends Phaser.Scene
{
    create(data)
    {
        this.difficultyVal = data.difficulty;
        this.tier = this.difficultyVal;

        this.battle = getBattle(this.tier);
        this.timeLimit = timerTimes[Math.min(timerTimes.length - 1, this.tier)]

        M.gameStarted();

        this.diceIsActive = false;

        this.justClickedLMB = false;
        this.LMBWasClicked = false;

        this.bg = this.add.image(-30, -22, 'background').setOrigin(0, 0);

        this.stopwatch = new M.Stopwatch(this, this.timeLimit, new M.Vec2(26, 26));
        this.stopwatch.depth = 5;

        this.circle = this.add.image(-6000, 0, "red_circle");
        this.targetArrow = this.add.image(-6000, 0, "target_arrow"); 
        this.targetArrow.setOrigin(1, 0.5);
        this.targetArrow.depth = 2;

        this.allEnemies = [];

        const enemySpacing = 50;
        const enemyYOffset = -12;
        const startOffset = ((this.battle.length - 2) / 2) * enemySpacing;
        for (let i = 1; i < this.battle.length; i++) {
            const newEnemy = enemyTypes[this.battle[i]](this);
            const xOffset = ((i - 1) * enemySpacing) - startOffset;
            newEnemy.setHomePos(this.screenCenterPos().add(new M.Vec2(xOffset, enemyYOffset)));
            newEnemy.addToDisplayUpdate();
            this.allEnemies.push(newEnemy);
        }

        this.reroll = this.add.image(220, 132, "reroll");
        this.reroll.depth = 1;

        this.numDice = this.battle[0];
        this.allDice = [];
        this.rollDice(this.numDice);
    }

    screenCenterPos() {
        const h_center = this.game.scale.gameSize.width / 2;
        const v_center = this.game.scale.gameSize.height / 2;
        return new M.Vec2(h_center, v_center);
    }

    update(t, dt) {
        let pickableDice = 0;
        for (let dice of this.allDice) {
            if (dice.rolling) {
                dice.roll_timer += dt;
                dice.roll_anim_timer += dt;

                if (dice.roll_anim_timer > ROLL_ONCE) {
                    dice.roll_anim_timer = 0;
                    let rand_side = Math.floor(Math.random() * 5);
                    let cur_side = parseInt(dice.frame.name);
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
                    pickableDice += 1;
                    dice.setPosVec(dice.roll_target_pos);
                    this.setupRolledDice(dice);
                }
            } else {
                pickableDice += 1;
            }
        }

        const activePointer = this.input.activePointer;
        activePointer.updateWorldPoint(this.cameras.default);
        const pVec = new M.Vec2(activePointer.worldX, activePointer.worldY);

        const clicked = activePointer.primaryDown
        this.justClickedLMB = !this.LMBWasClicked && clicked
        this.LMBWasClicked = clicked

        let closestEnemy = null;
        let closestDice = null;
        let minDist = 0;
        for (let dice of this.allDice) {
            if (dice.rolling) {
                continue;
            }
            let pointerDist = pVec.distance(dice.getPosVec());
            if (pointerDist > 49 || (!dice.emphasis && pointerDist > 45)) {
                continue;
            } else if (!closestDice || pointerDist < minDist) {
                minDist = pointerDist;
                closestDice = dice;
            }
        }
        for (let enemy of this.allEnemies) {
            if (!enemy.alive) {
                continue;
            }
            let pointerDist = pVec.distance(enemy.getPosVec());
            if (pointerDist > 49) {
                continue;
            } else if (!closestEnemy || pointerDist < minDist) {
                minDist = pointerDist;
                closestEnemy = enemy;
            }
        }

        if (this.isOverReroll(pVec)) {
            closestDice = null;
            closestEnemy = null;
            if (this.justClickedLMB && pickableDice > 0) {
                this.rerollUnused();
            }
        }

        // If close enough to click dice or enemy and any dice is already selected, only consider enemy
        if (closestDice && closestEnemy && this.diceIsActive) {
            closestDice = null;
        }

        let clickedDice = false;
        this.changeEmphasisDice(closestDice);
        if (this.justClickedLMB) {
            if (closestDice && (!closestEnemy || !this.diceIsActive)) {
                clickedDice = true;
                this.changeActiveDice(closestDice);
            }
        }
        for (let enemy of this.allEnemies) {
            if (closestEnemy && enemy === closestEnemy) {
                enemy.showHint();
            } else {
                enemy.hideHint();
            }
        }

        if (closestEnemy && this.diceIsActive && !clickedDice) {
            const activeDice = this.getActiveDice();
            let diceToTargetVec = closestEnemy.getPosVec().subtract(activeDice.getPosVec());

            this.targetArrow.setPosVec(closestEnemy.getPosVec());
            this.targetArrow.rotation = diceToTargetVec.angle();
            if (this.justClickedLMB) {
                const activeDiceVal = this.getDiceVal(activeDice);
                closestEnemy.attack(activeDiceVal);
                this.removeDice(activeDice);
            }
        } else {
            this.targetArrow.x = -6000
        }
    }

    getDiceVal(dice) {
        return parseInt(dice.frame.name) + 1;
    }

    setupRolledDice(dice) {
        dice.tint = 0xdddddd;
        dice.emphasis = false;
        dice.activeDice = false;
    }

    removeDice(dice) {
        const diceIndex = this.allDice.indexOf(dice);
        if (diceIndex < 0) {
            return;
        }
        this.clearDiceActive(dice);
        this.allDice.splice(diceIndex, 1);
        dice.destroy();
        this.numDice = this.allDice.length;
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

    isOverReroll(pointerPos) {
        const relPointer = pointerPos.clone().subtract(this.reroll.getPosVec());
        if (Math.abs(relPointer.x) * 2 > this.reroll.width) {
            return false;
        } else if (Math.abs(relPointer.y) * 2 > this.reroll.height) {
            return false;
        }
        return true;
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
        this.circle.x = -6000;
        this.diceIsActive = false;
    }

    changeEmphasisDice(newEmphasis) {
        for (let dice of this.allDice) {
            if (dice === newEmphasis) {
                this.setDiceEmphasis(dice);
            } else if (dice.emphasis) {
                this.clearDiceEmphasis(dice);
            }
        }
    }

    changeActiveDice(newActiveDice) {
        for (let dice of this.allDice) {
            if (dice !== newActiveDice) {
                this.clearDiceActive(dice);
            }
        }
        this.diceIsActive = true;
        this.setDiceActive(newActiveDice);
    }

    enemyExploded(explodingEnemy) {
        console.log("enemy exploded");
        for (let e of this.allEnemies) {
            if (e === explodingEnemy || !e.alive) {
                continue;
            }
            e.attack(8);
        }
    }

    getActiveDice() {
        if (!this.diceIsActive || this.allDice.length === 0) {
            return null;
        }
        for (let dice of this.allDice) {
            if (dice.activeDice) {
                return dice;
            }
        }
        return null;
    }

    clearAllDice() {
        for (let dice of this.allDice) {
            if (dice.activeDice) {
                this.clearDiceActive(dice);
            }
            dice.destroy();
        }
        this.allDice = [];
    }

    rerollUnused() {
        this.clearAllDice();
        this.rollDice(this.numDice);
    }

    rollDice(num) {
        let diceSpacing = 52;
        if (num > 1) {
            diceSpacing = Math.min(diceSpacing, Math.round(154 / (num - 1)));
        }
        const center = this.screenCenterPos();
        for (let i = 0; i < num; i++) {
            const xPos = center.x - ((num - 1) * diceSpacing * 0.5) + (i * diceSpacing) - 10;
            const dice = this.add.sprite(xPos, center.y + 52, 'dices');
            this.allDice.push(dice);

            dice.addPosVec(new M.Vec2(randOffset(3), randOffset(11)));
            dice.roll_target_pos = dice.getPosVec();
            dice.addPosVec(new M.Vec2(randOffset(16), 30));
            dice.roll_from_pos = dice.getPosVec();

            dice.rolling = true;
            dice.roll_anim_timer = 0;
            dice.roll_timer = 0;
            dice.total_roll_time = ROLL_TOTAL + Math.random() * 400;
        }
    }

    timeUp() {
        this.scene.restart();
    }
}

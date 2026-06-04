
M.Stopwatch = class extends Phaser.GameObjects.Container
{
    constructor(scene, totalSeconds, pos) {
        super(scene);
        this.setPosVec(pos);

        this.elapsed = 0;
        this.totalSeconds = totalSeconds;

        this.frame = new Phaser.GameObjects.Image(scene, 0, -3, 'stopwatch_frame');
        this.add(this.frame);
        this.tens = new Phaser.GameObjects.Image(scene, 0, 0, 'stopwatch_numbers', 0);
        this.add(this.tens);
        this.tens.setOrigin(1, 0.5);
        this.ones = new Phaser.GameObjects.Image(scene, 0, 0, 'stopwatch_numbers', 0);
        this.add(this.ones);
        this.ones.setOrigin(0, 0.5);

        this.addToDisplayList();
        this.addToUpdateList();
        this.showNumber(totalSeconds - 1);
    }

    pause() {
        this.removeFromUpdateList();
    }

    resume() {
        this.addToUpdateList();
    }

    setupHint(height, hintData) {
        this.addHintData(hintData);
        this.hint.y = -height;
    }

    preUpdate (t, dt) {
        this.elapsed += dt;

        const dispSeconds = Math.max(0, Math.floor(this.totalSeconds - (this.elapsed / 1000)));
        this.showNumber(dispSeconds);

        if (this.elapsed / 1000 > this.totalSeconds) {
            this.scene.timeUp();
        }
    }

    showNumber(dispNumber) {
        const num = Math.round(dispNumber) % 100;
        this.tens.setFrame(Math.floor(num / 10));
        this.ones.setFrame(num % 10);
    }
};

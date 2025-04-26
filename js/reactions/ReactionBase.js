export class ReactionBase {
    constructor(player, sceneManager, starfield) {
        this.player = player;
        this.sceneManager = sceneManager;
        this.starfield = starfield;
    }

    react(eventType, data) {
        throw new Error('react() method must be implemented by child class');
    }
}

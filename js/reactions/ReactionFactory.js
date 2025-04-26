import { ConsoleReaction } from './ConsoleReaction.js';

export class ReactionFactory {
    static createReaction(type, player, sceneManager, starfield) {
        switch (type) {
            case 'console':
                return new ConsoleReaction(player, sceneManager, starfield);
            default:
                throw new Error(`Unknown reaction type: ${type}`);
        }
    }
}

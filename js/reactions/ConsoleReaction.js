import { ReactionBase } from './ReactionBase.js';
import { ConsoleReactionMessages } from './ConsoleReactionMessages.js';
import { ConsoleReactionStyles } from './ConsoleReactionStyles.js';
import Debug from '../utils/Debug.js';

export class ConsoleReaction extends ReactionBase {
    constructor(player, sceneManager, starfield) {
        super(player, sceneManager, starfield);
        this.messages = new ConsoleReactionMessages();
        this.styles = new ConsoleReactionStyles();
    }

    react(eventType, data) {
        let message = this.messages.getRandomMessage(eventType);
        if (data) {
            message += ` | Context: ${data}`;
        }
        const style = this.styles.getRandomStyle(eventType);
        Debug.log(`%c[${eventType}] ${message}`, style);
    }
}

import { ReactionFactory } from './ReactionFactory.js';

export class Reactions {
    constructor(player, sceneManager, starfield, settings) {
        this.player = player;
        this.sceneManager = sceneManager;
        this.starfield = starfield;
        this.settings = settings;
        
        // Initialize all reaction types
        this.reactions = {
            console: ReactionFactory.createReaction('console', player, sceneManager, starfield)
        };
    }
    
    // Process an event and trigger appropriate reactions
    processEvent(eventType, data = {}) {
        if (!this.settings.reactionsEnabled) return;
        
        // Send the event to all reaction handlers
        Object.values(this.reactions).forEach(reaction => {
            if (typeof reaction.react === 'function') {
                reaction.react(eventType, data);
            }
        });
    }
    
    // Helper methods for common events
    onShardCollected(count) {
        this.processEvent('shardCollected', { count });
    }
    
    onPlayerTrapped() {
        this.processEvent('playerTrapped');
    }
    
    onPlayerEscaped() {
        this.processEvent('playerEscaped');
    }
    
    onPlayerDestroyed() {
        this.processEvent('playerDestroyed');
    }
    
    // New method for game start reactions
    onGameStart() {
        this.processEvent('gameStart');
    }
}

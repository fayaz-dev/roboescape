import { ReactionFactory } from './ReactionFactory.js';
import soundManager from '../SoundManager.js';

export class Reactions {
    constructor(player, sceneManager, starfield, settings) {
        this.player = player;
        this.sceneManager = sceneManager;
        this.starfield = starfield;
        this.settings = settings;
        
        // Initialize all reaction types
        this.reactions = {
            screen: ReactionFactory.createReaction('screen', player, sceneManager, starfield)
        };
        
        // Initialize sound manager for reactions
        this.soundManager = soundManager;
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
        
        // Play particle collection sound based on value/rarity
        // This will be triggered by the particleCollected event in SoundManager
        // but we keep this as fallback
        if (count >= 8) {
            this.soundManager.playParticleCollected('quantum');
        } else if (count >= 5) {
            this.soundManager.playParticleCollected('rare');
        } else if (count >= 3) {
            this.soundManager.playParticleCollected('unstable');
        } else {
            this.soundManager.playParticleCollected('normal');
        }
    }
    
    onPlayerTrapped() {
        this.processEvent('playerTrapped');
    }
    
    onPlayerEscaped() {
        this.processEvent('playerEscaped');
    }
    
    onPlayerDestroyed() {
        this.processEvent('playerDestroyed');
        
        // Play black hole collision sound
        this.soundManager.playBlackHoleCollision();
        
        // Play game over sound with a slight delay
        setTimeout(() => {
            this.soundManager.playGameOver();
        }, 500);
    }
    
    // New method for game start reactions
    onGameStart() {
        this.processEvent('gameStart');
        
        // Play game start sound
        this.soundManager.playGameStart();
    }
}

import { ReactionBase } from './ReactionBase.js';
import { ConsoleReactionMessages } from './ConsoleReactionMessages.js';

export class ScreenReaction extends ReactionBase {
    constructor(player, sceneManager, starfield) {
        super(player, sceneManager, starfield);
        this.messages = new ConsoleReactionMessages();
        this.messagesContainer = document.getElementById('screen-messages-container');
        
        // Create the container if it doesn't exist
        if (!this.messagesContainer) {
            this.messagesContainer = document.createElement('div');
            this.messagesContainer.id = 'screen-messages-container';
            this.messagesContainer.className = 'screen-messages-container';
            
            // Get the game container and append the messages container
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.appendChild(this.messagesContainer);
            } else {
                document.body.appendChild(this.messagesContainer);
            }
        }
        
        // Position the container at a more visible location
        this.messagesContainer.style.top = '20%';
        
        // Maximum number of messages to display at once
        this.maxMessages = 3;
        // Time before message starts fading out (milliseconds)
        this.messageDuration = 3000;
    }

    react(eventType, data) {
        // Get a random message for this event type
        const message = this.messages.getRandomMessage(eventType);
        
        // Create a new message element
        const messageElement = document.createElement('div');
        messageElement.className = `screen-message message-${eventType || 'default'}`;
        messageElement.textContent = message;
        
        // Add some randomness to the position
        const randomPosition = Math.random() * 10 - 5; // -5% to +5% from center
        messageElement.style.transform = `translateX(${randomPosition}%)`;
        
        // Randomize the duration slightly
        const durationVariation = Math.random() * 1000 - 500; // -500ms to +500ms
        const messageDuration = this.messageDuration + durationVariation;
        
        // Add to the messages container
        this.messagesContainer.appendChild(messageElement);
        
        // Force a repaint to ensure CSS transitions work properly
        messageElement.offsetHeight;
        
        // Show the message with a slight delay
        setTimeout(() => {
            messageElement.classList.add('show');
            
            // Set timeout to fade out and remove the message
            setTimeout(() => {
                messageElement.classList.add('fade-out');
                
                // Remove the message from DOM after fade out
                setTimeout(() => {
                    if (messageElement.parentNode === this.messagesContainer) {
                        this.messagesContainer.removeChild(messageElement);
                    }
                }, 800); // Matches the duration in the CSS fade-out transition
            }, messageDuration);
        }, 50);
        
        // Limit the number of messages by removing older ones if needed
        this.limitMessages();
        
        // Also log to console for debugging and accessibility
        console.log(`[${eventType}] ${message}`);
    }
    
    limitMessages() {
        // Get all current message elements
        const messages = this.messagesContainer.querySelectorAll('.screen-message');
        
        // Remove excess messages from the oldest ones
        if (messages.length > this.maxMessages) {
            const toRemove = messages.length - this.maxMessages;
            for (let i = 0; i < toRemove; i++) {
                if (messages[i] && messages[i].parentNode === this.messagesContainer) {
                    this.messagesContainer.removeChild(messages[i]);
                }
            }
        }
    }
    
    // Method to clear all messages (e.g., when game ends or restarts)
    clearAllMessages() {
        while (this.messagesContainer.firstChild) {
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
    }
}

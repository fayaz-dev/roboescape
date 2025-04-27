import { ReactionBase } from './ReactionBase.js';
import { ConsoleReactionMessages } from './ConsoleReactionMessages.js';

export class ScreenReaction extends ReactionBase {
    constructor(player, sceneManager, starfield) {
        super(player, sceneManager, starfield);
        this.messages = new ConsoleReactionMessages();
        this.ensureMessagesContainer();
        
        // Make container cover the entire game area for message positioning
        this.messagesContainer.style.top = '0';
        this.messagesContainer.style.left = '0';
        this.messagesContainer.style.width = '100%';
        this.messagesContainer.style.height = '100%';
        
        // Screen dimensions for position calculations
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        
        // Update screen dimensions when window resizes
        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
            
            // Update existing messages on resize
            this.adjustExistingMessagesOnResize();
        });
        
        // Initialize positions for message zones (avoid center gameplay area)
        this.initializeMessageZones();
        
        // Maximum number of messages to display at once
        this.maxMessages = 3;
        // Time before message starts fading out (milliseconds)
        this.messageDuration = 3000;
    }
    
    // Define message zones that avoid the center of the screen
    initializeMessageZones() {
        // Create regions where messages can appear (top, sides, bottom)
        this.messageZones = [
            { name: 'top', x: 0.5, y: 0.15 },        // Top center
            { name: 'topLeft', x: 0.2, y: 0.2 },     // Top left
            { name: 'topRight', x: 0.8, y: 0.2 },    // Top right
            { name: 'bottomLeft', x: 0.2, y: 0.8 },  // Bottom left
            { name: 'bottomRight', x: 0.8, y: 0.8 }, // Bottom right
            { name: 'bottom', x: 0.5, y: 0.85 }      // Bottom center
        ];
        
        // Create regions where messages can move to during fade-out
        this.fadeOutDestinations = [
            { x: 0.1, y: 0.1 },   // Top left corner
            { x: 0.9, y: 0.1 },   // Top right corner
            { x: 0.1, y: 0.9 },   // Bottom left corner
            { x: 0.9, y: 0.9 },   // Bottom right corner
            { x: 0.5, y: 0.05 },  // Top center edge
            { x: 0.5, y: 0.95 },  // Bottom center edge
            { x: 0.05, y: 0.5 },  // Left center edge
            { x: 0.95, y: 0.5 }   // Right center edge
        ];
    }

    react(eventType, data) {
        // Ensure the messages container exists and is in the DOM
        this.ensureMessagesContainer();
        
        // Get a random message for this event type
        const message = this.messages.getRandomMessage(eventType);
        
        // Create a new message element
        const messageElement = document.createElement('div');
        messageElement.className = `screen-message message-${eventType || 'default'}`;
        messageElement.textContent = message;
        
        // Adjust font size based on screen size and message length
        this.adjustMessageSize(messageElement, message);
        
        // Get random starting position from defined zones
        const startZone = this.getRandomMessageZone();
        
        // Position the message at the selected zone with absolute positioning
        messageElement.style.position = 'absolute';
        messageElement.style.left = `${startZone.x * 100}%`;
        messageElement.style.top = `${startZone.y * 100}%`;
        messageElement.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Keep track of its starting position for fade-out animation
        messageElement.dataset.startX = startZone.x;
        messageElement.dataset.startY = startZone.y;
        
        // Randomize the duration slightly
        const durationVariation = Math.random() * 1000 - 500; // -500ms to +500ms
        const messageDuration = this.messageDuration + durationVariation;
        
        // Add to the messages container
        this.messagesContainer.appendChild(messageElement);
        
        // Force a repaint to ensure CSS transitions work properly
        messageElement.offsetHeight;
        
        // Show the message with a slight delay
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translate(-50%, -50%) scale(1)';
            
            // Set timeout to fade out and fly away
            setTimeout(() => {
                // Get a destination zone far from the starting zone
                const endZone = this.getRandomFadeOutDestination(
                    parseFloat(messageElement.dataset.startX),
                    parseFloat(messageElement.dataset.startY)
                );
                
                // Create a smooth transition to the new position with fade out
                messageElement.style.opacity = '0';
                messageElement.style.transform = `translate(-50%, -50%) scale(0.8)`;
                messageElement.style.left = `${endZone.x * 100}%`;
                messageElement.style.top = `${endZone.y * 100}%`;
                messageElement.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out, left 1.2s ease-in-out, top 1.2s ease-in-out';
                
                // Remove the message from DOM after fade out
                setTimeout(() => {
                    if (messageElement.parentNode === this.messagesContainer) {
                        this.messagesContainer.removeChild(messageElement);
                    }
                }, 1200); // Slightly longer to allow for the position transition
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
    
    // Method to ensure the messages container exists and is properly connected to DOM
    ensureMessagesContainer() {
        this.messagesContainer = document.getElementById('screen-messages-container');
        
        // Create the container if it doesn't exist or isn't connected to the DOM
        if (!this.messagesContainer || !document.body.contains(this.messagesContainer)) {
            // If there's an old disconnected element with this ID, remove it
            if (this.messagesContainer) {
                if (this.messagesContainer.parentNode) {
                    this.messagesContainer.parentNode.removeChild(this.messagesContainer);
                }
            }
            
            // Create a new container
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
    }
    
    // Method to clear all messages (e.g., when game ends or restarts)
    clearAllMessages() {
        this.ensureMessagesContainer();
        while (this.messagesContainer.firstChild) {
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
    }
    
    // Adjust message font size based on screen dimensions and message length
    adjustMessageSize(messageElement, message) {
        const baseSize = Math.min(this.screenWidth, this.screenHeight) * 0.04;
        const messageLengthFactor = message.length > 50 ? 0.8 : 1;
        const finalSize = Math.min(Math.max(baseSize * messageLengthFactor, 14), 36);
        messageElement.style.fontSize = `${finalSize}px`;
        
        // Also limit width based on screen size
        const maxWidth = Math.min(this.screenWidth * 0.8, 600);
        messageElement.style.maxWidth = `${maxWidth}px`;
        
        // Adjust padding based on size too
        const paddingSize = Math.max(finalSize * 0.4, 8);
        messageElement.style.padding = `${paddingSize}px ${paddingSize * 1.5}px`;
    }
    
    // Get a random zone for the message to appear
    getRandomMessageZone() {
        const index = Math.floor(Math.random() * this.messageZones.length);
        return this.messageZones[index];
    }
    
    // Get a random destination for fade-out that's different from the starting point
    getRandomFadeOutDestination(startX, startY) {
        // Filter destinations that are far enough from the starting position
        const MIN_DISTANCE = 0.3; // Minimum 30% of screen width/height
        
        const farDestinations = this.fadeOutDestinations.filter(dest => {
            const distanceX = Math.abs(dest.x - startX);
            const distanceY = Math.abs(dest.y - startY);
            return Math.sqrt(distanceX * distanceX + distanceY * distanceY) > MIN_DISTANCE;
        });
        
        // If no suitable destinations, use any destination
        const destinations = farDestinations.length > 0 ? farDestinations : this.fadeOutDestinations;
        return destinations[Math.floor(Math.random() * destinations.length)];
    }
    
    // Adjust existing messages when the screen resizes
    adjustExistingMessagesOnResize() {
        const messages = this.messagesContainer.querySelectorAll('.screen-message');
        messages.forEach(msg => {
            // Re-apply font size adjustment based on new screen dimensions
            this.adjustMessageSize(msg, msg.textContent);
            
            // Make sure message is still within screen bounds
            const currentLeft = parseFloat(msg.style.left) / 100;
            const currentTop = parseFloat(msg.style.top) / 100;
            
            // Ensure positions are within bounds
            const boundedLeft = Math.min(Math.max(currentLeft, 0.1), 0.9);
            const boundedTop = Math.min(Math.max(currentTop, 0.1), 0.9);
            
            if (boundedLeft !== currentLeft || boundedTop !== currentTop) {
                msg.style.left = `${boundedLeft * 100}%`;
                msg.style.top = `${boundedTop * 100}%`;
            }
        });
    }
}

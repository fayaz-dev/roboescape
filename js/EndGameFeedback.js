// End Game Feedback module to handle player performance feedback
export class EndGameFeedback {
    constructor() {
        // Create the DOM elements
        this.createElements();
        
        // Initially hide the feedback panel
        this.hidePanel();
    }
    
    createElements() {
        // Create the overall panel
        this.panel = document.createElement('div');
        this.panel.className = 'end-game-feedback';
        this.panel.style.display = 'none';
        
        // Create the content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'feedback-content';
        
        // Create the heading
        this.heading = document.createElement('h2');
        this.heading.className = 'feedback-heading';
        contentContainer.appendChild(this.heading);
        
        // Create the stats container
        this.statsContainer = document.createElement('div');
        this.statsContainer.className = 'feedback-stats';
        contentContainer.appendChild(this.statsContainer);
        
        // Create the rank container
        this.rankContainer = document.createElement('div');
        this.rankContainer.className = 'feedback-rank';
        contentContainer.appendChild(this.rankContainer);
        
        // Create the message container
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'feedback-message';
        contentContainer.appendChild(this.messageContainer);
        
        // Create the button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'feedback-buttons';
        
        // Create play again button
        this.playAgainButton = document.createElement('button');
        this.playAgainButton.className = 'play-again-button';
        this.playAgainButton.textContent = 'PLAY AGAIN';
        buttonContainer.appendChild(this.playAgainButton);
        
        // Create menu buttons container (similar to home page)
        const menuButtons = document.createElement('div');
        menuButtons.className = 'menu-buttons';
        
        // Create settings button
        this.settingsButton = document.createElement('button');
        this.settingsButton.className = 'menu-button';
        this.settingsButton.textContent = 'Settings';
        menuButtons.appendChild(this.settingsButton);
        
        // Create leaderboard button
        this.leaderboardButton = document.createElement('button');
        this.leaderboardButton.className = 'menu-button';
        this.leaderboardButton.textContent = 'Leaderboard';
        menuButtons.appendChild(this.leaderboardButton);
        
        // Add all elements to the panel
        this.panel.appendChild(contentContainer);
        this.panel.appendChild(buttonContainer);
        this.panel.appendChild(menuButtons);
        
        // Add the panel to the body
        document.body.appendChild(this.panel);
    }
    
    showFeedback(score, time, particles) {
        // Format time
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Set heading
        this.heading.textContent = 'OBLITERATED';
        
        // Set the stats
        this.statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Final Score:</span>
                <span class="stat-value">${score}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Time Survived:</span>
                <span class="stat-value">${timeString}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Particles Collected:</span>
                <span class="stat-value">${particles}</span>
            </div>
        `;
        
        // Determine rank and message based on performance
        const { rank, message, badge } = this.determineRankAndMessage(score, time, particles);
        
        // Set the rank
        this.rankContainer.innerHTML = `<div class="rank-badge">${badge} Rank: ${rank} ${badge}</div>`;
        
        // Set the message
        this.messageContainer.textContent = message;
        
        // Show the panel with a fade-in effect
        this.panel.style.display = 'flex';
        this.panel.style.opacity = '0';
        setTimeout(() => {
            this.panel.style.opacity = '1';
        }, 50);
    }
    
    determineRankAndMessage(score, time, particles) {
        // Default rank
        let rank = "Rookie";
        let message = "A valiant effort, but the void calls.";
        let badge = "🥉"; // Bronze

        // Tier 1: Basic
        if (score > 50 && time > 60 && particles > 10) {
            rank = "Explorer";
            message = "You navigated the dangers well!";
            badge = "🥈"; // Silver
        }
        // Tier 2: Intermediate
        if (score > 150 && time > 120 && particles > 25) {
            rank = "Veteran";
            message = "A true cosmic survivor!";
            badge = "🥇"; // Gold
        }
        // Tier 3: Advanced
        if (score > 300 && time > 180 && particles > 50) {
            rank = "Ace Pilot";
            message = "Master of the void! Legendary run!";
            badge = "🏆"; // Trophy
        }
        
        return { rank, message, badge };
    }
    
    hidePanel() {
        this.panel.style.opacity = '0';
        setTimeout(() => {
            this.panel.style.display = 'none';
        }, 300);
    }
    
    setPlayAgainHandler(handler) {
        this.playAgainButton.addEventListener('click', () => {
            this.hidePanel();
            handler();
        });
    }
    
    setSettingsHandler(handler) {
        this.settingsButton.addEventListener('click', () => {
            // Semi-hide this panel to show settings
            this.panel.style.opacity = '0.3';
            handler();
            
            // Find settings panel close button and add a listener to restore this panel
            const settingsCloseButton = document.getElementById('settings-close');
            if (settingsCloseButton) {
                const originalOnclick = settingsCloseButton.onclick;
                settingsCloseButton.onclick = (e) => {
                    // Run original close handler if it exists
                    if (originalOnclick) originalOnclick.call(settingsCloseButton, e);
                    // Restore this panel
                    this.panel.style.opacity = '1';
                };
            }
        });
    }
    
    setLeaderboardHandler(handler) {
        this.leaderboardButton.addEventListener('click', () => {
            // Semi-hide this panel to show leaderboard
            this.panel.style.opacity = '0.3';
            handler();
            
            // Find leaderboard panel close button and add a listener to restore this panel
            const leaderboardCloseButton = document.getElementById('leaderboard-close');
            if (leaderboardCloseButton) {
                const originalOnclick = leaderboardCloseButton.onclick;
                leaderboardCloseButton.onclick = (e) => {
                    // Run original close handler if it exists
                    if (originalOnclick) originalOnclick.call(leaderboardCloseButton, e);
                    // Restore this panel
                    this.panel.style.opacity = '1';
                };
            }
        });
    }
}

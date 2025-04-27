// filepath: /home/fayaz/lab/roboescape/js/UIManager.js
/**
 * UIManager - Utility class for managing common UI functionality across screens
 */
export class UIManager {
    constructor() {
        // Cache references to common UI elements
        this.leaderboardPanel = document.getElementById('leaderboard-panel');
        this.leaderboardClose = document.getElementById('leaderboard-close');
        this.homeSettingsPanel = document.getElementById('home-settings-panel');
        this.settingsClose = document.getElementById('settings-close');
        
        // Reference to parent element that might need to be partially hidden/restored
        this.activeParent = null;
        this.originalOpacity = '1';
        
        // Game controller reference for settings access
        this.gameController = null;
    }
    
    /**
     * Set the game controller reference to access settings
     * @param {Object} controller - The game controller instance
     */
    setGameController(controller) {
        this.gameController = controller;
    }

    /**
     * Toggle the leaderboard panel visibility
     * @param {HTMLElement} [parentElement] - Optional parent element to partially hide
     */
    toggleLeaderboard(parentElement = null) {
        if (this.leaderboardPanel.style.display === 'block') {
            this.leaderboardPanel.style.display = 'none';
            // Restore parent's opacity if needed
            if (this.activeParent) {
                this.activeParent.style.opacity = this.originalOpacity;
                this.activeParent = null;
            }
        } else {
            // Hide settings panel if it's open
            this.homeSettingsPanel.style.display = 'none';
            this.leaderboardPanel.style.display = 'block';
            
            // Handle parent element semi-hiding
            if (parentElement) {
                this.activeParent = parentElement;
                this.originalOpacity = parentElement.style.opacity || '1';
                parentElement.style.opacity = '0.3';
                
                // Make sure to restore opacity when leaderboard is closed
                const originalOnclick = this.leaderboardClose.onclick;
                this.leaderboardClose.onclick = (e) => {
                    // Run original close handler if it exists
                    if (originalOnclick) originalOnclick.call(this.leaderboardClose, e);
                    
                    // Restore parent's opacity
                    if (this.activeParent) {
                        this.activeParent.style.opacity = this.originalOpacity;
                        this.activeParent = null;
                    }
                    
                    // Hide panel
                    this.leaderboardPanel.style.display = 'none';
                };
            }
        }
    }
    
    /**
     * Toggle the settings panel visibility
     * @param {HTMLElement} [parentElement] - Optional parent element to partially hide
     */
    toggleSettings(parentElement = null) {
        if (this.homeSettingsPanel.style.display === 'block') {
            this.homeSettingsPanel.style.display = 'none';
            // Restore parent's opacity if needed
            if (this.activeParent) {
                this.activeParent.style.opacity = this.originalOpacity;
                this.activeParent = null;
            }
        } else {
            // Hide leaderboard panel if it's open
            this.leaderboardPanel.style.display = 'none';
            
            // Initialize settings panel content before showing
            this.initializeSettingsPanel();
            
            // Show the panel
            this.homeSettingsPanel.style.display = 'block';
            
            // Handle parent element semi-hiding
            if (parentElement) {
                this.activeParent = parentElement;
                this.originalOpacity = parentElement.style.opacity || '1';
                parentElement.style.opacity = '0.3';
                
                // Make sure to restore opacity when settings are closed
                const originalOnclick = this.settingsClose.onclick;
                this.settingsClose.onclick = (e) => {
                    // Run original close handler if it exists
                    if (originalOnclick) originalOnclick.call(this.settingsClose, e);
                    
                    // Restore parent's opacity
                    if (this.activeParent) {
                        this.activeParent.style.opacity = this.originalOpacity;
                        this.activeParent = null;
                    }
                    
                    // Hide panel
                    this.homeSettingsPanel.style.display = 'none';
                };
            }
        }
    }
    
    /**
     * Initialize or refresh the settings panel content
     */
    initializeSettingsPanel() {
        if (this.gameController && this.gameController.settings) {
            // Get the settings content container
            const settingsContent = document.querySelector('.home-settings-panel .settings-content');
            
            // Clear previous content
            settingsContent.innerHTML = '';
            
            // Create player color settings
            const colorSection = document.createElement('div');
            colorSection.className = 'settings-section';
            
            const colorTitle = document.createElement('h3');
            colorTitle.textContent = 'Robot Color';
            colorSection.appendChild(colorTitle);
            
            const colorGrid = document.createElement('div');
            colorGrid.className = 'color-grid';
            
            // Get color options from settings
            const colors = this.gameController.settings.playerColorsCss.map(c => c.css);
            const currentColor = this.gameController.settings.getCurrentPlayerColorCss();
            
            colors.forEach(color => {
                const colorOption = document.createElement('div');
                colorOption.className = 'color-option';
                colorOption.style.backgroundColor = color;
                
                // Mark as selected if it matches current player color
                if (currentColor === color) {
                    colorOption.classList.add('selected');
                }
                
                colorOption.addEventListener('click', () => {
                    // Remove selection from all options
                    document.querySelectorAll('.color-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Add selection to clicked option
                    colorOption.classList.add('selected');
                    
                    // Update player color
                    this.gameController.settings.updatePlayerColor(color);
                });
                
                colorGrid.appendChild(colorOption);
            });
            
            colorSection.appendChild(colorGrid);
            settingsContent.appendChild(colorSection);
            
            // Create reaction toggle
            const reactionSection = document.createElement('div');
            reactionSection.className = 'settings-section';
            
            const reactionTitle = document.createElement('h3');
            reactionTitle.textContent = 'Game Reactions';
            reactionSection.appendChild(reactionTitle);
            
            // Create toggle switch
            const toggleContainer = document.createElement('div');
            toggleContainer.style.display = 'flex';
            toggleContainer.style.alignItems = 'center';
            toggleContainer.style.marginTop = '10px';
            
            const toggle = document.createElement('label');
            toggle.className = 'toggle-switch';
            toggle.style.position = 'relative';
            toggle.style.display = 'inline-block';
            toggle.style.width = '60px';
            toggle.style.height = '30px';
            toggle.style.marginRight = '10px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.opacity = '0';
            checkbox.style.width = '0';
            checkbox.style.height = '0';
            checkbox.checked = this.gameController.settings.reactionsEnabled;
            
            const slider = document.createElement('span');
            slider.style.position = 'absolute';
            slider.style.cursor = 'pointer';
            slider.style.top = '0';
            slider.style.left = '0';
            slider.style.right = '0';
            slider.style.bottom = '0';
            slider.style.backgroundColor = checkbox.checked ? '#00ccff' : '#333';
            slider.style.borderRadius = '30px';
            slider.style.transition = '.4s';
            
            const sliderBefore = document.createElement('span');
            sliderBefore.style.position = 'absolute';
            sliderBefore.style.content = '""';
            sliderBefore.style.height = '22px';
            sliderBefore.style.width = '22px';
            sliderBefore.style.left = checkbox.checked ? '34px' : '4px';
            sliderBefore.style.bottom = '4px';
            sliderBefore.style.backgroundColor = 'white';
            sliderBefore.style.borderRadius = '50%';
            sliderBefore.style.transition = '.4s';
            
            const label = document.createElement('span');
            label.textContent = 'Enable gameplay reactions';
            
            // Add event listener
            checkbox.addEventListener('change', function() {
                sliderBefore.style.left = this.checked ? '34px' : '4px';
                slider.style.backgroundColor = this.checked ? '#00ccff' : '#333';
                this.gameController.settings.toggleReactions(this.checked);
            }.bind(this));
            
            slider.appendChild(sliderBefore);
            toggle.appendChild(checkbox);
            toggle.appendChild(slider);
            toggleContainer.appendChild(toggle);
            toggleContainer.appendChild(label);
            reactionSection.appendChild(toggleContainer);
            
            settingsContent.appendChild(reactionSection);
        }
    }
}

// Create singleton instance
const uiManager = new UIManager();
export default uiManager;

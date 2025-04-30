import Debug from './utils/Debug.js';

export class Settings {
    constructor() {
        this.isOpen = false;
        this.playerColors = [
            { name: "White", bodyColor: 0xffffff, helmetColor: 0xdddddd },
            { name: "Blue", bodyColor: 0x3498db, helmetColor: 0xa2c4db },
            { name: "Red", bodyColor: 0xe74c3c, helmetColor: 0xf5b7b1 },
            { name: "Green", bodyColor: 0x2ecc71, helmetColor: 0xa2dfb2 },
            { name: "Yellow", bodyColor: 0xf1c40f, helmetColor: 0xf7dc6f }
        ];
        
        // Convert the player colors to CSS hex format for the home page settings
        this.playerColorsCss = this.playerColors.map(color => ({
            name: color.name,
            css: '#' + color.bodyColor.toString(16).padStart(6, '0')
        }));
        
        this.selectedColorIndex = 0;
        this.reactionsEnabled = true;
        
        // Load saved preferences from localStorage if available
        this.loadSettings();
        
        // Create in-game settings UI
        this.createSettingsUI();
    }
    
    loadSettings() {
        try {
            const savedSettings = JSON.parse(localStorage.getItem('blackholeSettings'));
            if (savedSettings) {
                this.selectedColorIndex = savedSettings.colorIndex || 0;
                this.reactionsEnabled = savedSettings.reactionsEnabled !== undefined ? 
                    savedSettings.reactionsEnabled : true;
            }
        } catch (e) {
            Debug.error("Error loading settings:", e);
        }
    }
    
    saveSettings() {
        const settings = {
            colorIndex: this.selectedColorIndex,
            reactionsEnabled: this.reactionsEnabled
        };
        localStorage.setItem('blackholeSettings', JSON.stringify(settings));
    }
    
    createSettingsUI() {
        // Create settings icon container
        this.settingsIcon = document.createElement('div');
        this.settingsIcon.className = 'settings-icon';
        this.settingsIcon.innerHTML = '⚙️';
        document.body.appendChild(this.settingsIcon);
        
        // Create settings panel
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.className = 'settings-panel';
        this.settingsPanel.style.display = 'none';
        document.body.appendChild(this.settingsPanel);
        
        // Create panel header
        const header = document.createElement('div');
        header.className = 'settings-header';
        header.textContent = 'Settings';
        this.settingsPanel.appendChild(header);
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'settings-close';
        closeBtn.textContent = '×';
        header.appendChild(closeBtn);
        
        // Create color selection section
        const colorSection = document.createElement('div');
        colorSection.className = 'settings-section';
        this.settingsPanel.appendChild(colorSection);
        
        const colorTitle = document.createElement('h3');
        colorTitle.textContent = 'Player Color';
        colorSection.appendChild(colorTitle);
        
        // Color selection grid
        const colorGrid = document.createElement('div');
        colorGrid.className = 'color-grid';
        colorSection.appendChild(colorGrid);
        
        // Add color options
        this.colorButtons = [];
        this.playerColors.forEach((color, index) => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = '#' + color.bodyColor.toString(16).padStart(6, '0');
            colorOption.dataset.index = index;
            
            if (index === this.selectedColorIndex) {
                colorOption.classList.add('selected');
            }
            
            colorGrid.appendChild(colorOption);
            this.colorButtons.push(colorOption);
        });
        
        // Add reactions toggle section
        const reactionSection = document.createElement('div');
        reactionSection.className = 'settings-section';
        this.settingsPanel.appendChild(reactionSection);
        
        const reactionTitle = document.createElement('h3');
        reactionTitle.textContent = 'Reactions';
        reactionSection.appendChild(reactionTitle);
        
        const reactionToggle = document.createElement('label');
        reactionToggle.className = 'toggle-switch';
        reactionToggle.innerHTML = `
            <input type="checkbox" ${this.reactionsEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
            <span class="toggle-label">Enable Reactions</span>
        `;
        reactionSection.appendChild(reactionToggle);
        
        // Add event listener for reaction toggle
        reactionToggle.querySelector('input').addEventListener('change', (e) => {
            this.reactionsEnabled = e.target.checked;
        });
        
        // Event listeners
        this.settingsIcon.addEventListener('click', () => this.toggleSettings());
        closeBtn.addEventListener('click', () => this.toggleSettings());
        
        this.colorButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.selectColor(index);
            });
        });
    }
    
    toggleSettings() {
        this.isOpen = !this.isOpen;
        this.settingsPanel.style.display = this.isOpen ? 'block' : 'none';
    }
    
    selectColor(index) {
        if (index >= 0 && index < this.playerColors.length) {
            // Remove selected class from previous selection
            if (this.colorButtons && this.colorButtons[this.selectedColorIndex]) {
                this.colorButtons[this.selectedColorIndex].classList.remove('selected');
            }
            
            // Update selected color
            this.selectedColorIndex = index;
            
            // Add selected class to new selection
            if (this.colorButtons && this.colorButtons[this.selectedColorIndex]) {
                this.colorButtons[this.selectedColorIndex].classList.add('selected');
            }
            
            // Dispatch custom event for player to update color
            window.dispatchEvent(new CustomEvent('playerColorChange', {
                detail: this.playerColors[this.selectedColorIndex]
            }));
            
            // Save settings to localStorage
            this.saveSettings();
        }
    }
    
    updatePlayerColor(cssColor) {
        // Find the corresponding index from CSS color
        const index = this.playerColorsCss.findIndex(color => color.css === cssColor);
        if (index !== -1) {
            this.selectColor(index);
        } else {
            // If color is not in our predefined list, we could add it or ignore
            Debug.log("Custom color not in predefined list:", cssColor);
        }
    }
    
    getCurrentPlayerColor() {
        return this.playerColors[this.selectedColorIndex];
    }
    
    getCurrentPlayerColorCss() {
        return this.playerColorsCss[this.selectedColorIndex].css;
    }
    
    toggleReactions(enabled) {
        this.reactionsEnabled = enabled;
        this.saveSettings();
    }
}
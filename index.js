import { GameController } from './js/GameController.js';
import { SceneManager } from './js/SceneManager.js';
import { Player } from './js/Player.js';
import { BlackHole } from './js/BlackHole.js';
import { Starfield } from './js/Starfield.js';
import { ExoticParticles } from './js/ExoticParticles.js';
import { Settings } from './js/Settings.js';
import { HomeBackground } from './js/HomeBackground.js';

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    const homePage = document.getElementById('home-page');
    const homeBackgroundCanvas = document.getElementById('home-background');
    const startButton = document.getElementById('start-button');
    const settingsButton = document.getElementById('settings-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const leaderboardPanel = document.getElementById('leaderboard-panel');
    const leaderboardClose = document.getElementById('leaderboard-close');
    const homeSettingsPanel = document.getElementById('home-settings-panel');
    const settingsClose = document.getElementById('settings-close');
    const leaderboardList = document.getElementById('leaderboard-list');
    
    // Initialize home page background animation
    const homeBackground = new HomeBackground(homeBackgroundCanvas);
    
    // Set background canvas size
    homeBackgroundCanvas.width = window.innerWidth;
    homeBackgroundCanvas.height = window.innerHeight;
    
    let gameController;
    let gameInitialized = false;
    
    // Initialize leaderboard from localStorage
    const leaderboard = JSON.parse(localStorage.getItem('blackholeLeaderboard')) || [];
    updateLeaderboardDisplay();
    
    // Set up event listeners for the home page
    startButton.addEventListener('click', startGame);
    settingsButton.addEventListener('click', toggleSettings);
    leaderboardButton.addEventListener('click', toggleLeaderboard);
    leaderboardClose.addEventListener('click', toggleLeaderboard);
    settingsClose.addEventListener('click', toggleSettings);
    
    // Initialize home background animation
    homeBackground.init();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (gameInitialized) {
            gameController.sceneManager.handleResize();
        }
        
        // Resize home background canvas
        homeBackgroundCanvas.width = window.innerWidth;
        homeBackgroundCanvas.height = window.innerHeight;
        homeBackground.resize();
    });
    
    // Preload and initialize the game in the background
    initializeGame();
    
    function initializeGame() {
        const sceneManager = new SceneManager();
        const player = new Player();
        const blackHole = new BlackHole();
        const starfield = new Starfield();
        const dataShards = new ExoticParticles();
        const settings = new Settings();
        
        // Create game controller and pass all components
        gameController = new GameController({
            sceneManager,
            player,
            blackHole,
            starfield, 
            dataShards,
            settings,
            onGameOver: handleGameOver
        });
        
        // Setup the game
        gameController.setup();
        
        // Start animations but don't start actual gameplay yet
        gameController.animateOnly();
        
        gameInitialized = true;
    }
    
    function startGame() {
        // Fade out home page
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            homePage.style.opacity = opacity;
            
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                homePage.style.display = 'none';
                homePage.style.opacity = 1; // Reset opacity for next time
                
                // Hide any open panels
                leaderboardPanel.style.display = 'none';
                homeSettingsPanel.style.display = 'none';
                
                if (gameController.gameOver) {
                    // If game is over from a previous session, restart it
                    gameController.restart();
                }
                
                // Start the actual gameplay
                gameController.startGame();
            }
        }, 20);
    }
    
    function handleGameOver(score, time) {
        // Show home page again with animation
        homePage.style.opacity = 0;
        homePage.style.display = 'block';
        
        // Fade in the home page
        let opacity = 0;
        const fadeInterval = setInterval(() => {
            opacity += 0.05;
            homePage.style.opacity = opacity;
            
            if (opacity >= 1) {
                clearInterval(fadeInterval);
            }
        }, 30);
        
        // Update leaderboard with new score
        updateLeaderboard(score, time);
        
        // Change start button text to "PLAY AGAIN"
        startButton.textContent = "PLAY AGAIN";
    }
    
    function updateLeaderboard(score, time) {
        if (score > 0) {
            // Add new score to leaderboard
            leaderboard.push({
                score: score,
                time: time,
                date: new Date().toLocaleDateString()
            });
            
            // Sort by score (highest first)
            leaderboard.sort((a, b) => b.score - a.score);
            
            // Keep only top 10
            if (leaderboard.length > 10) {
                leaderboard.length = 10;
            }
            
            // Save to localStorage
            localStorage.setItem('blackholeLeaderboard', JSON.stringify(leaderboard));
            
            // Update display
            updateLeaderboardDisplay();
        }
    }
    
    function updateLeaderboardDisplay() {
        // Clear current entries
        leaderboardList.innerHTML = '';
        
        // Add entries from leaderboard array
        leaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            
            const rank = document.createElement('span');
            rank.className = 'leaderboard-rank';
            rank.textContent = (index + 1);
            
            const info = document.createElement('span');
            info.textContent = `${formatTime(entry.time)} - ${entry.date}`;
            
            const score = document.createElement('span');
            score.className = 'leaderboard-score';
            score.textContent = entry.score;
            
            li.appendChild(rank);
            li.appendChild(info);
            li.appendChild(score);
            leaderboardList.appendChild(li);
        });
        
        // If no entries, show a message
        if (leaderboard.length === 0) {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            li.textContent = 'No scores yet. Play the game!';
            leaderboardList.appendChild(li);
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function toggleLeaderboard() {
        if (leaderboardPanel.style.display === 'block') {
            leaderboardPanel.style.display = 'none';
        } else {
            leaderboardPanel.style.display = 'block';
            homeSettingsPanel.style.display = 'none';
        }
    }
    
    function toggleSettings() {
        if (homeSettingsPanel.style.display === 'block') {
            homeSettingsPanel.style.display = 'none';
        } else {
            homeSettingsPanel.style.display = 'block';
            leaderboardPanel.style.display = 'none';                // Load settings from the existing Settings module
                if (gameController && gameController.settings) {
                    // Clone settings panel content from the in-game settings
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
                    const colors = gameController.settings.playerColorsCss.map(c => c.css);
                    const currentColor = gameController.settings.getCurrentPlayerColorCss();
                    
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
                            gameController.settings.updatePlayerColor(color);
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
                    checkbox.checked = gameController.settings.reactionsEnabled;
                    
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
                        gameController.settings.toggleReactions(this.checked);
                    });
                    
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
});
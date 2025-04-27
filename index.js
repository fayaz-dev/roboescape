import { GameController } from './js/GameController.js';
import { SceneManager } from './js/SceneManager.js';
import { Player } from './js/Player.js';
import { BlackHole } from './js/BlackHole.js';
import { Starfield } from './js/Starfield.js';
import { ExoticParticles } from './js/ExoticParticles.js';
import { Settings } from './js/Settings.js';
import { HomeBackground } from './js/HomeBackground.js';
import uiManager from './js/UIManager.js';

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
    settingsButton.addEventListener('click', () => uiManager.toggleSettings());
    leaderboardButton.addEventListener('click', () => uiManager.toggleLeaderboard());
    leaderboardClose.addEventListener('click', () => uiManager.toggleLeaderboard());
    settingsClose.addEventListener('click', () => uiManager.toggleSettings());
    
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
        
        // Set the game controller reference in the UI manager
        uiManager.setGameController(gameController);
        
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
                
                if (gameController && gameController.gameOver) {
                    // If game is over from a previous session, restart it
                    gameController.restart();
                }
                
                // Start the actual gameplay
                gameController.startGame();
            }
        }, 20);
    }
    
    function handleGameOver(score, time) {
        // Update leaderboard with new score
        updateLeaderboard(score, time);
        
        // Prepare home page for when the player closes the feedback
        homePage.style.opacity = '0';
        
        // The home page will be shown after the player interacts with the feedback panel
        // The EndGameFeedback component will handle the "Play Again" action
        
        // Change start button text to "PLAY AGAIN" for when the home page is shown
        startButton.textContent = "PLAY AGAIN";
    }
    
    // Make it globally accessible
    window.handleGameOver = handleGameOver;
    
    // Also ensure it's defined early in case it's needed before this point
    if (typeof window.handleGameOver !== 'function') {
        window.handleGameOver = handleGameOver;
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
    
    // The toggleLeaderboard and toggleSettings functions are now handled by UIManager
    // These are kept for backward compatibility but redirect to the UIManager
    function toggleLeaderboard() {
        uiManager.toggleLeaderboard();
    }
    
    function toggleSettings() {
        // Just use UIManager's toggle function which now handles all of this
        uiManager.toggleSettings();
    }
});
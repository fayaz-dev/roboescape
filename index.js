import { GameController } from './js/GameController.js';
import { SceneManager } from './js/SceneManager.js';
import { Player } from './js/Player.js';
import { BlackHole } from './js/BlackHole.js';
import { Starfield } from './js/Starfield.js';
import { ExoticParticles } from './js/ExoticParticles.js';
import { Settings } from './js/Settings.js';

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    const sceneManager = new SceneManager();
    const player = new Player();
    const blackHole = new BlackHole();
    const starfield = new Starfield();
    const dataShards = new ExoticParticles();
    const settings = new Settings();
    
    // Create game controller and pass all components
    const gameController = new GameController({
        sceneManager,
        player,
        blackHole,
        starfield, 
        dataShards,
        settings
    });
    
    // Setup the game
    gameController.setup();
    
    // Start game loop
    gameController.start();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        sceneManager.handleResize();
    });
});
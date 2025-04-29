import { Reactions } from './reactions/Reactions.js';
// Import the EndGameFeedback class from the current directory
import { EndGameFeedback } from './EndGameFeedback.js';
import uiManager from './UIManager.js';
import PerformanceOptimizer from './utils/PerformanceOptimizer.js';

export class GameController {
    constructor({ sceneManager, player, blackHole, starfield, dataShards, settings, onGameOver }) {
        this.sceneManager = sceneManager;
        this.player = player;
        this.blackHole = blackHole;
        this.starfield = starfield;
        this.dataShards = dataShards;
        this.settings = settings;
        this.lastTime = 0;
        this.gameOver = false;
        this.gameActive = false; // New flag to control game active state
        this.score = 0;
        this.gameTime = 0; // Track game time in seconds
        this.timeDilation = 1.0;
        this.reactions = new Reactions(player, sceneManager, starfield, settings);
        this.explosionParticles = [];
        this.gameOverEffects = {
            shake: 0,
            fadeIn: 0,
            redFlash: 0
        };
        
        // Performance optimizations
        this.animationFrameId = null; // Track animation frame for proper cancellation
        this.frameCounter = 0; // For throttling certain operations
        this.lastUpdateTimestamp = 0; // For FPS calculation
        this.performanceOptimizer = new PerformanceOptimizer(); // Performance optimization utilities
        
        // Callback for when the game ends
        this.onGameOver = onGameOver || function(score, time) {
            // Use the global handleGameOver function
            if (window.handleGameOver) {
                window.handleGameOver(score, time);
            }
        };
        
        // Initialize end game feedback module
        this.endGameFeedback = new EndGameFeedback();
        this.endGameFeedback.setPlayAgainHandler(() => {
            document.getElementById('home-page').style.display = 'none';
            this.restart();
        });
        
        // Add handlers for settings and leaderboard buttons using UIManager
        this.endGameFeedback.setSettingsHandler(() => {
            // No additional handler needed as UIManager handles everything
        });
        
        this.endGameFeedback.setLeaderboardHandler(() => {
            // No additional handler needed as UIManager handles everything
        });
        
        this.setupControls();

        // Listen for player destruction event
        window.addEventListener('playerDestroyed', () => {
            this.handlePlayerDestroyed();
        });
        
        // Listen for speed boost usage event
        window.addEventListener('speedBoostUsed', (event) => {
            // Only reduce score if we have positive score and game is active
            if (this.score > 0 && this.gameActive) {
                this.score = Math.max(0, this.score - event.detail.cost);
            } else if (this.score <= 0 && this.player.speedBoostActive) {
                // No score left, notify player to deactivate boost
                this.player.speedBoostActive = false;
            }
        });
    }
    
    setup() {
        this.player.init(this.sceneManager);
        this.blackHole.init(this.sceneManager);
        this.starfield.init(this.sceneManager);
        this.dataShards.init(this.sceneManager);
        
        // Setup event listeners
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        document.addEventListener('keyup', (e) => this.handleKeyup(e));
    }
    
    setupControls() {
        // Remove the direct movement controls since we now use the key handlers
        // with physics-based movement in the player class
    }
    
    showQuip() {
        // This method is no longer needed but kept for compatibility
        // Events now trigger reactions directly
    }
    
    createExplosion(x, y) {
        const particleCount = 50;
        const colors = ['#ff0000', '#ff6600', '#ffff00', '#ffffff'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 5 + Math.random() * 10;
            this.explosionParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 3
            });
        }
    }

    checkCollisions() {
        // Check player collision with black hole
        if (this.player.checkCollision(this.blackHole)) {
            if (!this.gameOver) {
                // Create explosion at player position
                this.createExplosion(this.player.x, this.player.y);
                // Add screen shake
                this.gameOverEffects.shake = 1.0;
                this.gameOverEffects.fadeIn = 0;
                this.gameOverEffects.redFlash = 1.0;
                // Set game over immediately on direct collision
                this.gameOver = true;
                // Trigger reaction (this will also play collision sound)
                this.reactions.onPlayerDestroyed();
                return; // Stop further checks after game over
            }
        }
        
        // Check for exotic particle collection
        const collectedShards = this.dataShards.checkCollection(this.player);
        if (collectedShards > 0) {
            this.score += collectedShards;
            this.player.dataShards += 1; // Add 1 shard for each collection
            // Trigger reaction
            this.reactions.onShardCollected(collectedShards);
        }

        // Check if player has lost all shards and is in event horizon
        if (this.player.dataShards <= 0 && this.player.isTrapped) {
            if (!this.gameOver) {
                this.createExplosion(this.player.x, this.player.y);
                this.gameOverEffects.shake = 1.0;
                this.gameOverEffects.fadeIn = 0;
                this.gameOverEffects.redFlash = 1.0;
                this.gameOver = true;
                // Trigger reaction (which will also play sounds)
                this.reactions.onPlayerDestroyed();
            }
        }
    }
    
    drawScore() {
        const ctx = this.sceneManager.ctx;
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${this.score}`, 20, 40);
        
        // Display game time in minutes:seconds format
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(`Time: ${timeString}`, 20, 70);
        
        // Draw exotic particle count with color coding
        ctx.fillStyle = this.player.dataShards < 0 ? '#ff3333' : '#00ffff';
        ctx.fillText(`Exotic Particles: ${this.player.dataShards}`, 20, 100);
        
        // Show speed boost indicator when active
        if (this.player.speedBoostActive) {
            ctx.fillStyle = '#ffcc00'; // Bright yellow/gold for boost indicator
            ctx.fillText('SPEED BOOST ACTIVE (-1 score/sec)', 20, 130);
        }

        // Show warning when trapped in black hole
        if (this.player.isTrapped) {
            ctx.fillStyle = '#ff3333';
            ctx.textAlign = 'center';
            
            if (this.player.dataShards >= 5) {
                ctx.fillText('Press SPACEBAR to escape! (-5 shards)', 
                    this.sceneManager.centerX, 60);
            } else {
                const timeSinceLastMove = (Date.now() - this.player.lastMovementTime) / 1000;
                if (timeSinceLastMove >= 5) {
                    ctx.fillText('WARNING: Losing exotic particles to black hole!', 
                        this.sceneManager.centerX, 60);
                } else {
                    const timeLeft = Math.ceil(5 - timeSinceLastMove);
                    ctx.fillText(`Warning: Move within ${timeLeft} seconds!`, 
                        this.sceneManager.centerX, 60);
                }
            }
            ctx.textAlign = 'left';
        } else if (this.gameTime < 10) {
            // Show speed boost tip during the first 10 seconds of gameplay
            ctx.fillStyle = '#66ff66';
            ctx.textAlign = 'center';
            ctx.fillText('TIP: Hold SPACEBAR for speed boost (-1 score/sec)', 
                this.sceneManager.centerX, 60);
            ctx.textAlign = 'left';
        }
    }
    
    drawGameOver() {
        const ctx = this.sceneManager.ctx;

        // Apply screen shake
        if (this.gameOverEffects.shake > 0) {
            const shakeAmount = this.gameOverEffects.shake * 20;
            ctx.save();
            ctx.translate(
                Math.random() * shakeAmount - shakeAmount/2,
                Math.random() * shakeAmount - shakeAmount/2
            );
        }

        // Draw red flash
        if (this.gameOverEffects.redFlash > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.gameOverEffects.redFlash * 0.3})`;
            ctx.fillRect(0, 0, this.sceneManager.width, this.sceneManager.height);
        }

        // Update explosion particles
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const particle = this.explosionParticles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.size *= 0.99;

            if (particle.life <= 0) {
                this.explosionParticles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particle.color.replace(')', `,${particle.life})`);
            ctx.fill();
        }

        // Update fade-in effect
        this.gameOverEffects.fadeIn = Math.min(1, this.gameOverEffects.fadeIn + 0.02);
        
        // Restore context state if shake was applied
        if (this.gameOverEffects.shake > 0) {
            ctx.restore(); // This pairs with the ctx.save() inside the shake block
            this.gameOverEffects.shake *= 0.95;
        }
        this.gameOverEffects.redFlash *= 0.95;
        
        // Once the fade-in and effects are almost complete, show the end game feedback
        if (this.gameOverEffects.fadeIn >= 0.95 && this.explosionParticles.length === 0) {
            // Only show the feedback once
            if (this.onGameOver && typeof this.onGameOver === 'function') {
                // Only call once
                const callback = this.onGameOver;
                this.onGameOver = null;
                
                // Small delay to allow the final explosion animation to finish
                setTimeout(() => {
                    // Show the feedback panel with the player's performance
                    this.endGameFeedback.showFeedback(this.score, this.gameTime, this.player.dataShards);
                    
                    // Call the original callback as well
                    callback(this.score, this.gameTime);
                    
                    // Deactivate gameplay
                    this.gameActive = false;
                }, 1000);
            }
        }
    }
    
    handleKeydown(e) {
        // Only handle gameplay keys if the game is active
        if (this.gameActive) {
            this.player.handleKeydown(e);
        }
    }
    
    handleKeyup(e) {
        this.player.handleKeyup(e);
    }
    
    restart() {
        // Cancel any existing animation frame before restarting
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.gameOver = false;
        this.gameActive = true;
        this.score = 0;
        this.gameTime = 0; // Reset game time
        this.frameCounter = 0;
        this.lastUpdateTimestamp = performance.now();
        this.lastTime = performance.now();
        
        // Use a more efficient way to clear arrays
        this.explosionParticles.length = 0; 
        
        this.gameOverEffects = {
            shake: 0,
            fadeIn: 0,
            redFlash: 0
        };
        
        this.player.reset();
        this.dataShards.reset();
        this.player.dataShards = 1; // Restart with 1 exotic particle
        
        // Reset blackhole using its dedicated reset method
        this.blackHole.reset();
        
        // Clear any existing screen messages
        if (this.reactions && this.reactions.reactions.screen) {
            this.reactions.reactions.screen.clearAllMessages();
        }
        
        // Hide any open panels that might be visible
        const leaderboardPanel = document.getElementById('leaderboard-panel');
        const settingsPanel = document.getElementById('home-settings-panel');
        if (leaderboardPanel) leaderboardPanel.style.display = 'none';
        if (settingsPanel) settingsPanel.style.display = 'none';
        
        // Trigger the game start reaction (which will play sound too)
        this.reactions.onGameStart();
        
        // Play intro animation when restarting
        this.playIntroAnimation();
        
        // Make sure game start message appears when restarting
        if (this.settings.reactionsEnabled) {
            setTimeout(() => {
                this.reactions.onGameStart();
            }, 100);
        }
        
        // Set up the callback again
        this.onGameOver = function(score, time) {
            // Handle game over safely
            if (typeof window.handleGameOver === 'function') {
                window.handleGameOver(score, time);
            } else {
                console.log('Game over with score:', score, 'time:', time);
            }
        };
    }
    
    update(time) {
        const deltaTime = time * 0.001;
        
        // Update game elements
        this.player.update(deltaTime, this.blackHole);
        this.blackHole.update(deltaTime);
        this.starfield.update(deltaTime);
        this.dataShards.update(deltaTime);
        
        // Check for collisions
        this.checkCollisions();
    }
    
    start() {
        // Cancel any existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    // New method to only animate background elements without gameplay
    animateOnly() {
        // Cancel any existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.lastTime = performance.now();
        this.gameOver = false;
        this.gameActive = false; // Game not active yet
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    // New method to actually start the game
    startGame() {
        // Show countdown animation
        this.showCountdown(() => {
            this.gameActive = true;
            this.gameOver = false;
            this.score = 0;
            this.gameTime = 0;
            this.player.reset();
            this.dataShards.reset();
            this.blackHole.reset();
            this.player.dataShards = 1;
            
            // Display start message and play start sound
            this.reactions.onGameStart();
        });
    }
    
    showCountdown(callback) {
        let count = 3;
        const ctx = this.sceneManager.ctx;
        const centerX = this.sceneManager.centerX;
        const centerY = this.sceneManager.centerY;
        
        // Create an overlay for the countdown
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '8rem';
        overlay.style.fontFamily = 'Orbitron, sans-serif';
        overlay.style.color = '#00ccff';
        overlay.style.textShadow = '0 0 20px #00ccff, 0 0 40px #0066ff';
        overlay.style.zIndex = '5';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);
        
        // Function to update countdown
        const updateCountdown = () => {
            if (count > 0) {
                overlay.textContent = count.toString();
                
                // Animate the number
                overlay.style.transform = 'scale(2)';
                overlay.style.opacity = '0.8';
                
                setTimeout(() => {
                    overlay.style.transition = 'all 0.9s ease-out';
                    overlay.style.transform = 'scale(0.5)';
                    overlay.style.opacity = '0';
                }, 100);
                
                count--;
                setTimeout(updateCountdown, 1000);
            } else {
                // Show "GO!" message
                overlay.textContent = "GO!";
                overlay.style.transition = 'all 0.5s ease-out';
                overlay.style.transform = 'scale(2)';
                overlay.style.opacity = '0.9';
                
                setTimeout(() => {
                    overlay.style.transform = 'scale(0)';
                    overlay.style.opacity = '0';
                    
                    // Remove element after animation
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                    }, 500);
                    
                    // Start the game
                    if (callback) callback();
                }, 700);
            }
        };
        
        // Start the countdown
        updateCountdown();
    }
    
    // Add intro animation when starting the game
    playIntroAnimation() {
        // Add a camera zoom effect or player entry animation
        const canvas = this.sceneManager.canvas;
        
        // Make sure canvas is visible and positioned correctly
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '5';
        
        // Initial zoom effect
        canvas.style.transform = 'scale(0.9)';
        canvas.style.opacity = '0.7';
        
        // Create countdown overlay
        const countdown = document.createElement('div');
        countdown.style.position = 'absolute';
        countdown.style.top = '50%';
        countdown.style.left = '50%';
        countdown.style.transform = 'translate(-50%, -50%)';
        countdown.style.fontSize = '100px';
        countdown.style.fontFamily = 'Orbitron, sans-serif';
        countdown.style.color = '#00ccff';
        countdown.style.textShadow = '0 0 20px #00ccff, 0 0 40px #0066ff';
        countdown.style.zIndex = '15';
        countdown.style.opacity = '0.9';
        countdown.style.transition = 'all 0.3s ease-out';
        countdown.textContent = '3';
        document.body.appendChild(countdown);
        
        // Animate zoom to normal
        setTimeout(() => {
            canvas.style.transition = 'all 1s ease-out';
            canvas.style.transform = 'scale(1)';
            canvas.style.opacity = '1';
            
            // Countdown animation
            setTimeout(() => {
                countdown.textContent = '2';
                countdown.style.transform = 'translate(-50%, -50%) scale(1.2)';
                setTimeout(() => {
                    countdown.style.transform = 'translate(-50%, -50%) scale(1)';
                    setTimeout(() => {
                        countdown.textContent = '1';
                        countdown.style.transform = 'translate(-50%, -50%) scale(1.2)';
                        setTimeout(() => {
                            countdown.style.transform = 'translate(-50%, -50%) scale(1)';
                            setTimeout(() => {
                                countdown.textContent = 'GO!';
                                countdown.style.color = '#00ff00';
                                countdown.style.transform = 'translate(-50%, -50%) scale(1.5)';
                                setTimeout(() => {
                                    countdown.style.opacity = '0';
                                    setTimeout(() => {
                                        document.body.removeChild(countdown);
                                    }, 500);
                                    
                                    // Show a welcome message via the reaction system
                                    if (this.settings.reactionsEnabled) {
                                        this.reactions.onGameStart();
                                    }
                                }, 800);
                            }, 1000);
                        }, 200);
                    }, 1000);
                }, 200);
            }, 500);
        }, 100);
    }
    
    gameLoop(currentTime) {
        // Calculate accurate deltaTime with max value clamping to prevent huge jumps
        let deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        // Update performance metrics
        this.performanceOptimizer.measureFrameRate(currentTime);
        
        // Skip frame if browser tab is inactive (deltaTime too large)
        if (deltaTime > 0.05 && !document.hasFocus()) {
            this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
            return;
        }
        
        // Update universe rotation
        this.sceneManager.updateUniverseRotation(deltaTime);
        
        // Clear the canvas
        this.sceneManager.clear();
        
        // Always update starfield and black hole for visual effect
        // Use quality-based rendering for starfield
        if (this.performanceOptimizer.shouldRender('starfield', {
            high: 0,      // Every frame on high quality
            medium: 0,    // Every frame on medium quality
            low: 16       // Every other frame on low quality (approximately 60fps -> 30fps)
        })) {
            this.starfield.update(deltaTime);
        }
        
        if (this.gameActive && !this.gameOver) {
            // Active gameplay
            // Update game time
            this.gameTime += deltaTime;
            
            // Sync blackHole's game time with our game time for difficulty scaling
            this.blackHole.gameTime = this.gameTime;
            
            this.blackHole.update(deltaTime, this.player); // Pass player to blackHole
            
            // Pass the blackHole to the player update method
            this.player.update(deltaTime, this.blackHole);
            
            // Update particles - quality based rendering
            if (this.performanceOptimizer.shouldRender('exotic_particles', {
                high: 0,     // Every frame on high quality
                medium: 16,  // Every other frame on medium quality
                low: 33      // Every third frame on low quality
            })) {
                this.dataShards.update(deltaTime, this.player);
            }
            
            // Check for collisions - this must run every frame for gameplay
            this.checkCollisions();
            
            // Draw score
            this.drawScore();
        } else if (this.gameOver) {
            // Game over state
            this.blackHole.update(deltaTime, null); // No player when game over
            this.drawGameOver();
        } else {
            // Background animation only (before game starts)
            this.blackHole.update(deltaTime, null);
        }
        
        // Optional performance debug overlay
        if (this.settings && this.settings.debugMode) {
            this.drawPerformanceDebug();
        }
        
        // Continue the game loop using the callback pattern for better performance
        if (window.requestAnimationFrame) {
            this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }

    handlePlayerDestroyed() {
        if (!this.gameOver) {
            this.gameOver = true;
            this.createExplosion(this.player.x, this.player.y);
            this.gameOverEffects.shake = 1.0;
            this.gameOverEffects.fadeIn = 0;
            this.gameOverEffects.redFlash = 1.0;
            // Trigger reaction
            this.reactions.onPlayerDestroyed();
            
            // Reset onGameOver callback if it was previously nullified
            if (!this.onGameOver) {
                this.onGameOver = (score, time) => {
                    // Show home page again after feedback is displayed
                    document.getElementById('home-page').style.display = 'flex';
                };
            }
        }
    }
    
    drawPerformanceDebug() {
        const ctx = this.sceneManager.ctx;
        const info = this.performanceOptimizer.getDebugInfo();
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.sceneManager.width - 150, 10, 140, 70);
        
        ctx.fillStyle = info.fps < 30 ? '#ff5555' : info.fps < 50 ? '#ffff55' : '#55ff55';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${info.fps}`, this.sceneManager.width - 140, 30);
        ctx.fillText(`Frame: ${info.averageFrameTime}ms`, this.sceneManager.width - 140, 50);
        ctx.fillText(`Quality: ${info.qualityLevel}`, this.sceneManager.width - 140, 70);
        ctx.restore();
    }
}

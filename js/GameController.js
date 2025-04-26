import { Reactions } from './reactions/Reactions.js';

export class GameController {
    constructor({ sceneManager, player, blackHole, starfield, dataShards, settings }) {
        this.sceneManager = sceneManager;
        this.player = player;
        this.blackHole = blackHole;
        this.starfield = starfield;
        this.dataShards = dataShards;
        this.settings = settings;
        this.lastTime = 0;
        this.gameOver = false;
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
        
        this.setupControls();

        // Listen for player destruction event
        window.addEventListener('playerDestroyed', () => {
            this.handlePlayerDestroyed();
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
                // Trigger reaction
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
                // Trigger reaction
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

        // Draw game over text with fade-in effect
        this.gameOverEffects.fadeIn = Math.min(1, this.gameOverEffects.fadeIn + 0.02);
        const fadeAlpha = this.gameOverEffects.fadeIn;
        
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 64px Arial';
        ctx.fillText('OBLITERATED', this.sceneManager.centerX, this.sceneManager.centerY);
        
        ctx.font = '32px Arial';
        ctx.fillText(`Final Score: ${this.score}`, this.sceneManager.centerX, this.sceneManager.centerY + 60);
        
        // Format and display time survived
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(`Time Survived: ${timeString}`, this.sceneManager.centerX, this.sceneManager.centerY + 100);
        
        // Pulsing restart text
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha * pulse})`;
        ctx.font = '24px Arial';
        ctx.fillText('Press R to Restart', this.sceneManager.centerX, this.sceneManager.centerY + 160);
        ctx.restore();

        if (this.gameOverEffects.shake > 0) {
            ctx.restore();
            this.gameOverEffects.shake *= 0.95;
        }
        this.gameOverEffects.redFlash *= 0.95;
    }
    
    handleKeydown(e) {
        if (this.gameOver && e.key === 'r') {
            this.restart();
            return;
        }
        this.player.handleKeydown(e);
    }
    
    handleKeyup(e) {
        this.player.handleKeyup(e);
    }
    
    restart() {
        this.gameOver = false;
        this.score = 0;
        this.gameTime = 0; // Reset game time
        this.explosionParticles = [];
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
        this.lastTime = performance.now();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update universe rotation
        this.sceneManager.updateUniverseRotation(deltaTime);
        
        if (!this.gameOver) {
            // Update game time
            this.gameTime += deltaTime;
            
            // Sync blackHole's game time with our game time for difficulty scaling
            this.blackHole.gameTime = this.gameTime;
            
            // Clear the canvas
            this.sceneManager.clear();
            
            // Update and render
            this.starfield.update(deltaTime);
            this.blackHole.update(deltaTime, this.player); // Pass player to blackHole
            // Pass the blackHole to the player update method
            this.player.update(deltaTime, this.blackHole);
            this.dataShards.update(deltaTime, this.player);
            
            // Check for collisions
            this.checkCollisions();
            
            // Draw score
            this.drawScore();
        } else {
            this.sceneManager.clear();
            this.starfield.update(deltaTime);
            this.blackHole.update(deltaTime, null); // No player when game over
            this.drawGameOver();
        }
        
        // Continue the game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
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
        }
    }
}

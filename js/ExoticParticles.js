import * as THREE from 'three';
import { ExoticParticleFactory } from './particles/ExoticParticleFactory.js';

export class ExoticParticles {
    constructor() {
        this.shards = [];
        this.shardCount = 10;
        this.collectionRadius = 25;
        this.spawnTimer = 0;
        this.spawnInterval = 3; // seconds
        this.collectionEffects = []; // Store visual effects for shard collection
        this.particleFactory = new ExoticParticleFactory();
    }
    
    init(sceneManager) {
        this.sceneManager = sceneManager;
        this.reset();
    }
    
    update(deltaTime, player) {
        const ctx = this.sceneManager.ctx;
        
        // Spawn new shards periodically
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.shards.length < this.shardCount) {
            this.spawnShard();
            this.spawnTimer = 0;
        }
        
        // Update and draw shards
        this.shards.forEach(shard => {
            // Apply universe rotation to each shard
            const relX = shard.x - this.sceneManager.centerX;
            const relY = shard.y - this.sceneManager.centerY;
            const rotationSpeed = this.sceneManager.universeRotationSpeed;
            
            // Calculate rotation-induced velocity
            const rotationVelocityX = -relY * rotationSpeed;
            const rotationVelocityY = relX * rotationSpeed;
            
            // Apply rotation to shard position
            shard.x += rotationVelocityX * 60 * deltaTime;
            shard.y += rotationVelocityY * 60 * deltaTime;
            
            // Update particle's internal state
            shard.update(deltaTime);
            
            // Draw shard - delegate to the particle's draw method
            shard.draw(ctx);
        });
        
        // Update and draw collection effects
        for (let i = this.collectionEffects.length - 1; i >= 0; i--) {
            const effect = this.collectionEffects[i];
            effect.life -= deltaTime;
            
            // Remove expired effects
            if (effect.life <= 0) {
                this.collectionEffects.splice(i, 1);
                continue;
            }
            
            // Apply universe rotation to collection effects
            const relX = effect.x - this.sceneManager.centerX;
            const relY = effect.y - this.sceneManager.centerY;
            const rotationSpeed = this.sceneManager.universeRotationSpeed;
            
            effect.x += -relY * rotationSpeed * 60 * deltaTime;
            effect.y += relX * rotationSpeed * 60 * deltaTime;
            
            // Draw expanding circle
            const progress = 1 - effect.life / effect.maxLife;
            const radius = effect.radius * (1 + progress * 2);
            const opacity = effect.life / effect.maxLife;
            
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw floating text
            ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`+${effect.value}`, effect.x, effect.y - 20 - progress * 30);
            ctx.textAlign = 'left';
        }
    }
    
    spawnShard() {
        // Avoid spawning too close to black hole
        const margin = 100;
        const blackHoleCenterX = this.sceneManager.centerX;
        const blackHoleCenterY = this.sceneManager.centerY;
        
        let x, y;
        do {
            x = Math.random() * (this.sceneManager.width - 2 * margin) + margin;
            y = Math.random() * (this.sceneManager.height - 2 * margin) + margin;
        } while (
            Math.abs(x - blackHoleCenterX) < 150 &&
            Math.abs(y - blackHoleCenterY) < 150
        );
        
        // Choose particle type based on probability
        const particleOptions = {
            x: x,
            y: y,
            radius: 8,
            rotation: Math.random() * Math.PI * 2 // Initial rotation angle
        };
        
        // Random number between 0 and 100 to determine particle type
        const roll = Math.random() * 100;
        let particleType;
        
        // Distribution: 60% normal, 25% unstable, 10% rare, 5% quantum
        if (roll < 60) {
            particleType = 'normal';
        } else if (roll < 85) {
            particleType = 'unstable';
        } else if (roll < 95) {
            particleType = 'rare';
        } else {
            particleType = 'quantum';
        }
        
        // Create shard using the factory
        const shard = this.particleFactory.createParticle(particleType, particleOptions);
        
        this.shards.push(shard);
    }
    
    checkCollection(player) {
        let collectedPoints = 0;
        let collectedType = null;
        
        this.shards = this.shards.filter(shard => {
            const dx = player.x - shard.x;
            const dy = player.y - shard.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If player collects a shard
            if (distance < this.collectionRadius) {
                collectedPoints += shard.value;
                // Create collection effect
                this.createCollectionEffect(shard.x, shard.y, shard.value);
                
                // Determine particle type based on constructor name or value
                if (shard instanceof this.particleFactory.particleTypes.quantum) {
                    collectedType = 'quantum';
                } else if (shard instanceof this.particleFactory.particleTypes.rare) {
                    collectedType = 'rare';
                } else if (shard instanceof this.particleFactory.particleTypes.unstable) {
                    collectedType = 'unstable';
                } else {
                    collectedType = 'normal';
                }
                
                // Dispatch an event for the collected particle
                window.dispatchEvent(new CustomEvent('particleCollected', { 
                    detail: { 
                        type: collectedType, 
                        value: shard.value 
                    } 
                }));
                
                return false;
            }
            return true;
        });
        
        return collectedPoints;
    }

    createCollectionEffect(x, y, value) {
        // Add to the collection effects array for better visual feedback
        this.collectionEffects.push({
            x: x,
            y: y,
            radius: 10,
            value: value,
            life: 1.0,
            maxLife: 1.0
        });
    }
    
    reset() {
        this.shards = [];
        this.spawnTimer = 0;
        this.collectionEffects = [];
        
        // Spawn initial set of shards
        for (let i = 0; i < Math.floor(this.shardCount / 2); i++) {
            this.spawnShard();
        }
    }
}

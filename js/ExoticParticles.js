import * as THREE from 'three';
import { ExoticParticleFactory } from './particles/ExoticParticleFactory.js';
import { ObjectPool } from './utils/ObjectPool.js';

export class ExoticParticles {
    constructor() {
        this.shards = [];
        this.shardCount = 20;
        this.collectionRadius = 25;
        this.spawnTimer = 0;
        this.spawnInterval = 3; // seconds
        this.collectionEffects = []; // Store visual effects for shard collection
        this.particleFactory = new ExoticParticleFactory();
        
        // Object pool for collection effects
        this.effectPool = new ObjectPool(
            () => ({ x: 0, y: 0, radius: 0, life: 0, maxLife: 0, value: 0 }),
            (effect, x, y, radius, value) => {
                effect.x = x;
                effect.y = y;
                effect.radius = radius;
                effect.life = 1.0; // 1 second
                effect.maxLife = 1.0;
                effect.value = value;
                return effect;
            }
        );
        
        // Performance optimization - pre-calculate common values
        this.lastUpdateTime = 0;
        this.frameCounter = 0;
        this.frameUpdateInterval = 2; // Only update certain operations every 2 frames
    }
    
    init(sceneManager) {
        this.sceneManager = sceneManager;
        this.reset();
    }
    
    update(deltaTime, player) {
        const ctx = this.sceneManager.ctx;
        const centerX = this.sceneManager.centerX;
        const centerY = this.sceneManager.centerY;
        const rotationSpeed = this.sceneManager.universeRotationSpeed;
        
        // Increment frame counter
        this.frameCounter++;
        
        // Throttled operations - only every X frames
        if (this.frameCounter % this.frameUpdateInterval === 0) {
            // Spawn new shards periodically (throttled)
            this.spawnTimer += deltaTime * this.frameUpdateInterval;
            if (this.spawnTimer >= this.spawnInterval && this.shards.length < this.shardCount) {
                this.spawnShard();
                this.spawnTimer = 0;
            }
        }
        
        // Update and draw shards
        for (let i = 0; i < this.shards.length; i++) {
            const shard = this.shards[i];
            if (!shard.active) continue; // Skip inactive shards
            
            // Apply universe rotation to each shard
            const relX = shard.x - centerX;
            const relY = shard.y - centerY;
            
            // Calculate rotation-induced velocity (pre-calculated for performance)
            const rotationVelocityX = -relY * rotationSpeed;
            const rotationVelocityY = relX * rotationSpeed;
            
            // Apply rotation to shard position
            shard.x += rotationVelocityX * 60 * deltaTime;
            shard.y += rotationVelocityY * 60 * deltaTime;
            
            // Update particle's internal state
            shard.update(deltaTime);
            
            // Draw shard - delegate to the particle's draw method
            shard.draw(ctx);
        }
        
        // Update and draw collection effects
        for (let i = this.collectionEffects.length - 1; i >= 0; i--) {
            const effect = this.collectionEffects[i];
            effect.life -= deltaTime;
            
            // Remove expired effects and return to pool
            if (effect.life <= 0) {
                this.effectPool.release(effect);
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
        // Ensure sceneManager is available
        if (!this.sceneManager) {
            console.error("SceneManager not available for spawning shards");
            return;
        }
        
        // Cache frequently accessed properties for better performance
        const centerX = this.sceneManager.centerX;
        const centerY = this.sceneManager.centerY;
        const width = this.sceneManager.width;
        const height = this.sceneManager.height;
        const margin = 100;
        
        // Fast path: check if we have too many shards, only relevant for very CPU intensive moments
        if (this.shards.length > this.shardCount * 1.5) {
            return;
        }
        
        // Avoid spawning too close to black hole
        let x, y;
        let attempts = 0; // Limit attempts to avoid infinite loop
        do {
            x = Math.random() * (width - 2 * margin) + margin;
            y = Math.random() * (height - 2 * margin) + margin;
            attempts++;
            
            // Break after 5 attempts and just place it somewhere
            if (attempts > 5) {
                x = margin + Math.random() * (width - 2 * margin);
                y = margin + Math.random() * (height - 2 * margin);
                break;
            }
        } while (
            Math.abs(x - centerX) < 150 &&
            Math.abs(y - centerY) < 150
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
        
        // Distribution: 50% normal, 25% unstable, 15% rare, 10% quantum
        if (roll < 50) {
            particleType = 'normal';
        } else if (roll < 75) {
            particleType = 'unstable';
        } else if (roll < 90) {
            particleType = 'rare';
        } else {
            particleType = 'quantum';
        }
        
        try {
            // Create shard using the factory with object pooling
            const shard = this.particleFactory.createParticle(particleType, particleOptions);
            if (shard) {
                this.shards.push(shard);
            } else {
                console.error(`Failed to create ${particleType} particle`);
            }
        } catch (error) {
            console.error(`Error spawning shard: ${error.message}`);
        }
    }
    
    checkCollection(player) {
        let collectedPoints = 0;
        let collectedType = null;
        
        // Performance optimization - pre-calculate squared radius
        const collectionRadiusSquared = this.collectionRadius * this.collectionRadius;
        
        // Using a for loop with indices instead of filter for better performance
        for (let i = this.shards.length - 1; i >= 0; i--) {
            const shard = this.shards[i];
            const dx = player.x - shard.x;
            const dy = player.y - shard.y;
            
            // Using distance squared to avoid costly square root operation
            const distanceSquared = dx * dx + dy * dy;
            
            // If player collects a shard
            if (distanceSquared < collectionRadiusSquared) {
                collectedPoints += shard.value;
                // Create collection effect
                this.createCollectionEffect(shard.x, shard.y, shard.value);
                
                // Determine particle type based on constructor name or value
                // Using a more direct check that avoids instanceof for better performance
                const particleType = shard.constructor.name;
                if (particleType.includes('Quantum')) {
                    collectedType = 'quantum';
                } else if (particleType.includes('Rare')) {
                    collectedType = 'rare';
                } else if (particleType.includes('Unstable')) {
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
                
                // Remove the shard
                // Performance: Swap with the last element and pop
                const lastShard = this.shards.pop();
                if (i < this.shards.length) {
                    this.shards[i] = lastShard;
                }
            }
        }
        
        return collectedPoints;
    }

    createCollectionEffect(x, y, value) {
        // Add to the collection effects array for better visual feedback using object pooling
        const effect = this.effectPool.get(x, y, 10, value);
        this.collectionEffects.push(effect);
    }
    
    reset() {
        console.log("ExoticParticles reset called");
        
        // Ensure sceneManager is available
        if (!this.sceneManager) {
            console.error("ExoticParticles reset: sceneManager not initialized");
            return;
        }
        
        // Return all effects to the pool
        for (let i = 0; i < this.collectionEffects.length; i++) {
            this.effectPool.release(this.collectionEffects[i]);
        }
        
        // Return active particles to pool if using pooling
        if (this.particleFactory) {
            for (let i = 0; i < this.shards.length; i++) {
                const shard = this.shards[i];
                if (shard) {
                    // Mark as inactive but don't worry about returning to pool yet
                    // The factory will handle this when creating new particles
                    shard.active = false;
                }
            }
        }
        
        this.shards = [];
        this.collectionEffects = [];
        this.spawnTimer = 0;
        this.frameCounter = 0;
        
        // Force immediate spawn of initial particles
        const initialCount = Math.ceil(this.shardCount * 0.7); // Spawn 70% of max shards initially
        console.log(`Spawning ${initialCount} initial shards`);
        
        // Spawn initial set of shards without throttling
        try {
            for (let i = 0; i < initialCount; i++) {
                this.spawnShard();
            }
            console.log(`Successfully spawned ${this.shards.length} shards`);
        } catch (error) {
            console.error("Error spawning initial shards:", error);
        }
    }
}

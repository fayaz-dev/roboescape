import * as THREE from 'three';

export class BlackHole {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 50;
        this.baseRadius = 50; // Store the base radius for pulsating effect
        this.pullStrength = 150; // Tripled from 50 to make gravity much stronger
        this.color = '#000';
        this.glowColor = 'rgba(255, 0, 255, 0.5)';
        this.glowRadius = 100;
        this.angularSpeed = 0.5;
        this.angle = 0;
        this.eventHorizonRadius = this.radius * 3.5; // Increased event horizon size
        this.eventHorizonPulse = 1.5;
        this.eventHorizonPulseSpeed = 5;
        this.plasmaParticles = [];
        this.accretionParticles = [];
        this.lastShredTime = 0;

        // Game time tracking for difficulty scaling
        this.gameTime = 0;

        // New properties for shard consumption effects
        this.consumedShardEffects = [];
        this.warningPulse = 0;
        
        // New properties for pulsating mystical effect
        this.pulseFactor = 0;
        this.pulseSpeed = 0.5 + Math.random() * 0.5;
        this.pulseRange = 0.3; // 30% size variation
        
        // New properties for unpredictable movement
        this.movementTimer = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.moveSpeed = 30;
        this.movementUpdateInterval = 5; // Change direction every 5 seconds
        this.movementRange = 0.2; // Move up to 20% of screen size
        
        this.effectMaxLife = 2.0;
        this.consumedShardEffects.push({ life: this.effectMaxLife, maxLife: this.effectMaxLife });
        
        // Universe rotation properties
        this.rotationOffset = 0; // Additional rotation caused by universe rotation
    }
    
    init(sceneManager) {
        this.sceneManager = sceneManager;
        this.x = sceneManager.centerX;
        this.y = sceneManager.centerY;
        this.targetX = this.x;
        this.targetY = this.y;
        this.initAccretionDisk();
    }
    
    initAccretionDisk() {
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = this.radius * (1.5 + Math.random() * 0.5);
            this.accretionParticles.push({
                angle: angle,
                distance: distance,
                baseDistance: distance,
                speed: 0.5 + Math.random() * 0.5,
                color: `hsl(${280 + Math.random() * 60}, 100%, ${50 + Math.random() * 50}%)`,
                size: 1 + Math.random() * 2
            });
        }
    }
    
    createPlasmaJet(x, y, angle) {
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const speed = 5 + Math.random() * 3;
            const spread = 0.2;
            const particleAngle = angle + (Math.random() - 0.5) * spread;
            this.plasmaParticles.push({
                x: x,
                y: y,
                vx: Math.cos(particleAngle) * speed,
                vy: Math.sin(particleAngle) * speed,
                life: 1.0,
                size: 2 + Math.random() * 2,
                color: `hsla(${280 + Math.random() * 60}, 100%, 70%, `
            });
        }
    }
    
    updatePulsation(deltaTime) {
        // Update the pulsation factor
        this.pulseFactor += this.pulseSpeed * deltaTime;
        if (this.pulseFactor > Math.PI * 2) {
            this.pulseFactor = 0;
            // Randomly change the pulse speed for more mystical effect
            this.pulseSpeed = 0.5 + Math.random() * 1.0;
            this.pulseRange = 0.2 + Math.random() * 0.3; // 20-50% size variation
        }
        
        // Calculate current radius based on pulse factor
        const pulseAmount = Math.sin(this.pulseFactor) * this.pulseRange;
        this.radius = this.baseRadius * (1 + pulseAmount);
        
        // Update event horizon radius based on new black hole radius
        this.eventHorizonRadius = this.radius * 3.5;
        
        // Update glow radius to match black hole pulsation
        this.glowRadius = 100 * (1 + pulseAmount * 0.5);
    }
    
    updateMovement(deltaTime, player) {
        // Update movement timer
        this.movementTimer += deltaTime;
        
        // Update target position periodically
        if (this.movementTimer >= this.movementUpdateInterval) {
            this.movementTimer = 0;
            
            // Randomly update movement interval (getting shorter over time for increasing difficulty)
            this.movementUpdateInterval = Math.max(1.0, 3 + Math.random() * 2); // Between 1-5 seconds
            
            // Randomly change movement speed with time-based increase
            const timeBoost = this.gameTime ? Math.min(3, this.gameTime / 60) : 0; // Boost factor based on minutes passed
            this.moveSpeed = 20 + Math.random() * 40 + (timeBoost * 20); // Speed increases with time
        }
        
        if (player) {
            // Set target position to the player's location with some randomness
            // This makes the black hole follow the player but not perfectly
            const followFactor = 0.7; // How directly it follows the player (0-1)
            const randomOffset = 150; // Add some randomness to make the movement less predictable
            
            this.targetX = (player.x * followFactor) + 
                        (this.sceneManager.centerX * (1-followFactor)) + 
                        (Math.random() * 2 - 1) * randomOffset;
            this.targetY = (player.y * followFactor) + 
                        (this.sceneManager.centerY * (1-followFactor)) + 
                        (Math.random() * 2 - 1) * randomOffset;
        }
        
        // Move toward target position
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            const moveX = dx / distance * this.moveSpeed * deltaTime;
            const moveY = dy / distance * this.moveSpeed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
        }
    }
    
    update(deltaTime, player) {
        // Update game time
        this.gameTime += deltaTime;
        
        this.angle += this.angularSpeed * deltaTime;
        
        // Update event horizon pulse
        this.eventHorizonPulse += this.eventHorizonPulseSpeed * deltaTime;
        if (this.eventHorizonPulse > Math.PI * 2) {
            this.eventHorizonPulse = 0;
        }
        
        // Update mystical pulsation and movement (now passing player)
        this.updatePulsation(deltaTime);
        this.updateMovement(deltaTime, player);
        
        // Create plasma jets periodically
        if (Date.now() - this.lastShredTime > 50) {
            // Adjust plasma jet angles based on universe rotation
            const jetAngle1 = -Math.PI/2 + this.rotationOffset;
            const jetAngle2 = Math.PI/2 + this.rotationOffset;
            this.createPlasmaJet(this.x, this.y, jetAngle1); // Adjusted top jet
            this.createPlasmaJet(this.x, this.y, jetAngle2); // Adjusted bottom jet
            this.lastShredTime = Date.now();
        }
        
        // Update rotation offset from universe rotation
        this.rotationOffset += this.sceneManager.universeRotationSpeed * deltaTime;
        
        // Update plasma particles with universe rotation
        for (let i = this.plasmaParticles.length - 1; i >= 0; i--) {
            const particle = this.plasmaParticles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= deltaTime * 2;
            
            // Apply universe rotation to plasma particles
            const relX = particle.x - this.sceneManager.centerX;
            const relY = particle.y - this.sceneManager.centerY;
            const rotationSpeed = this.sceneManager.universeRotationSpeed;
            
            // Calculate rotation-induced velocity
            const rotationVelocityX = -relY * rotationSpeed;
            const rotationVelocityY = relX * rotationSpeed;
            
            // Apply rotation to plasma particle position
            particle.x += rotationVelocityX * 60 * deltaTime;
            particle.y += rotationVelocityY * 60 * deltaTime;
            
            if (particle.life <= 0) {
                this.plasmaParticles.splice(i, 1);
            }
        }
        
        this.draw(deltaTime);
    }
    
    draw(deltaTime) {
        const ctx = this.sceneManager.ctx;
        
        // Draw outer glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.glowRadius
        );
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
        
        // Draw consumed shard effects
        for (let i = this.consumedShardEffects.length - 1; i >= 0; i--) {
            const effect = this.consumedShardEffects[i];
            effect.life -= deltaTime;
            
            if (effect.life <= 0) {
                this.consumedShardEffects.splice(i, 1);
                continue;
            }
            
            const progress = 1 - effect.life / effect.maxLife;
            const radius = this.radius * (1 - progress);
            const opacity = effect.life / effect.maxLife;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Update and draw plasma particles
        for (let i = this.plasmaParticles.length - 1; i >= 0; i--) {
            const particle = this.plasmaParticles[i];
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particle.color + particle.life + ')';
            ctx.fill();
        }
        
        // Draw accretion disk with dynamic particles that follow universe rotation
        const baseAccretionAngle = this.angle + this.rotationOffset;
        for (const particle of this.accretionParticles) {
            // Apply universe rotation to accretion disk particles
            particle.angle += particle.speed * deltaTime;
            
            // Add some wobble to the distance
            particle.distance = particle.baseDistance + Math.sin(particle.angle * 2) * 5;
            
            // Calculate particle position with combined rotation
            const combinedAngle = particle.angle + baseAccretionAngle;
            const x = this.x + Math.cos(combinedAngle) * particle.distance;
            const y = this.y + Math.sin(combinedAngle) * (particle.distance * 0.3); // Flatten for perspective
            
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
        }
        
        // Draw event horizon indicator with enhanced effects when consuming shards
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.eventHorizonRadius, 0, Math.PI * 2);
        const pulseIntensity = (Math.sin(this.eventHorizonPulse) + 1) * 0.5;
        
        // Increase red component when consuming shards
        if (this.consumedShardEffects.length > 0) {
            this.warningPulse = (this.warningPulse + deltaTime * 10) % (Math.PI * 2);
            const warningIntensity = (Math.sin(this.warningPulse) + 1) * 0.5;
            ctx.strokeStyle = `rgba(255, ${Math.floor(warningIntensity * 100)}, ${Math.floor(warningIntensity * 255)}, ${0.3 + pulseIntensity * 0.2})`;
        } else {
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + pulseIntensity * 0.2})`;
        }
        
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        // Draw black hole
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Draw accretion disk with enhanced effects and universe rotation
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 1.8, this.radius * 0.5, 
                   this.angle + this.rotationOffset, 0, Math.PI * 2);
        if (this.consumedShardEffects.length > 0) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'; // Redder when consuming shards
        } else {
            ctx.strokeStyle = 'rgba(255, 100, 255, 0.7)';
        }
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();
    }

    // Add method to show shard consumption effect
    addShardConsumptionEffect() {
        this.consumedShardEffects.push({
            life: 1.0,
            maxLife: 1.0
        });
    }

    // Reset the blackhole to its initial state
    reset() {
        // Reset position
        this.x = this.sceneManager.centerX;
        this.y = this.sceneManager.centerY;
        this.targetX = this.x;
        this.targetY = this.y;
        
        // Reset movement and timing
        this.movementTimer = 0;
        this.movementUpdateInterval = 5;
        this.moveSpeed = 30;
        this.gameTime = 0;
        
        // Reset visual effects
        this.consumedShardEffects = [];
        this.warningPulse = 0;
        
        // Reset rotation and pulsing
        this.rotationOffset = 0;
        this.pulseFactor = 0;
        this.pulseSpeed = 0.5 + Math.random() * 0.5;
    }

    applyGravity(object, deltaTime) {
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If an exotic particle was just consumed, create visual effect
        if (object.lastShardLossTime && 
            Date.now() - object.lastShardLossTime < 100) {
            this.addShardConsumptionEffect();
        }
        
        if (distance > 0) {
            // When very close to event horizon, apply massive sudden force
            if (distance < this.eventHorizonRadius * 1.2) {
                const eventHorizonForce = this.pullStrength * 20 * Math.exp((this.eventHorizonRadius - distance) / 5);
                const angle = Math.atan2(dy, dx);
                
                return {
                    x: Math.cos(angle) * eventHorizonForce,
                    y: Math.sin(angle) * eventHorizonForce
                };
            }
            
            // Outside event horizon, use more aggressive gravity curve
            const minDistance = this.radius;
            const scaledDistance = Math.max(distance, minDistance);
            const force = (this.pullStrength * 3 * deltaTime) / Math.pow(scaledDistance * 0.15, 1.5);
            const cappedForce = Math.min(force, 400); // Doubled max force cap
            
            const angle = Math.atan2(dy, dx);
            
            return {
                x: Math.cos(angle) * cappedForce,
                y: Math.sin(angle) * cappedForce
            };
        }
        
        return { x: 0, y: 0 };
    }
}

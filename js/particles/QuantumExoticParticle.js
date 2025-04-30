// filepath: /home/fayaz/lab/roboescape/js/particles/QuantumExoticParticle.js
import { ExoticParticleBase } from './ExoticParticleBase.js';

/**
 * Quantum exotic particle - phase-shifting appearance with high value
 */
export class QuantumExoticParticle extends ExoticParticleBase {
    constructor(options) {
        super(options);
        
        this.maxValue = 15; // Highest maximum value
        this.value = Math.floor(Math.random() * (this.maxValue - 8)) + 8; // Value between 8 and maxValue
        this.color = '#00ddff'; // Bright cyan for quantum particles
        
        this.phaseTime = 0;
        this.phaseSpeed = 1.0;
        this.orbitRadius = 15;
        this.orbitParticles = [];
        
        // Create small orbiting particles
        const orbitCount = 3;
        for (let i = 0; i < orbitCount; i++) {
            this.orbitParticles.push({
                angle: (i / orbitCount) * Math.PI * 2,
                speed: 1 + Math.random() * 0.5,
                size: 2 + Math.random() * 2
            });
        }
    }
    
    draw(ctx) {
        // Core particle with phase-shifting effect
        const phase = (Math.sin(this.phaseTime) + 1) / 2; // 0 to 1
        const secondaryPhase = (Math.sin(this.phaseTime * 1.3) + 1) / 2; // Different frequency
        
        // Draw quantum field effect (rippling circles)
        const rippleCount = 3;
        for (let i = 0; i < rippleCount; i++) {
            const ripplePhase = (i / rippleCount + secondaryPhase) % 1;
            const rippleRadius = this.radius * (1 + ripplePhase * 3);
            const rippleOpacity = 0.5 * (1 - ripplePhase);
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, rippleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 200, 255, ${rippleOpacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Core of the particle - phase shifting between geometries
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (phase < 0.33) {
            // Circle form
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 220, 255, ${0.7 + secondaryPhase * 0.3})`;
            ctx.fill();
        } else if (phase < 0.66) {
            // Square form - gradually changes to diamond
            const morph = (phase - 0.33) * 3; // 0 to 1 during this phase
            ctx.save();
            ctx.rotate(morph * Math.PI / 4); // Rotate from 0 to 45 degrees
            
            ctx.beginPath();
            const size = this.radius * 1.8;
            ctx.rect(-size/2, -size/2, size, size);
            ctx.fillStyle = `rgba(0, 180, 255, ${0.7 + secondaryPhase * 0.3})`;
            ctx.fill();
            ctx.restore();
        } else {
            // Triangle form
            const sides = 3;
            const size = this.radius * 1.8;
            
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * size;
                const y = Math.sin(angle) * size;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(100, 220, 255, ${0.7 + secondaryPhase * 0.3})`;
            ctx.fill();
        }
        ctx.restore();
        
        // Draw orbiting particles
        this.orbitParticles.forEach(particle => {
            const x = this.x + Math.cos(particle.angle) * this.orbitRadius;
            const y = this.y + Math.sin(particle.angle) * this.orbitRadius;
            
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(150, 255, 255, 0.8)';
            ctx.fill();
            
            // Trail effect
            ctx.beginPath();
            const trailLength = 0.5;
            const trailX = x - Math.cos(particle.angle) * trailLength * this.orbitRadius;
            const trailY = y - Math.sin(particle.angle) * trailLength * this.orbitRadius;
            
            const gradient = ctx.createLinearGradient(x, y, trailX, trailY);
            gradient.addColorStop(0, 'rgba(150, 255, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(150, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = particle.size;
            ctx.moveTo(x, y);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
        });
        
        // Draw particle value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.value.toString(), this.x, this.y + 4);
        ctx.textAlign = 'left';
        
        // Additional energy field
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.radius * 2.5
        );
        glowGradient.addColorStop(0, `rgba(0, 200, 255, ${0.2 + secondaryPhase * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
    }
    
    update(deltaTime) {
        // Update phase time
        this.phaseTime += deltaTime * this.phaseSpeed;
        
        // Moderate rotation speed for base element
        super.update(deltaTime * 0.8);
        
        // Update orbiting particles
        this.orbitParticles.forEach(particle => {
            particle.angle += deltaTime * particle.speed * 2;
        });
    }
}

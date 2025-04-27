// filepath: /home/fayaz/lab/roboescape/js/particles/UnstableExoticParticle.js
import { ExoticParticleBase } from './ExoticParticleBase.js';

/**
 * Unstable exotic particle - flickering, erratic movement
 */
export class UnstableExoticParticle extends ExoticParticleBase {
    constructor(options) {
        super(options);
        
        this.maxValue = 6; // Medium-high maximum value
        this.value = Math.floor(Math.random() * 3) + 3; // Value between 3 and 5
        this.color = '#ff7700'; // Orange color for unstable particles
        
        this.flickerTimer = 0;
        this.flickerInterval = 0.1; // How often to change flicker state
        this.flickerState = 1; // Current flicker intensity
        this.jitterRadius = 2; // How far it can jitter from its position
        this.originalX = this.x;
        this.originalY = this.y;
    }
    
    draw(ctx) {
        // Apply jitter to position for drawing only
        const jitterX = this.x + (Math.random() - 0.5) * this.jitterRadius;
        const jitterY = this.y + (Math.random() - 0.5) * this.jitterRadius;
        
        // Flickering core
        ctx.beginPath();
        ctx.arc(jitterX, jitterY, this.radius * this.flickerState, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Unstable corona effect
        ctx.beginPath();
        ctx.arc(jitterX, jitterY, this.radius * 2, 0, Math.PI * 2);
        const glowIntensity = (0.3 + (this.value / 10) * 0.4) * this.flickerState;
        const gradient = ctx.createRadialGradient(
            jitterX, jitterY, this.radius,
            jitterX, jitterY, this.radius * 2
        );
        gradient.addColorStop(0, `rgba(255, 119, 0, ${glowIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 119, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw particle value
        const textOpacity = 0.5 + this.flickerState * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.value.toString(), jitterX, jitterY + 4);
        ctx.textAlign = 'left';
        
        // Draw unstable energy pattern
        ctx.save();
        ctx.translate(jitterX, jitterY);
        ctx.rotate(this.rotation);
        
        // Lightning-like zigzag pattern
        ctx.beginPath();
        const segments = 6;
        const zigzagAmplitude = this.radius * 0.5;
        
        ctx.moveTo(-this.radius * 1.5, 0);
        for (let i = 1; i <= segments; i++) {
            const progress = i / segments;
            const x = -this.radius * 1.5 + progress * this.radius * 3;
            const y = (i % 2 === 0 ? -1 : 1) * zigzagAmplitude * this.flickerState;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.radius * 1.5, 0);
        
        ctx.strokeStyle = `rgba(255, 255, 200, ${0.7 * this.flickerState})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    update(deltaTime) {
        // Call parent update with faster rotation
        super.update(deltaTime * 2);
        
        // Update flicker effect
        this.flickerTimer += deltaTime;
        if (this.flickerTimer >= this.flickerInterval) {
            this.flickerTimer = 0;
            this.flickerState = 0.6 + Math.random() * 0.4; // Random flicker intensity
        }
        
        // Reset position to avoid drift but keep jitter visual effect
        this.x = this.originalX;
        this.y = this.originalY;
    }
}

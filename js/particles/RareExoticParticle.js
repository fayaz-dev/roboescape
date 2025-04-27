// filepath: /home/fayaz/lab/roboescape/js/particles/RareExoticParticle.js
import { ExoticParticleBase } from './ExoticParticleBase.js';

/**
 * Rare exotic particle - higher value but rarer
 */
export class RareExoticParticle extends ExoticParticleBase {
    constructor(options) {
        super(options);
        
        this.maxValue = 8; // Higher maximum value
        this.value = Math.floor(Math.random() * 3) + 5; // Value between 5 and 7
        this.color = '#ff00ff'; // Magenta color for rare particles
        this.pulseSpeed = 1.5; // Controls the speed of the pulsing effect
        this.pulseFactor = 0; // Current pulse phase
    }
    
    draw(ctx) {
        // Pulsing glow effect
        ctx.beginPath();
        const pulseSize = 1 + Math.sin(this.pulseFactor) * 0.2;
        ctx.arc(this.x, this.y, this.radius * pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5 * pulseSize, 0, Math.PI * 2);
        const glowIntensity = 0.4 + (this.value / 10) * 0.4;
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius * pulseSize,
            this.x, this.y, this.radius * 2.5 * pulseSize
        );
        gradient.addColorStop(0, `rgba(255, 0, 255, ${glowIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw particle value
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.value.toString(), this.x, this.y + 4);
        ctx.textAlign = 'left';
        
        // Draw multiple rotating rays around the particle
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const rayCount = 3;
        for (let i = 0; i < rayCount; i++) {
            ctx.rotate((Math.PI * 2) / rayCount);
            ctx.save();
            ctx.rotate(this.rotation);
            
            ctx.beginPath();
            ctx.moveTo(-this.radius * 1.8, 0);
            ctx.lineTo(this.radius * 1.8, 0);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    update(deltaTime) {
        // Call parent update method with modified rotation speed
        super.update(deltaTime * 1.2);
        
        // Update pulse factor
        this.pulseFactor += deltaTime * this.pulseSpeed * Math.PI;
    }
}

/**
 * Base class for all exotic particles
 */
export class ExoticParticleBase {
    /**
     * @param {Object} options - Particle initialization options
     * @param {number} options.x - X position
     * @param {number} options.y - Y position 
     * @param {number} options.radius - Particle radius
     * @param {number} options.rotation - Initial rotation angle
     */
    constructor(options = {}) {
        this.initialize(options);
    }
    
    /**
     * Initialize or reinitialize the particle (for object pooling)
     * @param {Object} options - Particle initialization options
     */
    initialize(options = {}) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.radius = options.radius || 8;
        this.rotation = options.rotation || Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.5 + 0.2; // Random rotation speed
        this.value = 1; // Default value, to be overridden by subclasses
        this.color = '#00ffff'; // Default color, can be overridden
        this.active = true; // Flag for object pooling
        this.pulsePhase = Math.random() * Math.PI * 2; // Random pulse phase for animation
        return this;
    }
    
    /**
     * Draw the particle
     * @param {CanvasRenderingContext2D} ctx - The rendering context
     */
    draw(ctx) {
        // Apply pulse effect
        const pulseFactor = 0.15 * Math.sin(this.pulsePhase) + 1.0; // Pulsate between 0.85 and 1.15
        const currentRadius = this.radius * pulseFactor;
        
        // Basic drawing logic - can be overridden by subclasses for custom visuals
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Glow effect with intensity based on value
        ctx.beginPath();
        const glowRadius = currentRadius * 2;
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        
        // More valuable particles glow brighter and with a pulse
        const baseIntensity = 0.3 + (this.value / 10) * 0.4;
        const glowIntensity = baseIntensity * (0.8 + 0.2 * Math.sin(this.pulsePhase));
        
        // Create color components with slight variations
        const r = 0;
        const g = 255;
        const b = 255;
        
        const gradient = ctx.createRadialGradient(
            this.x, this.y, currentRadius,
            this.x, this.y, glowRadius
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowIntensity})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw particle value
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.value.toString(), this.x, this.y + 4);
        ctx.textAlign = 'left';
        
        // Draw rotating glimmer line across the particle
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(-currentRadius * 1.2, 0);
        ctx.lineTo(currentRadius * 1.2, 0);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + 0.3 * Math.sin(this.pulsePhase + Math.PI/2)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * Update particle state - to be implemented by subclasses
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Rotate the particle based on its rotation speed
        this.rotation += deltaTime * this.rotationSpeed;
        
        // Update pulse phase for animation effects
        this.pulsePhase += deltaTime * 2;
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase -= Math.PI * 2;
        }
    }
}

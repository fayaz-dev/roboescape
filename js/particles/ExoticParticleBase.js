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
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.radius = options.radius || 8;
        this.rotation = options.rotation || 0;
        this.value = 1; // Default value, to be overridden by subclasses
        this.color = '#00ffff'; // Default color, can be overridden
    }
    
    /**
     * Draw the particle
     * @param {CanvasRenderingContext2D} ctx - The rendering context
     */
    draw(ctx) {
        // Basic drawing logic - can be overridden by subclasses for custom visuals
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Glow effect with intensity based on value
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        const glowIntensity = 0.3 + (this.value / 10) * 0.4; // More valuable particles glow brighter
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, `rgba(0, 255, 255, ${glowIntensity})`);
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
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
        ctx.moveTo(-this.radius * 1.2, 0);
        ctx.lineTo(this.radius * 1.2, 0);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * Update particle state - to be implemented by subclasses
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Default behavior - just rotate
        this.rotation += deltaTime * 0.5;
    }
}

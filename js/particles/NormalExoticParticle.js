import { ExoticParticleBase } from './ExoticParticleBase.js';

/**
 * Normal exotic particle - basic behavior
 */
export class NormalExoticParticle extends ExoticParticleBase {
    constructor(options) {
        super(options);
        
        this.maxValue = 3; // Maximum value for this particle type
        this.value = Math.floor(Math.random() * this.maxValue) + 1; // Random value between 1 and maxValue
        this.color = '#00ffff'; // Cyan color for normal particles
    }
    
    // We can override the draw method if we want custom visuals
    // Or leave it to inherit from the base class
    
    update(deltaTime) {
        // Call parent update method
        super.update(deltaTime);
        
        // Add any specific behavior for normal particles here
    }
}

import { NormalExoticParticle } from './NormalExoticParticle.js';

/**
 * Factory for creating different types of exotic particles
 */
export class ExoticParticleFactory {
    constructor() {
        // Register all available particle types
        this.particleTypes = {
            'normal': NormalExoticParticle
            // Additional particle types can be registered here later
            // 'speed': SpeedExoticParticle,
            // 'power': PowerExoticParticle,
        };
    }
    
    /**
     * Create a new particle instance
     * @param {string} type - Type of particle to create
     * @param {Object} options - Initialization options
     * @returns {ExoticParticleBase} A new particle instance
     */
    createParticle(type, options) {
        const ParticleClass = this.particleTypes[type];
        
        if (!ParticleClass) {
            console.warn(`Unknown particle type: ${type}, falling back to normal`);
            return new NormalExoticParticle(options);
        }
        
        return new ParticleClass(options);
    }
    
    /**
     * Register a new particle type
     * @param {string} typeName - Name of the particle type
     * @param {Class} particleClass - Class constructor for the particle type
     */
    registerParticleType(typeName, particleClass) {
        this.particleTypes[typeName] = particleClass;
    }
}

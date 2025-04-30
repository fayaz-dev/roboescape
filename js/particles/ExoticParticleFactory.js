import { NormalExoticParticle } from './NormalExoticParticle.js';
import { RareExoticParticle } from './RareExoticParticle.js';
import { UnstableExoticParticle } from './UnstableExoticParticle.js';
import { QuantumExoticParticle } from './QuantumExoticParticle.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import Debug from '../utils/Debug.js';

/**
 * Factory for creating different types of exotic particles
 */
export class ExoticParticleFactory {
    constructor() {
        // Register all available particle types
        this.particleTypes = {
            'normal': NormalExoticParticle,
            'rare': RareExoticParticle,
            'unstable': UnstableExoticParticle,
            'quantum': QuantumExoticParticle
            // Add new particle types here in the future
        };
        
        // Initialize object pools for each particle type
        this.particlePools = {
            'normal': new ObjectPool(
                () => new NormalExoticParticle({}),
                (particle, options) => particle.initialize(options)
            ),
            'rare': new ObjectPool(
                () => new RareExoticParticle({}),
                (particle, options) => particle.initialize(options)
            ),
            'unstable': new ObjectPool(
                () => new UnstableExoticParticle({}),
                (particle, options) => particle.initialize(options)
            ),
            'quantum': new ObjectPool(
                () => new QuantumExoticParticle({}),
                (particle, options) => particle.initialize(options)
            )
        };
    }
    
    /**
     * Create a new particle instance using object pooling
     * @param {string} type - Type of particle to create
     * @param {Object} options - Initialization options
     * @returns {ExoticParticleBase} A new particle instance
     */
    createParticle(type, options) {
        try {
            // Make sure options object is valid
            if (!options) {
                options = {};
            }
            
            // Ensure position is set
            if (options.x === undefined || options.y === undefined) {
                Debug.warn(`Creating particle without position, using default`);
                options.x = options.x || 0;
                options.y = options.y || 0;
            }
            
            // Make sure the particle is marked as active
            options.active = true;
            
            // Use the object pool if available
            if (this.particlePools[type]) {
                const particle = this.particlePools[type].get(options);
                return particle;
            }
            
            // Fall back to traditional instantiation
            const ParticleClass = this.particleTypes[type];
            
            if (!ParticleClass) {
                Debug.warn(`Unknown particle type: ${type}, falling back to normal`);
                return this.particlePools['normal'].get(options);
            }
            
            return new ParticleClass(options);
        } catch (error) {
            Debug.error(`Error in createParticle for type ${type}:`, error);
            // Last resort fallback - return a basic normal particle
            return new NormalExoticParticle({
                x: options?.x || 0,
                y: options?.y || 0,
                active: true
            });
        }
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

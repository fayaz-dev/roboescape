import { ObjectPool } from './ObjectPool.js';

/**
 * A high-performance object pool specifically for plasma particles
 * in the black hole, optimized for the specific use case
 */
export class PlasmaParticlePool extends ObjectPool {
    constructor(initialSize = 100) {
        super(
            // Factory function
            () => ({
                x: 0, 
                y: 0, 
                vx: 0, 
                vy: 0, 
                life: 1.0, 
                size: 2,
                color: 'hsla(290, 100%, 70%, '
            }),
            // Reset function
            (particle, x, y, vx, vy, size, color) => {
                particle.x = x;
                particle.y = y;
                particle.vx = vx;
                particle.vy = vy;
                particle.life = 1.0;
                particle.size = size || 2;
                particle.color = color || 'hsla(290, 100%, 70%, ';
                return particle;
            },
            initialSize
        );
    }
}

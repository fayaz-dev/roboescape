/**
 * Generic object pool to reuse objects and reduce garbage collection
 */
export default class ObjectPool {
    /**
     * Create a new object pool
     * @param {Function} factory - Factory function to create new objects
     * @param {Function} reset - Function to reset/recycle objects
     * @param {number} initialSize - Initial pool size
     */
    constructor(factory, reset, initialSize = 20) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        
        // Initialize pool with objects
        this.expand(initialSize);
    }
    
    /**
     * Get an object from the pool or create a new one if empty
     * @param  {...any} args - Arguments to pass to the factory or reset function
     * @returns {Object} An object from the pool
     */
    get(...args) {
        if (this.pool.length === 0) {
            // Auto-expand pool when empty (creates 10 more objects)
            this.expand(10);
        }
        
        const object = this.pool.pop();
        this.reset(object, ...args);
        return object;
    }
    
    /**
     * Return an object to the pool
     * @param {Object} object - Object to return to the pool
     */
    release(object) {
        this.pool.push(object);
    }
    
    /**
     * Expand the pool with new objects
     * @param {number} count - Number of objects to add
     */
    expand(count) {
        for (let i = 0; i < count; i++) {
            this.pool.push(this.factory());
        }
    }
    
    /**
     * Get the current size of the pool
     * @returns {number} Pool size
     */
    get size() {
        return this.pool.length;
    }
}

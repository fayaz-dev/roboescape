/**
 * Performance optimization utilities for the game
 */
export default class PerformanceOptimizer {
    constructor() {
        // FPS tracking
        this.fps = 60;
        this.frameTimes = [];
        this.lastFrameTimestamp = 0;
        
        // Adaptive quality settings
        this.qualityLevel = 'high'; // 'low', 'medium', 'high'
        this.adaptiveQualityEnabled = true;
        
        // Performance metrics
        this.averageFrameTime = 16; // ms (targeting 60fps)
        this.frameCounter = 0;
        
        // Measure intervals
        this.measureInterval = 30; // Check performance every 30 frames
        
        // Throttling
        this.renderThrottleMap = new Map(); // For tracking last render times of objects
    }
    
    /**
     * Track frame time and calculate FPS
     * @param {number} timestamp - Current timestamp
     */
    measureFrameRate(timestamp) {
        if (this.lastFrameTimestamp === 0) {
            this.lastFrameTimestamp = timestamp;
            return;
        }
        
        // Calculate time since last frame
        const frameTime = timestamp - this.lastFrameTimestamp;
        this.lastFrameTimestamp = timestamp;
        
        // Add to rolling buffer
        this.frameTimes.push(frameTime);
        
        // Keep only the last 60 frames
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        // Calculate average FPS
        const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        this.averageFrameTime = averageFrameTime;
        this.fps = Math.round(1000 / averageFrameTime);
        
        // Adaptive quality adjustments
        this.frameCounter++;
        if (this.adaptiveQualityEnabled && this.frameCounter % this.measureInterval === 0) {
            this.adjustQuality();
        }
    }
    
    /**
     * Adjust quality settings based on performance
     */
    adjustQuality() {
        if (this.fps < 30 && this.qualityLevel !== 'low') {
            this.qualityLevel = 'low';
            console.log('⚡ Performance: Reducing quality to improve framerate');
        } else if (this.fps < 45 && this.qualityLevel === 'high') {
            this.qualityLevel = 'medium';
            console.log('⚡ Performance: Reducing quality to medium');
        } else if (this.fps > 58 && this.qualityLevel === 'low') {
            this.qualityLevel = 'medium';
            console.log('⚡ Performance: Increasing quality to medium');
        } else if (this.fps > 58 && this.qualityLevel === 'medium') {
            this.qualityLevel = 'high';
            console.log('⚡ Performance: Increasing quality to high');
        }
    }
    
    /**
     * Whether to render this frame for a specific object based on quality settings
     * @param {string} objectId - Unique identifier for the object
     * @param {object} options - Options for throttling
     * @param {number} options.high - Frame interval for high quality (ms)
     * @param {number} options.medium - Frame interval for medium quality (ms)
     * @param {number} options.low - Frame interval for low quality (ms)
     * @returns {boolean} - True if should render, false if should skip
     */
    shouldRender(objectId, options = { high: 0, medium: 33, low: 50 }) {
        const now = performance.now();
        const lastRenderTime = this.renderThrottleMap.get(objectId) || 0;
        
        // Determine interval based on quality level
        let interval = 0; // Default: render every frame
        switch (this.qualityLevel) {
            case 'low':
                interval = options.low;
                break;
            case 'medium':
                interval = options.medium;
                break;
            case 'high':
                interval = options.high;
                break;
        }
        
        if (now - lastRenderTime >= interval) {
            this.renderThrottleMap.set(objectId, now);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get the current quality level
     * @returns {string} - Current quality level
     */
    getQualityLevel() {
        return this.qualityLevel;
    }
    
    /**
     * Get performance debug info
     * @returns {object} - Debug information
     */
    getDebugInfo() {
        return {
            fps: this.fps,
            averageFrameTime: this.averageFrameTime.toFixed(2),
            qualityLevel: this.qualityLevel
        };
    }
}

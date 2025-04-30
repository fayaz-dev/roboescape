/**
 * Performance optimization manager for RoboEscape game
 * Centralizes performance optimization configurations and utilities
 */
import { PerformanceOptimizer } from './PerformanceOptimizer.js';
import { ObjectPool } from './ObjectPool.js';

// Create and export a single instance of the performance optimizer
export const performanceOptimizer = new PerformanceOptimizer();

// Configuration constants for performance
export const PERFORMANCE_CONFIG = {
    // Rendering quality levels
    quality: {
        low: {
            particleLimit: 150,
            starLimit: 100,
            updateInterval: 2,
            effectDetail: 'low'
        },
        medium: {
            particleLimit: 300,
            starLimit: 200,
            updateInterval: 1,
            effectDetail: 'medium'
        },
        high: {
            particleLimit: 500,
            starLimit: 300,
            updateInterval: 1,
            effectDetail: 'high'
        }
    },
    
    // Memory management
    memory: {
        maxPoolSize: 1000,      // Maximum size for any object pool
        cleanupInterval: 10000, // Milliseconds between pool size checks
    },
    
    // Rendering optimizations
    rendering: {
        batchSize: 50,           // Number of objects to batch-process at once
        cullingEnabled: true,    // Enable off-screen object culling
        throttleFactor: 1        // Throttle factor for non-critical animations
    }
};

/**
 * Get the current performance configuration based on quality level
 * @returns {Object} Current performance config
 */
export function getCurrentConfig() {
    return PERFORMANCE_CONFIG.quality[performanceOptimizer.getQualityLevel()];
}

/**
 * Initialize game-wide performance optimizations
 * @param {Object} options - Optimization options
 */
export function initPerformanceOptimizations(options = {}) {
    // Enable adaptive quality if not explicitly disabled
    performanceOptimizer.adaptiveQualityEnabled = 
        options.adaptiveQuality !== undefined ? options.adaptiveQuality : true;
    
    // Set initial quality level based on device capabilities
    // Use a more cautious approach - start with higher quality and let the adaptive system adjust
    if (!window.navigator.hardwareConcurrency || window.navigator.hardwareConcurrency <= 2) {
        performanceOptimizer.qualityLevel = 'medium'; // Start with medium even on low-end devices
    } else {
        performanceOptimizer.qualityLevel = 'high';   // Start with high on better devices
    }
    
    // Setup periodic pool cleanup
    if (options.enablePoolCleanup !== false) {
        setInterval(() => {
            // This would typically be tied to the game's state
            // For now, just log the initialization
            console.log('Performance optimization initialized');
        }, PERFORMANCE_CONFIG.memory.cleanupInterval);
    }
    
    // Return the optimizer for reference
    return performanceOptimizer;
}

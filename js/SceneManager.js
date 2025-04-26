import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        
        // Set canvas to full window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Store dimensions for calculations
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Universe rotation properties
        this.universeRotationAngle = 0;
        this.universeRotationSpeed = 0.001; // radians per second
        
        // Set up event listener for window resizing
        window.addEventListener('resize', () => {
            this.handleResize();
            // Dispatch a custom event that components can listen for
            window.dispatchEvent(new CustomEvent('gameResize', {
                detail: { width: this.width, height: this.height }
            }));
        });
    }
    
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }
    
    clear() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    updateUniverseRotation(deltaTime) {
        this.universeRotationAngle += this.universeRotationSpeed * deltaTime;
        
        // Keep angle between 0 and 2π for cleaner math
        if (this.universeRotationAngle > Math.PI * 2) {
            this.universeRotationAngle -= Math.PI * 2;
        }
    }
    
    // Convert absolute coordinates to rotated coordinates
    applyUniverseRotation(x, y) {
        // Calculate relative position from center
        const relX = x - this.centerX;
        const relY = y - this.centerY;
        
        // Apply rotation
        const rotatedX = relX * Math.cos(this.universeRotationAngle) - relY * Math.sin(this.universeRotationAngle);
        const rotatedY = relX * Math.sin(this.universeRotationAngle) + relY * Math.cos(this.universeRotationAngle);
        
        // Return absolute position
        return {
            x: rotatedX + this.centerX,
            y: rotatedY + this.centerY
        };
    }
    
    // Convert rotated coordinates back to absolute coordinates
    reverseUniverseRotation(x, y) {
        // Calculate relative position from center
        const relX = x - this.centerX;
        const relY = y - this.centerY;
        
        // Apply reverse rotation
        const rotatedX = relX * Math.cos(-this.universeRotationAngle) - relY * Math.sin(-this.universeRotationAngle);
        const rotatedY = relX * Math.sin(-this.universeRotationAngle) + relY * Math.cos(-this.universeRotationAngle);
        
        // Return absolute position
        return {
            x: rotatedX + this.centerX,
            y: rotatedY + this.centerY
        };
    }
}

// Home page background animation
export class HomeBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.stars = [];
        this.lastTime = 0;
        this.initialized = false;
    }

    init() {
        // Only initialize once
        if (this.initialized) return;
        this.initialized = true;

        // Create background stars (static)
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.7 + 0.3
            });
        }

        // Create particles (moving)
        for (let i = 0; i < 80; i++) {
            this.createParticle();
        }

        // Start animation
        this.animate();
    }

    createParticle() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Create particles in a circular area around the center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * Math.min(this.canvas.width, this.canvas.height) * 0.4;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Calculate velocity (slow movement towards center)
        const speed = 0.2 + Math.random() * 0.3;
        const vx = (centerX - x) / distance * speed;
        const vy = (centerY - y) / distance * speed;
        
        this.particles.push({
            x,
            y,
            vx,
            vy,
            size: Math.random() * 2 + 1,
            color: this.getRandomColor(),
            opacity: Math.random() * 0.7 + 0.3,
            life: Math.random() * 0.8 + 0.2
        });
    }

    getRandomColor() {
        const colors = [
            '0, 204, 255',  // Cyan
            '0, 102, 255',  // Blue
            '102, 0, 255',  // Purple
            '255, 0, 102',  // Pink
            '255, 102, 0'   // Orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(deltaTime) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Move particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Decrease life
            particle.life -= 0.003 * deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0 || 
                particle.x < 0 || 
                particle.x > this.canvas.width || 
                particle.y < 0 || 
                particle.y > this.canvas.height) {
                this.particles.splice(i, 1);
                this.createParticle();
            }
            
            // Particles get smaller as they approach center
            const distanceToCenter = Math.sqrt(
                Math.pow(particle.x - centerX, 2) + 
                Math.pow(particle.y - centerY, 2)
            );
            
            const normalizedDistance = Math.min(distanceToCenter / (this.canvas.width * 0.25), 1);
            particle.currentSize = particle.size * normalizedDistance;
            particle.currentOpacity = particle.opacity * normalizedDistance;
        }
        
        // Create new particles to maintain count
        while (this.particles.length < 80) {
            this.createParticle();
        }
    }

    draw() {
        // Clear canvas with a transparent black to create fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars (background)
        for (const star of this.stars) {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fill();
        }
        
        // Draw particles
        for (const particle of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${particle.color}, ${particle.currentOpacity * particle.life})`;
            this.ctx.fill();
        }
        
        // Draw center glow (simulating black hole)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 50;
        
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(20, 20, 40, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 102, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 204, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    animate(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.animate(time));
    }
    
    resize() {
        // Update star positions
        this.stars.forEach(star => {
            star.x = (star.x / this.canvas.width) * this.canvas.width;
            star.y = (star.y / this.canvas.height) * this.canvas.height;
        });
    }
}


/**
 * Elegant Cosmos Effect v2 - "Clear Galaxy"
 * Features: Balanced star density, white nebula gradients, 
 * and interactive star movement.
 */

const canvas = document.getElementById('cosmos-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
let mouse = { x: -1000, y: -1000 };

// Configuration for Elegance
const STAR_COUNT = 300; // Balanced density as requested
const STAR_COLOR = 'rgba(255, 255, 255, 0.9)';
const NEBULA_INTENSITY = 0.12;

class Star {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.8 + 0.2;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 40) + 5;
        this.opacity = Math.random() * 0.7 + 0.1;
        this.vX = (Math.random() - 0.5) * 0.2;
        this.vY = (Math.random() - 0.5) * 0.2;
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a tiny glow to larger stars
        if (this.size > 1.2) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "white";
        } else {
            ctx.shadowBlur = 0;
        }
    }

    update() {
        // Natural drift
        this.x += this.vX;
        this.y += this.vY;

        // Wrap around screen
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Mouse Interactivity: Stars move when mouse passes
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        let maxDistance = 150;

        if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const directionX = dx / distance;
            const directionY = dy / distance;
            
            // Push stars away from mouse subtly
            this.x -= directionX * force * 3;
            this.y -= directionY * force * 3;
        }
    }
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star());
    }
}

function drawNebula() {
    // Elegant White "Galaxy" Glow
    if (mouse.x > -500) {
        ctx.save();
        const gradient = ctx.createRadialGradient(
            mouse.x, mouse.y, 0,
            mouse.x, mouse.y, 500
        );
        
        // Multi-layered white gradient for "Clear Galaxy" feel
        gradient.addColorStop(0, `rgba(255, 255, 255, ${NEBULA_INTENSITY})`);
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.01)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
}

function animate() {
    // Clear and draw background
    ctx.clearRect(0, 0, width, height);
    
    // 1. Draw Nebula (the white clear light)
    drawNebula();
    
    // 2. Draw and update stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    init();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

init();
animate();

console.log("Celestial Galaxy Background Loaded.");

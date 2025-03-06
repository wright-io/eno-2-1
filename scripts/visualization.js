/**
 * Visualization for Brian Eno's "2/1" Web Recreation
 * Handles canvas drawing and animation of the orbiting dots
 */

class Visualization {
    constructor(canvasId) {
        // Get the canvas element
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d')
        
        // Visualization properties
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.maxRadius = Math.min(this.centerX, this.centerY) * 0.85;
        this.playheadAngle = Math.PI / 2; // Start at top (90 degrees)
        
        // Animation properties
        this.isAnimating = false;
        this.animationFrameId = null;
        
        // Voice data (will be populated from audio engine)
        this.voices = [];
        
        // Dot properties
        this.dotRadius = 8;
        this.playheadWidth = 2;
        
        // Bind methods
        this.draw = this.draw.bind(this);
        this.startAnimation = this.startAnimation.bind(this);
        this.stopAnimation = this.stopAnimation.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the visualization
     */
    init() {
        // Set canvas dimensions to match its display size
        this.resize();
        
        // Add event listener for window resize
        window.addEventListener('resize', () => this.resize());
        
        // Get voice data from audio engine
        this.voices = audioEngine.getVoices();
        
        // Calculate orbit radii based on loop durations
        this.calculateOrbitRadii();
        
        // Calculate initial offsets for each voice
        this.calculateInitialOffsets();
        
        // Initial draw
        this.draw();
    }
    
    /**
     * Initialize the visualization with the random offsets from the audio engine
     * This ensures the visualization matches the audio timing
     * @param {boolean} forceUpdate - Whether to force an update of the visualization
     */
    calculateInitialOffsets(forceUpdate = false) {
        // The random offsets are already stored in the voice objects by the audio engine
        // We just need to make sure they're properly initialized for the visualization
        let offsetsChanged = false;
        
        this.voices.forEach(voice => {
            if (typeof voice.randomOffset === 'undefined') {
                // If the audio engine hasn't generated random offsets yet (e.g., before playback starts),
                // initialize with a random value for the initial visualization
                voice.randomOffset = Math.random() * voice.loopDuration;
                console.log(`Voice ${voice.note}: initialized random offset ${voice.randomOffset.toFixed(2)}s for visualization`);
                offsetsChanged = true;
            } else {
                console.log(`Voice ${voice.note}: using audio engine random offset ${voice.randomOffset.toFixed(2)}s`);
            }
        });
        
        // If offsets changed or force update is requested, redraw the visualization
        if (offsetsChanged || forceUpdate) {
            this.draw();
        }
        
        return this.voices;
    }
    
    /**
     * Resize the canvas to match its display size
     */
    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas dimensions to match container (maintaining square aspect ratio)
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        
        // Update center coordinates
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Update max radius
        this.maxRadius = Math.min(this.centerX, this.centerY) * 0.85;
        
        // Recalculate orbit radii
        this.calculateOrbitRadii();
        
        // Redraw
        this.draw();
        
        console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }
    
    /**
     * Calculate orbit radii - equidistant spacing, arranged by loop duration
     * with longest duration furthest from center
     */
    calculateOrbitRadii() {
        // Number of voices
        const voiceCount = this.voices.length;
        
        // Calculate equidistant radii
        const minRadius = this.maxRadius * 0.2; // Minimum radius is 20% of max
        const radiusStep = (this.maxRadius - minRadius) / (voiceCount - 1);
        
        // Sort voices by loop duration (longest first)
        const sortedVoices = [...this.voices].sort((a, b) => b.loopDuration - a.loopDuration);
        
        // Assign equidistant radii with longest duration furthest from center
        sortedVoices.forEach((voice, index) => {
            // Find the original voice in the voices array
            const voiceIndex = this.voices.findIndex(v => v.note === voice.note);
            
            // Assign radius - longest duration gets largest radius (reverse the index)
            // Index 0 (longest duration) should get the largest radius (maxRadius)
            // Last index (shortest duration) should get the smallest radius (minRadius)
            this.voices[voiceIndex].orbitRadius = this.maxRadius - (index * radiusStep);
            
            console.log(`Voice ${voice.note}: loop duration ${voice.loopDuration}s, orbit radius ${this.voices[voiceIndex].orbitRadius.toFixed(1)} (equidistant, by duration)`);
        });
    }
    
    /**
     * Draw the visualization
     */
    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw orbits
        this.drawOrbits();
        
        // Draw playhead
        this.drawPlayhead();
        
        // Draw dots
        this.drawDots();
    }
    
    /**
     * Draw the background
     */
    drawBackground() {
        // Pure white background to match the minimalist theme
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Draw the orbits (concentric circles) - all in black
     */
    drawOrbits() {
        // Draw orbits with consistent line width
        this.voices.forEach(voice => {
            // Use a consistent thin line for all orbits
            const lineWidth = 1;
            
            // Draw orbit in black
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, voice.orbitRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#000000'; // Black
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        });
    }
    
    /**
     * Draw the fixed playhead line - in black
     */
    drawPlayhead() {
        const endX = this.centerX + Math.cos(this.playheadAngle) * this.maxRadius * 1.1;
        const endY = this.centerY + Math.sin(this.playheadAngle) * this.maxRadius * 1.1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#000000'; // Black
        this.ctx.lineWidth = this.playheadWidth;
        this.ctx.stroke();
    }
    
    /**
     * Draw the dots for each voice
     */
    drawDots() {
        if (!audioEngine.isPlaying) {
            // Even when not playing, we should position the dots according to their random offsets
            console.log('Not playing, drawing dots at their random offset positions');
            this.voices.forEach(voice => {
                // Calculate position based on random offset
                const randomPosition = (voice.randomOffset || 0) / voice.loopDuration;
                // Invert the position for counterclockwise movement
                const loopPosition = 1 - randomPosition;
                const angle = (loopPosition * Math.PI * 2) + this.playheadAngle;
                
                const dotX = this.centerX + Math.cos(angle) * voice.orbitRadius;
                const dotY = this.centerY + Math.sin(angle) * voice.orbitRadius;
                
                this.drawDot(dotX, dotY, voice.color);
            });
            return;
        }
        
        // Get current playback time
        const currentTime = audioEngine.getCurrentTime();
        
        // Log current time occasionally (every ~3 seconds)
        if (Math.floor(currentTime * 10) % 30 === 0) {
            console.log('Current playback time:', currentTime.toFixed(2), 'seconds');
            
            // Log each voice's position
            this.voices.forEach((voice, index) => {
                const loopPosition = (currentTime % voice.loopDuration) / voice.loopDuration;
                console.log(`Voice ${index} (${voice.note}): ${(loopPosition * 100).toFixed(1)}% through its ${voice.loopDuration}s loop`);
            });
        }
        
        // Draw each voice's dot
        this.voices.forEach((voice, index) => {
            // Get the random offset for this voice
            const randomOffset = voice.randomOffset || 0;
            
            // Calculate the adjusted elapsed time (accounting for random offset)
            // This exactly matches the calculation in the audio engine
            const adjustedElapsedTime = currentTime + randomOffset;
            
            // Calculate the loop position (0-1 range)
            // We need to invert the direction to match the audio scheduling
            // The playhead is fixed, so dots move counterclockwise
            const loopPosition = 1 - ((adjustedElapsedTime % voice.loopDuration) / voice.loopDuration);
            const angle = (loopPosition * Math.PI * 2) + this.playheadAngle;
            
            const dotX = this.centerX + Math.cos(angle) * voice.orbitRadius;
            const dotY = this.centerY + Math.sin(angle) * voice.orbitRadius;
            
            // Draw the dot
            this.drawDot(dotX, dotY, voice.color);
            
            // Draw a pulse effect when a note is played (when dot crosses playhead)
            // Use a very tight threshold to ensure pulses happen exactly at the playhead
            // The playhead is at loopPosition = 0 or 1
            const distanceFromPlayhead = Math.min(loopPosition, 1 - loopPosition);
            if (distanceFromPlayhead < 0.005) { // Much tighter threshold (0.5% of the loop)
                this.drawPulse(dotX, dotY, voice.color, distanceFromPlayhead);
            }
        });
    }
    
    /**
     * Draw a single dot - all in black
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @param {string} color - The dot color (ignored, using black)
     */
    drawDot(x, y, color) {
        // Draw outer circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.dotRadius * 1.5, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#000000'; // Black
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw solid dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.dotRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000000'; // Black
        this.ctx.fill();
    }
    
    /**
     * Start the animation loop
     */
    startAnimation() {
        if (this.isAnimating) {
            console.log('Animation already running, ignoring start request');
            return;
        }
        
        console.log('Starting visualization animation');
        this.isAnimating = true;
        
        let frameCount = 0;
        const startTime = performance.now();
        
        const animate = () => {
            frameCount++;
            const currentTime = performance.now();
            
            // Log FPS every 60 frames
            if (frameCount % 60 === 0) {
                const elapsedSeconds = (currentTime - startTime) / 1000;
                const fps = frameCount / elapsedSeconds;
                console.log(`Animation running at ${fps.toFixed(1)} FPS`);
            }
            
            this.draw();
            
            if (this.isAnimating) {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Stop the animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Draw one last frame to show the paused state
        this.draw();
    }
    
    /**
     * Draw a pulse effect when a note is played - in black
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @param {string} color - The dot color (ignored, using black)
     * @param {number} distanceFromPlayhead - Distance from the playhead (0-1)
     */
    drawPulse(x, y, color, distanceFromPlayhead) {
        // Calculate pulse size - larger when exactly at the playhead
        // Use an inverse relationship with distance for a sharper pulse
        const pulseSize = this.dotRadius * (3 - distanceFromPlayhead * 200);
        
        if (pulseSize <= this.dotRadius) return;
        
        // Draw pulse as a series of concentric circles
        const maxCircles = 4; // More circles for a more visible pulse
        for (let i = 1; i <= maxCircles; i++) {
            const circleSize = this.dotRadius * (1 + i * 0.5);
            if (circleSize <= pulseSize) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, circleSize, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#000000'; // Black
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * Handle note start event from audio engine
     * @param {number} voiceIndex - The index of the voice
     * @param {number} time - The time the note starts
     */
    onNoteStart(voiceIndex, time) {
        // This method is called by the audio engine when a note starts
        // We don't need to do anything here as we're handling the pulse effect in drawDots
    }
}

// Create a global instance of the visualization
let visualization;

// Initialize after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    visualization = new Visualization('visualization');
});
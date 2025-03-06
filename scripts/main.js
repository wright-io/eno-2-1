/**
 * Main Application for Brian Eno's "2/1" Web Recreation
 * Entry point that initializes and connects all components
 */

class App {
    constructor() {
        // Application state
        this.initialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.init);
        } else {
            this.init();
        }
    }
    
    /**
     * Initialize the application
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('Initializing Brian Eno\'s "2/1" Web Recreation');
        
        // Ensure audio context is created on user interaction
        // (needed for browsers that require user gesture to start audio)
        const handleUserInteraction = () => {
            if (audioEngine && audioEngine.audioContext && audioEngine.audioContext.state === 'suspended') {
                audioEngine.audioContext.resume();
            }
            
            // Remove event listeners once audio is started
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        };
        
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        
        // Log musical information
        this.logMusicInfo();
    }
    
    /**
     * Log information about the musical piece
     */
    logMusicInfo() {
        console.log('Brian Eno\'s "2/1" from Music for Airports (1978)');
        console.log('Musical Information:');
        
        if (audioEngine && audioEngine.voices) {
            audioEngine.voices.forEach(voice => {
                console.log(`- ${voice.note}: ${voice.loopDuration} second loop (${voice.frequency.toFixed(2)} Hz)`);
            });
        }
    }
}

// Create the application instance
const app = new App();

// Add a service worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}
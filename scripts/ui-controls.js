/**
 * UI Controls for Brian Eno's "2/1" Web Recreation
 * Handles user interface interactions and connects audio and visualization
 */

class UIControls {
    constructor() {
        // UI elements
        this.playPauseButton = document.getElementById('playPauseButton');
        this.regenerateButton = document.getElementById('regenerateButton');
        this.playIcon = this.playPauseButton.querySelector('.play-icon');
        this.pauseIcon = this.playPauseButton.querySelector('.pause-icon');
        this.loadingIndicator = document.getElementById('loading');
        
        // State
        this.isLoaded = false;
        
        // Bind methods
        this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);
        this.handleRegenerateClick = this.handleRegenerateClick.bind(this);
        this.updatePlayPauseButton = this.updatePlayPauseButton.bind(this);
        this.handleAudioLoaded = this.handleAudioLoaded.bind(this);
        this.handleNoteStart = this.handleNoteStart.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize UI controls
     */
    init() {
        // Show loading indicator
        this.showLoading(true);
        
        // Disable play button until loaded
        this.playPauseButton.disabled = true;
        
        // Add event listeners for buttons
        this.playPauseButton.addEventListener('click', this.handlePlayPauseClick);
        this.regenerateButton.addEventListener('click', this.handleRegenerateClick);
        
        // Add keyboard event listener for space bar to control play/pause
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Connect audio engine events
        audioEngine.onPlayStateChange = this.updatePlayPauseButton;
        audioEngine.onLoaded = this.handleAudioLoaded;
        audioEngine.onNoteStart = this.handleNoteStart;
        
        // Initialize audio engine
        audioEngine.init().catch(error => {
            console.error('Failed to initialize audio engine:', error);
            this.showError('Failed to initialize audio. Please try refreshing the page.');
        });
    }
    
    /**
     * Handle play/pause button click
     */
    handlePlayPauseClick() {
        if (!this.isLoaded) {
            console.log('Audio not loaded yet, cannot play');
            return;
        }
        
        console.log('Play/Pause button clicked');
        
        // Ensure audio context is resumed (needed for browsers that require user gesture)
        if (audioEngine.audioContext.state === 'suspended') {
            console.log('Resuming audio context...');
            audioEngine.audioContext.resume().then(() => {
                console.log('Audio context resumed successfully');
                this.proceedWithPlayback();
            });
        } else {
            console.log('Audio context already running, state:', audioEngine.audioContext.state);
            this.proceedWithPlayback();
        }
    }
    
    proceedWithPlayback() {
        audioEngine.togglePlayPause();
        console.log('Audio playback toggled, isPlaying:', audioEngine.isPlaying);
        
        // Start or stop visualization animation
        if (audioEngine.isPlaying) {
            console.log('Starting visualization animation');
            visualization.startAnimation();
        } else {
            console.log('Stopping visualization animation');
            visualization.stopAnimation();
        }
    }
    
    /**
     * Handle regenerate button click
     * This regenerates random offsets for all voices
     */
    handleRegenerateClick() {
        console.log('Regenerate button clicked');
        
        // If currently playing, pause first
        const wasPlaying = audioEngine.isPlaying;
        if (wasPlaying) {
            audioEngine.pause();
            visualization.stopAnimation();
        }
        
        // Generate new random offsets (force regeneration)
        audioEngine.generateRandomStartTimes(true);
        
        // Update visualization to match new offsets
        visualization.calculateInitialOffsets();
        
        // Redraw visualization
        visualization.draw();
        
        console.log('Generated new random arrangement');
        
        // Show a brief confirmation message
        this.showTemporaryMessage('New arrangement generated!');
        
        // Resume playback if it was playing before
        if (wasPlaying) {
            // Small delay to ensure everything is updated
            setTimeout(() => {
                audioEngine.play();
                visualization.startAnimation();
            }, 100);
        }
    }
    
    /**
     * Show a temporary message
     * @param {string} message - The message to show
     * @param {number} duration - How long to show the message in ms
     */
    showTemporaryMessage(message, duration = 2000) {
        // Use the loading indicator to show the message
        const originalText = this.loadingIndicator.textContent;
        const wasHidden = this.loadingIndicator.classList.contains('hidden');
        
        this.loadingIndicator.textContent = message;
        this.loadingIndicator.style.color = '#4a4a4a';
        this.loadingIndicator.classList.remove('hidden');
        
        // Restore original state after duration
        setTimeout(() => {
            if (wasHidden) {
                this.loadingIndicator.classList.add('hidden');
            }
            this.loadingIndicator.textContent = originalText;
        }, duration);
    }
    
    /**
     * Update play/pause button state
     * @param {boolean} isPlaying - Whether audio is playing
     */
    updatePlayPauseButton(isPlaying) {
        if (isPlaying) {
            this.playIcon.classList.add('hidden');
            this.pauseIcon.classList.remove('hidden');
        } else {
            this.playIcon.classList.remove('hidden');
            this.pauseIcon.classList.add('hidden');
        }
    }
    
    /**
     * Handle audio loaded event
     */
    handleAudioLoaded() {
        this.isLoaded = true;
        this.showLoading(false);
        this.playPauseButton.disabled = false;
    }
    
    /**
     * Handle note start event
     * @param {number} voiceIndex - The index of the voice
     * @param {number} time - The time the note starts
     */
    handleNoteStart(voiceIndex, time) {
        // Pass the event to visualization
        if (visualization) {
            visualization.onNoteStart(voiceIndex, time);
        }
    }
    
    /**
     * Show or hide loading indicator
     * @param {boolean} isLoading - Whether to show loading indicator
     */
    showLoading(isLoading) {
        if (isLoading) {
            this.loadingIndicator.classList.remove('hidden');
        } else {
            this.loadingIndicator.classList.add('hidden');
        }
    }
    
    /**
     * Show error message
     * @param {string} message - The error message
     */
    showError(message) {
        this.loadingIndicator.textContent = message;
        this.loadingIndicator.style.color = 'red';
        this.loadingIndicator.classList.remove('hidden');
    }
    
    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        // Check if the space bar was pressed
        if (event.code === 'Space' || event.key === ' ') {
            // Prevent default space bar behavior (scrolling)
            event.preventDefault();
            
            // Toggle play/pause
            this.handlePlayPauseClick();
            
            // Provide visual feedback by simulating button click
            this.playPauseButton.classList.add('active');
            setTimeout(() => {
                this.playPauseButton.classList.remove('active');
            }, 100);
        }
    }
}

// Create a global instance of UI controls after the DOM is loaded
let uiControls;

document.addEventListener('DOMContentLoaded', () => {
    uiControls = new UIControls();
});
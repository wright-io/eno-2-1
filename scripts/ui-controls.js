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
        this.silentAudio = null;
        this.silentAudioInterval = null;
        this.heartbeatOscillator = null;
        this.heartbeatInterval = null;
        
        // Bind methods
        this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);
        this.handleRegenerateClick = this.handleRegenerateClick.bind(this);
        this.updatePlayPauseButton = this.updatePlayPauseButton.bind(this);
        this.handleAudioLoaded = this.handleAudioLoaded.bind(this);
        this.handleNoteStart = this.handleNoteStart.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.setupMediaSession = this.setupMediaSession.bind(this);
        this.updateMediaSessionState = this.updateMediaSessionState.bind(this);
        this.initSilentAudio = this.initSilentAudio.bind(this);
        
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
        audioEngine.onPlayStateChange = (isPlaying) => {
            this.updatePlayPauseButton(isPlaying);
            this.updateMediaSessionState(isPlaying);
        };
        audioEngine.onLoaded = this.handleAudioLoaded;
        audioEngine.onNoteStart = this.handleNoteStart;
        
        // Set up MediaSession API for background playback
        this.setupMediaSession();
        
        // Initialize silent audio for iOS background playback
        this.initSilentAudio();
        
        // Initialize audio engine
        audioEngine.init().catch(error => {
            console.error('Failed to initialize audio engine:', error);
            this.showError('Failed to initialize audio. Please try refreshing the page.');
        });
    }
    
    /**
     * Initialize silent audio element for iOS background playback
     * This creates a silent, looping audio element that keeps the audio session alive
     * when the screen is locked on iOS devices
     */
    initSilentAudio() {
        console.log('Initializing silent audio element for iOS background playback');
        
        // Create a silent audio element
        this.silentAudio = new Audio('assets/silent-1s.mp3');
        
        // Critical iOS-specific settings
        this.silentAudio.loop = true;
        this.silentAudio.autoplay = false; // Don't autoplay until user interaction
        this.silentAudio.controls = false;
        this.silentAudio.muted = false; // Important: don't mute or iOS won't consider it "playing audio"
        this.silentAudio.volume = 0.1; // Low but not zero volume
        
        // Set attributes for better mobile behavior
        this.silentAudio.setAttribute('playsinline', '');
        this.silentAudio.setAttribute('webkit-playsinline', '');
        this.silentAudio.setAttribute('x-webkit-airplay', 'allow');
        
        // Add iOS-specific attributes
        if (this.isIOS()) {
            console.log('iOS device detected, adding specific attributes');
            // These attributes help signal to iOS that audio should continue in background
            this.silentAudio.setAttribute('data-audio-keep-alive', 'true');
        }
        
        // Preload the audio
        this.silentAudio.preload = 'auto';
        
        // Add event listeners for debugging and handling iOS behavior
        this.silentAudio.addEventListener('play', () => console.log('Silent audio started playing'));
        this.silentAudio.addEventListener('pause', () => console.log('Silent audio paused'));
        this.silentAudio.addEventListener('ended', () => {
            console.log('Silent audio ended - this should not happen with loop=true');
            // Try to restart if it somehow ends
            if (audioEngine.isPlaying) {
                console.log('Restarting silent audio');
                this.silentAudio.play().catch(e => console.warn('Failed to restart silent audio:', e));
            }
        });
        
        // Add error handling
        this.silentAudio.onerror = (e) => {
            console.error('Error with silent audio:', e);
            // Try to recreate the audio element if there's an error
            setTimeout(() => this.initSilentAudio(), 1000);
        };
        
        // Add page visibility change listener to handle app going to background
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && audioEngine.isPlaying) {
                console.log('Page hidden, ensuring silent audio is playing');
                // Make sure silent audio is playing when page goes to background
                this.silentAudio.play().catch(e => console.warn('Could not play silent audio on visibility change:', e));
                
                // Also create an audio context heartbeat when the page is hidden
                if (this.isIOS()) {
                    this.createAudioContextHeartbeat();
                }
            }
        });
        
        console.log('Silent audio element initialized with enhanced iOS support');
    }
    
    /**
     * Create a continuous audio context heartbeat to prevent iOS from suspending the audio context
     * This creates a very quiet oscillator that plays continuously to keep the audio context active
     */
    createAudioContextHeartbeat() {
        if (!audioEngine.audioContext || !audioEngine.isPlaying) return;
        
        console.log('Creating audio context heartbeat for iOS background playback');
        
        // Create a very quiet oscillator
        const oscillator = audioEngine.audioContext.createOscillator();
        const gainNode = audioEngine.audioContext.createGain();
        
        // Set extremely low gain (volume) so it's practically inaudible
        gainNode.gain.value = 0.001;
        
        // Set a very low frequency
        oscillator.frequency.value = 1; // 1 Hz, barely audible
        
        // Connect the oscillator to the gain node and then to the destination
        oscillator.connect(gainNode);
        gainNode.connect(audioEngine.audioContext.destination);
        
        // Start the oscillator
        oscillator.start();
        
        console.log('Audio context heartbeat created and started');
        
        // Store the oscillator so we can stop it later if needed
        this.heartbeatOscillator = oscillator;
        
        // Schedule periodic oscillator restarts to ensure continuous audio
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (audioEngine.isPlaying && document.visibilityState === 'hidden') {
                // Stop the old oscillator
                if (this.heartbeatOscillator) {
                    this.heartbeatOscillator.stop();
                }
                
                // Create a new oscillator
                const newOscillator = audioEngine.audioContext.createOscillator();
                newOscillator.frequency.value = 1;
                newOscillator.connect(gainNode);
                newOscillator.start();
                
                // Update the reference
                this.heartbeatOscillator = newOscillator;
                
                console.log('Audio context heartbeat refreshed');
            } else if (!audioEngine.isPlaying && this.heartbeatInterval) {
                // Stop the heartbeat if playback has stopped
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
                
                if (this.heartbeatOscillator) {
                    this.heartbeatOscillator.stop();
                    this.heartbeatOscillator = null;
                }
            }
        }, 10000); // Refresh every 10 seconds
    }
    
    /**
     * Detect if the current device is running iOS
     * @returns {boolean} True if the device is running iOS
     */
    isIOS() {
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform) ||
        // iPad on iOS 13+ detection
        (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    }
    
    /**
     * Set up the MediaSession API for background playback
     * This allows the music to continue playing when the screen is locked on mobile devices
     */
    setupMediaSession() {
        if ('mediaSession' in navigator) {
            console.log('Setting up MediaSession API for background playback');
            
            // Set metadata for the currently playing media
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Brian Eno\'s "2/1" Web Recreation',
                artist: 'Music for Airports (1978)',
                album: 'Ambient 1: Music for Airports',
                artwork: [
                    { src: 'favicon.ico', sizes: '16x16', type: 'image/x-icon' }
                ]
            });
            
            // Set up action handlers
            navigator.mediaSession.setActionHandler('play', () => {
                console.log('MediaSession play action triggered');
                if (!audioEngine.isPlaying) {
                    this.handlePlayPauseClick();
                }
            });
            
            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('MediaSession pause action triggered');
                if (audioEngine.isPlaying) {
                    this.handlePlayPauseClick();
                }
            });
            
            console.log('MediaSession API setup complete');
        } else {
            console.log('MediaSession API not available in this browser');
        }
    }
    
    /**
     * Update the MediaSession playback state
     * @param {boolean} isPlaying - Whether audio is playing
     */
    updateMediaSessionState(isPlaying) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
            console.log(`Updated MediaSession playback state: ${isPlaying ? 'playing' : 'paused'}`);
        }
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
        
        // Start or stop visualization animation and silent audio
        if (audioEngine.isPlaying) {
            console.log('Starting visualization animation');
            visualization.startAnimation();
            
            // Play silent audio to keep iOS audio session alive
            if (this.silentAudio) {
                console.log('Playing silent audio for iOS background playback');
                
                // Ensure audio context is resumed first
                audioEngine.audioContext.resume().then(() => {
                    // Use promise to handle autoplay restrictions
                    this.silentAudio.play().catch(error => {
                        console.warn('Could not play silent audio:', error);
                        
                        // If autoplay is blocked, show a message to the user
                        if (this.isIOS()) {
                            this.showTemporaryMessage('Tap again for background audio support', 3000);
                        }
                    });
                });
                
                // Set up a periodic check to ensure silent audio keeps playing
                // This helps with iOS potentially stopping the audio after some time
                if (this.silentAudioInterval) {
                    clearInterval(this.silentAudioInterval);
                }
                
                this.silentAudioInterval = setInterval(() => {
                    if (audioEngine.isPlaying && this.silentAudio.paused) {
                        console.log('Silent audio stopped unexpectedly, restarting');
                        this.silentAudio.play().catch(e => console.warn('Failed to restart silent audio:', e));
                    }
                }, 5000); // Check every 5 seconds
                
                // For iOS devices, also create an audio context heartbeat
                if (this.isIOS()) {
                    console.log('iOS device detected, creating audio context heartbeat');
                    this.createAudioContextHeartbeat();
                }
            }
        } else {
            console.log('Stopping visualization animation');
            visualization.stopAnimation();
            
            // Pause silent audio
            if (this.silentAudio) {
                console.log('Pausing silent audio');
                this.silentAudio.pause();
                
                // Clear the interval when paused
                if (this.silentAudioInterval) {
                    clearInterval(this.silentAudioInterval);
                    this.silentAudioInterval = null;
                }
                
                // Stop the audio context heartbeat
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = null;
                }
                
                if (this.heartbeatOscillator) {
                    this.heartbeatOscillator.stop();
                    this.heartbeatOscillator = null;
                }
            }
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
            
            // Pause silent audio
            if (this.silentAudio) {
                console.log('Pausing silent audio during regeneration');
                this.silentAudio.pause();
            }
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
                
                // Resume silent audio
                if (this.silentAudio) {
                    console.log('Resuming silent audio after regeneration');
                    this.silentAudio.play().catch(error => {
                        console.warn('Could not resume silent audio:', error);
                    });
                }
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
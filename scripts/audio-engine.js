/**
 * Audio Engine for Brian Eno's "2/1" Web Recreation
 * Handles sample loading, Web Audio API setup, and note scheduling
 */

class AudioEngine {
    constructor() {
        // Octave shift configuration - easily adjustable
        // Negative values shift down, positive values shift up
        // -1 = one octave down, -2 = two octaves down, 1 = one octave up, etc.
        this.octaveShift = -1; // Shift down by one octave
        
        // Base frequencies (original values from the piece)
        const baseFrequencies = {
            "A♭5": 830.61,
            "C5": 523.25,
            "D♭5": 554.37,
            "F5": 698.46,
            "E♭5": 622.25,
            "A♭4": 415.30,
            "F4": 349.23
        };
        
        // Apply octave shift to all frequencies
        // Each octave is a factor of 2 in frequency
        const octaveMultiplier = Math.pow(2, this.octaveShift);
        
        // Define the 7 voices with their exact loop durations and frequencies
        this.voices = [
            {
                note: "High A♭",
                baseFrequency: baseFrequencies["A♭5"],
                frequency: baseFrequencies["A♭5"] * octaveMultiplier, // Shifted A♭
                loopDuration: 17.8, // seconds
                color: "#E57373"
            },
            {
                note: "C",
                baseFrequency: baseFrequencies["C5"],
                frequency: baseFrequencies["C5"] * octaveMultiplier, // Shifted C
                loopDuration: 20.1,
                color: "#FFB74D"
            },
            {
                note: "D♭",
                baseFrequency: baseFrequencies["D♭5"],
                frequency: baseFrequencies["D♭5"] * octaveMultiplier, // Shifted D♭
                loopDuration: 31.8,
                color: "#FFF176"
            },
            {
                note: "High F",
                baseFrequency: baseFrequencies["F5"],
                frequency: baseFrequencies["F5"] * octaveMultiplier, // Shifted F
                loopDuration: 19.6,
                color: "#AED581"
            },
            {
                note: "E♭",
                baseFrequency: baseFrequencies["E♭5"],
                frequency: baseFrequencies["E♭5"] * octaveMultiplier, // Shifted E♭
                loopDuration: 16.2,
                color: "#4FC3F7"
            },
            {
                note: "Low A♭",
                baseFrequency: baseFrequencies["A♭4"],
                frequency: baseFrequencies["A♭4"] * octaveMultiplier, // Shifted A♭
                loopDuration: 21.3,
                color: "#7986CB"
            },
            {
                note: "Low F",
                baseFrequency: baseFrequencies["F4"],
                frequency: baseFrequencies["F4"] * octaveMultiplier, // Shifted F
                loopDuration: 24.7,
                color: "#BA68C8"
            }
        ];

        // Audio context and nodes
        this.audioContext = null;
        this.masterGain = null;
        this.reverbNode = null;
        this.pianoSample = null;
        
        // Playback state
        this.isPlaying = false;
        this.startTime = 0;
        this.scheduledNotes = [];
        
        // Scheduling parameters
        this.lookahead = 0.1;  // seconds
        this.scheduleAheadTime = 0.5;  // seconds
        this.schedulerTimer = null;
        
        // Callbacks
        this.onPlayStateChange = null;
        this.onNoteStart = null;
        this.onLoaded = null;
    }

    /**
     * Initialize the audio engine
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.audioContext.destination);
            
            // Load piano sample
            await this.loadPianoSample();
            
            // Load reverb impulse response
            await this.setupReverb();
            
            // Generate random start times at initialization
            // This ensures the visualization can use them before playback starts
            this.generateRandomStartTimes();
            console.log('Generated initial random offsets during initialization');
            
            if (this.onLoaded) {
                this.onLoaded();
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing audio engine:', error);
            return false;
        }
    }

    /**
     * Load the Rhodes electric piano sample
     * @returns {Promise} Resolves when the sample is loaded
     */
    async loadPianoSample() {
        // Create a high-quality Rhodes-like electric piano tone
        const sampleRate = this.audioContext.sampleRate;
        const duration = 10.0;  // longer duration for better sustain
        const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        
        // Fill the buffer with a Rhodes-like tone
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            
            // Rhodes electric piano has a complex harmonic structure
            // We'll simulate it with multiple sine waves and careful envelopes
            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                
                // Attack phase - quick rise with slight bell-like character
                const attackTime = 0.01;
                const attack = t < attackTime ? t / attackTime : 1.0;
                
                // Decay and sustain phases - Rhodes has a characteristic bell-like decay
                // followed by a warm sustain
                const decayTime = 0.2;
                const sustainLevel = 0.7;
                const decay = t > attackTime ?
                    1.0 - (1.0 - sustainLevel) * Math.min(1.0, (t - attackTime) / decayTime) :
                    1.0;
                
                // Release phase - smooth exponential release
                const releaseStart = 2.0;
                const releaseTime = 1.0;
                const release = t > releaseStart ?
                    Math.max(0, sustainLevel * (1.0 - (t - releaseStart) / releaseTime)) :
                    1.0;
                
                // Combine envelope phases
                const envelope = attack * decay * (t < releaseStart ? 1.0 : release);
                
                // Rhodes tine fundamental frequency
                const fundamental = Math.sin(2 * Math.PI * 440 * t);
                
                // Bell-like overtones (characteristic of Rhodes)
                const overtone1 = 0.5 * Math.sin(2 * Math.PI * 880 * t) * Math.exp(-4 * t);
                const overtone2 = 0.3 * Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-6 * t);
                
                // Slight chorus/phasing effect (characteristic of Rhodes)
                const chorus = 0.1 * Math.sin(2 * Math.PI * 442 * t + 0.2 * Math.sin(2 * Math.PI * 4 * t));
                
                // Combine all components
                data[i] = (fundamental + overtone1 + overtone2 + chorus) * envelope * 0.5;
                
                // Add subtle noise for the mechanical character of Rhodes
                if (t < 0.05) {
                    data[i] += (Math.random() * 2 - 1) * 0.05 * (0.05 - t) / 0.05;
                }
            }
        }
        
        this.pianoSample = buffer;
        return buffer;
    }

    /**
     * Set up high-quality reverb using a convolution node
     * @returns {Promise} Resolves when reverb is set up
     */
    async setupReverb() {
        // Create convolver node
        this.reverbNode = this.audioContext.createConvolver();
        
        // Create an extremely spacious, ambient impulse response
        // This creates the characteristic "infinite" reverb of Brian Eno's original
        const sampleRate = this.audioContext.sampleRate;
        const duration = 20.0;  // Much longer duration for truly ambient reverb
        const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        
        // Create a more sophisticated impulse response
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            
            // Parameters for an extremely spacious, ambient reverb
            const preDelay = 0.05; // 50ms pre-delay for more space
            const earlyReflectionsTime = 0.2; // Longer early reflections (200ms)
            const earlyReflectionsCount = 5; // Fewer, more spread out reflections
            const diffusionTime = 0.0; // Longer diffusion phase
            const decayStartTime = preDelay + earlyReflectionsTime + diffusionTime;
            const decayFactor = 0.98; // Much slower decay for ambient feel
            
            // Fill the buffer
            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                let sample = 0;
                
                // Pre-delay (initial silence)
                if (t < preDelay) {
                    sample = 0;
                }
                // Early reflections (discrete echoes)
                else if (t < preDelay + earlyReflectionsTime) {
                    // Generate several discrete early reflections
                    for (let reflection = 1; reflection <= earlyReflectionsCount; reflection++) {
                        const reflectionTime = preDelay + (reflection / earlyReflectionsCount) * earlyReflectionsTime;
                        const reflectionStrength = 0.7 * (1 - reflection / earlyReflectionsCount);
                        
                        if (Math.abs(t - reflectionTime) < 0.001) {
                            sample += reflectionStrength * (Math.random() * 0.2 + 0.9);
                        }
                    }
                }
                // Diffusion phase (transition to late reverb)
                else if (t < decayStartTime) {
                    const diffusionProgress = (t - preDelay - earlyReflectionsTime) / diffusionTime;
                    const diffusionDensity = 20 + 100 * diffusionProgress; // Increasing density
                    
                    // Create increasingly dense reflections
                    sample = 0.5 * (1 - diffusionProgress) * Math.sin(2 * Math.PI * diffusionDensity * t);
                    sample += 0.3 * Math.random() * Math.exp(-2 * diffusionProgress);
                }
                // Late reverb (exponential decay)
                else {
                    const decayTime = t - decayStartTime;
                    // Frequency-dependent decay with much slower rates
                    // Higher frequencies still decay faster, but everything decays more slowly
                    const highFreqDecay = Math.exp(-decayTime * 0.8); // Slower high frequency decay
                    const midFreqDecay = Math.exp(-decayTime * 0.4);  // Much slower mid frequency decay
                    const lowFreqDecay = Math.exp(-decayTime * 0.2);  // Very slow low frequency decay
                    
                    // Combine different frequency bands with noise for natural sound
                    const noise = Math.random() * 2 - 1;
                    const highFreq = noise * highFreqDecay * 0.2;
                    const midFreq = noise * midFreqDecay * 0.3;
                    const lowFreq = noise * lowFreqDecay * 0.5;
                    
                    sample = (highFreq + midFreq + lowFreq) * Math.pow(decayFactor, decayTime * 10);
                }
                
                // Apply overall envelope and slight stereo variation
                const stereoOffset = channel === 0 ? 1.0 : 0.98;
                data[i] = sample * stereoOffset;
            }
        }
        
        // Normalize the impulse response to prevent clipping
        let maxAmplitude = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < buffer.length; i++) {
                maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
            }
        }
        
        if (maxAmplitude > 0) {
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const data = buffer.getChannelData(channel);
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = data[i] / maxAmplitude * 0.9; // Leave some headroom
                }
            }
        }
        
        // Create a dry/wet mix for the reverb with much more wet signal
        const dryGain = this.audioContext.createGain();
        dryGain.gain.value = 0.4; // 40% dry signal (reduced)
        
        const wetGain = this.audioContext.createGain();
        wetGain.gain.value = 0.6; // 60% wet (reverb) signal (increased)
        
        // Connect the reverb through the wet gain
        this.reverbNode.buffer = buffer;
        this.reverbNode.connect(wetGain);
        wetGain.connect(this.masterGain);
        
        // Store the dry gain for direct connections
        this.dryGain = dryGain;
        dryGain.connect(this.masterGain);
        
        return this.reverbNode;
    }

    /**
     * Play a note with the given frequency
     * @param {number} frequency - The frequency of the note in Hz
     * @param {number} time - The time to play the note (in seconds, relative to audioContext.currentTime)
     * @param {number} duration - The duration of the note in seconds
     * @param {number} gain - The gain (volume) of the note (0-1)
     */
    playNote(frequency, time, duration = 2.0, gain = 0.7) {
        // Create source node from the piano sample
        const source = this.audioContext.createBufferSource();
        source.buffer = this.pianoSample;
        
        // Create a gain node for this note
        const noteGain = this.audioContext.createGain();
        noteGain.gain.value = gain;
        
        // Create a filter to shape the tone based on pitch
        // Higher notes get brighter, lower notes get warmer
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        
        // Adjust filter frequency based on note pitch
        // Higher notes get a higher cutoff frequency
        const normalizedFreq = Math.min(1, frequency / 1000); // Normalize to 0-1 range
        const minCutoff = 800;
        const maxCutoff = 8000;
        filter.frequency.value = minCutoff + normalizedFreq * (maxCutoff - minCutoff);
        
        // Add slight resonance for the characteristic Rhodes sound
        filter.Q.value = 1 + normalizedFreq * 2; // 1-3 range
        
        // Connect source -> filter -> gain
        source.connect(filter);
        filter.connect(noteGain);
        
        // Create separate dry and wet paths if dryGain exists
        if (this.dryGain) {
            // Connect to dry path (direct to master via dryGain)
            noteGain.connect(this.dryGain);
            
            // Connect to wet path (through reverb)
            noteGain.connect(this.reverbNode);
        } else {
            // Fallback to direct connection to reverb if dryGain doesn't exist
            noteGain.connect(this.reverbNode);
        }
        
        // Adjust playback rate to match the desired frequency
        // Base frequency of our sample is 440Hz (A4)
        source.playbackRate.value = frequency / 440;
        
        // Add a slight detune for a more natural sound
        // This creates a subtle chorus-like effect
        source.detune.value = (Math.random() * 10 - 5); // -5 to +5 cents
        
        // Add a more musical envelope
        const now = this.audioContext.currentTime;
        const attackTime = 0.02; // Slightly longer attack for Rhodes
        const releaseTime = 0.3; // Longer release for Rhodes
        
        if (time > now) {
            // Schedule envelope with a more natural curve
            noteGain.gain.setValueAtTime(0, time);
            noteGain.gain.linearRampToValueAtTime(gain, time + attackTime);
            
            // Add a slight decay after the attack
            const decayTime = 0.1;
            const sustainLevel = gain * 0.9;
            noteGain.gain.setTargetAtTime(sustainLevel, time + attackTime, decayTime);
            
            // Schedule release
            noteGain.gain.setTargetAtTime(0, time + duration - releaseTime, releaseTime / 3);
        }
        
        // Schedule the note
        source.start(time);
        source.stop(time + duration + 0.5); // Add a bit of extra time for the release tail
        
        // Store the scheduled note
        this.scheduledNotes.push(source);
        
        return source;
    }

    /**
     * Start playing the piece
     */
    play() {
        if (this.isPlaying) {
            console.log('Already playing, ignoring play request');
            return;
        }
        
        console.log('Starting audio playback');
        
        // Resume audio context if it's suspended (needed for autoplay policies)
        if (this.audioContext.state === 'suspended') {
            console.log('Audio context is suspended, attempting to resume...');
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed successfully');
                this.startPlayback();
            }).catch(err => {
                console.error('Failed to resume audio context:', err);
            });
        } else {
            this.startPlayback();
        }
    }
    
    startPlayback() {
        this.isPlaying = true;
        this.startTime = this.audioContext.currentTime;
        this.scheduledNotes = [];
        
        console.log('Audio context current time:', this.audioContext.currentTime);
        console.log('Starting playback for', this.voices.length, 'voices');
        
        // We don't need to regenerate random start times here
        // as they are already generated during initialization
        // This ensures consistency between visualization and audio
        console.log('Using existing random offsets for playback');
        
        // Schedule initial notes with random offsets
        this.scheduleInitialNotes();
        
        // Start the scheduler for subsequent notes
        this.scheduleNotes();
        
        // Notify about play state change
        if (this.onPlayStateChange) {
            this.onPlayStateChange(true);
        } else {
            console.warn('No onPlayStateChange callback registered');
        }
    }
    
    /**
     * Generate random start times for each voice
     * This can be called at initialization, when playback starts, or on demand
     * @param {boolean} forceRegenerate - Whether to force regeneration even if offsets already exist
     */
    generateRandomStartTimes(forceRegenerate = false) {
        console.log('Generating random start times for each voice');
        
        // Generate a random start time within each voice's loop duration
        this.voices.forEach((voice, index) => {
            // Only regenerate if forced or if no offset exists yet
            if (forceRegenerate || typeof voice.randomOffset === 'undefined') {
                // Random value between 0 and 1 representing position in the loop
                const randomPosition = Math.random();
                
                // Convert to time offset (0 to loopDuration)
                const randomOffset = randomPosition * voice.loopDuration;
                
                // Store the random offset as a property of the voice
                voice.randomOffset = randomOffset;
                
                console.log(`Voice ${voice.note}: random offset ${randomOffset.toFixed(2)}s (${(randomPosition * 100).toFixed(0)}% through its loop)`);
            } else {
                console.log(`Voice ${voice.note}: keeping existing random offset ${voice.randomOffset.toFixed(2)}s`);
            }
        });
        
        // Return the voices with their updated offsets
        return this.voices;
    }
    
    /**
     * Schedule initial notes with random offsets
     * This method now only schedules the first upcoming notes for each voice
     * based on when they will cross the playhead
     */
    scheduleInitialNotes() {
        console.log('Scheduling initial notes based on playhead crossings');
        
        // For each voice, calculate when it will first cross the playhead
        this.voices.forEach((voice, index) => {
            const voiceIndex = this.voices.findIndex(v => v.note === voice.note);
            const randomOffset = voice.randomOffset || 0;
            
            // Calculate the time until the first playhead crossing
            // This is the time remaining in the current loop
            const timeUntilCrossing = voice.loopDuration - randomOffset;
            
            // Schedule the note to play when it crosses the playhead
            const noteTime = this.startTime + timeUntilCrossing;
            
            console.log(`Voice ${voice.note}: will first cross playhead in ${timeUntilCrossing.toFixed(2)}s`);
            
            // Only schedule if it's within our scheduling window
            if (timeUntilCrossing < this.scheduleAheadTime) {
                // Play the note with longer duration and slightly lower volume for ambient feel
                this.playNote(voice.frequency, noteTime, 3.0, 0.35);
                console.log(`Scheduled first note for ${voice.note} at time ${noteTime.toFixed(2)}s`);
                
                // Notify about the note start
                if (this.onNoteStart) {
                    this.onNoteStart(voiceIndex, noteTime);
                }
            } else {
                console.log(`First note for ${voice.note} will be scheduled later by the main scheduler`);
            }
        });
    }

    /**
     * Stop playing the piece
     */
    pause() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        
        // Stop the scheduler
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        
        // Stop all scheduled notes
        this.scheduledNotes.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Note might have already stopped
            }
        });
        this.scheduledNotes = [];
        
        // Notify about play state change
        if (this.onPlayStateChange) {
            this.onPlayStateChange(false);
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Schedule notes for all voices
     */
    scheduleNotes() {
        const currentTime = this.audioContext.currentTime;
        const lookAheadEnd = currentTime + this.scheduleAheadTime;
        
        console.log('Scheduling notes, current time:', currentTime.toFixed(2), 'looking ahead to:', lookAheadEnd.toFixed(2));
        
        let notesScheduled = 0;
        
        // For each voice, schedule notes within the look-ahead window
        this.voices.forEach((voice, voiceIndex) => {
            // Get the random offset for this voice
            const randomOffset = voice.randomOffset || 0;
            
            // Calculate the adjusted elapsed time (accounting for random offset)
            const adjustedElapsedTime = (currentTime - this.startTime) + randomOffset;
            
            // Calculate how many complete loops have occurred with the adjusted time
            const completeLoops = Math.floor(adjustedElapsedTime / voice.loopDuration);
            
            // Calculate the next note time, accounting for the random offset
            // The formula ensures the note plays exactly when the dot crosses the playhead
            const nextNoteTime = this.startTime + (completeLoops + 1) * voice.loopDuration - randomOffset;
            
            console.log(`Voice ${voiceIndex} (${voice.note}): adjusted elapsed ${adjustedElapsedTime.toFixed(2)}s, next note at ${nextNoteTime.toFixed(2)}s (random offset: ${randomOffset.toFixed(2)}s)`);
            
            // If the next note is within our scheduling window, schedule it
            if (nextNoteTime < lookAheadEnd) {
                // Play the note with longer duration and slightly lower volume for ambient feel
                this.playNote(voice.frequency, nextNoteTime, 3.0, 0.35);
                notesScheduled++;
                
                console.log(`Scheduled note for voice ${voiceIndex} (${voice.note}) at time ${nextNoteTime.toFixed(2)}s`);
                
                // Notify about the note start
                if (this.onNoteStart) {
                    this.onNoteStart(voiceIndex, nextNoteTime);
                }
            }
        });
        
        console.log(`Total notes scheduled this cycle: ${notesScheduled}`);
        
        // Schedule the next iteration of the scheduler
        this.schedulerTimer = setTimeout(() => {
            if (this.isPlaying) {
                this.scheduleNotes();
            } else {
                console.log('Playback stopped, scheduler will not continue');
            }
        }, this.lookahead * 1000);
    }

    /**
     * Get the current playback time
     * @returns {number} The current playback time in seconds
     */
    getCurrentTime() {
        if (!this.isPlaying) return 0;
        return this.audioContext.currentTime - this.startTime;
    }

    /**
     * Get the voice data
     * @returns {Array} The voice data
     */
    getVoices() {
        return this.voices;
    }
    
    /**
     * Set the octave shift and update all voice frequencies
     * @param {number} shift - The octave shift value (-2, -1, 0, 1, 2, etc.)
     */
    setOctaveShift(shift) {
        // Store the new octave shift
        this.octaveShift = shift;
        
        // Calculate the frequency multiplier
        const octaveMultiplier = Math.pow(2, shift);
        
        // Update all voice frequencies
        this.voices.forEach(voice => {
            voice.frequency = voice.baseFrequency * octaveMultiplier;
        });
        
        console.log(`Octave shift set to ${shift} (multiplier: ${octaveMultiplier.toFixed(2)})`);
        
        // If we're currently playing, we need to stop and restart to apply the new frequencies
        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.pause();
            setTimeout(() => this.play(), 100);
        }
        
        return this.voices;
    }
}

// Create a global instance of the audio engine
const audioEngine = new AudioEngine();
/**
 * SoundManager - Handles all game audio using Web Audio API
 * Provides methods to play different sound effects and control global sound settings
 */
import Debug from './utils/Debug.js';

export class SoundManager {
    constructor() {
        // Create audio context
        this.audioContext = null;
        
        // Initialize audio enabled state (default: enabled)
        this.soundEnabled = true;

        // Initialize music enabled state (default: enabled)
        this.musicEnabled = true;

        // Flag for audio worklet initialization
        this.audioWorkletInitialized = false;
        
        // Background music element
        this.backgroundMusic = null;
        
        // Try to get saved sound preference
        const savedSoundPreference = localStorage.getItem('soundEnabled');
        if (savedSoundPreference !== null) {
            this.soundEnabled = savedSoundPreference === 'true';
        }
        
        // Try to get saved music preference
        const savedMusicPreference = localStorage.getItem('musicEnabled');
        if (savedMusicPreference !== null) {
            this.musicEnabled = savedMusicPreference === 'true';
        }
        
        // Sound banks for different effects
        this.sounds = {
            gameStart: null,
            blackHoleCollision: null,
            gameOver: null,
            particles: {
                normal: null,
                rare: null,
                quantum: null,
                unstable: null
            }
        };
        
        // Initialize but don't create context until user interaction
        this.initialize();
    }
    
    /**
     * Initialize audio context and load sound effects
     */
    initialize() {
        // Add sound toggle button to the UI
        this.createSoundToggle();
        
        // Add music toggle button to the UI
        this.createMusicToggle();
        
        // Setup background music
        this.setupBackgroundMusic();
        
        // We defer creating the audio context until first user interaction
        // This is because browsers require user interaction before creating AudioContext
        document.addEventListener('click', () => {
            this.initAudioContext();
            
            // Start playing background music after first interaction if enabled
            if (this.musicEnabled && this.backgroundMusic) {
                this.backgroundMusic.play().catch(err => {
                    Debug.warn('Failed to play background music', err);
                });
            }
        }, { once: true });
        
        // Listen for particle collection events
        window.addEventListener('particleCollected', (event) => {
            const { type, value } = event.detail;
            this.playParticleCollected(type);
        });
    }
    
    /**
     * Initialize the Web Audio API context
     */
    async initAudioContext() {
        if (this.audioContext) return; // Already initialized
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Load and initialize the AudioWorklet for noise generation
            if (this.audioContext.audioWorklet) {
                try {
                    await this.audioContext.audioWorklet.addModule('./js/audio-processors/noise-processor.js');
                    this.audioWorkletInitialized = true;
                    Debug.log('Audio worklet initialized successfully');
                } catch (err) {
                    Debug.warn('Failed to initialize audio worklet, falling back to alternative methods', err);
                    this.audioWorkletInitialized = false;
                }
            } else {
                Debug.warn('AudioWorklet not supported in this browser, falling back to alternative methods');
                this.audioWorkletInitialized = false;
            }
            
            // Create and cache all sounds
            this.createSounds();
            
            // Log success
            Debug.log('Audio context initialized successfully');
            
            // Resume audio context if it's suspended and sound is enabled
            if (this.audioContext.state === 'suspended' && this.soundEnabled) {
                this.audioContext.resume().then(() => {
                    Debug.log('Audio context resumed successfully');
                }).catch(err => {
                    Debug.warn('Failed to resume audio context', err);
                });
            }
        } catch (error) {
            Debug.error('Web Audio API is not supported in this browser', error);
        }
    }
    
    /**
     * Create sound toggle button in the top-right corner
     */
    createSoundToggle() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sound-toggle';
        toggleBtn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
        toggleBtn.title = this.soundEnabled ? 'Sound On' : 'Sound Off';
        
        // Toggle functionality
        toggleBtn.addEventListener('click', () => {
            this.toggleSound();
            toggleBtn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
            toggleBtn.title = this.soundEnabled ? 'Sound On' : 'Sound Off';
        });
        
        // Add to DOM
        document.body.appendChild(toggleBtn);
    }
    
    /**
     * Create music toggle button 
     */
    createMusicToggle() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'music-toggle';
        toggleBtn.innerHTML = this.musicEnabled ? '🎵' : '🔇';
        toggleBtn.title = this.musicEnabled ? 'Music On' : 'Music Off';
        
        // Toggle functionality
        toggleBtn.addEventListener('click', () => {
            this.toggleMusic();
            toggleBtn.innerHTML = this.musicEnabled ? '🎵' : '🔇';
            toggleBtn.title = this.musicEnabled ? 'Music On' : 'Music Off';
        });
        
        // Add to DOM
        document.body.appendChild(toggleBtn);
    }
    
    /**
     * Setup background music audio element
     */
    setupBackgroundMusic() {
        // Create audio element for background music
        this.backgroundMusic = new Audio('/audio/music.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.5;  // Set to 50% volume
        
        // Set initial state based on user preference
        if (!this.musicEnabled) {
            this.backgroundMusic.pause();
        }
    }
    
    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        // Save preference to localStorage
        localStorage.setItem('soundEnabled', this.soundEnabled.toString());
        
        // Make sure audio context is running if sound is enabled
        if (this.soundEnabled && this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Dispatch event so other components can respond to sound toggle
        window.dispatchEvent(new CustomEvent('soundToggled', { detail: { enabled: this.soundEnabled } }));
    }
    
    /**
     * Toggle music on/off
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        // Save preference to localStorage
        localStorage.setItem('musicEnabled', this.musicEnabled.toString());
        
        // Play or pause the music based on the new state
        if (this.backgroundMusic) {
            if (this.musicEnabled) {
                this.backgroundMusic.play().catch(err => {
                    Debug.warn('Failed to play background music', err);
                });
            } else {
                this.backgroundMusic.pause();
            }
        }
        
        // Dispatch event so other components can respond to music toggle
        window.dispatchEvent(new CustomEvent('musicToggled', { detail: { enabled: this.musicEnabled } }));
    }
    
    /**
     * Create all sound effects
     */
    createSounds() {
        if (!this.audioContext) return;
        
        // Game start/restart sound
        this.sounds.gameStart = this.createGameStartSound();
        
        // Black hole collision sound
        this.sounds.blackHoleCollision = this.createBlackHoleCollisionSound();
        
        // Game over sound
        this.sounds.gameOver = this.createGameOverSound();
        
        // Particle collection sounds
        this.sounds.particles.normal = this.createNormalParticleSound();
        this.sounds.particles.rare = this.createRareParticleSound();
        this.sounds.particles.quantum = this.createQuantumParticleSound();
        this.sounds.particles.unstable = this.createUnstableParticleSound();
    }
    
    /**
     * Create a sound for game start/restart
     * @returns {Function} Function that plays the sound when called
     */
    createGameStartSound() {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            // Create oscillators for a spacey startup sound
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set up oscillator properties
            osc1.type = 'sine';
            osc2.type = 'triangle';
            
            // Start at low volume
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            // Fade in
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
            // Fade out
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
            
            // Frequency sweep
            osc1.frequency.setValueAtTime(220, this.audioContext.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.7);
            
            osc2.frequency.setValueAtTime(440, this.audioContext.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.7);
            
            // Start and stop oscillators
            osc1.start();
            osc2.start();
            osc1.stop(this.audioContext.currentTime + 1.5);
            osc2.stop(this.audioContext.currentTime + 1.5);
        };
    }
    
    /**
     * Create a sound for black hole collision
     * @returns {Function} Function that plays the sound when called
     */
    createBlackHoleCollisionSound() {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            // Create a low rumbling sound with noise
            let noiseNode;
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Use AudioWorkletNode if initialized, otherwise fallback to audio buffer
            if (this.audioWorkletInitialized) {
                // Create noise using AudioWorkletNode
                noiseNode = new AudioWorkletNode(this.audioContext, 'noise-processor');
                
                // Connect nodes
                noiseNode.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
            } else {
                // Fallback: Create noise using AudioBuffer
                const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise
                const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                
                // Fill the buffer with white noise
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
                
                // Create buffer source
                noiseNode = this.audioContext.createBufferSource();
                noiseNode.buffer = noiseBuffer;
                
                // Connect nodes
                noiseNode.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Start the source
                noiseNode.start();
                noiseNode.stop(this.audioContext.currentTime + 2);
            }
            
            // Configure filter
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
            filter.Q.setValueAtTime(10, this.audioContext.currentTime);
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
            
            // Frequency sweep
            filter.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 2);
            
            // Clean up
            setTimeout(() => {
                if (this.audioWorkletInitialized) {
                    noiseNode.disconnect();
                }
                gainNode.disconnect();
                filter.disconnect();
            }, 2000);
        };
    }
    
    /**
     * Create a game over sound
     * @returns {Function} Function that plays the sound when called
     */
    createGameOverSound() {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            // Create a dramatic game over sound
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure oscillator
            osc.type = 'triangle';
            
            // Create a downward sweep
            osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 2.5);
            
            // Envelope
            gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
            
            // Start and stop
            osc.start();
            osc.stop(this.audioContext.currentTime + 2);
        };
    }
    
    /**
     * Create a sound for normal particle collection
     * @returns {Function} Function that plays the sound when called
     */
    createNormalParticleSound() {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            // Create a simple collection sound
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure oscillator
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.1);
            
            // Envelope
            gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            // Start and stop
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    /**
     * Create a sound for rare particle collection
     * @returns {Function} Function that plays the sound when called
     */
    createRareParticleSound() {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            // Create a sound for rare particles
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure oscillators
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1320, this.audioContext.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.15);
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1320 * 1.5, this.audioContext.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1760 * 1.5, this.audioContext.currentTime + 0.15);
            
            // Envelope
            gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
            
            // Start and stop
            osc1.start();
            osc2.start();
            osc1.stop(this.audioContext.currentTime + 0.4);
            osc2.stop(this.audioContext.currentTime + 0.4);
        };
    }
    
    /**
     * Create a sound for quantum particle collection
     * @returns {Function} Function that plays the sound when called
     */
    createQuantumParticleSound() {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            // Create a more complex sound for quantum particles
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const osc3 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            osc3.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure oscillators
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1760, this.audioContext.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(2093, this.audioContext.currentTime + 0.2);
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1760 * 1.5, this.audioContext.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(2093 * 1.5, this.audioContext.currentTime + 0.2);
            
            osc3.type = 'square';
            osc3.frequency.setValueAtTime(1760 * 0.5, this.audioContext.currentTime);
            osc3.frequency.exponentialRampToValueAtTime(2093 * 0.5, this.audioContext.currentTime + 0.2);
            
            // Envelope
            gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
            
            // Start and stop
            osc1.start();
            osc2.start();
            osc3.start();
            osc1.stop(this.audioContext.currentTime + 0.5);
            osc2.stop(this.audioContext.currentTime + 0.5);
            osc3.stop(this.audioContext.currentTime + 0.5);
        };
    }
    
    /**
     * Create a sound for unstable particle collection
     * @returns {Function} Function that plays the sound when called
     */
    createUnstableParticleSound() {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            // Create a distorted sound for unstable particles
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const distortion = this.audioContext.createWaveShaper();
            
            // Connect nodes
            osc.connect(distortion);
            distortion.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Create distortion curve
            function makeDistortionCurve(amount) {
                const k = typeof amount === 'number' ? amount : 50;
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                for (let i = 0; i < n_samples; ++i) {
                    const x = (i * 2) / n_samples - 1;
                    curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
                }
                return curve;
            }
            
            distortion.curve = makeDistortionCurve(100);
            distortion.oversample = '4x';
            
            // Configure oscillator
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
            osc.frequency.linearRampToValueAtTime(220, this.audioContext.currentTime + 0.2);
            
            // Envelope
            gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
            
            // Start and stop
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.5);
        };
    }
    
    /**
     * Play game start/restart sound
     */
    async playGameStart() {
        if (this.sounds.gameStart) {
            this.sounds.gameStart();
        } else {
            await this.initAudioContext();
            this.createSounds();
            if (this.sounds.gameStart) {
                this.sounds.gameStart();
            }
        }
    }
    
    /**
     * Play black hole collision sound
     */
    playBlackHoleCollision() {
        if (this.sounds.blackHoleCollision) {
            this.sounds.blackHoleCollision();
        }
    }
    
    /**
     * Play game over sound
     */
    playGameOver() {
        if (this.sounds.gameOver) {
            this.sounds.gameOver();
        }
    }
    
    /**
     * Play particle collection sound based on particle type
     * @param {string} type - Particle type ('normal', 'rare', 'quantum', 'unstable')
     */
    playParticleCollected(type = 'normal') {
        if (this.sounds.particles[type]) {
            this.sounds.particles[type]();
        } else {
            // Fallback to normal particle sound
            if (this.sounds.particles.normal) {
                this.sounds.particles.normal();
            }
        }
    }
}

// Create and export singleton instance
const soundManager = new SoundManager();
export default soundManager;

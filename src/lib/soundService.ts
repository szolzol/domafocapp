import goalSoundFile from '@/assets/audio/goal_score.mp3'
import matchEndSoundFile from '@/assets/audio/end_match.mp3'

// Sound effects service for the soccer tournament app
class SoundService {
  private isEnabled: boolean = true
  private goalAudio: HTMLAudioElement | null = null
  private matchEndAudio: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private isInitialized: boolean = false

  constructor() {
    // Initialize audio on first user interaction
    this.initOnUserInteraction()
  }

  private initOnUserInteraction() {
    const initAudio = () => {
      if (!this.isInitialized) {
        this.initAudioElements()
        this.isInitialized = true
        // Remove the event listeners after first initialization
        document.removeEventListener('click', initAudio)
        document.removeEventListener('touchstart', initAudio)
        document.removeEventListener('keydown', initAudio)
      }
    }

    // Listen for user interactions to initialize audio
    document.addEventListener('click', initAudio)
    document.addEventListener('touchstart', initAudio)
    document.addEventListener('keydown', initAudio)
  }

  private initAudioElements() {
    try {
      // Create audio context for better browser compatibility
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create audio elements for the sound files
      this.goalAudio = new Audio(goalSoundFile)
      this.matchEndAudio = new Audio(matchEndSoundFile)
      
      // Set volume levels
      this.goalAudio.volume = 0.7
      this.matchEndAudio.volume = 0.8
      
      // Preload the audio files
      this.goalAudio.preload = 'auto'
      this.matchEndAudio.preload = 'auto'

      // Handle loading errors
      this.goalAudio.addEventListener('error', (e) => {
        console.warn('Goal sound failed to load:', e)
      })
      
      this.matchEndAudio.addEventListener('error', (e) => {
        console.warn('Match end sound failed to load:', e)
      })

      console.log('Audio elements initialized successfully')
    } catch (error) {
      console.warn('Could not initialize audio elements:', error)
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  async playGoalSound() {
    if (!this.isEnabled) return
    
    try {
      // Ensure audio is initialized
      if (!this.isInitialized) {
        this.initAudioElements()
        this.isInitialized = true
      }
      
      if (!this.goalAudio) {
        console.warn('Goal audio not available')
        return
      }

      // Resume audio context if suspended (Safari requirement)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      
      // Reset audio to beginning and play
      this.goalAudio.currentTime = 0
      const playPromise = this.goalAudio.play()
      
      if (playPromise !== undefined) {
        await playPromise
        console.log('Goal sound played successfully')
      }
    } catch (error) {
      console.warn('Could not play goal sound:', error)
    }
  }

  async playMatchEndSound() {
    if (!this.isEnabled) return
    
    try {
      // Ensure audio is initialized
      if (!this.isInitialized) {
        this.initAudioElements()
        this.isInitialized = true
      }
      
      if (!this.matchEndAudio) {
        console.warn('Match end audio not available')
        return
      }

      // Resume audio context if suspended (Safari requirement)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      
      // Reset audio to beginning and play
      this.matchEndAudio.currentTime = 0
      const playPromise = this.matchEndAudio.play()
      
      if (playPromise !== undefined) {
        await playPromise
        console.log('Match end sound played successfully')
      }
    } catch (error) {
      console.warn('Could not play match end sound:', error)
    }
  }
}

export const soundService = new SoundService()
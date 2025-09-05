import goalSoundFile from '@/assets/audio/goal_score.mp3'
import matchEndSoundFile from '@/assets/audio/end_match.mp3'

// Sound effects service for the soccer tournament app
class SoundService {
  private isEnabled: boolean = true
  private goalAudio: HTMLAudioElement | null = null
  private matchEndAudio: HTMLAudioElement | null = null

  constructor() {
    this.initAudioElements()
  }

  private initAudioElements() {
    try {
      // Create audio elements for the sound files
      this.goalAudio = new Audio(goalSoundFile)
      this.matchEndAudio = new Audio(matchEndSoundFile)
      
      // Set volume levels
      this.goalAudio.volume = 0.7
      this.matchEndAudio.volume = 0.8
      
      // Preload the audio files
      this.goalAudio.preload = 'auto'
      this.matchEndAudio.preload = 'auto'
    } catch (error) {
      console.warn('Could not initialize audio elements:', error)
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  async playGoalSound() {
    if (!this.isEnabled || !this.goalAudio) return
    
    try {
      // Reset audio to beginning and play
      this.goalAudio.currentTime = 0
      await this.goalAudio.play()
    } catch (error) {
      console.warn('Could not play goal sound:', error)
    }
  }

  async playMatchEndSound() {
    if (!this.isEnabled || !this.matchEndAudio) return
    
    try {
      // Reset audio to beginning and play
      this.matchEndAudio.currentTime = 0
      await this.matchEndAudio.play()
    } catch (error) {
      console.warn('Could not play match end sound:', error)
    }
  }

export const soundService = new SoundService()
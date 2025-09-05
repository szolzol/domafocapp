// Sound effects using Web Audio API for live scoring notifications

export class SoundEffects {
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn('Web Audio API not supported')
      }
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) return null
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    return this.audioContext
  }

  // Goal scoring sound - celebratory tone
  async playGoalSound() {
    const context = await this.ensureAudioContext()
    if (!context) return

    try {
      // Create a celebratory ascending tone sequence
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      // Set initial frequency (G note)
      oscillator.frequency.setValueAtTime(392, context.currentTime)
      // Rise to C note
      oscillator.frequency.exponentialRampToValueAtTime(523, context.currentTime + 0.15)
      // Drop to E note and sustain
      oscillator.frequency.exponentialRampToValueAtTime(659, context.currentTime + 0.3)
      
      oscillator.type = 'sine'
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, context.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.1, context.currentTime + 0.3)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6)
      
      oscillator.start(context.currentTime)
      oscillator.stop(context.currentTime + 0.6)
    } catch (e) {
      console.warn('Failed to play goal sound:', e)
    }
  }

  // Match start sound - whistle-like tone
  async playMatchStartSound() {
    const context = await this.ensureAudioContext()
    if (!context) return

    try {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      oscillator.frequency.setValueAtTime(800, context.currentTime)
      oscillator.type = 'square'
      
      gainNode.gain.setValueAtTime(0, context.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.15)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)
      
      oscillator.start(context.currentTime)
      oscillator.stop(context.currentTime + 0.3)
    } catch (e) {
      console.warn('Failed to play match start sound:', e)
    }
  }

  // Match end sound - completion tone
  async playMatchEndSound() {
    const context = await this.ensureAudioContext()
    if (!context) return

    try {
      // Create a completion chord sequence
      const frequencies = [523, 659, 784] // C, E, G major chord
      
      frequencies.forEach((freq, index) => {
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(context.destination)
        
        oscillator.frequency.setValueAtTime(freq, context.currentTime)
        oscillator.type = 'sine'
        
        const delay = index * 0.1
        gainNode.gain.setValueAtTime(0, context.currentTime + delay)
        gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + delay + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + delay + 0.8)
        
        oscillator.start(context.currentTime + delay)
        oscillator.stop(context.currentTime + delay + 0.8)
      })
    } catch (e) {
      console.warn('Failed to play match end sound:', e)
    }
  }

  // Notification beep for general alerts
  async playNotificationSound() {
    const context = await this.ensureAudioContext()
    if (!context) return

    try {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      oscillator.frequency.setValueAtTime(880, context.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, context.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)
      
      oscillator.start(context.currentTime)
      oscillator.stop(context.currentTime + 0.2)
    } catch (e) {
      console.warn('Failed to play notification sound:', e)
    }
  }

  // Enable audio context on user interaction (required by browser policies)
  async enableAudio() {
    const context = await this.ensureAudioContext()
    if (context && context.state === 'suspended') {
      await context.resume()
    }
  }
}

// Global instance
export const soundEffects = new SoundEffects()
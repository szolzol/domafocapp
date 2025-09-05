// Sound effects service for the soccer tournament app
class SoundService {
  private audioContext: AudioContext | null = null
  private isEnabled: boolean = true

  constructor() {
    // Initialize audio context on first user interaction
    this.initAudioContext()
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Web Audio API not supported')
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  playGoalSound() {
    if (!this.isEnabled) return
    
    this.ensureAudioContext()
    
    try {
      // Create a crowd cheer effect using oscillators
      const now = this.audioContext!.currentTime
      
      // Create noise for crowd effect
      const noise = this.createNoise(0.3, 1.5)
      
      // Add some harmonics for cheering effect
      const osc1 = this.audioContext!.createOscillator()
      const osc2 = this.audioContext!.createOscillator()
      const gain1 = this.audioContext!.createGain()
      const gain2 = this.audioContext!.createGain()
      
      osc1.frequency.setValueAtTime(200, now)
      osc1.frequency.exponentialRampToValueAtTime(400, now + 0.5)
      osc2.frequency.setValueAtTime(150, now)
      osc2.frequency.exponentialRampToValueAtTime(300, now + 0.5)
      
      gain1.gain.setValueAtTime(0.1, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.5)
      gain2.gain.setValueAtTime(0.1, now)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.5)
      
      osc1.connect(gain1)
      osc2.connect(gain2)
      gain1.connect(this.audioContext!.destination)
      gain2.connect(this.audioContext!.destination)
      
      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 1.5)
      osc2.stop(now + 1.5)
      
    } catch (error) {
      console.warn('Could not play goal sound:', error)
    }
  }

  playMatchEndSound() {
    if (!this.isEnabled) return
    
    this.ensureAudioContext()
    
    try {
      // Create a referee whistle effect
      const now = this.audioContext!.currentTime
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      
      // Sharp whistle sound
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.setValueAtTime(1200, now + 0.1)
      osc.frequency.setValueAtTime(800, now + 0.2)
      osc.type = 'sine'
      
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
      
      osc.connect(gain)
      gain.connect(this.audioContext!.destination)
      
      osc.start(now)
      osc.stop(now + 0.5)
      
    } catch (error) {
      console.warn('Could not play match end sound:', error)
    }
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      this.initAudioContext()
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  private createNoise(volume: number, duration: number) {
    if (!this.audioContext) return null
    
    const now = this.audioContext.currentTime
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume
    }
    
    const noise = this.audioContext.createBufferSource()
    const gain = this.audioContext.createGain()
    
    noise.buffer = buffer
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)
    
    noise.connect(gain)
    gain.connect(this.audioContext.destination)
    
    noise.start(now)
    
    return noise
  }
}

export const soundService = new SoundService()
import * as Tone from 'tone'

export class ChannelStrip {
    public input: Tone.UserMedia | Tone.Player
    public eq: Tone.EQ3
    public filter: Tone.Filter
    public volume: Tone.Volume
    public panner: Tone.Panner
    public meter: Tone.Meter
    public solo: Tone.Solo

    constructor(sourceType: 'mic' | 'player' = 'mic') {
        if (sourceType === 'mic') {
            this.input = new Tone.UserMedia()
        } else {
            this.input = new Tone.Player()
        }

        this.eq = new Tone.EQ3(0, 0, 0) // Low, Mid, High
        this.filter = new Tone.Filter(20000, "lowpass")
        this.volume = new Tone.Volume(0)
        this.panner = new Tone.Panner(0)
        this.meter = new Tone.Meter()
        this.solo = new Tone.Solo()

        // THE SIGNAL CHAIN
        // Input -> EQ -> Filter -> Volume -> Panner -> Solo -> Master
        this.input.chain(this.eq, this.filter, this.volume, this.panner, this.solo, Tone.Destination)

        // Also connect to meter for visuals
        this.panner.connect(this.meter)
    }

    // Map 0-100 UI values to Decibels (-10 to +10)
    setEQ(low: number, mid: number, high: number) {
        // Map 0-100 to -24dB to +6dB (standard DJ range)
        // Center (50) should be 0dB.
        const map = (val: number) => {
            if (val === 50) return 0
            if (val < 50) return -24 + (val / 50) * 24 // 0->-24, 50->0
            return (val - 50) / 50 * 12 // 50->0, 100->+12
        }

        this.eq.low.value = map(low)
        this.eq.mid.value = map(mid)
        this.eq.high.value = map(high)
    }

    setFilter(val: number) {
        // 0-50 = Low Pass (Muffle), 50-100 = High Pass (Thin)
        // Center (50) should be neutral/open

        // Note: Standard DJ Filter usually requires TWO filters (LP and HP) or swapping types.
        // The prompt asks for:
        // if (val < 50) { this.filter.type = "lowpass"; ... } else { this.filter.type = "highpass"; ... }

        if (val < 45) {
            // Low Pass Mode
            this.filter.type = "lowpass"
            this.filter.rolloff = -24
            // 0 -> 200Hz, 50 -> 20000Hz
            // We want 0 to be VERY muffled (low freq) and 50 to be Open (high freq)
            // Logarithmic mapping is better
            const freq = Math.max(100, (val / 50) * 20000)
            this.filter.frequency.rampTo(freq, 0.1)
            this.filter.Q.value = 1
        } else if (val > 55) {
            // High Pass Mode
            this.filter.type = "highpass"
            this.filter.rolloff = -24
            // 50 -> 0Hz (Open), 100 -> 10000Hz (Thin)
            const freq = Math.max(0, ((val - 50) / 50) * 5000)
            this.filter.frequency.rampTo(freq, 0.1)
            this.filter.Q.value = 1
        } else {
            // Neutral (Open)
            // Move frequency out of audible range
            this.filter.type = "lowpass"
            this.filter.frequency.rampTo(22000, 0.1)
            this.filter.Q.value = 0
        }
    }

    setVolume(val: number) {
        // val 0-1. Map to dB.
        if (val <= 0) this.volume.mute = true
        else {
            this.volume.mute = false
            this.volume.volume.rampTo(Tone.gainToDb(val), 0.1)
        }
    }
}

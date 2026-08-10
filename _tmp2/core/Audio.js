/**
 * Core/Audio.js
 * Retro Web Audio Synthesizer (SFX & C64 Music Engine)
 */

export class SoundEngine
{
    constructor()
    {
        this.ctx = null;
        this.musicInterval = null;
        this.musicStep = 0;

        // Frequenzen für Musik-Noten (in Hz)
        this.NOTES = {
            C3: 130.81, D3: 146.83, Ds3: 155.56, F3: 174.61, G3: 196.00, Gs3: 207.65, As3: 233.08, B3: 246.94,
            C4: 261.63, D4: 293.66, Ds4: 311.13, F4: 349.23, G4: 392.00, Gs4: 415.30, As4: 466.16, B4: 493.88,
            C5: 523.25, D5: 587.33, Ds5: 622.25, F5: 698.46, G5: 783.99, Gs5: 830.61, As5: 932.33, B5: 987.77, REST: 0
        };

        // Track 1: Lead Melodie (64 Schritte)
        this.spookyLeadTrack = [
            this.NOTES.C5,  this.NOTES.REST, this.NOTES.Ds5, this.NOTES.G5,  
            this.NOTES.C5,  this.NOTES.REST, this.NOTES.D5,  this.NOTES.REST,
            this.NOTES.Gs4, this.NOTES.C5,   this.NOTES.Ds5, this.NOTES.F5,  
            this.NOTES.G5,  this.NOTES.F5,   this.NOTES.Ds5, this.NOTES.D5,

            this.NOTES.C5,  this.NOTES.Ds5,  this.NOTES.G5,  this.NOTES.C5, 
            this.NOTES.As5, this.NOTES.Gs5,  this.NOTES.G5,  this.NOTES.F5,
            this.NOTES.Ds5, this.NOTES.F5,   this.NOTES.G5,  this.NOTES.Ds5,
            this.NOTES.D5,  this.NOTES.REST, this.NOTES.G4,  this.NOTES.REST,

            this.NOTES.Gs4, this.NOTES.Gs4,  this.NOTES.C5,  this.NOTES.Ds5,
            this.NOTES.F5,  this.NOTES.Ds5,  this.NOTES.D5,  this.NOTES.C5,
            this.NOTES.D5,  this.NOTES.G4,   this.NOTES.B4,  this.NOTES.D5,
            this.NOTES.F5,  this.NOTES.Ds5,  this.NOTES.D5,  this.NOTES.B4,

            this.NOTES.C5,  this.NOTES.Ds5,  this.NOTES.F5,  this.NOTES.G5,
            this.NOTES.Gs5, this.NOTES.G5,   this.NOTES.F5,  this.NOTES.Ds5,
            this.NOTES.D5,  this.NOTES.F5,   this.NOTES.Ds5, this.NOTES.D5,
            this.NOTES.B4,  this.NOTES.D5,   this.NOTES.G4,  this.NOTES.B4
        ];

        // Track 2: Bassline
        this.spookyBassTrack = [
            this.NOTES.C3,  this.NOTES.C3,  this.NOTES.C3,  this.NOTES.REST,
            this.NOTES.C3,  this.NOTES.C3,  this.NOTES.Ds3, this.NOTES.REST,
            this.NOTES.Gs3, this.NOTES.Gs3, this.NOTES.Gs3, this.NOTES.REST,
            this.NOTES.G3,  this.NOTES.G3,  this.NOTES.G3,  this.NOTES.REST,

            this.NOTES.C3,  this.NOTES.C3,  this.NOTES.C3,  this.NOTES.REST,
            this.NOTES.As3, this.NOTES.As3, this.NOTES.Ds3, this.NOTES.REST,
            this.NOTES.Gs3, this.NOTES.Gs3, this.NOTES.F3,  this.NOTES.F3,
            this.NOTES.G3,  this.NOTES.G3,  this.NOTES.G3,  this.NOTES.REST,

            this.NOTES.Gs3, this.NOTES.Gs3, this.NOTES.Gs3, this.NOTES.Gs3,
            this.NOTES.F3,  this.NOTES.F3,  this.NOTES.F3,  this.NOTES.F3,
            this.NOTES.G3,  this.NOTES.G3,  this.NOTES.G3,  this.NOTES.G3,
            this.NOTES.G3,  this.NOTES.REST,this.NOTES.G3,  this.NOTES.REST,

            this.NOTES.C3,  this.NOTES.C3,  this.NOTES.C3,  this.NOTES.C3,
            this.NOTES.F3,  this.NOTES.F3,  this.NOTES.F3,  this.NOTES.F3,
            this.NOTES.G3,  this.NOTES.G3,  this.NOTES.G3,  this.NOTES.G3,
            this.NOTES.G3,  this.NOTES.G3,  this.NOTES.B3,  this.NOTES.G3
        ];

        // Track 3: Arpeggios
        this.spookyArpeggios = [
            [this.NOTES.C4,  this.NOTES.Ds4, this.NOTES.G4],
            [this.NOTES.C4,  this.NOTES.D4,  this.NOTES.G4],
            [this.NOTES.Gs3, this.NOTES.C4,  this.NOTES.Ds4],
            [this.NOTES.G3,  this.NOTES.D4,  this.NOTES.G4],
            [this.NOTES.C4,  this.NOTES.Ds4, this.NOTES.Gs4],
            [this.NOTES.As3, this.NOTES.D4,  this.NOTES.F4],
            [this.NOTES.F3,  this.NOTES.Gs3, this.NOTES.C4],
            [this.NOTES.G3,  this.NOTES.B4,  this.NOTES.D5]
        ];
    }

    init()
    {
        if (!this.ctx)
        {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx)
            {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended')
        {
            this.ctx.resume();
        }
    }

    // --- SOUND EFFECTS ---
    playJump()
    {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playShoot()
    {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHit()
    {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playGameOver()
    {
        this.stopMusic();
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    // --- C64 MUSIC ENGINE ---
    startSpookyMusic()
    {
        this.stopMusic();
        this.init();
        if (!this.ctx) return;

        this.musicStep = 0;

        this.musicInterval = setInterval(() => {
            const now = this.ctx.currentTime;
            const totalSteps = this.spookyLeadTrack.length;
            const stepIdx = this.musicStep % totalSteps;

            // Channel 1: Lead Melody
            let leadFreq = this.spookyLeadTrack[stepIdx];
            if (leadFreq > 0)
            {
                let osc1 = this.ctx.createOscillator();
                let gain1 = this.ctx.createGain();

                osc1.type = 'square';
                osc1.frequency.setValueAtTime(leadFreq, now);

                gain1.gain.setValueAtTime(0.04, now);
                gain1.gain.linearRampToValueAtTime(0.001, now + 0.12);

                osc1.connect(gain1);
                gain1.connect(this.ctx.destination);

                osc1.start(now);
                osc1.stop(now + 0.12);
            }

            // Channel 2: Bass
            let bassFreq = this.spookyBassTrack[stepIdx];
            if (bassFreq > 0)
            {
                let osc2 = this.ctx.createOscillator();
                let gain2 = this.ctx.createGain();

                osc2.type = 'sawtooth';
                osc2.frequency.setValueAtTime(bassFreq, now);

                gain2.gain.setValueAtTime(0.05, now);
                gain2.gain.linearRampToValueAtTime(0.001, now + 0.1);

                osc2.connect(gain2);
                gain2.connect(this.ctx.destination);

                osc2.start(now);
                osc2.stop(now + 0.1);
            }

            // Channel 3: Arpeggio
            let chordIdx = Math.floor(stepIdx / 4) % this.spookyArpeggios.length;
            let chord = this.spookyArpeggios[chordIdx];

            if (chord)
            {
                let osc3 = this.ctx.createOscillator();
                let gain3 = this.ctx.createGain();

                osc3.type = 'square';
                osc3.frequency.setValueAtTime(chord[0], now);
                osc3.frequency.setValueAtTime(chord[1], now + 0.03);
                osc3.frequency.setValueAtTime(chord[2], now + 0.06);

                gain3.gain.setValueAtTime(0.02, now);
                gain3.gain.linearRampToValueAtTime(0.001, now + 0.09);

                osc3.connect(gain3);
                gain3.connect(this.ctx.destination);

                osc3.start(now);
                osc3.stop(now + 0.09);
            }

            this.musicStep++;
        }, 150);
    }

    stopMusic()
    {
        if (this.musicInterval)
        {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}
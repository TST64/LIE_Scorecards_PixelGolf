// Retro Web Audio Synthesizer
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let musicInterval = null;
let musicStep = 0;

// Noten-Frequenzen (in Hz)
const NOTES = {
    C3: 130.81, D3: 146.83, Ds3: 155.56, F3: 174.61, G3: 196.00, Gs3: 207.65, As3: 233.08, B3: 246.94,
    C4: 261.63, D4: 293.66, Ds4: 311.13, F4: 349.23, G4: 392.00, Gs4: 415.30, As4: 466.16, B4: 493.88,
    C5: 523.25, D5: 587.33, Ds5: 622.25, F5: 698.46, G5: 783.99, Gs5: 830.61, As5: 932.33, B5: 987.77, REST: 0
};

// 1. LEAD-MELODIE (64 Schritte / 16 Takte - Perfekter Loop)
const spookyLeadTrack = [
    // Teil 1: Thema A (C-Moll Düsterkeit)
    NOTES.C5,  NOTES.REST, NOTES.Ds5, NOTES.G5,  
    NOTES.C5,  NOTES.REST, NOTES.D5,  NOTES.REST,
    NOTES.Gs4, NOTES.C5,   NOTES.Ds5, NOTES.F5,  
    NOTES.G5,  NOTES.F5,   NOTES.Ds5, NOTES.D5,

    // Teil 2: Thema B (Spannungsaufbau)
    NOTES.C5,  NOTES.Ds5,  NOTES.G5,  NOTES.C5, 
    NOTES.As5, NOTES.Gs5,  NOTES.G5,  NOTES.F5,
    NOTES.Ds5, NOTES.F5,   NOTES.G5,  NOTES.Ds5,
    NOTES.D5,  NOTES.REST, NOTES.G4,  NOTES.REST,

    // Teil 3: Thema C (Rhythmischer Lauf & Melodie)
    NOTES.Gs4, NOTES.Gs4,  NOTES.C5,  NOTES.Ds5,
    NOTES.F5,  NOTES.Ds5,  NOTES.D5,  NOTES.C5,
    NOTES.D5,  NOTES.G4,   NOTES.B4,  NOTES.D5,
    NOTES.F5,  NOTES.Ds5,  NOTES.D5,  NOTES.B4,

    // Teil 4: Überleitung & Harmonische Auflösung zurück zu Teil 1
    NOTES.C5,  NOTES.Ds5,  NOTES.F5,  NOTES.G5,
    NOTES.Gs5, NOTES.G5,   NOTES.F5,  NOTES.Ds5,
    NOTES.D5,  NOTES.F5,   NOTES.Ds5, NOTES.D5,
    NOTES.B4,  NOTES.D5,   NOTES.G4,  NOTES.B4  // Hinführung auf das C5 am Anfang!
];

// 2. BASSLINE (64 Schritte)
const spookyBassTrack = [
    NOTES.C3,  NOTES.C3,  NOTES.C3,  NOTES.REST,
    NOTES.C3,  NOTES.C3,  NOTES.Ds3, NOTES.REST,
    NOTES.Gs3, NOTES.Gs3, NOTES.Gs3, NOTES.REST,
    NOTES.G3,  NOTES.G3,  NOTES.G3,  NOTES.REST,

    NOTES.C3,  NOTES.C3,  NOTES.C3,  NOTES.REST,
    NOTES.As3, NOTES.As3, NOTES.Ds3, NOTES.REST,
    NOTES.Gs3, NOTES.Gs3, NOTES.F3,  NOTES.F3,
    NOTES.G3,  NOTES.G3,  NOTES.G3,  NOTES.REST,

    NOTES.Gs3, NOTES.Gs3, NOTES.Gs3, NOTES.Gs3,
    NOTES.F3,  NOTES.F3,  NOTES.F3,  NOTES.F3,
    NOTES.G3,  NOTES.G3,  NOTES.G3,  NOTES.G3,
    NOTES.G3,  NOTES.REST,NOTES.G3,  NOTES.REST,

    NOTES.C3,  NOTES.C3,  NOTES.C3,  NOTES.C3,
    NOTES.F3,  NOTES.F3,  NOTES.F3,  NOTES.F3,
    NOTES.G3,  NOTES.G3,  NOTES.G3,  NOTES.G3,
    NOTES.G3,  NOTES.G3,  NOTES.B3,  NOTES.G3
];

// 3. WECHSELNDE C64 ARPEGGIOS
const spookyArpeggios = [
    [NOTES.C4, NOTES.Ds4, NOTES.G4],  // C-Moll
    [NOTES.C4, NOTES.D4,  NOTES.G4],  // C-Sus2
    [NOTES.Gs3,NOTES.C4,  NOTES.Ds4], // Gs-Dur
    [NOTES.G3, NOTES.D4,  NOTES.G4],  // G-Dur
    [NOTES.C4, NOTES.Ds4, NOTES.Gs4], // Cm/Gs
    [NOTES.As3,NOTES.D4,  NOTES.F4],  // As-Dur
    [NOTES.F3, NOTES.Gs3, NOTES.C4],  // F-Moll
    [NOTES.G3, NOTES.B4,  NOTES.D5]   // G7
];

function startSpookyC64Music()
{
    stopC64Music();
    
    if (audioCtx.state === 'suspended')
    {
        audioCtx.resume();
    }

    musicStep = 0;

    musicInterval = setInterval(() => {
        if (typeof currentState !== 'undefined' && currentState !== GAME_STATE.PLAYING) return;

        const now = audioCtx.currentTime;
        const totalSteps = spookyLeadTrack.length;
        const stepIdx = musicStep % totalSteps;

        // KANAL 1: LEAD MELODIE
        let leadFreq = spookyLeadTrack[stepIdx];
        if (leadFreq > 0)
        {
            let osc1 = audioCtx.createOscillator();
            let gain1 = audioCtx.createGain();

            osc1.type = 'square';
            osc1.frequency.setValueAtTime(leadFreq, now);

            gain1.gain.setValueAtTime(0.04, now);
            gain1.gain.linearRampToValueAtTime(0.001, now + 0.12);

            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);

            osc1.start(now);
            osc1.stop(now + 0.12);
        }

        // KANAL 2: BASS
        let bassFreq = spookyBassTrack[stepIdx];
        if (bassFreq > 0)
        {
            let osc2 = audioCtx.createOscillator();
            let gain2 = audioCtx.createGain();

            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(bassFreq, now);

            gain2.gain.setValueAtTime(0.05, now);
            gain2.gain.linearRampToValueAtTime(0.001, now + 0.1);

            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);

            osc2.start(now);
            osc2.stop(now + 0.1);
        }

        // KANAL 3: ARPEGGIOS
        let chordIdx = Math.floor(stepIdx / 4) % spookyArpeggios.length;
        let chord = spookyArpeggios[chordIdx];

        if (chord)
        {
            let osc3 = audioCtx.createOscillator();
            let gain3 = audioCtx.createGain();

            osc3.type = 'square';
            osc3.frequency.setValueAtTime(chord[0], now);
            osc3.frequency.setValueAtTime(chord[1], now + 0.03);
            osc3.frequency.setValueAtTime(chord[2], now + 0.06);

            gain3.gain.setValueAtTime(0.02, now);
            gain3.gain.linearRampToValueAtTime(0.001, now + 0.09);

            osc3.connect(gain3);
            gain3.connect(audioCtx.destination);

            osc3.start(now);
            osc3.stop(now + 0.09);
        }

        musicStep++;
    }, 150);
}

function stopC64Music()
{
    if (musicInterval)
    {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

function playJumpSound()
{
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playHitSound()
{
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playGameOverSound()
{
    stopC64Music();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}
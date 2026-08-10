// Retro Web Audio Synthesizer (Zentral für alle Kapitel)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let musicInterval = null;
let musicStep = 0;

// Noten-Frequenzen (in Hz)
const NOTES = {
    C3: 130.81, D3: 146.83, Ds3: 155.56, F3: 174.61, G3: 196.00, Gs3: 207.65, As3: 233.08, B3: 246.94,
    C4: 261.63, D4: 293.66, Ds4: 311.13, F4: 349.23, G4: 392.00, Gs4: 415.30, As4: 466.16, B4: 493.88,
    C5: 523.25, D5: 587.33, Ds5: 622.25, F5: 698.46, G5: 783.99, Gs5: 830.61, As5: 932.33, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E5: 659.25, E6: 1318.51, F6: 1396.91, G6: 1567.98, A5: 880.00, B5: 987.77, REST: 0
};

// --- 1. TRACK FÜR LEVEL 1: HELLE DAYTIME-MELODIE (C-DUR) ---
const dayLeadTrack = [
    NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6,
    NOTES.G5, NOTES.E5, NOTES.C5, NOTES.REST,
    NOTES.F5, NOTES.A5, NOTES.C6, NOTES.F6,
    NOTES.C6, NOTES.A5, NOTES.F5, NOTES.REST,
    NOTES.G5, NOTES.B5, NOTES.D6, NOTES.G6,
    NOTES.D6, NOTES.B5, NOTES.G5, NOTES.REST,
    NOTES.C6, NOTES.G5, NOTES.E5, NOTES.G5,
    NOTES.C6, NOTES.REST, NOTES.REST, NOTES.REST
];

const dayBassTrack = [
    NOTES.C3, NOTES.REST, NOTES.C3, NOTES.REST,
    NOTES.F3, NOTES.REST, NOTES.F3, NOTES.REST,
    NOTES.G3, NOTES.REST, NOTES.G3, NOTES.REST,
    NOTES.C3, NOTES.REST, NOTES.G3, NOTES.REST
];

// --- 2. TRACK FÜR LEVEL 2: DÜSTERE ZOMBIE-MELODIE (C-MOLL) ---
const spookyLeadTrack = [
    // Teil 1: Thema A
    NOTES.C5,  NOTES.REST, NOTES.Ds5, NOTES.G5,  
    NOTES.C5,  NOTES.REST, NOTES.D5,  NOTES.REST,
    NOTES.Gs4, NOTES.C5,   NOTES.Ds5, NOTES.F5,  
    NOTES.G5,  NOTES.F5,   NOTES.Ds5, NOTES.D5,

    // Teil 2: Thema B
    NOTES.C5,  NOTES.Ds5,  NOTES.G5,  NOTES.C5, 
    NOTES.As5, NOTES.Gs5,  NOTES.G5,  NOTES.F5,
    NOTES.Ds5, NOTES.F5,   NOTES.G5,  NOTES.Ds5,
    NOTES.D5,  NOTES.REST, NOTES.G4,  NOTES.REST,

    // Teil 3: Thema C
    NOTES.Gs4, NOTES.Gs4,  NOTES.C5,  NOTES.Ds5,
    NOTES.F5,  NOTES.Ds5,  NOTES.D5,  NOTES.C5,
    NOTES.D5,  NOTES.G4,   NOTES.B4,  NOTES.D5,
    NOTES.F5,  NOTES.Ds5,  NOTES.D5,  NOTES.B4,

    // Teil 4: Überleitung
    NOTES.C5,  NOTES.Ds5,  NOTES.F5,  NOTES.G5,
    NOTES.Gs5, NOTES.G5,   NOTES.F5,  NOTES.Ds5,
    NOTES.D5,  NOTES.F5,   NOTES.Ds5, NOTES.D5,
    NOTES.B4,  NOTES.D5,   NOTES.G4,  NOTES.B4
];

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

const spookyArpeggios = [
    [NOTES.C4, NOTES.Ds4, NOTES.G4],
    [NOTES.C4, NOTES.D4,  NOTES.G4],
    [NOTES.Gs3,NOTES.C4,  NOTES.Ds4],
    [NOTES.G3, NOTES.D4,  NOTES.G4],
    [NOTES.C4, NOTES.Ds4, NOTES.Gs4],
    [NOTES.As3,NOTES.D4,  NOTES.F4],
    [NOTES.F3, NOTES.Gs3, NOTES.C4],
    [NOTES.G3, NOTES.B4,  NOTES.D5]
];

// --- LEVEL 1 MUSIK (Tages-Golfen) ---
function startC64Music()
{
    stopC64Music();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    musicStep = 0;
    musicInterval = setInterval(() => {
        if (typeof currentState !== 'undefined' && currentState !== GAME_STATE.PLAYING) return;

        const now = audioCtx.currentTime;
        const stepIdx = musicStep % dayLeadTrack.length;

        let leadFreq = dayLeadTrack[stepIdx];
        if (leadFreq > 0)
        {
            let osc1 = audioCtx.createOscillator();
            let gain1 = audioCtx.createGain();
            osc1.type = 'square';
            osc1.frequency.setValueAtTime(leadFreq, now);
            gain1.gain.setValueAtTime(0.03, now);
            gain1.gain.linearRampToValueAtTime(0.001, now + 0.1);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.1);
        }

        let bassFreq = dayBassTrack[musicStep % dayBassTrack.length];
        if (bassFreq > 0)
        {
            let osc2 = audioCtx.createOscillator();
            let gain2 = audioCtx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(bassFreq, now);
            gain2.gain.setValueAtTime(0.06, now);
            gain2.gain.linearRampToValueAtTime(0.001, now + 0.12);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now);
            osc2.stop(now + 0.12);
        }

        musicStep++;
    }, 140);
}

// --- LEVEL 2 MUSIK (Zombie Siege) ---
function startSpookyC64Music()
{
    stopC64Music();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    musicStep = 0;
    musicInterval = setInterval(() => {
        if (typeof currentState !== 'undefined' && currentState !== GAME_STATE.PLAYING) return;

        const now = audioCtx.currentTime;
        const stepIdx = musicStep % spookyLeadTrack.length;

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

// --- SOUNDEFFEKTE ---
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

function playPickupSound()
{
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
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
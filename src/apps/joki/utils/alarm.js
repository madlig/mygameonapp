/**
 * Piercing Dual-Tone Alarm System:
 * High-pitch dual square wave beep (988Hz & 1319Hz)
 * Loops continuously every 1.4s until stopAlarm() is called.
 */

let sharedAudioContext = null;
let alarmTimer = null;

function getAudioContext() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume();
    }
    return sharedAudioContext;
  } catch (error) {
    return null;
  }
}

// User interaction priming
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => getAudioContext(), { once: true });
  document.addEventListener('keydown', () => getAudioContext(), { once: true });
}

function playAlarmPattern() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const tones = [
      { freq: 988, at: 0, dur: 0.18 },
      { freq: 1319, at: 0.22, dur: 0.28 },
    ];

    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.value = tone.freq;

      gain.gain.setValueAtTime(0.0001, t + tone.at);
      gain.gain.exponentialRampToValueAtTime(0.4, t + tone.at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.at + tone.dur);

      osc.start(t + tone.at);
      osc.stop(t + tone.at + tone.dur + 0.05);
    });
  } catch (error) {
    console.log('Audio notification error:', error);
  }
}

export function startPiercingAlarm() {
  stopPiercingAlarm();
  playAlarmPattern();
  alarmTimer = setInterval(playAlarmPattern, 1400);
}

export function stopPiercingAlarm() {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
}

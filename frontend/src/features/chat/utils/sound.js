// Ek chhota "pop" sound Web Audio API se seedha banate hain — koi audio file load
// nahi karni padti. Browsers audio ko user ke gesture (click) ke bina block karte
// hain; call shuru karne ke liye user pehle "Join now" dabata hai, isliye tab tak
// audio allow ho chuka hota hai. Fir bhi fail ho to chupchaap ignore karte hain.
let audioCtx = null;

function getAudioContext() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
}

// Do halke tone, chhoti si "pop" — naya message aane par bajta hai
export function playNotificationSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;
        [880, 1175].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;

            const start = now + i * 0.08;
            // Halka fade-in/out, taaki "click" jaisi awaaz na aaye
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.16);
        });
    } catch {
        // Audio blocked ya unsupported — chupchaap ignore
    }
}
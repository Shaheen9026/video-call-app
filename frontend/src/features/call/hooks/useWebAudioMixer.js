import { useRef } from "react";

// Local aur remote, dono audio streams ko Web Audio API ke through mix karta hai
// taaki recording mein dono taraf ki awaaz aaye. MediaRecorder ek hi audio track
// leta hai, isliye dono ko ek MediaStreamDestination pe combine karna padta hai.
export function useWebAudioMixer() {
    const audioCtxRef = useRef(null);
    const destRef = useRef(null);
    const sourcesRef = useRef([]); // connected source nodes, cleanup ke liye

    function ensureContext() {//AudioContext bana hua hai ya nahi?
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            destRef.current = audioCtxRef.current.createMediaStreamDestination();
        }
    }

    // stream mein se audio nikal ke mixer destination se connect karta hai.
    // Agar stream mein audio track nahi hai to chup-chaap skip kar deta hai.
    function addStream(stream) {
        if (!stream) return;
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        ensureContext();

        const audioOnlyStream = new MediaStream(audioTracks);
        const source = audioCtxRef.current.createMediaStreamSource(audioOnlyStream);
        source.connect(destRef.current);
        sourcesRef.current.push(source);
    }

    // Mixed audio ka MediaStreamTrack deta hai — recorder mein video ke saath jodenge
    function getMixedTrack() {
        ensureContext();
        return destRef.current.stream.getAudioTracks()[0] || null;
    }

    function cleanup() {
        sourcesRef.current.forEach((s) => {
            try {
                s.disconnect();
            } catch {
                // already disconnected, ignore
            }
        });
        sourcesRef.current = [];
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => { });
            audioCtxRef.current = null;
            destRef.current = null;
        }
    }

    return { addStream, getMixedTrack, cleanup };
}
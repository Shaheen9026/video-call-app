import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CALL_STATUS } from "../utils/constants";

// Camera/mic access — pehle video+audio try karta hai, camera na mile to
// audio-only fallback. Stream ko diye gaye <video> ref pe bhi attach kar deta hai.
export function useMediaStream(localVideoRef) {
    const localStreamRef = useRef(null);//Camera/mic ka MediaStream store kiya ja raha hai

    async function acquire() {
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (err) {
            console.warn("Camera not found, trying audio-only:", err.message);
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            toast("Camera not available — audio-only mode", { icon: "🎙️" });
        }

        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;
        return stream;
    }

    function stopStream() {
        //track current track ko represent karta hai.
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
    }

    return { localStreamRef, acquire, stopStream };
}

// Sirf "call kitni der se chal rahi hai" ka logic. callStatus IN_CALL hote hi
// timer shuru, warna reset.
export function useCallTimer(callStatus) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (callStatus !== CALL_STATUS.IN_CALL) return;
        setElapsed(0);
        const id = setInterval(() => setElapsed((prev) => prev + 1), 1000);
        return () => clearInterval(id);
    }, [callStatus]);

    return elapsed;
}  
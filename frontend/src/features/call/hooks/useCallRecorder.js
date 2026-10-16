// import { useRef, useState, useCallback } from "react";
// import toast from "react-hot-toast";
// import { useCanvasCompositor } from "./useCanvasCompositor";
// import { useWebAudioMixer } from "./useWebAudioMixer";

// // Browser codec support alag-alag hai — jo bhi pehle supported mile wahi use karo.
// const PREFERRED_MIME_TYPES = [
//     "video/webm;codecs=vp9,opus",
//     "video/webm;codecs=vp8,opus",
//     "video/webm",
// ];

// function pickSupportedMimeType() {
//     for (const type of PREFERRED_MIME_TYPES) {
//         if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) {
//             return type;
//         }
//     }
//     return ""; // browser ko default choose karne do
// }

// // Local + remote video ko composite karke, dono ka audio mix karke, ek single
// // .webm file record karta hai. Recording stop hote hi local download, aur
// // backend upload — dono automatically ho jaate hain.
// export function useCallRecorder({ localVideoRef, remoteVideoRef, roomId }) {
//     const [isRecording, setIsRecording] = useState(false);
//     const [recordedSeconds, setRecordedSeconds] = useState(0);
//     const [lastRecordingUrl, setLastRecordingUrl] = useState(null);

//     const recorderRef = useRef(null);
//     const chunksRef = useRef([]);
//     const timerIdRef = useRef(null);
//     const combinedStreamRef = useRef(null);
//     const isRecordingRef = useRef(false);
//     const recordedSecondsRef = useRef(0);
//     const roomIdRef = useRef(roomId);
//     roomIdRef.current = roomId;

//     const compositor = useCanvasCompositor();
//     const audioMixer = useWebAudioMixer();

//     const start = useCallback(() => {
//         if (isRecordingRef.current) return;

//         const localEl = localVideoRef.current;
//         const remoteEl = remoteVideoRef.current;
//         if (!localEl || !remoteEl) {
//             console.warn("Recording start failed: video elements not ready");
//             return;
//         }

//         const canvasStream = compositor.start(localEl, remoteEl);
//         const videoTrack = canvasStream.getVideoTracks()[0];

//         audioMixer.addStream(localEl.srcObject);
//         audioMixer.addStream(remoteEl.srcObject);
//         const audioTrack = audioMixer.getMixedTrack();

//         const finalStream = new MediaStream();
//         if (videoTrack) finalStream.addTrack(videoTrack);
//         if (audioTrack) finalStream.addTrack(audioTrack);
//         combinedStreamRef.current = finalStream;

//         const mimeType = pickSupportedMimeType();
//         const recorder = new MediaRecorder(finalStream, mimeType ? { mimeType } : undefined);
//         chunksRef.current = [];

//         recorder.ondataavailable = (e) => {
//             if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
//         };

//         recorder.onstop = async () => {
//             const rawBlob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });

//             // Duration/container fix ab CLIENT pe nahi hota — ye kaam ab
//             // backend ffmpeg remux karta hai (upload ke turant baad,
//             // recordingController.js dekho).
//             const finalBlob = new Blob([rawBlob], { type: "video/webm" });
//             const url = URL.createObjectURL(finalBlob);
//             setLastRecordingUrl(url);

//             const a = document.createElement("a");
//             a.href = url;
//             a.download = `call-recording-${Date.now()}.webm`;
//             document.body.appendChild(a);
//             a.click();
//             a.remove();

//             toast.success("Recording downloaded");

//             try {
//                 const formData = new FormData();
//                 formData.append("roomId", roomIdRef.current || "unknown");
//                 formData.append("recording", finalBlob, `recording-${Date.now()}.webm`);

//                 const res = await fetch("http://192.168.204.119:5000/api/recordings/upload", {
//                     method: "POST",
//                     body: formData,
//                 });

//                 if (res.ok) {
//                     const result = await res.json().catch(() => null);
//                     if (result && result.repaired === false) {
//                         toast("Saved, but duration fix failed on server", { icon: "⚠️" });
//                     } else {
//                         toast.success("Recording saved on server");
//                     }
//                 } else {
//                     toast.error("Server upload failed");
//                 }
//             } catch (err) {
//                 console.error("Upload error:", err);
//                 toast.error("Could not upload recording to server");
//             }

//             chunksRef.current = [];
//         };

//         recorder.start(1000);
//         recorderRef.current = recorder;

//         isRecordingRef.current = true;
//         setIsRecording(true);
//         setRecordedSeconds(0);
//         recordedSecondsRef.current = 0;
//         timerIdRef.current = setInterval(() => {
//             recordedSecondsRef.current += 1;
//             setRecordedSeconds(recordedSecondsRef.current);
//         }, 1000);
//     }, [localVideoRef, remoteVideoRef, compositor, audioMixer]);

//     const stop = useCallback(() => {
//         if (!isRecordingRef.current) return;

//         recorderRef.current?.stop();
//         recorderRef.current = null;

//         compositor.stop();
//         audioMixer.cleanup();
//         combinedStreamRef.current?.getTracks().forEach((t) => t.stop());
//         combinedStreamRef.current = null;

//         clearInterval(timerIdRef.current);
//         timerIdRef.current = null;

//         isRecordingRef.current = false;
//         setIsRecording(false);
//     }, [compositor, audioMixer]);

//     return {
//         isRecording,
//         recordedSeconds,
//         lastRecordingUrl,
//         startRecording: start,
//         stopRecording: stop,
//     };
// }        

import { useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useCanvasCompositor } from "./useCanvasCompositor";
import { useWebAudioMixer } from "./useWebAudioMixer";
import { API_BASE_URL } from "../../../shared/utils/constants";

// Browser codec support alag-alag hai — jo bhi pehle supported mile wahi use karo.
const PREFERRED_MIME_TYPES = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
];

function pickSupportedMimeType() {
    for (const type of PREFERRED_MIME_TYPES) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return ""; // browser ko default choose karne do
}

// Local + remote video ko composite karke, dono ka audio mix karke, ek single
// .webm file record karta hai. Recording stop hote hi local download, aur
// backend upload — dono automatically ho jaate hain.
export function useCallRecorder({ localVideoRef, remoteVideoRef, roomId }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedSeconds, setRecordedSeconds] = useState(0);
    const [lastRecordingUrl, setLastRecordingUrl] = useState(null);

    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerIdRef = useRef(null);
    const combinedStreamRef = useRef(null);
    const isRecordingRef = useRef(false);
    const recordedSecondsRef = useRef(0);
    const roomIdRef = useRef(roomId);
    roomIdRef.current = roomId;

    const compositor = useCanvasCompositor();
    const audioMixer = useWebAudioMixer();

    const start = useCallback(() => {
        if (isRecordingRef.current) return;

        const localEl = localVideoRef.current;
        const remoteEl = remoteVideoRef.current;
        if (!localEl || !remoteEl) {
            console.warn("Recording start failed: video elements not ready");
            return;
        }

        const canvasStream = compositor.start(localEl, remoteEl);
        const videoTrack = canvasStream.getVideoTracks()[0];

        audioMixer.addStream(localEl.srcObject);
        audioMixer.addStream(remoteEl.srcObject);
        const audioTrack = audioMixer.getMixedTrack();

        const finalStream = new MediaStream();
        if (videoTrack) finalStream.addTrack(videoTrack);
        if (audioTrack) finalStream.addTrack(audioTrack);
        combinedStreamRef.current = finalStream;

        const mimeType = pickSupportedMimeType();
        const recorder = new MediaRecorder(finalStream, mimeType ? { mimeType } : undefined);
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            const rawBlob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });

            // Duration/container fix ab CLIENT pe nahi hota — ye kaam ab
            // backend ffmpeg remux karta hai (upload ke turant baad,
            // recordingController.js dekho).
            const finalBlob = new Blob([rawBlob], { type: "video/webm" });
            const url = URL.createObjectURL(finalBlob);
            setLastRecordingUrl(url);

            const a = document.createElement("a");
            a.href = url;
            a.download = `call-recording-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            toast.success("Recording downloaded");

            try {
                const formData = new FormData();
                formData.append("roomId", roomIdRef.current || "unknown");
                formData.append("recording", finalBlob, `recording-${Date.now()}.webm`);

                const res = await fetch(`${API_BASE_URL}/api/recordings/upload`, {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const result = await res.json().catch(() => null);
                    if (result && result.repaired === false) {
                        toast("Saved, but duration fix failed on server", { icon: "⚠️" });
                    } else {
                        toast.success("Recording saved on server");
                    }
                } else {
                    toast.error("Server upload failed");
                }
            } catch (err) {
                console.error("Upload error:", err);
                toast.error("Could not upload recording to server");
            }

            chunksRef.current = [];
        };

        recorder.start(1000);
        recorderRef.current = recorder;

        isRecordingRef.current = true;
        setIsRecording(true);
        setRecordedSeconds(0);
        recordedSecondsRef.current = 0;
        timerIdRef.current = setInterval(() => {
            recordedSecondsRef.current += 1;
            setRecordedSeconds(recordedSecondsRef.current);
        }, 1000);
    }, [localVideoRef, remoteVideoRef, compositor, audioMixer]);

    const stop = useCallback(() => {
        if (!isRecordingRef.current) return;

        recorderRef.current?.stop();
        recorderRef.current = null;

        compositor.stop();
        audioMixer.cleanup();
        combinedStreamRef.current?.getTracks().forEach((t) => t.stop());
        combinedStreamRef.current = null;

        clearInterval(timerIdRef.current);
        timerIdRef.current = null;

        isRecordingRef.current = false;
        setIsRecording(false);
    }, [compositor, audioMixer]);

    return {
        isRecording,
        recordedSeconds,
        lastRecordingUrl,
        startRecording: start,
        stopRecording: stop,
    };
}
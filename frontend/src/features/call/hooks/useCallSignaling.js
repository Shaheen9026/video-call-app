
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CALL_STATUS, CONNECTION_STATE } from "../utils/constants";
import { endCallCleanup, toggleAudioTrack, toggleVideoTrack } from "../utils/callActions";
import { useWebSocket } from "../../../shared/hooks/useWebSocket";
import { useWebRTC } from "./useWebRTC";
import { useMediaStream, useCallTimer } from "./useMediaStream";
import { useCallRecorder } from "./useCallRecorder";
import { useChat } from "../../chat/hooks/useChat";          
import { CHAT_EVENTS } from "../../chat/utils/constants";    


// Orchestrator — WebSocket, WebRTC, media stream, aur timer, in sabko jodta
// hai aur CallScreen ko sirf woh cheezein deta hai jo UI render karne ke liye
// chahiye. Isme koi JSX nahi hai, sirf call flow ka business logic hai.
export function useCallSignaling({ roomId, onEndCall,displayName  }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const isCallerRef = useRef(false);
    const isResumingRef = useRef(false);

    const [micOn, setMicOn] = useState(true);
    const [remoteIsRecording, setRemoteIsRecording] = useState(false);
    const [cameraOn, setCameraOn] = useState(true);
    const [callStatus, setCallStatus] = useState(CALL_STATUS.WAITING);

    const elapsed = useCallTimer(callStatus);
    const { localStreamRef, acquire: acquireMediaStream } = useMediaStream(localVideoRef);
    const { wsRef, connect: connectWebSocket, send: sendMessage } = useWebSocket();

     const chat = useChat({ send: sendMessage,displayName });   // NEW
    const { pcRef, setupPeerConnection, connectionState, setConnectionState } = useWebRTC({
        remoteVideoRef,
        onIceCandidate: (candidate) => sendMessage("ice-candidate", { candidate, roomId }),
    });

    const {
        isRecording,
        recordedSeconds,
        startRecording,
        stopRecording,
    } = useCallRecorder({ localVideoRef, remoteVideoRef, roomId });

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const stream = await acquireMediaStream();

                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                setupPeerConnection(stream);

                connectWebSocket(
                    roomId,//kis room mein connect karna hai.
                    (data) => handleSignalingMessage(data, pcRef.current),//message receive hone par kya karna hai.
                    () => {//WebSocket close hone par kya karna hai.
                        setCallStatus((prev) => (prev === CALL_STATUS.IN_CALL ? CALL_STATUS.ENDED : prev));
                    },
                );
            } catch (err) {
                console.error("Camera/Mic error:", err.message);
                toast.error("Camera/Mic access failed");
            }
        };

        init();

        return () => {
            cancelled = true;
            stopRecording();
            endCallCleanup(wsRef, pcRef, localStreamRef);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    async function handleSignalingMessage(data, pc) {
        console.log("Signaling message received:", data.type);

        switch (data.type) {
            case "joined":
                if (data.reconnected) {
                    isResumingRef.current = true;
                    isCallerRef.current = data.isCaller;
                    setCallStatus(CALL_STATUS.IN_CALL);
                    setConnectionState(CONNECTION_STATE.CONNECTING);
                    toast("Reconnected — resuming your call", { icon: "🔄" });
                } else {
                    isCallerRef.current = data.isCaller;
                    setCallStatus(data.isCaller ? CALL_STATUS.CALLING : CALL_STATUS.WAITING);
                }
                break;
            case "room-full":
                toast.error("Room already has 2 people. Try another Room ID.");
                setCallStatus(CALL_STATUS.ROOM_FULL);
                setTimeout(() => onEndCall(), 1500);
                break;

            case "incoming-call":
                setCallStatus(CALL_STATUS.INCOMING);
                break;

            case "call-accepted":
                setCallStatus(CALL_STATUS.IN_CALL);
                toast.success("Call accepted!");
                {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    sendMessage("offer", { offer, roomId });
                }
                break;

            case "call-rejected":
                setCallStatus(CALL_STATUS.REJECTED);
                toast.error("Call was rejected");
                setTimeout(() => onEndCall(), 1500);
                break;

            case "peer-connection-lost":
                setConnectionState(CONNECTION_STATE.RECONNECTING);
                toast("Other user's connection dropped — waiting to reconnect...", { icon: "🔄" });
                break;

            case "peer-reconnected": {
                toast("Peer reconnected — resuming call...", { icon: "🔄" });
                pcRef.current?.close();

                const stream = localStreamRef.current;
                const newPc = setupPeerConnection(stream);

                const offer = await newPc.createOffer();
                await newPc.setLocalDescription(offer);
                sendMessage("offer", { offer, roomId });
                break;
            }
            

            case "call-ended":
                setCallStatus(CALL_STATUS.ENDED);
                toast("Call ended by other user", { icon: "📴" });
                stopRecording();
                endCallCleanup(wsRef, pcRef, localStreamRef);
                setTimeout(() => onEndCall(), 1200);
                break;

            case "recording-status":
                setRemoteIsRecording(data.isRecording);
                if (data.isRecording) {
                    toast("⚠️ Other user has started recording this call", { icon: "🔴", duration: 4000 });
                } else {
                    toast("Other user stopped recording", { icon: "⏹️" });
                }
                break;

            case "offer":
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                {
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sendMessage("answer", { answer, roomId });
                }
                break;

            case "answer":
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                break;

            case "ice-candidate":
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err.message);
                }
                break;

                 case CHAT_EVENTS.MESSAGE:      // NEW
            case CHAT_EVENTS.HISTORY:      // NEW
            case CHAT_EVENTS.ERROR: 
            case CHAT_EVENTS.TYPING:         // NEW
                chat.handleChatEvent(data);   // NEW
                break; 

            default:
                break;
        }
    }

    const handleAccept = () => {
        sendMessage("call-accept", { roomId });
        setCallStatus(CALL_STATUS.IN_CALL);
        toast.success("Call accepted");
    }; 

    const handleReject = () => {
        sendMessage("call-reject", { roomId });
        setCallStatus(CALL_STATUS.REJECTED);
        stopRecording();
        endCallCleanup(wsRef, pcRef, localStreamRef);
        onEndCall();
    };

    const handleEndCall = () => {
        sendMessage("call-end", { roomId });
        stopRecording();
        endCallCleanup(wsRef, pcRef, localStreamRef);
        onEndCall();
    };

    const toggleMic = () => {
        const newState = toggleAudioTrack(localStreamRef);
        if (newState !== null) {
            setMicOn(newState);
            toast(newState ? "Mic unmuted" : "Mic muted");
        }
    };

    const toggleCamera = () => {
        const newState = toggleVideoTrack(localStreamRef);
        if (newState !== null) {
            setCameraOn(newState);
            toast(newState ? "Camera on" : "Camera off");
        } else {
            toast.error("No camera available");
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
            sendMessage("recording-status", { roomId, isRecording: false });
            toast("Recording stopped — saving file...", { icon: "⏺️" });
        } else {
            if (callStatus !== CALL_STATUS.IN_CALL) {
                toast.error("Recording can only be started during an active call");
                return;
            }
            startRecording();
            sendMessage("recording-status", { roomId, isRecording: true });
            toast("Recording started", { icon: "⏺️" });
        }
    };

    return {
        localVideoRef,
        remoteVideoRef,
        callStatus,
        connectionState,
        elapsed,
        micOn,
        cameraOn,
        isRecording,
        recordedSeconds,
        remoteIsRecording,
        toggleRecording,
        handleAccept,
        handleReject,
        handleEndCall,
        toggleMic,
        toggleCamera,
        chat
    };
} 
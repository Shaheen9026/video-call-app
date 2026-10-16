import { useRef, useState, useCallback } from "react";
import { ICE_SERVERS, CONNECTION_STATE } from "../utils/constants";

// Sirf RTCPeerConnection ka kaam karta hai — setup, tracks attach, ICE candidates,
// connection state tracking. Isko WebSocket ka pata nahi hota; ICE candidate milne
// par sirf `onIceCandidate` callback fire karta hai, use kaise bhejna hai wo caller
// (CallScreen) decide karta hai.
export function useWebRTC({ remoteVideoRef, onIceCandidate }) {
    const pcRef = useRef(null);//pcRef ke andar hum RTCPeerConnection store karenge.
    const [connectionState, setConnectionState] = useState(null);//Connection ki current condition UI mein dikhane ke liye.

    const setupPeerConnection = useCallback(
        (stream) => {
            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;

            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            if (audioTrack) {
                pc.addTrack(audioTrack, stream);
            }

            if (videoTrack) {
                pc.addTrack(videoTrack, stream);//Camera ke video track ko WebRTC connection mein add karna
            } else {
                
                
                pc.addTransceiver("video", { direction: "recvonly" });
            }

            pc.ontrack = (event) => {
                remoteVideoRef.current.srcObject = event.streams[0];
            }; 


            //pc.onicecandidate ka main purpose hai WebRTC connection banane ke liye browser se milne wale ICE candidates ko useCallSignaling tak bhejna, taaki woh WebSocket ke through doosre user tak pahunch sakein.
            pc.onicecandidate = (event) => {
                if (event.candidate) {//Check karo ki browser ko ICE candidate mila hai ya nahi.
                    onIceCandidate?.(event.candidate);
                }

            };
            //Jab WebRTC connection ki state change hogi, ye function automatically chalega.
            pc.onconnectionstatechange = () => {
                const state = pc.connectionState;

                if (state === "connecting" || state === "new") {
                    setConnectionState(CONNECTION_STATE.CONNECTING);
                } else if (state === "connected") {
                    setConnectionState(CONNECTION_STATE.CONNECTED);
                } else if (state === "disconnected") {
                    setConnectionState(CONNECTION_STATE.RECONNECTING);
                } else if (state === "failed" || state === "closed") {
                    setConnectionState(CONNECTION_STATE.DISCONNECTED);
                }
            };

            return pc;
        },
        [remoteVideoRef, onIceCandidate],
    );

    const closePeerConnection = useCallback(() => {
        pcRef.current?.close();
    }, []);

    return { pcRef, setupPeerConnection, connectionState, setConnectionState, closePeerConnection };
}    
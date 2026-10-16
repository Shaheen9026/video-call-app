export function endCallCleanup(wsRef, pcRef, localStreamRef) {
    wsRef.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
}

export function toggleAudioTrack(localStreamRef) {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
    }
    return null;
}

export function toggleVideoTrack(localStreamRef) {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
    }
    return null;
}
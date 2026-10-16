


import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, User } from "lucide-react";
import { getDisplayName, saveDisplayName } from "../../../shared/utils/session";
import { MAX_NAME_LENGTH } from "../../chat/utils/constants";

function JoinScreen({ roomId, setRoomId, onJoin }) {
  const [displayName, setDisplayName] = useState(() => getDisplayName());
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream; //Agar component active hai, toh stream ko useRef mein store kar rahe hain.
        videoRef.current.srcObject = stream;
      } catch {
        setHasCamera(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  //toggleMic function microphone ko ON/OFF karne ka kaam kar raha hai.
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0]; //Ye MediaStream ke andar se audio tracks nikalta hai.
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCamera = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOn(track.enabled);
    }
  };

  const handleJoinClick = () => {
    saveDisplayName(displayName); // empty is fine — chat falls back to "Guest"
    setJoining(true);
    // ek frame paint hone do taaki spinner dikhe, phir parent switch kare
    setTimeout(() => {
      const success = onJoin();
      if (!success) setJoining(false);
    }, 50);
  };

  const initial = roomId.trim() ? roomId.trim().charAt(0).toUpperCase() : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center gap-2 px-6 py-5">
        <span className="w-2.5 h-2.5 rounded-full bg-meet-blue" />
        <span className="text-gray-700 font-medium text-sm">Rooms</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row items-center gap-8 md:gap-14 max-w-3xl w-full"
        >
          {/* camera preview */}
          <div className="relative w-full md:w-26rem aspect-video rounded-xl overflow-hidden bg-meet-tile shadow-md shadow-black/10 flex items-center justify-center">
            {hasCamera && cameraOn ? (
              <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-linear-to-br from-meet-blue to-indigo-500 flex items-center justify-center text-white shadow-md">
                {initial ? <span className="text-xl md:text-2xl font-medium">{initial}</span> : <User size={24} strokeWidth={1.75} />}
              </div>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                onClick={toggleMic}
                className={`p-2.5 rounded-full shadow-sm transition ${micOn ? "bg-white/90 text-gray-800 hover:bg-white" : "bg-meet-red text-white"}`}
              >
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-2.5 rounded-full shadow-sm transition ${cameraOn ? "bg-white/90 text-gray-800 hover:bg-white" : "bg-meet-red text-white"}`}
              >
                {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
            </div>
          </div>

          {/* join panel */}
          <div className="w-full md:w-72">
            <h1 className="text-2xl text-gray-900 font-normal mb-1.5">Ready to join?</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">No one else is here — enter a room code to connect.</p>

            <label htmlFor="displayName" className="block text-sm text-gray-600 mb-2">
              Your name
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="e.g. Rahul"
              value={displayName}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinClick()}
              className="w-full px-4 py-2.5 rounded-md bg-meet-light-surface border border-meet-border text-gray-800 outline-none focus:border-meet-blue focus:ring-1 focus:ring-meet-blue transition-colors mb-4"
            />

            <label htmlFor="roomCode" className="block text-sm text-gray-600 mb-2">
              Room code
            </label>
            <input
              id="roomCode"
              type="text"
              placeholder="e.g. 4f9-1a2-xyz"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinClick()}
              className="w-full px-4 py-2.5 rounded-md bg-meet-light-surface border border-meet-border text-gray-800 outline-none focus:border-meet-blue focus:ring-1 focus:ring-meet-blue transition-colors mb-6"
            />
            <motion.button
              whileHover={{ scale: joining ? 1 : 1.02 }}
              whileTap={{ scale: joining ? 1 : 0.98 }}
              onClick={handleJoinClick}
              disabled={joining}
              className="w-full bg-meet-blue hover:brightness-105 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-full shadow-sm shadow-meet-blue/30 hover:shadow-md transition-shadow flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Joining...
                </>
              ) : (
                "Join now"
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default JoinScreen;
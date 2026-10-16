



import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, PhoneIncoming, User, Circle, Square, MessageSquare } from "lucide-react";
import { CALL_STATUS, CONNECTION_STATE } from "../utils/constants";
//import { CALL_STATUS, CONNECTION_STATE } from "../../../shared/utils/constants";
import { useCallSignaling } from "../hooks/useCallSignaling";
import ChatPanel from "../../chat/components/ChatPanel";
import { countUnreadAfter, getLastServerMessageId } from "../../chat/utils/chatState";
import { loadLastSeenId, saveLastSeenId } from "../../chat/utils/lastSeen";
import { getDisplayName } from "../../../shared/utils/session";
import { playNotificationSound } from "../../chat/utils/sound";

const DOT_COLOR = {
  [CALL_STATUS.WAITING]: "bg-meet-blue",
  [CALL_STATUS.CALLING]: "bg-meet-blue",
  [CALL_STATUS.INCOMING]: "bg-meet-blue",
  [CALL_STATUS.IN_CALL]: "bg-meet-green",
  [CALL_STATUS.REJECTED]: "bg-meet-ink-dim",
  [CALL_STATUS.ENDED]: "bg-meet-ink-dim",
  [CALL_STATUS.ROOM_FULL]: "bg-meet-ink-dim",
};

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function CallScreen({ roomId, onEndCall }) {
  // Saara call logic (WebSocket + WebRTC + media + timer) is ek hook mein hai.
  // Yahan sirf UI hai.
  const {
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
    chat,
  } = useCallSignaling({ roomId, onEndCall, displayName: getDisplayName() });

  // ---- Chat (UI state) ----
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(() => loadLastSeenId(roomId)); // last message the user has seen
  const lastCountRef = useRef(0);

  // Chat is only visible during the call
  const isChatVisible = isChatOpen && callStatus === CALL_STATUS.IN_CALL;

  const lastMessageId = getLastServerMessageId(chat.messages);

  // Badge: messages from the other user that arrived after the last one the user saw.
  // It stays until the user actually opens the chat (also after a refresh).
  const unreadCount = isChatOpen ? 0 : countUnreadAfter(chat.messages, lastSeenId, chat.clientId);

  const closeChat = () => {
    if (lastMessageId) {
      setLastSeenId(lastMessageId);
      saveLastSeenId(roomId, lastMessageId);
    }
    setIsChatOpen(false);
  };

  // While the panel is open, everything on screen counts as seen; remember it so a refresh keeps the badge correct
  useEffect(() => {
    if (isChatOpen && lastMessageId) saveLastSeenId(roomId, lastMessageId);
  }, [isChatOpen, lastMessageId, roomId]);

  // Panel band ho aur dusre ka naya message aaye to chhota toast dikhao
  useEffect(() => {
    const count = chat.messages.length;
    const previous = lastCountRef.current;
    lastCountRef.current = count;

    if (isChatOpen || count !== previous + 1) return;

    const last = chat.messages[count - 1];
    if (last.senderId === chat.clientId) return;

    const preview = last.text.length > 60 ? `${last.text.slice(0, 60)}...` : last.text;
   // toast(`Other user: ${preview}`, { icon: "💬" });
       toast(`${last.senderName || "Other user"}: ${preview}`, { icon: "💬" });

  playNotificationSound();



  }, [chat.messages, chat.clientId, isChatOpen]);

  const statusLabel = {
    [CALL_STATUS.WAITING]: "Waiting for other user to join...",
    [CALL_STATUS.CALLING]: "Calling... waiting for them to accept",
    [CALL_STATUS.INCOMING]: "Incoming call",
    [CALL_STATUS.IN_CALL]: "Connected",
    [CALL_STATUS.REJECTED]: "Call rejected",
    [CALL_STATUS.ENDED]: "Call ended",
    [CALL_STATUS.ROOM_FULL]: "Room is full",
  }[callStatus];

  return (
    <div
      className={`min-h-screen bg-meet-bg flex flex-col transition-[padding] duration-300 ${
        isChatVisible ? "sm:pr-90" : ""
      }`}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-meet-ink-dim text-sm font-mono">{roomId}</span>
        <div className="flex items-center gap-2">
          <motion.span
            animate={callStatus === CALL_STATUS.IN_CALL ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`w-2 h-2 rounded-full ${DOT_COLOR[callStatus]}`}
          />
          <span className="text-meet-ink-dim text-sm">{statusLabel}</span>
        </div>
        <div className="flex items-center gap-3 w-32 justify-end">
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="flex items-center gap-1.5 bg-meet-red/15 text-meet-red px-2.5 py-1 rounded-full text-xs font-semibold"
            >
              <Circle size={8} fill="currentColor" />
              REC {formatTimer(recordedSeconds)}
            </motion.div>
          )}
          <span className="text-meet-ink-dim text-sm font-mono text-right">
            {callStatus === CALL_STATUS.IN_CALL ? formatTimer(elapsed) : ""}
          </span>
        </div>
      </div>

      {/* main stage */}
      <div className="flex-1 flex items-center justify-center px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-meet-tile"
        >
          <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />

          {remoteIsRecording && !isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-medium z-10">
              <Circle size={8} className="text-meet-red" fill="currentColor" />
              Other user is recording this call
            </div>
          )}

          {callStatus === CALL_STATUS.IN_CALL &&
            (connectionState === CONNECTION_STATE.RECONNECTING || connectionState === CONNECTION_STATE.DISCONNECTED) && (
              <div
                className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-medium z-10 ${
                  connectionState === CONNECTION_STATE.RECONNECTING ? "bg-yellow-500/90 text-black" : "bg-meet-red/90 text-white"
                }`}
              >
                {connectionState === CONNECTION_STATE.RECONNECTING ? "Reconnecting..." : "Connection lost"}
              </div>
            )}

          {callStatus !== CALL_STATUS.IN_CALL && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="relative w-20 h-20 rounded-full bg-linear-to-br from-meet-blue to-indigo-500 flex items-center justify-center text-white shadow-lg"
              >
                <User size={32} strokeWidth={1.75} />
                <motion.span
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-meet-blue"
                />
              </motion.div>
              <span className="text-meet-ink-dim text-sm">{statusLabel}</span>
            </div>
          )}

          {/* self view PiP */}
          <div className="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video rounded-lg overflow-hidden bg-meet-surface border border-black/20 shadow-lg">
            <video ref={localVideoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
          </div>
        </motion.div>
      </div>

      {/* incoming call overlay */}
      <AnimatePresence>
        {callStatus === CALL_STATUS.INCOMING && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-meet-bg/90 flex flex-col items-center justify-center gap-6 z-20"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="bg-meet-blue text-white p-5 rounded-full"
            >
              <PhoneIncoming size={28} />
            </motion.div>
            <p className="text-meet-ink text-lg">Incoming call</p>
            <div className="flex gap-6">
              <button
                onClick={handleAccept}
                className="bg-meet-green hover:brightness-110 text-white font-medium px-6 py-3 rounded-full flex items-center gap-2 transition"
              >
                <Phone size={18} /> Accept
              </button>
              <button
                onClick={handleReject}
                className="bg-meet-red hover:brightness-110 text-white font-medium px-6 py-3 rounded-full flex items-center gap-2 transition"
              >
                <PhoneOff size={18} /> Decline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom floating control pill */}
      {callStatus !== CALL_STATUS.INCOMING && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-meet-surface/95 backdrop-blur px-4 py-3 rounded-full shadow-lg transition-[left] duration-300 ${
            isChatVisible ? "sm:left-[calc(50%-11.25rem)]" : ""
          }`} 
        >     
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full transition ${
              micOn ? "bg-meet-tile hover:bg-white/10 text-meet-ink" : "bg-white text-meet-bg hover:bg-gray-200"
            }`}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full transition ${
              cameraOn ? "bg-meet-tile hover:bg-white/10 text-meet-ink" : "bg-white text-meet-bg hover:bg-gray-200"
            }`}
          >
            {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {callStatus === CALL_STATUS.IN_CALL && (
            <button
              onClick={toggleRecording}
              title={isRecording ? "Stop recording" : "Start recording"}
              className={`p-3 rounded-full transition ${
                isRecording ? "bg-meet-red text-white animate-pulse" : "bg-meet-tile hover:bg-white/10 text-meet-ink"
              }`}
            >
              {isRecording ? <Square size={20} fill="currentColor" /> : <Circle size={20} />}
            </button>
          )}

          {callStatus === CALL_STATUS.IN_CALL && (
            <button
              onClick={() => (isChatOpen ? closeChat() : setIsChatOpen(true))}
              title="Chat"
              className={`relative p-3 rounded-full transition ${
                isChatOpen ? "bg-white text-meet-bg hover:bg-gray-200" : "bg-meet-tile hover:bg-white/10 text-meet-ink"
              }`}
            >
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-meet-red text-white text-xs font-medium flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}

          <button onClick={handleEndCall} className="bg-meet-red hover:brightness-110 text-white px-6 py-3 rounded-full transition">
            <PhoneOff size={20} />
          </button>
        </div>
      )}

      {/* chat panel — sirf call ke time; call khatam to panel bhi hat jaata hai */}
      {callStatus === CALL_STATUS.IN_CALL && (
        <ChatPanel
          isOpen={isChatOpen}
          onClose={closeChat}
          messages={chat.messages}//Chat ki message list
          clientId={chat.clientId}//Current browser ki identity
          isPeerTyping={chat.isPeerTyping}
                    peerName={chat.peerName}//Doosre user ka display name
          onSend={chat.sendChatMessage}
          onRetry={chat.retryMessage}
          onTyping={chat.notifyTyping}//Typing event bhejna
        />
      )}
    </div>
  );
}

export default CallScreen;





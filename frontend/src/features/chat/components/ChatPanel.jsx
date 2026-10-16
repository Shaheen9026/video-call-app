
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

// Right side ka chat panel. Band hone par hatta nahi, sirf screen ke bahar chala jaata hai —
// isse likha hua adhoora message (draft) aur scroll position bani rehti hai.
function ChatPanel({ isOpen, onClose, messages, clientId, isPeerTyping,peerName, onSend, onRetry, onTyping }) {
  const inputRef = useRef(null);

  // Panel khulte hi cursor input box mein (preventScroll: slide animation ke beech page na khisake)
  useEffect(() => {
    if (isOpen) inputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  // Panel khula ho to Esc dabane par band ho jaye
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <motion.aside
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      inert={!isOpen}
      aria-label="In-call messages"
      className="fixed inset-y-0 right-0 z-30 w-full sm:w-90 bg-meet-surface border-l border-white/10 shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-meet-ink font-medium">In-call messages</h2>
        <button
          onClick={onClose}
          title="Close chat"
          aria-label="Close chat"
          className="p-2 rounded-full text-meet-ink-dim hover:bg-white/10 hover:text-meet-ink transition"
        >
          <X size={18} />
        </button>
      </div>

      <MessageList messages={messages} clientId={clientId} onRetry={onRetry} />

      {/* Hamesha jagah rakhte hain, taaki "typing..." aane-jaane par list uchhle nahi */}
      {/* <div className="h-5 px-4 text-xs text-meet-ink-dim">{isPeerTyping ? "Other user is typing..." : ""}</div> */}
      <div className="h-5 px-4 text-xs text-meet-ink-dim">{isPeerTyping ? `${peerName || "Other user"} is typing...` : ""}</div>

      <MessageInput onSend={onSend} onTyping={onTyping} textareaRef={inputRef} />
    </motion.aside>
  );
}

export default ChatPanel;




import { RotateCw } from "lucide-react";
import { MESSAGE_STATUS } from "../utils/constants";
import { formatMessageTime, splitTextWithLinks } from "../utils/helpers";

// Ek message ka dabba. Mera message right side (blue), dusre ka left side (grey).
// showMeta: group ke pehle message par hi naam + time dikhana (Zoom jaisa).
function MessageBubble({ message, isMine, showMeta, onRetry }) {
  const isSending = message.status === MESSAGE_STATUS.SENDING;
  const isFailed = message.status === MESSAGE_STATUS.FAILED;

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      {showMeta && (
        <div className="flex items-baseline gap-2 mb-1 px-1">
          {/* <span className="text-meet-ink text-xs font-medium">{isMine ? "You" : "Other user"}</span> */}
          <span className="text-meet-ink text-xs font-medium">{isMine ? "You" : message.senderName || "Other user"}</span>
          <span className="text-meet-ink-dim text-xs">{formatMessageTime(message.timestamp)}</span>
        </div>
      )}

      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
          isMine ? "bg-meet-blue text-white rounded-br-md" : "bg-meet-tile text-meet-ink rounded-bl-md"
        } ${isSending ? "opacity-60" : ""} ${isFailed ? "ring-1 ring-meet-red" : ""}`}
      >
        {splitTextWithLinks(message.text).map((part, i) =>
          part.type === "link" ? (
            <a key={i} href={part.value} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 break-all hover:opacity-80">
              {part.value}
            </a>
          ) : (
            <span key={i}>{part.value}</span>
          ),
        )}
      </div>

      {isFailed && (
        <button
          onClick={() => onRetry?.(message)}
          className="mt-1 flex items-center gap-1 text-xs text-meet-red hover:underline"
        >
          <RotateCw size={12} /> Failed to send. Retry
        </button>
      )}
    </div>
  );
}

export default MessageBubble;
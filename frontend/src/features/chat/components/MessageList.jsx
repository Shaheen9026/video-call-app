import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import MessageBubble from "./MessageBubble";

// Ek hi bande ke messages itne time ke andar ho to ek group maane jaate hain
const GROUP_WINDOW_MS = 5 * 60 * 1000;
// Neeche se itne pixel ke andar ho to "neeche hi hoon" maana jaata hai
const NEAR_BOTTOM_PX = 80;

// Saare messages ki list. Group ke pehle message par naam + time dikhata hai,
// naya message aane par neeche scroll karta hai — par agar user upar purani chat
// padh raha ho to use kheenchta nahi, "New messages" button dikhata hai.
function MessageList({ messages, clientId, onRetry }) {
  const listRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevLengthRef = useRef(0);
  const [hasNewBelow, setHasNewBelow] = useState(false);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;
    isNearBottomRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // User ne khud scroll kiya — dekho neeche hai ya upar
  const handleScroll = () => {
    const el = listRef.current;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_PX;
    if (isNearBottomRef.current) setHasNewBelow(false);
  };

  useEffect(() => {
    const previousLength = prevLengthRef.current;
    prevLengthRef.current = messages.length;

    // Naya message nahi aaya (sirf status badla, jaise sending -> sent)
    if (messages.length <= previousLength) return;

    const last = messages[messages.length - 1];

    if (previousLength === 0) {
      scrollToBottom("auto"); // pehli baar / refresh ke baad history — seedha neeche
    } else if (last.senderId === clientId || isNearBottomRef.current) {
      scrollToBottom("smooth"); // maine bheja, ya main already neeche tha
    } else {
      setHasNewBelow(true); // upar padh raha hai — kheencho mat, bas batao
    }
  }, [messages, clientId, scrollToBottom]);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={listRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-meet-ink-dim text-xs text-center mt-6 px-4">
            Messages are only visible to people in the call and are deleted when the call ends.
          </p>
        ) : (
          messages.map((message, index) => {
            const prev = messages[index - 1];
            const showMeta =
              !prev ||
              prev.senderId !== message.senderId ||
              message.timestamp - prev.timestamp > GROUP_WINDOW_MS;

            return (
              <div key={message.clientMessageId ?? message.id} className={showMeta ? "mt-3 first:mt-0" : "mt-1"}>
                <MessageBubble
                  message={message}
                  isMine={message.senderId === clientId}
                  showMeta={showMeta}
                  onRetry={onRetry}
                />
              </div>
            );
          })
        )}
      </div>

      {hasNewBelow && (
        <button
          onClick={() => {
            scrollToBottom("smooth");
            setHasNewBelow(false);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-meet-blue text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:brightness-110 transition"
        >
          <ArrowDown size={12} /> New messages
        </button>
      )}
    </div>
  );
}

export default MessageList;    
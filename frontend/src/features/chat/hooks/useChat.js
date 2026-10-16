     
import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
    CHAT_EVENTS,
    MESSAGE_STATUS,
    MAX_MESSAGE_LENGTH,
    SEND_TIMEOUT_MS,
    TYPING_THROTTLE_MS,
    TYPING_EXPIRE_MS,
} from "../utils/constants";
import { applyChatEvent, markMessageFailed } from "../utils/chatState";
import { createClientMessageId } from "../utils/helpers";
import { getOrCreateClientId } from "../../../shared/utils/session";



export function useChat({ send, displayName }) {
    const [messages, setMessages] = useState([]);//saare chat messages ki current list.
    const [isPeerTyping, setIsPeerTyping] = useState(false);// checking  second user is typing or not 
    const [peerName, setPeerName] = useState(null); // learned from the other user's messages/typing
    const [historyCount, setHistoryCount] = useState(0); // refresh ke baad server se aaye messages
    const timersRef = useRef(new Set());//useRef ek Set banata hai jisme active timeout IDs store hote hain.
    const peerTypingTimerRef = useRef(null);//
    const lastTypingSentRef = useRef(0);//Ye last typing event bhejne ka timestamp rakhta hai.
    const clientId = getOrCreateClientId();

    // Hook hatne par (call khatam) baaki bache timers band kar do
    useEffect(() => {
        const timers = timersRef.current;//Active timers wale Set ka reference le liya.
        return () => {
            timers.forEach(clearTimeout);//saare tracked timers cancel karta hai
            timers.clear();
        };
    }, []);

//typing indicator remove
    const clearPeerTyping = useCallback(() => {
        const timer = peerTypingTimerRef.current;
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(timer);
            peerTypingTimerRef.current = null;
        }
        setIsPeerTyping(false);
    }, []);

// Server ka chat event aane par kaam karo (list ka logic chatState.js mein hai)
    //server ke events handle karna
    const handleChatEvent = useCallback(
        (data) => {
            if (data.type === CHAT_EVENTS.TYPING) {
                clearPeerTyping();
                if (data.isTyping === true) {
                    setIsPeerTyping(true);
                    if (data.senderName) setPeerName(data.senderName);
                    const timer = setTimeout(() => {
                        timersRef.current.delete(timer);
                        peerTypingTimerRef.current = null;
                        setIsPeerTyping(false);
                    }, TYPING_EXPIRE_MS);//timer ka kaam hai typing indicator ko 4 seconds baad automatically hide karna,
                    timersRef.current.add(timer);
                    peerTypingTimerRef.current = timer;
                }
                return;
            }

            //Agar server error bhejta hai, to notification dikhayi jayegi.

            if (data.type === CHAT_EVENTS.ERROR) {
                toast.error(data.message || "Message could not be sent");
            }

            // Dusre ka message aa gaya to uska "typing..." hata do, aur naam yaad rakho
            if (data.type === CHAT_EVENTS.MESSAGE && data.message?.senderId !== clientId) {
                clearPeerTyping();
                if (data.message.senderName) setPeerName(data.message.senderName);
            }

            // Purani history kitni badi thi, ye yaad rakho — unread ginti ke liye
            if (data.type === CHAT_EVENTS.HISTORY && Array.isArray(data.messages)) {
                setHistoryCount(data.messages.length);
                const theirLast = [...data.messages].reverse().find((m) => m.senderId !== clientId);
                if (theirLast?.senderName) setPeerName(theirLast.senderName);
            }            

            setMessages((prev) => applyChatEvent(prev, data));
        },
        [clientId, clearPeerTyping],  
    );
//Iska purpose hai kisi specific message ko failed mark karna.
    const failMessage = useCallback((clientMessageId) => {
        setMessages((prev) => markMessageFailed(prev, clientMessageId));
    }, []);

    // Socket par message bhejo. Bheja nahi ja saka to turant failed, aur bhej diya
    // par server ka jawab SEND_TIMEOUT_MS tak nahi aaya to bhi failed.
    const deliver = useCallback(
        (clientMessageId, text) => {
            const sent = send(CHAT_EVENTS.MESSAGE, { text, clientMessageId, displayName });
            if (!sent) {
                failMessage(clientMessageId);
                return;
            }   
//Agar socket par send karna successful hai, timeout set hota hai. Tumhare project mein SEND_TIMEOUT_MS 8 seconds hai.
            const timer = setTimeout(() => {
                timersRef.current.delete(timer);
                failMessage(clientMessageId);
            }, SEND_TIMEOUT_MS);
            timersRef.current.add(timer);
        },
        [send, failMessage, displayName],
    );        

    const sendChatMessage = useCallback(
        (rawText) => {
            const text = rawText.trim();
            if (!text || text.length > MAX_MESSAGE_LENGTH) return false;

            const clientMessageId = createClientMessageId();//Unique ID banana

            //Message list update karna
            setMessages((prev) => [
                ...prev,
                {
                    clientMessageId,
                    senderId: clientId,
                    text,
                    timestamp: Date.now(),
                    status: MESSAGE_STATUS.SENDING,
                },
            ]);
            //Server ko bhejne ka process shuru karna
            deliver(clientMessageId, text);//Ye function message ko WebSocket ke through bhejne ka kaam karta hai.
            return true;
        },
        [clientId, deliver],
    );

    const retryMessage = useCallback(
        (message) => {
            if (message.status !== MESSAGE_STATUS.FAILED) return;

            setMessages((prev) =>
                prev.map((m) =>
                    m.clientMessageId === message.clientMessageId
                        ? { ...m, status: MESSAGE_STATUS.SENDING }
                        : m,
                ),
            );
            deliver(message.clientMessageId, message.text);
        },
        [deliver],
    );

    // Input box mein type karte waqt bulao — dusre ko "typing..." dikhane ke liye
    const notifyTyping = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
        lastTypingSentRef.current = now;
        send(CHAT_EVENTS.TYPING, { isTyping: true, displayName });
    }, [send, displayName]);

    return {
        messages,
        clientId,
        isPeerTyping,
        peerName,
        historyCount,
        handleChatEvent,
        sendChatMessage,
        retryMessage,
        notifyTyping,
    };
}  

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "../utils/constants";

// Limit ka 80% cross hone par hi counter dikhate hain, warna box saaf rehta hai
const COUNTER_SHOW_FROM = Math.floor(MAX_MESSAGE_LENGTH * 0.8);

// Type karne ka box. Enter = send, Shift+Enter = nayi line.
// onSend(text) true lautaye to message chala gaya — tab box khaali karte hain.
function MessageInput({ onSend ,onTyping,textareaRef: externalRef}) {
  const [text, setText] = useState("");
  const internalRef = useRef(null);
   const textareaRef = externalRef ?? internalRef; 

  const length = text.trim().length;
  const isTooLong = length > MAX_MESSAGE_LENGTH;
  const canSend = length > 0 && !isTooLong;


  // Jitna likha utna box lamba ho (max-h-32 tak), phir andar scroll

  const resizeTextarea = () => {
    const el = textareaRef.current;
    //Actual textarea element milta hai.
    if (!el) return;
    //Element nahi mila toh function wahi ruk jaata hai.
    el.style.height = "auto";//Pehle purani height reset hoti hai.
    el.style.height = `${el.scrollHeight}px`;
    //Content ko fit karne ke liye required height deta hai.
  };

  const handleChange = (e) => {
    setText(e.target.value);
    resizeTextarea();
       if (e.target.value.trim()) onTyping?.(); 
  };
//message bhejne ka process start karta hai.
  const handleSend = () => {

    if (!canSend) return;

    if (!onSend(text)) return;

    setText("");

    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.focus();
    }
  }; 

  const handleKeyDown = (e) => {
    // isComposing: Hindi/Japanese jaise input method mein Enter se shabd chunte waqt send na ho
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };



  return ( 
         

    <div className="border-t border-white/10 px-3 py-3">
      <div className="flex items-end gap-2 bg-meet-tile rounded-2xl px-3 py-2 focus-within:ring-1 focus-within:ring-meet-blue">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Send a message"
          aria-label="Message"
          className="flex-1 bg-transparent text-meet-ink text-sm placeholder:text-meet-ink-dim resize-none outline-none max-h-32 overflow-y-auto py-1"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          title="Send"
          aria-label="Send message"
          className={`p-2 rounded-full transition ${
            canSend ? "text-meet-blue hover:bg-white/10" : "text-meet-ink-dim cursor-not-allowed"
          }`}
        >


          <Send size={18} /> 
        </button> 
      </div>

      {length >= COUNTER_SHOW_FROM && (
        <p className={`mt-1 px-2 text-xs text-right ${isTooLong ? "text-meet-red" : "text-meet-ink-dim"}`}>
          {length} / {MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  );
  
} 

export default MessageInput;           

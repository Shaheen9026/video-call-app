
import { useState, useEffect } from "react";
import JoinScreen from "./features/call/components/JoinScreen";

import toast from "react-hot-toast";
import CallScreen from "./features/call/components/CallScreen";

import { clearActiveRoom, saveActiveRoom, getActiveRoom } from "./shared/utils/session";

function App() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const activeRoom = getActiveRoom();
    if (activeRoom) {
      setRoomId(activeRoom);
      setJoined(true);
    }
  }, []);

  const handleJoin = () => {
    if (roomId.trim() === "") {
      toast.error("Please enter a Room ID");
      return false;
    }
    saveActiveRoom(roomId.trim());
    setJoined(true);
    return true;
  };

  const handleEndCall = () => {
    clearActiveRoom();
    setJoined(false);
    setRoomId("");
  };

  return (
    <div>
      {!joined && <JoinScreen roomId={roomId} setRoomId={setRoomId} onJoin={handleJoin} />}
      {joined && <CallScreen roomId={roomId} onEndCall={handleEndCall} />}
    </div>
  );
}

export default App;       
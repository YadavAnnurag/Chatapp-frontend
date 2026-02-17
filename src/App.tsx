import { useEffect, useRef, useState } from "react";

type HomeProps = {
  roomId: string;
  setRoomId: (v: string) => void;
  createRoom: () => void;
  joinRoom: () => void;
};

const HomeScreen = ({
  roomId,
  setRoomId,
  createRoom,
  joinRoom,
}: HomeProps) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-[420px] bg-[#0f0f0f] border border-gray-800 rounded-xl p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-400">Real Time Chat</h1>
        <p className="text-xs text-gray-400">
          temporary room that expires after both users exit
        </p>
      </div>

      <button
        onClick={createRoom}
        className="w-full bg-white text-black py-2 rounded-md text-sm font-medium"
      >
        Create New Room
      </button>

      <div className="flex gap-2">
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room Code"
          className="flex-1 bg-[#1a1a1a] text-sm px-3 py-2 rounded-md outline-none text-gray-400"
        />
        <button
          onClick={joinRoom}
          className="bg-white text-black px-4 rounded-md text-sm font-medium"
        >
          Join Room
        </button>
      </div>
    </div>
  </div>
);


type ChatMessage = {
  text: string;
  senderId: string;
};

type ChatProps = {
  roomId: string;
  message: string;
  setMessage: (v: string) => void;
  messages: ChatMessage[];
  sendMessage: () => void;
  myId: string;
  userCount: number | null;
};


const ChatScreen = ({
  roomId,
  message,
  setMessage,
  messages,
  sendMessage,
  myId,
  userCount,
}: ChatProps) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-[420px] h-[600px] bg-[#0f0f0f] border border-gray-800 rounded-xl flex flex-col text-white">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Real Time Chat</h1>
          <p className="text-xs text-gray-400">Room: {roomId}</p>
        </div>

        <div className="text-xs text-gray-400">
          Users: {userCount ?? "-"}
        </div>
      </div>


      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === myId;

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-1 rounded-lg text-sm max-w-[70%]
          ${isMe ? "bg-white text-black" : "bg-gray-700 text-white"}
        `}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

      </div>

      <div className="p-3 border-t border-gray-800 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#1a1a1a] px-3 py-2 text-sm rounded-md outline-none"
        />
        <button
          type="button"
          onClick={sendMessage}
          className="bg-gray-700 px-4 rounded-md text-sm"
        >
          Send
        </button>
      </div>
    </div>
  </div>
);


function App() {
  const socketRef = useRef<WebSocket | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);



  const myIdRef = useRef(
    Math.random().toString(36).substring(2, 9)
  );

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;

    socket.onopen = () => console.log("connected");
    socket.onclose = () => console.log("disconnected");

    return () => socket.close();
  }, []);

  const [screen, setScreen] = useState<"home" | "chat">("home");
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);



  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "count") {
        setUserCount(data.count);
      }

      if (data.type === "chat") {
        setMessages(prev => [...prev, data.payload]);
      }
    };
  }, []);




  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);

    socketRef.current?.send(
      JSON.stringify({
        type: "join",
        payload: { roomId: id },
      })
    );

    setScreen("chat");
  };

  const joinRoom = () => {
    if (!roomId) return;

    socketRef.current?.send(
      JSON.stringify({
        type: "join",
        payload: { roomId },
      })
    );

    setScreen("chat");
  };





  const sendMessage = () => {
    if (!message) return;

    socketRef.current?.send(
      JSON.stringify({
        type: "chat",
        payload: {
          text: message,
          senderId: myIdRef.current,
        },
      })
    );

    setMessage("");
  };








  return screen === "home" ? (
    <HomeScreen
      roomId={roomId}
      setRoomId={setRoomId}
      createRoom={createRoom}
      joinRoom={joinRoom}
    />
  ) : (
    <ChatScreen
      roomId={roomId}
      message={message}
      setMessage={setMessage}
      messages={messages}
      sendMessage={sendMessage}
      myId={myIdRef.current}
      userCount={userCount}
    />

  );
}

export default App;


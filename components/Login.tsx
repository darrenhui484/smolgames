import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { socketAtom } from "../store";

export default function Lobby() {
  const router = useRouter();
  const [socket, setSocket] = useAtom(socketAtom);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const roomIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (socket == null) return;
    if (socket.connected) {
      console.log(`already connected: ${socket.id}`);
    } else {
      socket.on("connect", () => {
        console.log(`connected: ${socket.id}`);
      });
    }
  }, [socket]);

  function onClickStart() {
    try {
      validateInput();
      goToGameRoomPage();
    } catch (error) {
      alert(error);
    }
  }

  function validateInput() {
    if (!socket) throw new Error("no socket");
    if (
      usernameInputRef.current!.value === "" ||
      usernameInputRef.current!.value.length > 20
    )
      throw new Error("invalid username: must be less than 20 characters");
    if (roomIdInputRef.current!.value === "") throw new Error("invalid roomId");
  }

  function goToGameRoomPage() {
    router.replace({
      pathname: "/game-room",
      query: {
        username: usernameInputRef.current!.value,
        roomId: roomIdInputRef.current!.value,
      },
    });
  }

  return (
    <div>
      <h1>Hanabi</h1>

      <form>
        <label>
          Name
          <input ref={usernameInputRef} placeholder="Username" />
        </label>

        <label>
          Room ID
          <input ref={roomIdInputRef} placeholder="Room Number" />
        </label>

        <div>
          <button onClick={onClickStart}>Start</button>
        </div>
      </form>
    </div>
  );
}

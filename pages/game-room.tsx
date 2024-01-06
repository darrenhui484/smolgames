import { useAtom } from "jotai";
import { socketAtom } from "../store";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function GameRoom() {
  const [socket, setSocket] = useAtom(socketAtom);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const roomId = router.query.roomId;
    const username = router.query.username;

    socket.emit("join", roomId, username);
  }, [router.isReady]);

  return (
    <div>
      <h1>Game Room</h1>
    </div>
  );
}

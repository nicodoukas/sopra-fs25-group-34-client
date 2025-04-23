
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type OnMessageCallback = (message: string) => void;

export const connectWebSocket = (onMessageCallback: OnMessageCallback, gameId: string | string[] | undefined) => {
  const client = new Client({
    webSocketFactory: () => new SockJS(`https://sopra-fs25-group-34-server.oa.r.appspot.com/ws`),
    connectHeaders: {
    },
    onConnect: () => {
      console.log("Connected to WebSocket");
      client.subscribe(`/games/${gameId}`, (message) => {
        console.log("Message received", message.body);
        onMessageCallback(message.body);
      });
    },
    onStompError: (error) => {
      console.error("STOMP error", error);
    },
    reconnectDelay: 5000,
  });

  client.activate();
  return client
};

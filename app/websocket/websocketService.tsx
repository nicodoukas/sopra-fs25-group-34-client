
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type OnMessageCallback = (message: string) => void;

export const connectWebSocket = (onMessageCallback: OnMessageCallback, gameId: string | string[] | undefined) => {
  const isLocalhost = window.location.hostname === "localhost";
  const socketUrl = isLocalhost
    ? "http://localhost:8080/ws"
    : "https://backendv2-dot-sopra-fs25-group-34-server.oa.r.appspot.com/ws";
  const client = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
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

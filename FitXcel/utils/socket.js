import io from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:4000", {
      transports: ["websocket", "polling"],
      forceNew: false, 
      autoConnect: true,
    });
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
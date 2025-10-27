import io from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io("https://fitxcel.onrender.com", {
      transports: ["websocket"],
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
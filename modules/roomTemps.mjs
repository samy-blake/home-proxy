import { WebSocketServer } from "ws";

export function roomTemps() {
  const homeWss = new WebSocketServer({
    port: 8080,
    verifyClient: (info) => {
      if (
        Object.hasOwnProperty.call(
          info.req.headers,
          process.env.SOCKET_ROOM_TEMPS_HEADER_NAME
        ) &&
        info.req.headers[process.env.SOCKET_ROOM_TEMPS_HEADER_NAME] ===
          process.env.SOCKET_ROOM_TEMPS_HEADER_VALUE
      ) {
        return true;
      }

      return false;
    },
  });
  const clientWss = new WebSocketServer({
    port: 8000,
    verifyClient: (info) => {
      return true;
    },
  });
  const homeWssClients = {};

  homeWss.on("connection", (ws, req) => {
    const origin = req.headers.origin;
    homeWssClients[origin] = ws;
    ws.on("error", console.error);
    ws.on("close", () => {
      homeWssClients[origin] = null;
      console.log(new Date(), "close connection:", origin);
    });

    ws.on("message", (data) => {
      console.log("received: %s", data);
    });

    console.log(new Date(), "new connection:", origin);
  });

  clientWss.on("connection", (ws, req) => {
    ws.on("error", console.error);

    ws.on("message", (data) => {
      let paredData = null;
      try {
        paredData = JSON.parse(data);
      } catch (e) {
        console.log(e);
      }
      if (!paredData.action || !paredData.room) {
        return;
      }
      if (
        Object.hasOwnProperty.call(homeWssClients, paredData.room) &&
        homeWssClients[paredData.room]
      ) {
        homeWssClients[paredData.room].send(
          JSON.stringify({
            action: paredData.action,
          })
        );
        homeWssClients[paredData.room].on("message", (data) => {
          ws.send(data);
        });
      }

      console.log("received: %s", data);
    });
  });
}

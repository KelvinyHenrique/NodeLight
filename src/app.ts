import express, { Request, Response } from "express";
import http from "http";
import path from "path";
import { Server as SocketIOServer, Socket } from "socket.io";
import mqtt, { IClientSubscribeOptions } from "mqtt";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

type User = {
  id: string;
  remoteAddress: string;
};

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
const client = mqtt.connect("mqtt://broker.emqx.io:1883");
const mqttTopic = "qwgsdfgf8672348602436qe/office/light";
let mqttConnected = false;
let currentLightColor = "#000000";
let connectedUsers:User[] = [];

app.get("/", (req: Request, res: Response) => {
  const filePath = path.join(__dirname, "../public/index.html");
  res.sendFile(filePath);
});

client.on("connect", () => {
  const options: IClientSubscribeOptions = {
    qos: 0
  };
  client.subscribe(mqttTopic, options, (err) => {
    if (!err) {
      console.log("Connected to MQTT");
    }
  });
  mqttConnected = true;
});

io.on("connection", (socket: Socket) => {
  console.log(`Client connected: ${socket.id} from ${socket.handshake.address}`);
    const user = {
      id: socket.id,
      remoteAddress: socket.handshake.address,
    };

  connectedUsers.push(user);
  socket.on("light-change", (msg: any) => {
    if (mqttConnected) {
      client.publish(mqttTopic, msg);
      io.sockets.emit("light-change", msg);
      console.log("Sent light color to MQTT");
      // Save the current light color
      currentLightColor = msg;
    }
    
  });

  socket.on("get-light-color", () => {
    if (mqttConnected) {
      socket.emit("light-change", currentLightColor);
      console.log("Sent light color to client");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    connectedUsers = connectedUsers.filter((user) => user.id !== socket.id);
    io.sockets.emit("connected-new-user", JSON.stringify(connectedUsers));
  });

  socket.on("get-connected-users", () => {
    console.log("Sending connected users to client");
    
      io.sockets.emit("connected-new-user", JSON.stringify(connectedUsers));
  });
    
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on 'http://localhost:${PORT}'`);
});

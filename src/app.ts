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

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
const client = mqtt.connect("mqtt://broker.emqx.io:1883");
const mqttTopic = "qwgsdfgf8672348602436qe/office/light";
let mqttConnected = false;

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
  socket.on("light-change", (msg: any) => {
    if (mqttConnected) {
      client.publish(mqttTopic, msg);
      io.sockets.emit("light-change", msg);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on 'http://localhost:${PORT}'`);
});

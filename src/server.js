const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const mqtt = require("mqtt");

const io = new Server(server);

const client = mqtt.connect("mqtt://broker.emqx.io:1883");
let mqttConnected = false;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

client.on("connect", function () {
  client.subscribe("qwgsdfgf8672348602436qe/office/light", function (err) {
    if (!err) {
      console.log("connected to mqtt");
    }
  });
  mqttConnected = true;
});

io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    if (mqttConnected) {
      client.publish("qwgsdfgf8672348602436qe/office/light", msg);
    }
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});

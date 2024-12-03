const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + "/public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("find_partner", () => {
    if (waitingUser) {
      // Pair the users
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      waitingUser.emit("message", "You are now connected to a random user.");
      socket.emit("message", "You are now connected to a random user.");

      waitingUser = null;
    } else {
      // Wait for a partner
      waitingUser = socket;
      socket.emit("message", "Waiting for a random user to join...");
    }
  });

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    if (socket.partner) {
      socket.partner.emit("message", "The other user has disconnected.");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

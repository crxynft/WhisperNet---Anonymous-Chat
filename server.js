const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 9002;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/socket.io/socket.io.js", (req, res) => {
  res.sendFile(
    path.join(__dirname, "node_modules/socket.io/client-dist/socket.io.js"),
  );
});

const users = new Map();

app.get("/", (req, res) => {
  res.render("chat");
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  io.emit("userCount", io.engine.clientsCount);

  socket.on("userId", (userId) => {
    console.log(`User ID ${userId} associated with socket ${socket.id}`);
    users.set(socket.id, userId);
  });

  socket.on("chatMessage", (msgText) => {
    const userId = users.get(socket.id) || `User#${socket.id.substring(0, 4)}`;
    console.log(`Message from ${userId}: ${msgText}`);

    if (typeof msgText === "string" && msgText.trim().length > 0) {
      const messageData = {
        id: uuidv4(),
        user: userId,
        text: msgText.trim(),
        timestamp: Date.now(),
      };
      io.emit("chatMessage", messageData);
    } else {
      console.log(
        `Received invalid message format or empty message from ${userId}`,
      );
    }
  });

  socket.on("disconnect", () => {
    const userId = users.get(socket.id);
    console.log(`User ${userId || socket.id} disconnected`);
    users.delete(socket.id);
    io.emit("userCount", io.engine.clientsCount);
  });

  socket.on("error", (err) => {
    console.error(
      `Socket Error from ${users.get(socket.id) || socket.id}:`,
      err.message,
    );
  });
});

server.listen(PORT, () => {
  console.log(`WhisperNet server running on http://localhost:${PORT}`);
});

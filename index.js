const express = require("express");
const app = express();
const cors = require('cors');
const socketio = require("socket.io");
const http = require("http");

const server = http.createServer(app);
const socketCors = { cors: { origin: "*" } };
const io = socketio(server, socketCors) || 8080;

const roomRoutes = require("./routes/roomRoutes");
const initListeners = require("./listeners/initListeners");

require('dotenv').config()
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

initListeners(io);

app.use('/room', roomRoutes);

server.listen(PORT, () => { console.log(`Server has started on ${PORT}`) })
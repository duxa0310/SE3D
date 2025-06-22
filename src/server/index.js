const http = require("http");
const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const path = require("path");
const mongodb = require("mongodb");

const app = express();
const port = 8080;
const dbUrl = "mongodb://localhost:27017";

app.use(logger("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(
  "/socket.io",
  express.static(__dirname + "/../../node_modules/socket.io/client-dist"),
);

const server = http.createServer(app);
const io = new Server(server);

/* Database handle */

const clients = []; // Sockets list

class Message {
  username;
  message;

  constructor(username, message) {
    this.username = username;
    this.message = message;
  }
}

let messages = [];

class User {
  username;
  hp;
  coins;
  constructor(username) {
    this.username = username;
    this.hp = 102;
    this.coins = 0;
  }
}

let users = [];
function userGetByName(username) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].name == username) {
      return users[i];
    }
  }
  return new User("user");
}

function getUserNoByName(username) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].username == username) {
      return i;
    }
  }
  return 0;
}

/* App handle */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/../../dist/auth.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "/../../dist/game.html"));
});

app.use(express.static("dist"));

const playersMap = {};

app.post("/auth", async (req, res) => {
  const username = req.body.username;

  if (!username) {
    res.json({
      success: false,
      error: "Username required",
    });
  } else if (username.length < 3) {
    res.json({
      success: false,
      error: "Username must be at least 3 characters",
    });
  } else if (playersMap[username] && playersMap[username].online == true) {
    res.json({
      success: false,
      error: "You are already in the game!",
    });
  } else {
    res.json({ success: true });
  }
});

io.on("connection", (socket) => {
  clients.push(socket);
  console.log(`Client connected to site with socket id: ${socket.id}`);

  socket.on("setUsername", (username) => {
    socket.username = username;
    playersMap[socket.username] = {};
    playersMap[socket.username].online = true;
    console.log(`Player ${username} connected to game`);
  });

  socket.on("getMessages", () => {
    socket.emit("printMessages", messages)
  });

  socket.on("getUserInfo", (username) => {
    users.push(new User(username));
    socket.emit("printUsersInfo", users);
    for (let client of clients) {
      if (client.username != username) {
        client.emit("printNewUserInfo", users[users.length - 1]);
      }
    }
  });

  socket.on("updatePlayerData", (playerStr) => {
    const playerObj = JSON.parse(playerStr);
    playersMap[playerObj.name] = playerObj.data;
    for (let client of clients) {
      client.emit("getServerData", JSON.stringify(playersMap));
    }
  });

  socket.on("sendMessage", (username, message) => {
    messages.push(new Message(username, message));
    console.log(`User ${username} sent a message: ${message}`);
    for (let client of clients) {
      if (client.username != username) {
        client.emit("getMessage", messages);
      }
    }
  });

  socket.on("bulletCollision", (obj) => {
    for (let client of clients) {
      if (client.username == obj.target) {
        let targetNo = getUserNoByName(obj.target);
        users[targetNo].hp -= 30;
        if (users[targetNo].hp < 0) {
          users.splice(targetNo, 1);
          //playersMap[users[targetNo].username].online = false;
          client.emit("defeat");
        }
        else {
          client.emit("getHit", users);
        }
      }
      else if (client.username == obj.shooter) {
        let shooterNo = getUserNoByName(obj.shooter);
        users[shooterNo].coins += 18;
        if (users[shooterNo].coins > 102) {
          users.splice(shooterNo, 1);
          //playersMap[users[shooterNo].username].online = false;
          client.emit("victory");
        }
        else {
          client.emit("hitPlayer", users);
        }
      }
      client.emit("updateUsersData", users);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected with id: ${socket.id}`);
    playersMap[socket.username].online = false;
    const index = clients.indexOf(socket);
    if (index > -1) {
      clients.splice(index, 1);
    }
  });
});

server.listen(port, () => {
  console.log(`Server started: ${JSON.stringify(server.address())}`);
});
import * as mth from "./mth/mth.ts";
import * as anim from "./anim/anim.ts";
import * as time from "./anim/timer.ts";
import * as input from "./anim/input.ts";
import { Pane } from "tweakpane";
import { getRenderContext } from "./anim/rnd/rnd.ts";

export let socket;
export let username;
let message = "";
let prev_message = "";

function leave() {
  window.location.href = '/';
}

async function main() {
  username = localStorage.getItem('username');
  if (!username) {
    window.location.href = '/';
  }

  window.addEventListener("load", function () {
    socket = io();

    socket.on("connect", () => {
      console.log("Connected with ID:", socket.id);
      socket.emit("getMessages");
      socket.emit('setUsername', username);
      socket.emit("getUserInfo", username);
    });

    socket.on("printMessages", function (messages) {
      for (let i = 0; i < messages.length; i++) {
        prev_message += messages[i].username + ": " + messages[i].message;
        if (i < messages.length - 2 && messages[i].username != username)
          prev_message += "\n";
      }
      printPrevMessages(prev_message);
    });

    socket.on("printUsersInfo", function (users) {
      printUsersInfo(users);
    });

    socket.on("printNewUserInfo", function (user) {
      printNewUserInfo(user);
    });

    socket.on("getServerData", (serverStr) => {
      const serverData = JSON.parse(serverStr);
      const map = new Map();
      for (let property in serverData) {
        //if (property != username)
        map.set(property, serverData[property]);
      }
      anim.setPlayersMap(map);
    });

    socket.on("getMessage", (messages) => {
      if (messages.length - 1 < 0) {
        prev_message = "";
      }
      else {
        prev_message = messages[messages.length - 1].username + ": " + messages[messages.length - 1].message + "\n";
      }
      printPrevMessages(prev_message);
      console.log(`Got message from another client`)
    });

    socket.on("getHit", (users) => {
      updateUsersInfo(users);
      //console.log(`You got hit by ${obj.shooter}! GG!`);
      //leave();
    });

    socket.on("hitPlayer", (users) => {
      updateUsersInfo(users);
      //console.log(`You got hit by ${obj.shooter}! GG!`);
      //leave();
    });

    socket.on("defeat", () => {
      //socket.emit("getRidOfUser", user);
      leave();
    });

    socket.on("victory", () => {
      leave();
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });

  });
  console.log(mth.degreesToRadians(180));
  window.canvas = document.getElementById("webgl-canvas");
  window.gl = canvas.getContext("webgl2");

  await anim.animInit();
  systemHTMLInit();
  systemResponse();
}

let pane, tab;
const tweakContext = {
  fps: 1847.30,
  chat: "",
  input: "",
  info: "",
  users: "",
};

function systemHTMLInit() {
  let tc = time.getTimeContext();

  pane = new Pane({
    title: 'INFO & CHAT',
    expanded: true,
  });

  tweakContext.fps = tc.fps;

  tab = pane.addTab({
    pages: [
      { title: 'Info' },
      { title: 'Chat' },
    ],
  });

  const f1 = tab.pages[0].addFolder({
    title: 'Technical info',
  });
  f1.addBinding(tweakContext, 'fps', {
    readonly: true,
    multiline: true,
    rows: 5,
  });

  const f2 = tab.pages[0].addFolder({
    title: 'Users',
  });
  f2.addBinding(tweakContext, 'users', {
    readonly: true,
    multiline: true,
    rows: 5,
  });

  tab.pages[1].addBinding(tweakContext, 'chat', {
    readonly: true,
    multiline: true,
    rows: 7,
  });

  tab.pages[1].addBinding(tweakContext, 'input', {
    readonly: false,
    interval: 10,
  });

  const btn = tab.pages[1].addButton({
    title: 'Send a message',
  });

  /* if (tweakContext.input[tweakContext.input - 1].charCodeAt == 13) {
    btn.click();
  } */

  btn.on('click', () => {
    message = tweakContext.input;
    tweakContext.chat += username + ': ' + message + '\n';
    tweakContext.input = "";
    socket.emit("sendMessage", username, message);
  });
}

function printPrevMessages(prev_msg) {
  if (prev_msg != "") {
    tweakContext.chat += prev_msg;
  }
}

function printUsersInfo(users) {
  for (let user of users) {
    tweakContext.users += user.username + ". hp: " + user.hp + ". coins: " + user.coins + "\n";
  }
}

function printNewUserInfo(user) {
  tweakContext.users += user.username + ". hp: " + user.hp + ". coins: " + user.coins + "\n";
}

function updateUsersInfo(users) {
  tweakContext.users = "";
  for (let user of users) {
    tweakContext.users += user.username + ". hp: " + user.hp + ". coins: " + user.coins + "\n";
  }
}

function systemResponse() {
  anim.animRender();
  socket.emit("updatePlayerData", JSON.stringify({
    name: username,
    data: {
      online: true,
      loc: anim.getAnimContext().playerPos,
      dir: anim.getAnimContext().playerDir,
    }
  }));
  window.requestAnimationFrame(systemResponse);
}

main();
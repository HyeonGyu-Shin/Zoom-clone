const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room: ${roomName}`;
    const messageForm = room.querySelector("#message");
    const nicknameForm = room.querySelector("#nickname");
    messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = messageForm.querySelector("input");
        socket.emit("new_message", input.value, roomName, () => {
            addMessage(`You: ${input.value}`);
            input.value = "";
        });
    });
    nicknameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = nicknameForm.querySelector("input");
        socket.emit("nickname", input.value, roomName, () => {
            input.value = "";
        });
    });
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", { payload: input.value }, showRoom);
    roomName = input.value;
    input.value = "";
});

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount}) `;
    addMessage(`${user} arrived!`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount}) `;
    addMessage(`${left} left ㅠㅠ`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if (rooms.length === 0) {
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.appendChild(li);
    });
});

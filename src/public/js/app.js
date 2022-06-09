const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
            (device) => device.kind === "videoinput"
        );
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstranis = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstrains = {
        audio: true,
        video: {
            deviceId: {
                exact: deviceId,
            },
        },
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstranis
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

muteBtn.addEventListener("click", () => {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));

    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "mute";
        muted = false;
    }
});

cameraBtn.addEventListener("click", () => {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));

    if (cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
});

camerasSelect.addEventListener("input", async () => {
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        console.log(videoSender);
        videoSender.replaceTrack(videoTrack);
    }
});

// welcome Form (join a room)

const welcome = document.getElementById("welcome");

const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

welcomeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
});

// Socket code

socket.on("welcome", async () => {
    console.log("someone joined");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    console.log("sent the answer");
    socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: ["stun:ntk-turn-2.xirsys.com"] },
            {
                username:
                    "2YV1RJYyMMqZ20_4LWKXsRdiuDsXrphzDJW5VALOIyQUXF9BqMLJxsRSiIP4fjb3AAAAAGKiFxJya3JrZGxka2Q=",
                credential: "10d092d6-e80c-11ec-852e-0242ac120004",
                urls: [
                    "turn:ntk-turn-2.xirsys.com:80?transport=udp",
                    "turn:ntk-turn-2.xirsys.com:3478?transport=udp",
                    "turn:ntk-turn-2.xirsys.com:80?transport=tcp",
                    "turn:ntk-turn-2.xirsys.com:3478?transport=tcp",
                    "turns:ntk-turn-2.xirsys.com:443?transport=tcp",
                    "turns:ntk-turn-2.xirsys.com:5349?transport=tcp",
                ],
            },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", (data) => {
        console.log("sent candidate");
        socket.emit("ice", data.candidate, roomName);
    });
    myPeerConnection.addEventListener("addstream", (data) => {
        console.log(`Peer's stream ${data.stream}`);
        const peerStream = document.getElementById("peerStream");
        peerStream.srcObject = data.stream;
    });
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

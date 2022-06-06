import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public/", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http server");

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "ANON";
    console.log(`Connected to Browser ✓`);
    socket.on("close", () => console.log("Disconnected from Browser 𐄂"));
    socket.on("message", (message) => {
        const { type, payload } = JSON.parse(message);
        switch (type) {
            case "new_message":
                sockets.forEach((sc) =>
                    sc.send(`${socket.nickname} : ${payload}`)
                );
                break;
            case "nickname":
                console.log(payload);
                socket["nickname"] = payload;
            default:
                break;
        }
    });
});

server.listen(3000, handleListen);

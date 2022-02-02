const uniqid = require("uniqid");
const { uniqueNamesGenerator, adjectives, animals, NumberDictionary } = require('unique-names-generator');

const initGame = require("../events/initGame");
const { findRoom, addUserToRoom, removeUserFromRoom, getUsersInRoom, getPlayerLimit, userDisconnectedDuringGame, getAllMessagesFromRoom, getPhase, killRoom } = require("../data/roomData");
const { sendMessage, leaderVote, gambleChoice, abdicateVote, hostagePick } = require("./gameListeners");
const updatePlayers = require ("../utils/updatePlayers");

module.exports = (io) => {

    io.on("connection", (socket) => {
        const thisUserId = uniqid(); // assign an id for this connection
        let joinRoomId; // keeps track of the room connection wants to join

        let lobbyTimer; // a timer to keep track of things, scope needs to be up here to prevent multiple lobby timers
    
        socket.on("requestJoin", async ({ roomId }) => {
            console.log(`Someone requested to join room ${roomId}`);
            
            const foundRoom = await findRoom(roomId);
            if (foundRoom)
            {
                const gotPhase = await getPhase(roomId);
                const gotPlayerLimit = await getPlayerLimit(roomId);                
                
                let clientsConnected;
                io.sockets.adapter.rooms.get(roomId) ? // sets become undefined when they have no value which becomes a problem when getting size
                clientsConnected = io.sockets.adapter.rooms.get(roomId).size : 
                clientsConnected = 0;

                
                if (gotPlayerLimit == clientsConnected) {
                    socket.emit("roomFull");
                    socket.disconnect(); // just disconnect
                } else if (gotPhase === "Game Over") {
                    socket.emit("roomOver"); 
                    socket.disconnect(); // just disconnect
                } else if (gotPhase === "Lobby Phase") {
                    socket.emit("roomExists", { userId:thisUserId }); // let the client know its userid
                } else {
                    socket.emit("roomIsInProgress");
                    socket.disconnect(); // just disconnect if they try to join a room in progress
                }
            } else {
                socket.emit("roomIsInvalid");
                socket.disconnect(); // just disconnect if they try to join a non existent room
            }
        })

        socket.on("join", async ({ roomId, userId }) => {
            if (thisUserId === userId) {
                const numberDictionary = NumberDictionary.generate({ min: 10, max: 99 });
                const newName = uniqueNamesGenerator({ dictionaries: [adjectives, animals, numberDictionary], style: 'capital', length:3, separator:"" }); // asign random name
                let currentPlayerCount; // keep track of player count

                await addUserToRoom({ _id: userId, socketId:socket.id, name:newName }, roomId); // add user to database

                console.log(`${newName} has joined room ${roomId}`);
                joinRoomId = roomId;

                socket.join(`${roomId}`)

                const gotAllMessagesFromRoom = await getAllMessagesFromRoom(roomId);
                
                const trimmedMessageList = gotAllMessagesFromRoom.map((element) => {
                    return {userName: element.userName, text: element.message, phase:element.phase} // trim the message list for client
                })
                socket.emit("oldMessageList", trimmedMessageList)

                let gotUsersInRoom= await getUsersInRoom(roomId);
                currentPlayerCount = gotUsersInRoom.length;

                let clientsConnected;
                io.sockets.adapter.rooms.get(roomId) ? // sets become undefined when they have no value which becomes a problem when getting size
                clientsConnected = io.sockets.adapter.rooms.get(roomId).size : 
                clientsConnected = 0;

                updatePlayers(io, socket, gotUsersInRoom);
                const updateInterval = setInterval(async () => {
                    gotUsersInRoom = await getUsersInRoom(roomId);
                    Array.isArray(gotUsersInRoom) ? updatePlayers(io, socket, gotUsersInRoom) : clearInterval(updateInterval); // if the database is causing problems or doesnt exist anymore, clear
                }, 1000)

                const gotPhase = await getPhase(roomId);
                socket.emit("phaseChange", gotPhase);

                if (gotPhase === "Lobby Phase") {
                    if (currentPlayerCount !== clientsConnected) {
                        console.log("database player count: "+ currentPlayerCount);
                        console.log("socket client count: "+ clientsConnected);
                        console.log("Database desynced (on join)");
                    }

                    const gotPlayerLimit = await getPlayerLimit(roomId);

                    if (clientsConnected == gotPlayerLimit) { // once we have enough players start counting down
                        let countDownTimer = 31;
                        lobbyTimer = setInterval(()=> { // this setinterval is within the scope of this INDIVIDUAL connection
                            countDownTimer--;
                            io.to(`${roomId}`).emit("timerRunning", true);
                            io.to(`${roomId}`).emit("timerUpdate", countDownTimer);

                            io.sockets.adapter.rooms.get(roomId) ? // sets become undefined when they have no value
                            clientsConnected = io.sockets.adapter.rooms.get(roomId).size : 
                            clientsConnected = 0;

                            if (clientsConnected <= (gotPlayerLimit - 1)) { // if we don't have enough players, stop the countdown
                                io.to(`${roomId}`).emit("timerRunning", false);
                                clearInterval(lobbyTimer);
                            } else if (countDownTimer < 0) {
                                io.to(`${roomId}`).emit("timerRunning", false);
                                clearInterval(lobbyTimer);
                                initGame(io, roomId, gotPhase);
                            }
                        }, 1000)
                    }
                }
            } else {
                socket.disconnect(); // if the userId doesn't match for some reason, just disconnect
            }
        })

        // game listeners;
        sendMessage(io, socket);
        leaderVote(io, socket);
        gambleChoice(io, socket);
        abdicateVote(io, socket);
        hostagePick(io, socket);
    
        // when this connection disconnects
        socket.on("disconnect", async () => {
            let currentPlayerCount; // keep track of player count
            const foundRoom = await findRoom(joinRoomId);

            if (foundRoom) { // make sure room exists before doing all this
                const gotPhase = await getPhase(joinRoomId);

                if (gotPhase === "Lobby Phase") { // only remove the player from room if it's lobby phase
                    await removeUserFromRoom(thisUserId, joinRoomId);

                    console.log(`${thisUserId} left ${joinRoomId}`);
                    const gotUsersInRoom = await getUsersInRoom(joinRoomId);

                    currentPlayerCount = gotUsersInRoom.length;

                    let clientsConnected;
                    io.sockets.adapter.rooms.get(joinRoomId) ? // sets become undefined when they have no value
                    clientsConnected = io.sockets.adapter.rooms.get(joinRoomId).size : 
                    clientsConnected = 0;

                    if (currentPlayerCount !== clientsConnected) { 
                        console.log("database player count: "+ currentPlayerCount);
                        console.log("socket client count: " + (clientsConnected)); 
                        console.log("Database desynced (on disconnect)");
                    }

                    if (clientsConnected === 0) {
                        io.in(`${joinRoomId}`).disconnectSockets();
                        await killRoom(joinRoomId); // kill the room in the database (better to archived it, will be done in the future)
                    }
                } else { // if player disconnected while the game is already in session
                    await userDisconnectedDuringGame(thisUserId, joinRoomId);
                }
            }
        })
    
    })

}
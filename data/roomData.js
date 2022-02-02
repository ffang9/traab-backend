const { getClient } = require("./dbConnect");

// writing promises here seems to be a bit faster than writing async/await
const findRoom = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { _id:1 } })))
    .catch(error => (`Error: ${error}`));
}

const createRoom = (newRoom) => {
    newRoom.players = [];
    newRoom.messages = [];
    newRoom.phase = "Lobby Phase";

    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").insertOne(newRoom)))
    .catch(error => (`Error: ${error}`));
}

const getPhase = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { phase:1 } })))
    .then(result => (result.phase || []))
    .catch(error => (`Error: ${error}`));
}

const setPhase = (phase, roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $set: { phase: phase } })))
    .catch(error => (`Error: ${error}`));
}

const addUserToRoom = (newUser, roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $push: { players: newUser } })))
    .catch(error => (`Error: ${error}`));
}

const removeUserFromRoom = (userId, roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $pull: { players: { _id: userId } } })))
    .catch(error => (`Error: ${error}`));
}

const getUsersInRoom = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { players:1 } })))
    .then(result => (result.players || []))
    .catch(error => (`Error: ${error}`));
}

const getRoundLimit = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { roundLimit:1 } })))
    .then(result => (result.roundLimit))
    .catch(error => (`Error: ${error}`));
}

const getTimerLength = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { timerLength:1 } })))
    .then(result => (result.timerLength))
    .catch(error => (`Error: ${error}`));
}

const getPlayerLimit = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { playerLimit:1 } })))
    .then(result => (result.playerLimit))
    .catch(error => (`Error: ${error}`));
}

const setUsersInRoom = (userData, roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").updateOne({_id: roomId},{ $set: { players: userData } })))
    .catch(error => (`Error: ${error}`));
}

const userDisconnectedDuringGame = (userId, roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").updateOne(
        {_id: roomId},
        { $set: { "players.$[arrayElement].disconnected": true } },
        { arrayFilters: [ { "arrayElement._id": userId } ] }
    )))
    .catch(error => (`Error: ${error}`));
} 

const addMessageToRoom = (newMessage, roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $push: { messages: newMessage } })))
    .catch(error => (`Error: ${error}`));
}

const getAllMessagesFromRoom = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { messages:1 } })))
    .then(result => (result.messages || []))
    .catch(error => (`Error: ${error}`));
}

const killRoom = (roomId) => {
    return getClient()
    .then(client => (client.db("traab_database").collection("roomData").deleteOne({ _id:roomId })))
    .catch(error => (`Error: ${error}`));
}

module.exports = { findRoom, createRoom, getPhase, setPhase, addUserToRoom, removeUserFromRoom, getUsersInRoom, getRoundLimit, getTimerLength, getPlayerLimit, setUsersInRoom, userDisconnectedDuringGame, addMessageToRoom, getAllMessagesFromRoom, killRoom };
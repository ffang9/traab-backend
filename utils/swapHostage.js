const _ = require('lodash');

const { getUsersInRoom, setUsersInRoom} = require("../data/roomData")
const { removeSubroomUsurpVotes, getHostage, removeHostage } = require("../data/gameData") 

const getName = require ("../utils/getName");
 
 module.exports = async (io, roomId, phase) => {
    // swap hostage
    const gotUsersInRoom = await getUsersInRoom(roomId);

    let room1Hostage = await getHostage(1, roomId);
    let room2Hostage = await getHostage(2, roomId);

    if (!room1Hostage) { // if leader never picked a hostage, swap a random person
        const room1PlayerList = gotUsersInRoom.filter((player)=> {
            return player.subroom === 1;
        })
        let randomPlayer; 
        while (!room1PlayerList[randomPlayer] || room1PlayerList[randomPlayer].leader) { // random player to be switched can't be leader
            randomPlayer = _.random(0, room1PlayerList.length - 1);
        }
        room1Hostage = room1PlayerList[randomPlayer]._id;
    }
    if (!room2Hostage) { // if leader never picked a hostage, swap a random person
        const room2PlayerList = gotUsersInRoom.filter((player)=> {
            return player.subroom === 2;
        })
        let randomPlayer; 
        while (!room2PlayerList[randomPlayer] || room2PlayerList[randomPlayer].leader) { // random player to be switched can't be leader
            randomPlayer = _.random(0, room2PlayerList.length - 1);
        }
        room2Hostage = room2PlayerList[randomPlayer]._id;
    }
    
    const room1HostageName = getName(room1Hostage, gotUsersInRoom);
    const room2HostageName = getName(room2Hostage, gotUsersInRoom);
    
    const updatedPlayerList = gotUsersInRoom.map((player)=> {
        if (player._id === room1Hostage) { // send room 1's hostage to room 2
            io.to(player.socketId).emit("assignSubroom", 2); // make sure the client knows what subroom he's in now
            return { ...player, subroom:2 }; // now actually change it
        } else if (player._id === room2Hostage) { // vice versa
            io.to(player.socketId).emit("assignSubroom", 1); // make sure the client knows what subroom he's in now
            return { ...player, subroom:1 }; // now actually change it
        } else {
            return player;
        }
    })
    await removeHostage(1, roomId); // remove the hostage status on players
    await removeHostage(2, roomId);
    await removeSubroomUsurpVotes(1, roomId); // restart all ongoing votes
    await removeSubroomUsurpVotes(2, roomId);
    await setUsersInRoom(updatedPlayerList, roomId);
    io.to(`${roomId}`).emit("message",  { userName:"Event", text:`${room1HostageName} and ${room2HostageName} have been swapped over as hostages.`, phase:phase})

    return updatedPlayerList;
 }
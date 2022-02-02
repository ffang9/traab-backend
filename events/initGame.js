const teamPicker = require("../utils/teamPicker");
const { getTimerLength, setPhase, getUsersInRoom, setUsersInRoom } = require("../data/roomData");
const nextRound = require("./nextRound");

module.exports = async (io, roomId) => {
    let round1Timer;
    io.to(`${roomId}`).emit("phaseChange", "Round 1");
    await setPhase("Round 1", roomId);

    const gotUsersInRoom = await getUsersInRoom(roomId);
    currentPlayerCount = gotUsersInRoom.length;
    clientsConnected = io.sockets.adapter.rooms.get(roomId).size;

    if (currentPlayerCount === clientsConnected) {

        pickedTeams = teamPicker(currentPlayerCount);
                
        const updatedPlayerList = gotUsersInRoom.map((player, index)=> {
            const team = pickedTeams[index][0] === 0 ? "Blue" : pickedTeams[index][0] === 1 ? "Red" : "Neutral";
            const role = 
            team === "Blue" && pickedTeams[index][1] === 1 ? "President" : 
            team === "Red" && pickedTeams[index][1] === 1 ? "Bomber" :
            team === "Neutral" ? "Gambler" :
            "Citizen";
            const subroom = pickedTeams[index][2];

            io.to(player.socketId).emit("assignTeam", team);
            io.to(player.socketId).emit("assignRole", role);
            io.to(player.socketId).emit("assignSubroom", subroom);
            return { ...player, team: team, role:role, subroom:subroom };
        })
        await setUsersInRoom(updatedPlayerList, roomId);

        const trimmedPlayerList = updatedPlayerList.map((element) => {
            return { _id:element._id, userName: element.name, subroom:element.subroom, disconnected: element.disconnected };
        })
        io.to(`${roomId}`).emit("playerListUpdate", trimmedPlayerList);

        let countDownTimer = await getTimerLength(roomId);
        countDownTimer++; // 1 extra second to make it look more natural
        round1Timer = setInterval(()=> {
            countDownTimer--;
            io.to(`${roomId}`).emit("timerRunning", true);
            io.to(`${roomId}`).emit("timerUpdate", countDownTimer);
            if (countDownTimer < 0) {
                clearInterval(round1Timer);
                io.to(`${roomId}`).emit("timerRunning", false);
                nextRound(io, roomId, 2);
            }   
        }, 1000)
    } else {
        // should kill the server here
        console.log("server desynced");
    }   
}
const { setPhase, killRoom } = require("../data/roomData")

const swapHostage = require("../utils/swapHostage");

module.exports = async (io, roomId) => {
    io.to(`${roomId}`).emit("phaseChange", "Game Over");
    await setPhase("Game Over", roomId);

    const updatedPlayerList = await swapHostage(io, roomId, "Game Over");

    let presidentSubroom;
    let bomberSubroom;
    let gamblerChoice;
    updatedPlayerList.forEach((player) => {
        if (player.role === "President") {
            presidentSubroom = player.subroom;
        } else if (player.role === "Bomber") {
            bomberSubroom = player.subroom;
        } else if (player.role === "Gambler") {
            gamblerChoice = player.teamChoice;
        }
    })

    let teamWhoWon;
    let gamblerWon = false;
    if (presidentSubroom === bomberSubroom) { // president and bomber in the same room, red team wins
        teamWhoWon = "Red";
        if (gamblerChoice === "Red") { // gambler picke the right team
            gamblerWon = true;
        }
    } else { // president and bomber in different rooms, blue wins
        teamWhoWon = "Blue";
        if (gamblerChoice === "Blue") { // gambler picke the right team
            gamblerWon = true;
        }
    }

    const winnerArray = []
    updatedPlayerList.forEach(user => {
        if (user.role === "Citizen") {
            io.to(`${roomId}`).emit("message", { userName:"Event", text:`${user.name} was on the ${user.team} team and in room ${user.subroom}.`, phase:"Game Over" })
        } else {
            io.to(`${roomId}`).emit("message", { userName:"Event", text:`${user.name} was the ${user.role} and in room ${user.subroom}.`, phase:"Game Over" })
        }
        if ((user.team === teamWhoWon) || (user.role === "Gambler" && gamblerWon)) { // add player names to the winner array for win message
            winnerArray.push(user.name);         
        }
    })

    const winnersInString = winnerArray.join(", ");
    const winnerMessage = `${winnersInString} have won the game!`;

    io.to(`${roomId}`).emit("message", { userName:"Event", text:`Congratualations to the ${teamWhoWon} team${gamblerWon ? " and the gambler" : ""}!`, phase:"Game Over" });
    io.to(`${roomId}`).emit("message", { userName:"Event", text:winnerMessage, phase:"Game Over" });

    const trimmedPlayerList = updatedPlayerList.map((element) => {
        return { _id:element._id, userName: element.name, subroom:element.subroom, disconnected: element.disconnected };
    })
    io.to(`${roomId}`).emit("playerListUpdate", trimmedPlayerList);
    
    let countDownTimer = 121
    roundTimer = setInterval(()=> {
        countDownTimer--;
        io.to(`${roomId}`).emit("timerRunning", true);
        io.to(`${roomId}`).emit("timerUpdate", countDownTimer);
        if (countDownTimer < 0) {
            clearInterval(roundTimer);
            io.to(`${roomId}`).emit("gameFinished"); // game is over and time passed, kill the room
            io.in(`${roomId}`).disconnectSockets(); // game is over and time passed, kill the room
            killRoom(roomId); // game is over and time passed, kill the room
        }   
    }, 1000)
}
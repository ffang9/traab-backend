const _ = require('lodash');

const { getRoundLimit, getTimerLength, setPhase } = require("../data/roomData")
const gameOver = require("./gameOver");
const swapHostage = require("../utils/swapHostage");

nextRound = async (io, roomId, round) => {
    let roundTimer;
    const roundString = `Round ${round}`;
    io.to(`${roomId}`).emit("phaseChange", roundString);
    await setPhase(roundString, roomId);

    const updatedPlayerList = await swapHostage(io, roomId, `Round ${round}`);

    const trimmedPlayerList = updatedPlayerList.map((element) => {
        return { _id:element._id, userName: element.name, subroom:element.subroom, disconnected: element.disconnected };
    })
    io.to(`${roomId}`).emit("playerListUpdate", trimmedPlayerList);

    const roundLimit = await getRoundLimit(roomId);
    let countDownTimer = await getTimerLength(roomId);
    countDownTimer = countDownTimer / roundLimit * (roundLimit - round + 1); // each round gets shorter
    countDownTimer++; // 1 extra second to make it look more natural
    roundTimer = setInterval(()=> {
        countDownTimer--;
        io.to(`${roomId}`).emit("timerRunning", true);
        io.to(`${roomId}`).emit("timerUpdate", countDownTimer);
        if (countDownTimer < 0) {
            clearInterval(roundTimer);
            io.to(`${roomId}`).emit("timerRunning", false);

            round++;
            if (!(round > roundLimit)) {
                nextRound(io, roomId, round);
            } else {
                gameOver(io, roomId);
            }
        }   
    }, 1000)
}

module.exports = nextRound;
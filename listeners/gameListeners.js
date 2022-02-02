const { getUsersInRoom, addMessageToRoom, getPhase } = require("../data/roomData");
const { subroomLeaderElected, makeSubroomUserLeader, makeSubroomUsurpVote, getSubroomUsurpVote, removeSubroomUsurpVotes, removeSubroomLeader, makeHostage, getHostage, removeHostage, makeGambleChoice } = require("../data/gameData");
const voteCounter = require("../utils/voteCounter");
const getName = require ("../utils/getName");

const sendMessage = (io, socket) => {
    socket.on("sendMessage", async ({ message, userId, roomId, phase, subroom }) => {

        const gotPhase = await getPhase(roomId);
        const gotUsersInRoom = await getUsersInRoom(roomId);

        if (gotPhase === "Lobby Phase" || gotPhase === "Game Over") { // if it's lobby phase or game over send message to everyone
            gotUsersInRoom.forEach(async (player) => {
                if (player._id === userId) {
                    addMessageToRoom({ message, userId, roomId, phase:gotPhase, userName:player.name, subroom }, roomId)
                    .then(io.to(`${roomId}`).emit("message", { userName:player.name, text:message, phase }))
                }
            })
        } else {
            gotUsersInRoom.forEach(async (player) => { // if it's game phase only send message to same subroom
                if (player._id === userId) { // use the database's record of the player's subroom rather than take their word for it
                    await addMessageToRoom({ message, userId, roomId, phase:gotPhase, userName:player.name, subroom: player.subroom }, roomId);
                    gotUsersInRoom.forEach((eachPlayer) => { // send message to everyone who matches their subroom
                        if (eachPlayer.subroom === player.subroom){
                            io.to(eachPlayer.socketId).emit("message", { userName:player.name, text:message, phase });
                        }
                    })
                }
            })
        }
    })
}

const gambleChoice = (io, socket) => {
    socket.on("gambleChoice", async ( { userId, teamChoice, roomId } ) => {
        const gotPhase = await getPhase(roomId);
        await makeGambleChoice(userId, teamChoice, roomId);
        io.to(socket.id).emit("message", {userName:"Event", text:`You have picked ${teamChoice} team as your prediction to win the game.`, phase:gotPhase});
    })
}

const leaderVote = (io, socket) => {
    socket.on("leaderVote", async ( {userId, targetId, subroom, roomId } ) => { // might want to check userid matches subroom but it's not necessary
        const leaderBeenElected = await subroomLeaderElected(subroom, roomId);
        const gotUsersInRoom = await getUsersInRoom(roomId);
        const gotPhase = await getPhase(roomId);
        const voterName = getName(userId, gotUsersInRoom);
        const targetName = getName(targetId, gotUsersInRoom);

        if (!leaderBeenElected && userId !== targetId ) { // leader has not yet been elected, they can elect the leader directly
            await makeSubroomUserLeader(targetId, subroom, roomId);
            gotUsersInRoom.forEach((user) => {
                if (user.subroom === subroom) {
                    if (userId === user._id) {
                        io.to(user.socketId).emit("message", { userName:"Event", text:`You have chosen ${targetName} as the leader.`, phase:gotPhase})
                    } else {
                        io.to(user.socketId).emit("message", { userName:"Event", text:`${voterName} has chosen ${targetName} as the leader.`, phase:gotPhase})
                    }
                }
            })

        } else if (leaderBeenElected) { // if leader has already been elected, it becomes a vote to usurp the current leader
            const gotSubroomUsurpVote = await getSubroomUsurpVote(subroom, roomId);
            let alreadyVoted = false;
            let voteInvalid = false;
            gotSubroomUsurpVote.forEach((vote) => { // make sure they havent already voted
                if (userId === vote.voterId) {
                    alreadyVoted = true;
                }
            })
            gotUsersInRoom.forEach((user) => { // make sure their vote is valid
                if (userId === user._id && user.leader) {
                    voteInvalid = true;
                }
            })
            if (!alreadyVoted && !voteInvalid) { // if they havnt already voted and vote is valid
                const voteWinner = voteCounter(gotUsersInRoom,subroom,gotSubroomUsurpVote, targetId);
                if (voteWinner) { // if someone won
                    const gotHostage = await getHostage(subroom, roomId);
                    await removeSubroomLeader(subroom, roomId);
                    await makeSubroomUserLeader(voteWinner, subroom, roomId);
                    await removeSubroomUsurpVotes(subroom, roomId); // get rid of all votes once someone has won
                    gotUsersInRoom.forEach((user) => {
                        if (user.subroom === subroom) {
                            if (userId === user._id) {
                                io.to(user.socketId).emit("message", { userName:"Event", text:`You have voted for ${targetName} to be the new leader.`, phase:gotPhase})
                            } else {
                                io.to(user.socketId).emit("message", { userName:"Event", text:`${voterName} has voted for ${targetName} to be the new leader.`, phase:gotPhase})
                            }
                            io.to(user.socketId).emit("message", { userName:"Event", text:`${targetName} is now the new leader!`, phase:gotPhase})
                        }
                    })
                    if (gotHostage === targetId) { // if the new leader was the hostage, he is no longer the hostage
                        await removeHostage(subroom, roomId);
                        gotUsersInRoom.forEach(user => {
                            if (user.subroom === subroom) {
                                io.to(user.socketId).emit("message", { userName:"Event", text:`${targetName} is no longer the hostage!`, phase:gotPhase});
                                io.to(user.socketId).emit("noLongerHaveHostageThisTurn");
                            }
                        })
                    }
                    
                } else { // if the vote didn't make anyone win yet
                    await makeSubroomUsurpVote(userId, targetId, subroom, roomId);
                    gotUsersInRoom.forEach((user) => {
                        if (user.subroom === subroom) {
                            if (userId === user._id) {
                                io.to(user.socketId).emit("message", { userName:"Event", text:`You have voted for ${targetName} to be the new leader.`, phase:gotPhase})
                            } else {
                                io.to(user.socketId).emit("message", { userName:"Event", text:`${voterName} has voted for ${targetName} to be the new leader.`, phase:gotPhase})
                            }
                        }
                    })
                }
            }
        }
    })
}

const abdicateVote = (io, socket) => {
    socket.on("abdicateVote", async ({ userId, targetId, subroom, roomId }) => {
        let gotUsersInRoom = await getUsersInRoom(roomId);
        const gotPhase = await getPhase(roomId);
        const voterName = getName(userId, gotUsersInRoom);
        const targetName = getName(targetId, gotUsersInRoom);
        gotUsersInRoom.forEach(async (user) => {
            if (user._id === userId && user.leader && user.subroom === subroom) {
                await removeSubroomLeader(subroom, roomId);
                await makeSubroomUserLeader(targetId, subroom, roomId);
                const gotHostage = await getHostage(subroom, roomId);
                gotUsersInRoom.forEach((user) => {
                    if (user.subroom === subroom) {
                        io.to(user.socketId).emit("message", { userName:"Event", text:`${voterName} has abdicated and handed over power as leader to ${targetName}.`, phase:gotPhase})
                    }
                })
                if (gotHostage === targetId) { // if the new leader was the hostage, he is no longer the hostage
                    await removeHostage(subroom, roomId);
                    gotUsersInRoom.forEach(user => {
                        if (user.subroom === subroom) {
                            io.to(user.socketId).emit("message", { userName:"Event", text:`${targetName} is no longer the hostage!`, phase:gotPhase});
                            io.to(user.socketId).emit("noLongerHaveHostageThisTurn");
                        }
                    })
                }
            }
        })
    })
}

const hostagePick = (io, socket) => {
    socket.on("hostagePick", async ({ userId, targetId, subroom, roomId }) => {
        const gotUsersInRoom = await getUsersInRoom(roomId);
        const gotPhase = await getPhase(roomId);
        const voterName = getName(userId, gotUsersInRoom);
        const targetName = getName(targetId, gotUsersInRoom);
        gotUsersInRoom.forEach(async (user) => {
            if (user._id === userId && user.leader && user.subroom === subroom) {
                const haveHostage = await getHostage(subroom, roomId);
                if (!haveHostage) {
                    await makeHostage(targetId, subroom, roomId);
                    gotUsersInRoom.forEach((user) => {
                        if (user.subroom === subroom) {
                            io.to(user.socketId).emit("haveHostageThisTurn");
                            io.to(user.socketId).emit("message", { userName:"Event", text:`${voterName} has picked ${targetName} as the hostage to be swapped over.`, phase:gotPhase})
                        }
                    })
                }
            }
        })
    })
}

module.exports = { sendMessage, leaderVote, gambleChoice, abdicateVote, hostagePick };
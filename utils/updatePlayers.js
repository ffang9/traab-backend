module.exports = (io, socket, gotUsersInRoom) => {
    let trimmedPlayerList = gotUsersInRoom.map((element) => {
        return { _id:element._id, userName: element.name, leader:element.leader, subroom:element.subroom,  disconnected: element.disconnected };
    })
    io.to(socket.id).emit("playerListUpdate", trimmedPlayerList);
}
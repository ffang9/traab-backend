 module.exports = (userId, gotUsersInRoom) => {
    let returnName;
    gotUsersInRoom.forEach(user => {
        if (user._id === userId) {
            returnName = user.name;
        }
    })
    return returnName;
 }
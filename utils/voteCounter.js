module.exports = (gotUsersInRoom, subroom, gotSubroomUsurpVote, targetId) => {
    
    const subroomPlayerList = gotUsersInRoom.filter((player) => {
        return player.subroom === subroom; // filter out people from a different subroom
    })

    const passReq = (subroomPlayerList.length - 1) / 2; // number of votes required to pass majority
    
    let countArray = []; // for counting votes
    subroomPlayerList.forEach(() => {
        countArray.push(0);
    })
    subroomPlayerList.forEach((player, index) => { // account for the vote just casted
        if (targetId === player._id) {
            countArray[index]++; 
        }
    })
    gotSubroomUsurpVote.forEach((vote) => { // go through all the usurp votes and then players in the subroom
        subroomPlayerList.forEach((player, index) => {
            if (vote.targetId === player._id) { // if it matches, add to the counter to count votes
                countArray[index]++;
            }
        })
    })
    
    let winnerId;
    countArray.forEach((count, index) => {
        if (count > (passReq)) { // if one of the votes exceeds the teamsize
            winnerId = subroomPlayerList[index]._id;
        }
    })

    return winnerId;
}
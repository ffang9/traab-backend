const _ = require('lodash');

module.exports = (currentPlayerCount) => {

    const oddNumberOfPlayers = (currentPlayerCount % 2) === 1; // check if player count is odd to add gambler role
    const teamSize = Math.floor(currentPlayerCount / 2); // how many players on each team
    
    let teamPicker = [];
    const president = (_.random(0, teamSize - 1)); // pick the president
    const bomber = (_.random(teamSize, teamSize * 2 - 1)); // pick the bomber
    
    for (let i=0; i < currentPlayerCount; i++) {
        if (i === currentPlayerCount - 1 && oddNumberOfPlayers) {
            teamPicker.push([2]); // neutral team
        } else if (i < teamSize) {
            teamPicker.push([0]); // blue team
        } else {
            teamPicker.push([1]); // red team
        }
    
        if (i === president) {
            teamPicker[i][1] = 1 // president
        }
        if (i === bomber) {
            teamPicker[i][1] = 1 // bomber
        }
    }
    
    teamPicker=_.shuffle(teamPicker); // shuffle the teams so teams are not obvious
    
    for (let i=0; i < currentPlayerCount; i++) { // place players in subrooms
        if (i === currentPlayerCount - 1 && oddNumberOfPlayers) {
            teamPicker[i][2] = _.random(1, 2) // odd player out is placed on random subroom
        } else if (i < teamSize) {
            teamPicker[i][2] = 1; // subroom 1
        } else {
            teamPicker[i][2] = 2; // subroom 2
        }
    }

    return teamPicker;
}
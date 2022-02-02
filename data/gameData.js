const { getClient } = require("./dbConnect");

// writing promises here seems to be a bit faster than writing async/await
const subroomLeaderElected = (subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { subroom1LeaderElected:1 } })))
        .then(result => (result.subroom1LeaderElected))
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { subroom2LeaderElected:1 } })))
        .then(result => (result.subroom2LeaderElected))
        .catch(error => (`Error: ${error}`));
    }
}

const makeSubroomUserLeader = (targetId, subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => {
            client.db("traab_database").collection("roomData").updateOne({_id: roomId}, { $set: { subroom1LeaderElected:true } })
            return client;
        })
        .then(client => {
            return client.db("traab_database").collection("roomData").updateOne(
                { _id: roomId },
                { $set: { "players.$[arrayElement].leader": true } },
                { arrayFilters: [{ "arrayElement._id": targetId }] }
            );
        })
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => {
            client.db("traab_database").collection("roomData").updateOne({_id: roomId}, { $set: { subroom2LeaderElected:true } })
            return client;
        })
        .then(client => {
            return client.db("traab_database").collection("roomData").updateOne(
                { _id: roomId },
                { $set: { "players.$[arrayElement].leader": true } },
                { arrayFilters: [{ "arrayElement._id": targetId }] }
            );
        })
        .catch(error => (`Error: ${error}`));
    }
}

const makeSubroomUsurpVote = (userId, targetId, subroom, roomId) => { // vote to usurp a leader
    if (subroom === 1) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $push: { subroom1Votes: { voterId: userId, targetId: targetId } } })))
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $push: { subroom2Votes: { voterId: userId, targetId: targetId } } })))
        .catch(error => (`Error: ${error}`));
    }
}

const getSubroomUsurpVote = (subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { subroom1Votes:1 } })))
        .then(result => (result.subroom1Votes || []))
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { subroom2Votes:1 } })))
        .then(result => (result.subroom2Votes || []))
        .catch(error => (`Error: ${error}`));
    }
}

const removeSubroomUsurpVotes = (subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $unset: { subroom1Votes: [] } })))
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $unset: { subroom2Votes: [] } })))
        .catch(error => (`Error: ${error}`));
    }
}

const removeSubroomLeader = (subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => {
            client.db("traab_database").collection("roomData").updateOne({_id: roomId}, { $set: { subroom1LeaderElected:false } })
            return client;
        })
        .then(client => {
            return client.db("traab_database").collection("roomData").updateOne(
                { _id: roomId },
                { $set: { "players.$[arrayElement].leader": false } },
                { arrayFilters: [{ "arrayElement.subroom": 1 }] }
            );
        })
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => {
            client.db("traab_database").collection("roomData").updateOne({_id: roomId}, { $set: { subroom2LeaderElected:false } })
            return client;
        })
        .then(client => {
            return client.db("traab_database").collection("roomData").updateOne(
                { _id: roomId },
                { $set: { "players.$[arrayElement].leader": false } },
                { arrayFilters: [{ "arrayElement.subroom": 2 }] }
            );
        })
        .catch(error => (`Error: ${error}`));
    }
}

const makeHostage = (targetId, subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => (
            client.db("traab_database").collection("roomData").updateOne({_id: roomId}, { $set: { subroom1Hostage: targetId } })
        ))
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => (
            client.db("traab_database").collection("roomData").updateOne({_id: roomId}, { $set: { subroom2Hostage: targetId } })
        ))
        .catch(error => (`Error: ${error}`));
    }
}

const removeHostage = (subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $unset: { subroom1Hostage: "" } })))
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").updateOne({ _id:roomId }, { $unset: { subroom2Hostage: "" } })))
        .catch(error => (`Error: ${error}`));
    }
}

const getHostage = (subroom, roomId) => {
    if (subroom === 1) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { subroom1Hostage:1 } })))
        .then(result => (result.subroom1Hostage))
        .catch(error => (`Error: ${error}`));
    } else if (subroom === 2) {
        return getClient()
        .then(client => (client.db("traab_database").collection("roomData").findOne({ _id:roomId }, { projection: { subroom2Hostage:1 } })))
        .then(result => (result.subroom2Hostage))
        .catch(error => (`Error: ${error}`));
    }
}

const makeGambleChoice = (userId, teamChoice, roomId) => {
    return getClient()
    .then(client => {
        return client.db("traab_database").collection("roomData").updateOne(
            { _id: roomId },
            { $set: { "players.$[arrayElement].teamChoice": teamChoice } },
            { arrayFilters: [{ "arrayElement._id": userId }] }
        );
    })
    .catch(error => (`Error: ${error}`));
}

module.exports = { subroomLeaderElected, makeSubroomUserLeader, makeSubroomUsurpVote, getSubroomUsurpVote, removeSubroomUsurpVotes, removeSubroomLeader, makeHostage, removeHostage, getHostage, makeGambleChoice };
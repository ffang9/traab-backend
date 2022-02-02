const express = require("express");
const router = express.Router();

const randomstring = require("randomstring");

const { createRoom } = require("../data/roomData");

router.post('/', (req, res) => {
    const roomId = randomstring.generate({
        length: 5,
        charset: 'alphanumeric',
        capitalization: 'uppercase'
    });
    const playerLimit = req.body.playerLimit;
    const roundLimit = req.body.roundCount;
    const timerLength = req.body.timeLimit;
    createRoom({ _id:roomId, playerLimit, roundLimit, timerLength })
    res.json(roomId);
})

module.exports = router;
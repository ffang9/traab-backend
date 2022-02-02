const { MongoClient } = require("mongodb");
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const connection = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).connect();

const getClient = async () => {
    const client = await connection.catch((error) => {
        throw new Error(`Database connection failed: (${error.message})`);
    });
    return client;
}

module.exports = { getClient };
const { MongoClient } = require("mongodb");
require('dotenv').config();

const uri = process.env.URI;

const connection = new MongoClient(uri, {
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
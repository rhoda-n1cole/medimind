const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("medimind.json");
const db = low(adapter);

db.defaults({ users: [], medications: [], doses: [], appointments: [] }).write();

module.exports = db;
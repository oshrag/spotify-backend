import dotenv from "dotenv"
dotenv.config()


export default {
    dbURL: process.env.MONGO_URL,
    dbName: process.env.DB_NAME 
}

// console.log('process.env.MONGO_URL= ',process.env.MONGO_URL)

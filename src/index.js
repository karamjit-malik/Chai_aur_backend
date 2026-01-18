import connectDB from "./db/index.js"
import dotenv from "dotenv"
dotenv.config()

connectDB()






/*
import express from 'express'
const app = express()


( async () => {
    try{
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error', (err) => {
            console.error('Error connecting to MongoDB', err)
            throw err
        })

        app.listen(process.env.PORT , ()=>
        {
            console.log(`App listening on PORT ${process.env.PORT}`)
        })
    }
    catch(err){
        console.error('Error connecting to MongoDB', err)
        throw err
    }
})()
*/
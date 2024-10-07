import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './utils/db.js'
import userRouter from './routes/user.route.js'
import postRouter from './routes/post.route.js'
import messageRouter from './routes/message.route.js'
import { app, server } from './socket/socket.js'
import path from 'path'


dotenv.config()

const PORT = process.env.PORT || 3000

app.get('/', (req, resp) => {
    return resp.status(200).json({
        message: "I am a backend developer",
        success: true
    })
})

// for deployment we us this path
const __dirname = path.resolve()

//middleware
app.use(cookieParser())
app.use(express.json())
app.use(urlencoded({ extended: true }))

const corsOption = {
    origin: "http://localhost:5173",
    credentials: true
}
app.use(cors(corsOption))

// Routes
app.use('/api/v1/user', userRouter)
app.use('/api/v1/post', postRouter)
app.use('/api/v1/message', messageRouter)

app.use(express.static(path.join(__dirname, '/frontend/dist')))
// it server the file static html file and server the other file after hitting the particular route
app.get('*', (req, resp) => {
    resp.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
})

server.listen(PORT, () => {
    connectDB()
    console.log(`Server is running on port ${PORT}`);
})
import mongoose from "mongoose";

const connectDB = async (req, resp) => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("mongoDB is successfully connected");
    } catch (error) {
        resp.status(500).send(error.message)
    }
}

export default connectDB
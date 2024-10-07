import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, resp) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const { textMessage: message } = req.body;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        })
        // establish the conversation if not started yet
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            })
        };

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        })

        if (newMessage) conversation.messages.push(newMessage._id)
        await Promise.all([conversation.save(), newMessage.save()])

        // implement socket io for real time data transfer

        const receiverSocketId = getReceiverSocketId(receiverId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage)
        }
        return resp.status(201).json({
            newMessage,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const getMessages = async (req, resp) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages');

        if (!conversation) return resp.status(200).json({ messages: [], success: true })

        return resp.status(200).json({
            // ? optional chaining
            messages: conversation?.messages,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
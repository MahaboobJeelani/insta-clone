import sharp from 'sharp'
import cloudinary from '../utils/cloudinary.js';
import { Post } from '../models/post.model.js';
import { User } from '../models/user.model.js';
import { Comments } from '../models/comment.model.js'
import { getReceiverSocketId, io } from '../socket/socket.js';


export const addNewPost = async (req, resp) => {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id
    try {

        if (!image) return resp.status(400).json({ message: "image required" })

        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer()


        const uploadResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: "image" },
                (error, result) => {
                    if (error) reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(optimizedImageBuffer)
        });


        const post = await Post.create({
            caption,
            image: uploadResponse.secure_url,
            author: authorId
        })

        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post)
            await user.save()
        }

        await post.populate({ path: 'author', select: '-password' })

        return resp.status(200).json({
            message: "New post added",
            post,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}


export const getAllPosts = async (req, resp) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: "author", select: 'username profilePicture' })
            .populate({
                path: "comments",
                sort: { createdAt: -1 },
                populate: {
                    path: "author",
                    select: 'username profilePicture'
                }
            })
        return resp.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}

export const getUserPost = async (req, resp) => {
    try {
        const authorId = req.id
        const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 })
            .populate({
                path: "author", select: "username profilePicture"
            })
            .populate({
                path: "comments",
                sort: { createdAt: -1 },
                select: "username profilePicture"
            })
        return resp.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const likePost = async (req, resp) => {
    try {
        const loggedUserLikeId = req.id
        const postId = req.params.id
        const post = await Post.findById(postId);
        if (!post) return resp.status(400).json({ message: "post not found", success: true })
        // $addToSet to set the uniue value
        await post.updateOne({ $addToSet: { likes: loggedUserLikeId } })
        await post.save();

        // implement socket io for each time notification
        const user = await User.findById(loggedUserLikeId).select('username profilePicture')
        const postOwnerId = post.author.toString();
        if (postOwnerId !== loggedUserLikeId) {
            // emit a notification event
            const notification = {
                type: 'like',
                userId: loggedUserLikeId,
                userDetails: user,
                postId,
                message: 'your post was liked'
            }
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification)
        }

        return resp.status(200).json({
            message: "post liked",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}


export const disLikePost = async (req, resp) => {
    try {
        const loggedUserLikeId = req.id
        const postId = req.params.id
        const post = await Post.findById(postId);
        if (!post) return resp.status(400).json({ message: "post not found", success: true })
        // like logic
        // $addToSet to set the uniue value
        await post.updateOne({ $pull: { likes: loggedUserLikeId } })
        await post.save();

        // implement socket io for each time notification
        const user = await Post.findById(loggedUserLikeId).select('username profilePicture')
        const postOwnerId = post.author.toString();
        if (postOwnerId !== loggedUserLikeId) {
            // emit a notification event
            const notification = {
                type: 'dislike',
                userId: loggedUserLikeId,
                userDetails: user,
                postId,
                message: 'your post was disliked'
            }

            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification)
        }
        return resp.status(200).json({
            message: "post Unliked",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}


export const addComment = async (req, resp) => {
    try {
        const writeCommenterId = req.id
        const postId = req.params.id

        const { text } = req.body
        const post = await Post.findById(postId);

        if (!text) return resp.status(400).json({ message: "comment is required", success: true })

        const comment = await Comments.create({
            text,
            post: postId,
            author: writeCommenterId
        })

        await comment.populate({ path: 'author', select: 'username profilePicture' })

        post.comments.push(comment._id)
        await post.save();

        return resp.status(200).json({ message: "comment added", comment, success: true })
    } catch (error) {
        console.log(error);
    }
}

export const getCommentsOfPost = async (req, resp) => {
    try {
        const postId = req.params.id

        const comments = await Comments.find({ post: postId }).populate('author', 'username profilePicture');

        if (!comments) return resp.status(404).json({ message: 'No comments found for this post', success: false });

        return resp.status(200).json({ success: true, comments })
    } catch (error) {
        console.log(error);
    }
}


export const deletePost = async (req, resp) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) return resp.status(404).json({ message: "post not found", success: false });
        // check if the logged-in user is the owner of the post 
        if (post.author.toString() !== authorId) return resp.status(403).json({ message: "Unauthorized" })
        // delete post
        await Post.findByIdAndDelete(postId)
        // remove the post id from the users post
        const user = await User.findById(authorId)
        user.posts = user.posts.filter(id => id.toString() !== postId)
        await user.save();

        await Comments.deleteMany({ post: postId })

        return resp.status(200).json({
            message: "Post deleted",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const bookmarkPost = async (req, resp) => {
    try {
        const authorId = req.id
        const postId = req.params.id

        const post = await Post.findById(postId)
        if (!post) return resp.status(404).json({ message: "Post not found", success: true })

        const user = await User.findById(authorId);
        if (user.bookmarks.includes(post._id)) {
            // already bookmarked => remove from the bookmark
            await user.updateOne({ $pull: { bookmarks: post._id } });
            await user.save();
            return resp.status(200).json({ type: "Unsaved", message: "Post removed from bookmark", success: true })
        } else {
            //save to bookmark
            await user.updateOne({ $addToSet: { bookmarks: post._id } })
            await user.save();
            return resp.status(200).json({ type: "Saved", message: "Post bookmark", success: true })
        }
    } catch (error) {
        console.log(error);
    }
}
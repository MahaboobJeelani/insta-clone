import { User } from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import getDataUri from '../utils/datauri.js'
import cloudinary from '../utils/cloudinary.js'
import { Post } from '../models/post.model.js'

export const register = async (req, resp) => {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return resp.status(401).json({
                message: "Fields are empty, please check the fields",
                success: false
            })
        }
        const user = await User.findOne({ email })
        if (user) {
            return resp.status(401).json({
                message: "Try different email",
                success: false
            })
        }

        const hashPassword = await bcrypt.hash(password, 10)
        await User.create({
            username,
            email,
            password: hashPassword
        })
        return resp.status(200).json({
            message: "Account created successfully",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}


export const login = async (req, resp) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return resp.status(401).json({
                message: "Fields are empty, please check the fields",
                success: false
            })
        }

        let user = await User.findOne({ email })
        if (!user) {
            return resp.status(401).json({
                massage: "Incorrect email or password",
                success: false
            })
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password)

        if (!isPasswordMatch) {
            return resp.status(401).json({
                massage: "Incorrect password",
                success: false
            })
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' })
        // populate each post if in the posts array
        const populatePost = await Promise.all(

            user.posts.map(async (postId) => {
                const post = await Post.findById(postId)

                if (post?.author.equals(user._id)) {
                    return post;
                }
                return null;
            })
        )

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatePost
        }


        // 1 day, 24 hours, 60 min, 60 sec, 1000 millisec === 1 day
        return resp.cookie('token', token, { httpOnly: true, sameSite: "strict", maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        })
    } catch (error) {
        console.log(error);
    }
}


export const logout = async (req, resp) => {
    try {
        return resp.cookie('token', '', { maxAge: 0 }).json({
            message: "Logged out successfully",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}


export const getProfile = async (req, resp) => {
    try {
        const userId = req.params.id
        const user = await User.findById(userId).populate({ path: 'posts', createdAt: -1 }).populate({ path: 'bookmarks' })
        return resp.status(200).json({
            user,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}

export const editProfile = async (req, resp) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture)
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password')
        if (!user) {
            return resp.status(404).json({
                message: "user not found",
                success: false
            })
        }
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return resp.status(200).json({
            message: "profile updated",
            success: true,
            user
        })
    } catch (error) {
        console.log(error);
    }
}


export const getSuggestedUsers = async (req, resp) => {
    try {
        const suggestedUser = await User.find({ _id: { $ne: req.id } }).select('-password')
        if (!suggestedUser) {
            return resp.status(400).json({
                message: "Currently do not have any user"
            })
        }
        return resp.status(200).json({
            success: true,
            users: suggestedUser
        })
    } catch (error) {
        console.log(error)
    }
}

export const followOrUnfollow = async (req, resp) => {
    try {
        const followerId = req.id; // me
        const followingId = req.params.id // another user who is tring to follow me

        if (followerId === followingId) {
            return resp.status(400).json({
                message: "you cannot follow/unfollow yourself",
                success: false
            })
        }

        const user = await User.findById(followerId);

        const targetUser = await User.findById(followingId);

        if (!user || !targetUser) {
            return resp.status(400).json({
                message: "User not found",
                success: false
            })
        }

        // i am checking the here i am following or not
        const isFollowing = user.following.includes(followingId);

        if (isFollowing) {
            // unFollow logic
            await Promise.all([
                User.updateOne({ _id: followerId }, { $pull: { following: followingId } }),
                User.updateOne({ _id: followingId }, { $pull: { followers: followerId } })
            ])
            return resp.status(200).json({ message: "Unfollowed successfully", success: true })
        } else {
            // follow logic
            await Promise.all([
                User.updateOne({ _id: followerId }, { $push: { following: followingId } }),
                User.updateOne({ _id: followingId }, { $push: { followers: followerId } })
            ])
            return resp.status(200).json({ message: "Followed successfully", success: true })
        }
    } catch (error) {
        console.log(error);
    }
}
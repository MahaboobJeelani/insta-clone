import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import Comment from './Comment'
import axios from 'axios'
import { setPosts } from '@/redux/postSlice'

const CommentsDialog = ({ open, setOpen }) => {
    const [text, setText] = useState('')
    const { selectedPost, posts } = useSelector(store => store.post)
    const [comment, setComment] = useState(selectedPost?.comments)
    const dispatch = useDispatch()


    useEffect(() => {
        setComment(selectedPost?.comments)
    }, [selectedPost])

    const changeHandler = (e) => {
        const inputText = e.target.value
        if (inputText.trim()) {
            setText(inputText)
        } else {
            setText('')
        }
    }


    const sendMessageHandler = async () => {
        try {
            const res = await axios.post(`http://localhost:8000/api/v1/post/${selectedPost?._id}/comment`, { text }, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true
            })
            if (res.data.success) {
                const updatedCommentData = [...comment, res.data.comment]
                setComment(updatedCommentData)

                const updatedPostData = posts?.map(p =>
                    p?._id === selectedPost?._id ? { ...p, comments: updatedCommentData } : p
                )
                setText('')
                dispatch(setPosts(updatedPostData))
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div>
            <Dialog open={open}>
                <DialogContent onInteractOutside={() => setOpen(setOpen)} className='max-w-5xl p-0 flex flex-col'>
                    <div className='flex flex-1'>
                        <div className='w-1/2'>
                            <img
                                src={selectedPost?.image}
                                alt='post_image'
                                className='w-full h-full rounded-l-xl object-cover'
                            />
                        </div>
                        <div className='w-1/2 flex flex-col justify-between'>
                            <div className='flex items-center justify-between p-4'>
                                <div className='flex gap-3 items-center'>

                                    <Link>
                                        <Avatar>
                                            <AvatarImage src={selectedPost?.author?.profilePicture} />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div>
                                        <Link>
                                            {selectedPost?.author?.username}
                                        </Link>
                                        {/* <span>Bio herr....</span> */}
                                    </div>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <MoreHorizontal className='cursor-pointer' />
                                    </DialogTrigger>
                                    <DialogContent className='text-center flex flex-col text-sm'>
                                        <div className='cursor-pointer w-full font-bold text-[#ED4956]'>Unfollow</div>
                                        <div className='cursor-pointer w-full '>Add to Favorites</div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <hr />
                            <div className='flex-1 overflow-y-auto max-h-96 p-4'>
                                {
                                    comment?.map(comment => <Comment key={comment._id} comment={comment} />)
                                }
                            </div>
                            <div className='p-4'>
                                <div className='flex items-center gap-2'>
                                    <input type="text" value={text} onChange={changeHandler} placeholder='Add a comments...' className='w-full outline-none border border-gray-300 p-2 rounded text-sm' />

                                    <Button disabled={!text.trim()} variant='outline' onClick={sendMessageHandler}>
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CommentsDialog

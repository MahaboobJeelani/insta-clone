import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { readFileAsDataURL } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '@/redux/postSlice';

const CreatePost = ({ open, setOpen }) => {

    const imageRef = useRef();
    const [file, setFile] = useState('')
    const [caption, setCaption] = useState('')
    const [imagePreview, setImagePreview] = useState('')
    const [loading, setLoading] = useState(false)

    const { user } = useSelector(store => store.auth)
    const { posts } = useSelector(store => store.post)

    const dispatch = useDispatch()

    const nanigate = useNavigate()

    const fileChangeHandler = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file)
            const dataUrl = await readFileAsDataURL(file)
            setImagePreview(dataUrl)
        }
    }

    const createPostHandler = async (e) => {
        const formData = new FormData();
        formData.append('caption', caption);
        if (imagePreview) formData.append("image", file);

        try {
            setLoading(true)
            const res = await axios.post('http://localhost:8000/api/v1/post/addpost', formData, {
                headers: {
                    'Content-Type': "multipart/form-data"
                },
                withCredentials: true
            })
            if (res.data.success) {
                dispatch(setPosts([res.data.post, ...posts]))
                toast.success(res.data.message)
                nanigate('/')
                setOpen(false)
            }
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open}>
            <DialogContent onInteractOutside={() => setOpen(false)}>
                <DialogHeader className='text-center font-semibold'>Create New Post</DialogHeader>
                <div className='flex gap-3 items-center'>
                    <Avatar>
                        <AvatarImage src={user?.profilePicture} alt='img' />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className='font-semibold text-xs'>{user?.username}</h1>
                        <span className='text-xs text-gray-600'>{user?.bio}</span>
                    </div>
                </div>
                <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} className='focus-visible:ring-transparent border-none' placeholder='write a caption...' />
                {
                    imagePreview && (
                        <div className='h-64 w-full flex items-center justify-center'>
                            <img src={imagePreview} alt="preview_image" className='w-full h-full object-cover rounded-lg' />
                        </div>
                    )
                }
                <input ref={imageRef} type='file' className='hidden' onChange={fileChangeHandler} />
                <Button onClick={() => imageRef.current.click()} className='w-fit mx-auto bg-[#0095F6] hover:bg-[#3e96d1] rounded-[.3rem]'>Select from computor</Button>
                {
                    imagePreview && (
                        loading ? (
                            <Button>
                                <Loader2 className='m-2 h-4 w-4 animate-spin' />
                                Please Wait
                            </Button>
                        ) : (
                            <Button onClick={createPostHandler} type='submit' className='w-full'>Post</Button>
                        )
                    )
                }
            </DialogContent>
        </Dialog>
    )
}

export default CreatePost

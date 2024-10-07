import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const SuggestedUser = () => {
    const { suggestedUser } = useSelector(store => store.auth)

    return (
        <div className='my-10'>
            <div className='flex items-center justify-between text-sm'>
                <h1 className='font-semibold text-gray-600'>Suggested User</h1>
                <span className='cursor-pointer font-medium'>See All</span>
            </div>
            <div>
                {
                    suggestedUser?.map(user => {
                        return (
                            <div key={user?._id} className='flex items-center justify-between my-5'>
                                <div className='flex items-center gap-2'>
                                    <Link to={`/profile/${user?._id}`}>
                                        <Avatar>
                                            <AvatarImage src={user?.profilePicture} alt='post_image' />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div>
                                        <h1 className='font-semibold text-sm'><Link>{user?.username}</Link></h1>
                                        <span className='text-gray-600 text-sm'>{user?.bio || "bio Here..."}</span>
                                    </div>
                                </div>
                                <span className='text-[#3BADF8] text-xs font-bold cursor-pointer hover:text-[#5f9dc7]'>Follow</span>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default SuggestedUser

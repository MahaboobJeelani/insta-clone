import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser } from '@/redux/authSlice'

const Login = () => {
    const [input, setInput] = useState({
        email: '',
        password: ""
    })
    const [loading, setLoading] = useState()
    const { user } = useSelector(store => store.auth)

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value })
    }

    const createHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true)

            const res = await axios.post('http://localhost:8000/api/v1/user/login', input, {
                headers: {
                    'Content-Type': "application/json"
                },
                withCredentials: true,
            })

            if (res.data.success) {
                console.log('Hello world');

                dispatch(setAuthUser(res.data.user))
                toast.success(res.data.message)
                setInput({
                    email: '',
                    password: ""
                })
                navigate('/')
            }

        } catch (error) {
            console.log(error);
            toast(error.response.data.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            navigate('/')
        }
    }, [])
    return (
        <div className='flex items-center justify-center w-screen h-screen'>
            <form onSubmit={createHandler} className='shadow-lg flex flex-col gap-5 p-8 w-1/3'>
                <div className='my-4'>
                    <h1 className='text-center  font-bold text-xl'>LOGO</h1>
                    <p className='text-center'>Login up to see photos and videos</p>
                </div>
                <div>
                    <Label className='py-2 font-medium'>Email</Label>
                    <Input
                        type='email'
                        name='email'
                        value={input.email}
                        onChange={changeEventHandler}
                        className='focus-visible:ring-transparent my-2 rounded'
                    />
                </div>
                <div>
                    <Label className='py-2 font-medium'>Password</Label>
                    <Input
                        type='text'
                        name='password'
                        value={input.password}
                        onChange={changeEventHandler}
                        className='focus-visible:ring-transparent my-2 rounded'
                    />
                </div>
                {
                    loading ? (
                        <Button>

                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Please Wait
                        </Button>
                    ) : (
                        <Button type='submit' className='rounded'>Login</Button>
                    )
                }
                <span className='text-center'>Don't have an account <Link to='/signup' className="text-blue-600">Signup</Link></span>
            </form>
        </div>
    )
}

export default Login

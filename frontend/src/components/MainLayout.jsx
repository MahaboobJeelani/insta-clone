import React from 'react'
import { Outlet } from 'react-router-dom'
import Leftsidebar from './Leftsidebar'

const MainLayout = () => {
    return (
        <div>
            <Leftsidebar />
            <div>
                <Outlet />
            </div>
        </div>
    )
}

export default MainLayout

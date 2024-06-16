import React from 'react'
import MainHeader from './MainHeader';

const MainLayout = ({
        children,
    }: Readonly<{
        children: React.ReactNode;
    }>) => {
  return (
    <div className='bg-gray-500 w-full min-h-screen'>
        <MainHeader></MainHeader>
        <div className="flex justify-between">
            {/* flex-1 class below helps to grow a box to fit remaining size */}
            <main className='bg-gray-700 flex-1'>{children}</main> 

            <aside className='bg-blue-700'>
                <h1>Aside layout</h1>
            </aside>
        </div>
    </div>
  )
}

export default MainLayout

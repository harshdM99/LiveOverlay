import React from 'react'
import MainHeader from './MainHeader';

const MainLayout = ({
        children,
    }: Readonly<{
        children: React.ReactNode;
    }>) => {
  return (
    <div>
        <MainHeader></MainHeader>
        <h1>Main layout</h1>
        <hr />
        {children}
    </div>
  )
}

export default MainLayout

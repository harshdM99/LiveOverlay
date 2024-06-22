import React from 'react'

function login() {
  return (
    <main>
        <h1>Login Page</h1>
        <div className='flex p-5 bg-stone-600 gap-4'>
          <input type="email" placeholder='Enter email' />
          <input type="password" placeholder='Enter password'/>
        </div>
    </main>
  )
}

export default login
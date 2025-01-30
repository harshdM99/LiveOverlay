import React from 'react'

function MainHeader() {
  return (
    <div className='flex justify-between p-5 bg-gray-900'>
      <h1>Brand</h1>
        {/* <button className="text-white mt-2.5 py-2.5 px-10 border-none rounded-full cursor-pointer bg-red-600 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-red-400">
            End Broadcast
        </button> */}
        <button className="text-white mt-2.5 py-2.5 px-10 border-none rounded-full cursor-pointer bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-green-400">
            Start Broadcast
        </button>
    </div>
  )
}

export default MainHeader

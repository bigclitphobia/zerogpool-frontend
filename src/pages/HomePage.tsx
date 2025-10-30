import connectWallet from '../assets/connectWallet.png'
import gameMannual from '../assets/gameMannual.png'

const HomePage = () => {
  return (
    // <div className="flex flex-col mx-auto px-4 py-8 flex justify-between align-center" >
      <div className='flex flex-row justify-center gap-4 pb-16'>
        <img src={connectWallet} alt="connect" className="cursor-pointer" />
        <img src={gameMannual} alt="manual" className="cursor-pointer" />
      </div>
    //   <Outlet />
    // </div>
  )
}

export default HomePage

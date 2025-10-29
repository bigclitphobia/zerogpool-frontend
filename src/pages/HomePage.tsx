import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className="w-full flex justify-center px-4 pt-4 sm:pt-6 align-center">
      <div className="w-full max-w-md mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide text-cyan-200 mb-6">
          8‑Ball Pool
        </h1>
        <p className="text-neutral-200/90 mb-8">Connect to start playing and track your progress.</p>
        <Link
          to="/connect"
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_6px_20px_rgba(0,178,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,178,255,0.7)] transition"
        >
          Connect
        </Link>
      </div>
    </div>
  )
}

export default HomePage

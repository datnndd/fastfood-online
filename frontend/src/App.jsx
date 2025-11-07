import { Outlet } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
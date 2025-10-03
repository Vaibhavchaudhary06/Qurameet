import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import Home from "./pages/Home"
import Room from "./pages/Room"
import Help from "./pages/Help"
import Settings from "./pages/Settings"
import Report from "./pages/Report"
import QuickAccess from "./pages/QuickAccess"
import Schedule from "./pages/Schedule";
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />

        {/* Support section */}
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/report" element={<Report />} />
        <Route path="/quick-access" element={<QuickAccess />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </>
  )
}

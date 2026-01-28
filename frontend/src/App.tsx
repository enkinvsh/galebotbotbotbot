import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ExhibitionList from './pages/ExhibitionList'
import BookingFlow from './pages/BookingFlow'
import BookingSuccess from './pages/BookingSuccess'
import MyBookings from './pages/MyBookings'

function App() {
  return (
    <Router>
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: 'var(--tg-theme-bg-color)',
        color: 'var(--tg-theme-text-color)'
      }}>
        <Routes>
          <Route path="/" element={<ExhibitionList />} />
          <Route path="/book/:exhibitionId" element={<BookingFlow />} />
          <Route path="/success/:bookingId" element={<BookingSuccess />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

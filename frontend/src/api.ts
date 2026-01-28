import { initData } from '@telegram-apps/sdk-react'

interface Exhibition {
  id: number
  name: string
  description: string
  schedule_text: string
  schedule_days: number[]
  duration_minutes: number
  price: number
  capacity: number
  active: boolean
}

interface TimeSlot {
  time: string
  available: number
  capacity: number
}

interface Booking {
  id: number
  exhibition_id: number
  exhibition_name: string
  date: string
  time: string
  phone: string
  status: string
  created_at: string
}

interface AvailabilityResponse {
  date: string
  slots: TimeSlot[]
}

interface BookingRequest {
  exhibition_id: number
  date: string
  time: string
  phone: string
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const DEMO_MODE = !import.meta.env.VITE_API_URL && import.meta.env.PROD

const DEMO_EXHIBITIONS = [
  { id: 1, name: 'Время жить', description: 'Мы можем годами строить жизнь, которая подходит всем — кроме нас самих.', schedule_text: 'ежедневно', schedule_days: [0,1,2,3,4,5,6], duration_minutes: 60, price: 1000, capacity: 4, active: true },
  { id: 2, name: 'Сквозь страх', description: 'Свобода начинается там, где заканчивается страх.', schedule_text: 'ежедневно', schedule_days: [0,1,2,3,4,5,6], duration_minutes: 60, price: 1000, capacity: 3, active: true },
  { id: 3, name: 'Мама, я тебя прощаю', description: 'Самая теплая и трогательная тема в проекте «Галерея Путь».', schedule_text: 'вторник, четверг, суббота', schedule_days: [2,4,6], duration_minutes: 60, price: 1000, capacity: 4, active: true },
  { id: 4, name: 'Тело', description: 'Любовь к себе учит других любить тебя.', schedule_text: 'понедельник, пятница', schedule_days: [1,5], duration_minutes: 60, price: 1000, capacity: 3, active: true },
  { id: 5, name: 'Папа, давай поговорим', description: 'Каким он должен быть, или как принять, каким он не был?', schedule_text: 'воскресенье, среда', schedule_days: [0,3], duration_minutes: 60, price: 1000, capacity: 4, active: true },
]

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  try {
    if (initData.raw && typeof initData.raw === 'function') {
      const tgInitData = initData.raw()
      if (tgInitData) {
        headers['X-Telegram-Init-Data'] = tgInitData
      }
    }
  } catch (e) {
    console.warn('Failed to get Telegram init data:', e)
  }
  
  return headers
}

export const api = {
  async getExhibitions(): Promise<Exhibition[]> {
    if (DEMO_MODE) return DEMO_EXHIBITIONS
    const response = await fetch(`${API_BASE}/exhibitions`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch exhibitions')
    return response.json()
  },

  async getAvailability(exhibitionId: number, date: string): Promise<AvailabilityResponse> {
    if (DEMO_MODE) {
      const slots = ['12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(time => ({
        time, available: Math.floor(Math.random() * 4) + 1, capacity: 4
      }))
      return { date, slots }
    }
    const response = await fetch(
      `${API_BASE}/bookings/availability?exhibition_id=${exhibitionId}&date=${date}`,
      { headers: getHeaders() }
    )
    if (!response.ok) throw new Error('Failed to fetch availability')
    return response.json()
  },

  async createBooking(data: BookingRequest): Promise<Booking> {
    if (DEMO_MODE) {
      const ex = DEMO_EXHIBITIONS.find(e => e.id === data.exhibition_id)
      return { id: 1, exhibition_id: data.exhibition_id, exhibition_name: ex?.name || '', date: data.date, time: data.time, phone: data.phone, status: 'confirmed', created_at: new Date().toISOString() }
    }
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create booking')
    }
    return response.json()
  },

  async getMyBookings(): Promise<Booking[]> {
    if (DEMO_MODE) return []
    const response = await fetch(`${API_BASE}/bookings/my`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch bookings')
    return response.json()
  },

  async getBooking(id: number): Promise<Booking> {
    if (DEMO_MODE) throw new Error('Demo mode')
    const response = await fetch(`${API_BASE}/bookings/${id}`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch booking')
    return response.json()
  },
}

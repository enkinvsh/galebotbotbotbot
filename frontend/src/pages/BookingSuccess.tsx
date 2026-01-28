import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mainButton } from '@telegram-apps/sdk-react'
import { api } from '../api'

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

export default function BookingSuccess() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBooking()
    
    mainButton.setParams({
      text: 'На главную',
      isVisible: true,
    })
    
    const handleClick = () => navigate('/')
    mainButton.onClick(handleClick)
    
    return () => {
      mainButton.offClick(handleClick)
      if (mainButton.setParams) {
        mainButton.setParams({ isVisible: false })
      }
    }
  }, [navigate, bookingId])

  async function loadBooking() {
    if (!bookingId) {
      setError('Некорректный ID бронирования')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await api.getBooking(Number(bookingId))
      setBooking(data)
    } catch (err) {
      setError('Не удалось загрузить бронирование')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px' }}>Загрузка...</div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--tg-theme-destructive-text-color)', fontSize: '16px' }}>
          {error || 'Бронирование не найдено'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '16px',
      paddingBottom: '80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '48px',
        marginTop: '40px',
        marginBottom: '24px'
      }}>
        ✓
      </div>

      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '600',
        marginBottom: '12px',
        color: 'var(--tg-theme-text-color)'
      }}>
        Бронирование подтверждено!
      </h1>

      <p style={{
        fontSize: '15px',
        color: 'var(--tg-theme-hint-color)',
        marginBottom: '32px',
        lineHeight: '1.5'
      }}>
        Мы отправили вам подтверждение и напомним о визите за 24 часа
      </p>

      <div style={{ 
        width: '100%',
        backgroundColor: 'var(--tg-theme-secondary-bg-color)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'left'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--tg-theme-hint-color)',
            marginBottom: '6px'
          }}>
            Выставка
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            {booking.exhibition_name}
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--tg-theme-hint-color)',
            marginBottom: '6px'
          }}>
            Дата и время
          </div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {new Date(booking.date).toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
            {booking.time}
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--tg-theme-hint-color)',
            marginBottom: '6px'
          }}>
            Адрес
          </div>
          <div style={{ fontSize: '15px' }}>
            Гороховая 49Б, SЕНО, 2 этаж
          </div>
        </div>
        
        <div>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--tg-theme-hint-color)',
            marginBottom: '6px'
          }}>
            Номер бронирования
          </div>
          <div style={{ fontSize: '15px', fontFamily: 'monospace' }}>
            #{booking.id}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '24px',
        fontSize: '14px',
        color: 'var(--tg-theme-hint-color)',
        lineHeight: '1.6'
      }}>
        <div style={{ marginBottom: '8px' }}>
          📍 Мы находимся в 5 минутах от метро Садовая/Сенная
        </div>
        <div>
          💳 Оплата производится на месте
        </div>
      </div>
    </div>
  )
}

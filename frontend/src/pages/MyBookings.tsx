import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadBookings()
    
    let cleanup: (() => void) | undefined
    const setupBackButton = async () => {
      try {
        const sdk = await import('@telegram-apps/sdk-react')
        const backButton = sdk.backButton
        if (backButton && backButton.show) {
          backButton.show()
          const handleBack = () => navigate('/')
          backButton.onClick(handleBack)
          cleanup = () => {
            backButton.offClick(handleBack)
          }
        }
      } catch {
      }
    }
    setupBackButton()
    
    return () => {
      if (cleanup) cleanup()
    }
  }, [navigate])

  async function loadBookings() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getMyBookings()
      setBookings(data.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time).getTime()
        const dateB = new Date(b.date + ' ' + b.time).getTime()
        return dateB - dateA
      }))
    } catch (err) {
      setError('Не удалось загрузить записи')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function isPastBooking(booking: Booking): boolean {
    const bookingDate = new Date(booking.date + ' ' + booking.time)
    return bookingDate < new Date()
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px' }}>Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--tg-theme-destructive-text-color, #e53935)', marginBottom: '16px' }}>
          {error}
        </div>
        <button
          onClick={loadBookings}
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
            color: 'var(--tg-theme-button-text-color, #ffffff)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Повторить
        </button>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(b => !isPastBooking(b) && b.status === 'confirmed')
  const pastBookings = bookings.filter(b => isPastBooking(b) || b.status !== 'confirmed')

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--tg-theme-link-color, #3390ec)',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '0',
          marginBottom: '16px',
        }}
      >
        ← Назад
      </button>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '600',
        marginBottom: '24px',
        color: 'var(--tg-theme-text-color, #000000)'
      }}>
        Мои записи
      </h1>

      {bookings.length === 0 ? (
        <div style={{ 
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--tg-theme-hint-color, #999999)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <div style={{ fontSize: '16px' }}>У вас пока нет записей</div>
        </div>
      ) : (
        <>
          {upcomingBookings.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--tg-theme-hint-color, #999999)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px'
              }}>
                Предстоящие
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {pastBookings.length > 0 && (
            <div>
              <h2 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--tg-theme-hint-color, #999999)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px'
              }}>
                Прошедшие
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pastBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} isPast />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BookingCard({ booking, isPast = false }: { booking: Booking; isPast?: boolean }) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
        borderRadius: '12px',
        opacity: isPast ? 0.7 : 1,
      }}
    >
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '12px'
      }}>
        <h3 style={{ 
          fontSize: '17px', 
          fontWeight: '600',
          color: 'var(--tg-theme-text-color, #000000)',
          margin: 0
        }}>
          {booking.exhibition_name}
        </h3>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: getStatusColor(booking.status),
          backgroundColor: isPast ? 'transparent' : 'rgba(51, 144, 236, 0.1)',
          padding: isPast ? '0' : '4px 8px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          marginLeft: '12px'
        }}>
          {getStatusText(booking.status)}
        </span>
      </div>

      <div style={{ fontSize: '15px', marginBottom: '8px' }}>
        📅 {new Date(booking.date).toLocaleDateString('ru-RU', { 
          weekday: 'short',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>

      <div style={{ fontSize: '15px', marginBottom: '8px' }}>
        🕐 {booking.time}
      </div>

      <div style={{ 
        fontSize: '13px', 
        color: 'var(--tg-theme-hint-color, #999999)',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--tg-theme-hint-color)'
      }}>
        Бронирование #{booking.id}
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  if (status === 'confirmed') return 'var(--tg-theme-button-color, #3390ec)'
  if (status === 'cancelled') return 'var(--tg-theme-destructive-text-color, #e53935)'
  return 'var(--tg-theme-hint-color, #999999)'
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    confirmed: 'Подтверждено',
    cancelled: 'Отменено',
    completed: 'Завершено',
  }
  return statusMap[status] || status
}

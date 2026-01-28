import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mainButton } from '@telegram-apps/sdk-react'
import { api } from '../api'

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

export default function ExhibitionList() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadExhibitions()
    
    mainButton.setParams({
      text: 'Мои записи',
      isVisible: true,
    })
    
    const handleClick = () => navigate('/my-bookings')
    mainButton.onClick(handleClick)
    
    return () => {
      mainButton.offClick(handleClick)
      if (mainButton.setParams) {
        mainButton.setParams({ isVisible: false })
      }
    }
  }, [navigate])

  async function loadExhibitions() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getExhibitions()
      setExhibitions(data.filter(e => e.active))
    } catch (err) {
      setError('Не удалось загрузить выставки')
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

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--tg-theme-destructive-text-color)', marginBottom: '16px' }}>
          {error}
        </div>
        <button
          onClick={loadExhibitions}
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--tg-theme-button-color)',
            color: 'var(--tg-theme-button-text-color)',
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

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '600',
        marginBottom: '8px',
        color: 'var(--tg-theme-text-color)'
      }}>
        Gallery Way
      </h1>
      <p style={{ 
        fontSize: '14px', 
        color: 'var(--tg-theme-hint-color)',
        marginBottom: '24px'
      }}>
        Гороховая 49Б, SЕНО, 2 этаж
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {exhibitions.map(exhibition => (
          <div
            key={exhibition.id}
            onClick={() => navigate(`/book/${exhibition.id}`)}
            style={{
              padding: '16px',
              backgroundColor: 'var(--tg-theme-secondary-bg-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.opacity = '0.7'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--tg-theme-text-color)'
            }}>
              {exhibition.name}
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--tg-theme-text-color)',
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              {exhibition.description}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px'
            }}>
              <div style={{ color: 'var(--tg-theme-hint-color)' }}>
                {exhibition.schedule_text}
              </div>
              <div style={{ 
                fontWeight: '600',
                color: 'var(--tg-theme-button-color)',
                fontSize: '16px'
              }}>
                {exhibition.price} ₽
              </div>
            </div>
            <div style={{ 
              marginTop: '8px',
              fontSize: '13px',
              color: 'var(--tg-theme-hint-color)'
            }}>
              Продолжительность: {exhibition.duration_minutes} минут
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

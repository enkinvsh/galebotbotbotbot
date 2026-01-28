import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

interface TimeSlot {
  time: string
  available: number
  capacity: number
}

type Step = 'date' | 'time' | 'phone' | 'confirm'

export default function BookingFlow() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>()
  const navigate = useNavigate()
  
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [phone, setPhone] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExhibition()
  }, [exhibitionId])

  async function loadExhibition() {
    try {
      const data = await api.getExhibitions()
      const found = data.find(e => e.id === Number(exhibitionId))
      if (found) {
        setExhibition(found)
      } else {
        setError('Выставка не найдена')
      }
    } catch (err) {
      setError('Ошибка загрузки')
      console.error(err)
    }
  }

  async function loadTimeSlots(date: string) {
    if (!exhibitionId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAvailability(Number(exhibitionId), date)
      setTimeSlots(data.slots)
    } catch (err) {
      setError('Не удалось загрузить расписание')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function submitBooking() {
    if (!exhibitionId) return
    
    try {
      setSubmitting(true)
      setError(null)
      const booking = await api.createBooking({
        exhibition_id: Number(exhibitionId),
        date: selectedDate,
        time: selectedTime,
        phone: phone,
      })
      navigate(`/success/${booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка бронирования')
      setSubmitting(false)
    }
  }

  function isDateValid(date: string): boolean {
    if (!exhibition || !date) return false
    const dayOfWeek = new Date(date).getDay()
    return exhibition.schedule_days.includes(dayOfWeek)
  }

  function isPhoneValid(value: string): boolean {
    return /^\+7\d{10}$/.test(value)
  }

  function formatPhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits[0] === '7') {
      return '+' + digits.slice(0, 11)
    }
    if (digits[0] === '8') {
      return '+7' + digits.slice(1, 11)
    }
    return '+7' + digits.slice(0, 10)
  }

  function goBack() {
    if (step === 'date') {
      navigate('/')
    } else if (step === 'time') {
      setStep('date')
      setSelectedTime('')
      setTimeSlots([])
    } else if (step === 'phone') {
      setStep('time')
      setPhone('')
    } else if (step === 'confirm') {
      setStep('phone')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (!exhibition) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {error ? (
          <div style={{ color: 'var(--tg-theme-destructive-text-color)' }}>
            {error}
          </div>
        ) : (
          <div>Загрузка...</div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      <button
        onClick={goBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--tg-theme-link-color)',
          fontSize: '16px',
          marginBottom: '16px',
          padding: 0,
        }}
      >
        ← Назад
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: '600',
          marginBottom: '8px',
          color: 'var(--tg-theme-text-color)'
        }}>
          {exhibition.name}
        </h1>
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--tg-theme-hint-color)'
        }}>
          {exhibition.schedule_text} • {exhibition.duration_minutes} мин • {exhibition.price} ₽
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          borderRadius: '8px',
          color: 'var(--tg-theme-destructive-text-color)',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {step === 'date' && (
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '12px',
            color: 'var(--tg-theme-text-color)'
          }}>
            Выберите дату
          </label>
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => {
              const newDate = e.target.value
              setSelectedDate(newDate)
              setError(null)
              if (isDateValid(newDate)) {
                loadTimeSlots(newDate)
                setStep('time')
              } else if (newDate) {
                setError('Выставка не работает в этот день')
              }
            }}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              border: '1px solid var(--tg-theme-hint-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--tg-theme-bg-color)',
              color: 'var(--tg-theme-text-color)',
            }}
          />
          <div style={{
            marginTop: '12px',
            fontSize: '13px',
            color: 'var(--tg-theme-hint-color)',
            lineHeight: '1.5'
          }}>
            Расписание: {exhibition.schedule_text}
          </div>
        </div>
      )}

      {step === 'time' && (
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '12px',
            color: 'var(--tg-theme-text-color)'
          }}>
            Выберите время
          </label>
          <div style={{
            fontSize: '14px',
            color: 'var(--tg-theme-hint-color)',
            marginBottom: '16px'
          }}>
            {new Date(selectedDate).toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Загрузка расписания...
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {timeSlots.map(slot => {
                  const isAvailable = slot.available > 0
                  const isSelected = selectedTime === slot.time
                  
                  return (
                    <button
                      key={slot.time}
                      disabled={!isAvailable}
                      onClick={() => setSelectedTime(slot.time)}
                      style={{
                        padding: '16px 8px',
                        fontSize: '15px',
                        fontWeight: isSelected ? '600' : '500',
                        border: isSelected 
                          ? '2px solid var(--tg-theme-button-color)' 
                          : '1px solid var(--tg-theme-hint-color)',
                        borderRadius: '8px',
                        backgroundColor: isSelected 
                          ? 'var(--tg-theme-button-color)' 
                          : 'var(--tg-theme-secondary-bg-color)',
                        color: isSelected 
                          ? 'var(--tg-theme-button-text-color)' 
                          : isAvailable 
                            ? 'var(--tg-theme-text-color)' 
                            : 'var(--tg-theme-hint-color)',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        opacity: isAvailable ? 1 : 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <div>{slot.time}</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        {slot.available}/{slot.capacity}
                      </div>
                    </button>
                  )
                })}
              </div>
              {selectedTime && (
                <button
                  onClick={() => setStep('phone')}
                  style={{
                    marginTop: '24px',
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'var(--tg-theme-button-color)',
                    color: 'var(--tg-theme-button-text-color)',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  Далее
                </button>
              )}
            </>
          )}
        </div>
      )}

      {step === 'phone' && (
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '12px',
            color: 'var(--tg-theme-text-color)'
          }}>
            Номер телефона
          </label>
          <input
            type="tel"
            placeholder="+7XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              border: `1px solid ${isPhoneValid(phone) ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)'}`,
              borderRadius: '8px',
              backgroundColor: 'var(--tg-theme-bg-color)',
              color: 'var(--tg-theme-text-color)',
            }}
          />
          <div style={{
            marginTop: '12px',
            fontSize: '13px',
            color: 'var(--tg-theme-hint-color)'
          }}>
            Мы отправим вам подтверждение и напоминание
          </div>
          {isPhoneValid(phone) && (
            <button
              onClick={() => setStep('confirm')}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '14px',
                backgroundColor: 'var(--tg-theme-button-color)',
                color: 'var(--tg-theme-button-text-color)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              Подтвердить
            </button>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            marginBottom: '20px',
            color: 'var(--tg-theme-text-color)'
          }}>
            Подтвердите бронирование
          </h2>
          
          <div style={{ 
            backgroundColor: 'var(--tg-theme-secondary-bg-color)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--tg-theme-hint-color)',
                marginBottom: '4px'
              }}>
                Выставка
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {exhibition.name}
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--tg-theme-hint-color)',
                marginBottom: '4px'
              }}>
                Дата и время
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {new Date(selectedDate).toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {' • '}
                {selectedTime}
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--tg-theme-hint-color)',
                marginBottom: '4px'
              }}>
                Телефон
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {phone}
              </div>
            </div>
            
            <div style={{ 
              paddingTop: '12px',
              borderTop: '1px solid var(--tg-theme-hint-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
                К оплате
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>
                {exhibition.price} ₽
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '13px',
            color: 'var(--tg-theme-hint-color)',
            lineHeight: '1.5',
            marginBottom: '24px'
          }}>
            Оплата производится на месте. Мы отправим вам подтверждение и напомним о визите за 24 часа.
          </div>

          <button
            onClick={submitBooking}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '500',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Бронируем...' : 'Забронировать'}
          </button>
        </div>
      )}
    </div>
  )
}

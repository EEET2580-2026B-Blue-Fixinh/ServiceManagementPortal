import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:9443/api/v1'
).replace(/\/$/, '')

const SERVICE_TOKEN = import.meta.env.VITE_SMT_SERVICE_TOKEN || ''

function formatDate(value) {
  if (!value) return 'Not provided'

  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatTime(value) {
  return value ? value.slice(0, 5) : '—'
}

function App() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadBookings = useCallback(async (signal) => {
    setLoading(true)
    setError('')

    if (!SERVICE_TOKEN) {
      setError('VITE_SMT_SERVICE_TOKEN is not configured.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings?status=CREATED`,
        {
          signal,
          headers: {
            Authorization: `Bearer ${SERVICE_TOKEN}`,
            Accept: 'application/json',
          },
        },
      )

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          body?.message || `The booking API returned HTTP ${response.status}.`,
        )
      }

      const items = Array.isArray(body) ? body : body?.items || []

      setBookings(items)
      setLastUpdated(new Date())
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message || 'Unable to load the booking queue.')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const requestTimer = window.setTimeout(
      () => loadBookings(controller.signal),
      0,
    )

    return () => {
      window.clearTimeout(requestTimer)
      controller.abort()
    }
  }, [loadBookings])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>Fixinh</strong>
            <span>Service Management Portal</span>
          </div>
        </div>

        <span className="environment">Reception workspace</span>
      </header>

      <main>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Booking operations</p>
            <h1>Reception queue</h1>
            <p className="subtitle">
              Review newly created service bookings awaiting confirmation.
            </p>
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={() => loadBookings()}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh queue'}
          </button>
        </section>

        <section className="summary-card" aria-label="Queue summary">
          <div>
            <span>Awaiting confirmation</span>
            <strong>{loading ? '—' : bookings.length}</strong>
          </div>

          <p>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString('en-AU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Waiting for API response'}
          </p>
        </section>

        {loading && (
          <section className="state-card" aria-live="polite">
            <div className="spinner" />
            <div>
              <h2>Loading bookings</h2>
              <p>Connecting to the SMT booking service.</p>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="state-card error-card" role="alert">
            <div>
              <h2>Queue unavailable</h2>
              <p>{error}</p>
            </div>

            <button type="button" onClick={() => loadBookings()}>
              Try again
            </button>
          </section>
        )}

        {!loading && !error && bookings.length === 0 && (
          <section className="state-card empty-card">
            <div>
              <h2>No bookings are waiting</h2>
              <p>The CREATED booking queue is currently empty.</p>
            </div>
          </section>
        )}

        {!loading && !error && bookings.length > 0 && (
          <section className="booking-grid" aria-label="Created bookings">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking.bookingRef}>
                <div className="booking-card-header">
                  <div>
                    <span className="reference-label">Booking reference</span>
                    <h2>{booking.bookingRef}</h2>
                  </div>

                  <span className="status-badge">{booking.status}</span>
                </div>

                <dl className="booking-details">
                  <div>
                    <dt>Customer</dt>
                    <dd>{booking.customerFullName || booking.customerId}</dd>
                  </div>

                  <div>
                    <dt>Service</dt>
                    <dd>{booking.serviceName || booking.serviceId}</dd>
                  </div>

                  <div>
                    <dt>Preferred date</dt>
                    <dd>{formatDate(booking.preferredServiceDate)}</dd>
                  </div>

                  <div>
                    <dt>Available time</dt>
                    <dd>
                      {formatTime(booking.availableStartTime)}–
                      {formatTime(booking.availableEndTime)}
                    </dd>
                  </div>
                </dl>

                {booking.issueDescription && (
                  <div className="issue">
                    <span>Customer notes</span>
                    <p>{booking.issueDescription}</p>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
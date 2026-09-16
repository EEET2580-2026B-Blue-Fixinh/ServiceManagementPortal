const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:9443/api/v1'
).replace(/\/$/, '')

const SERVICE_TOKEN = import.meta.env.VITE_SMT_SERVICE_TOKEN || ''

export async function apiRequest(path, options = {}) {
  if (!SERVICE_TOKEN) {
    throw new Error('VITE_SMT_SERVICE_TOKEN is not configured.')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SERVICE_TOKEN}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      body?.message || `The SMT API returned HTTP ${response.status}.`,
    )
  }

  return body
}
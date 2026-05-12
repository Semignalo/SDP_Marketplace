import api from './api'

export async function register(name, email, password, passwordConfirmation, referralCode = null) {
  const payload = {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  }
  if (referralCode) payload.referral_code = referralCode

  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function logout() {
  const { data } = await api.post('/auth/logout')
  return data
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}

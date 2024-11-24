import { supabase } from '../lib/supabaseClient'

// Control de intentos fallidos (lo implementaremos en memoria por ahora)
const failedAttempts = new Map<string, number>()
const LOCK_THRESHOLD = 3
const LOCK_DURATION = 15 * 60 * 1000 // 15 minutos

export const loginUser = async (email: string, password: string) => {
  // Verificar si el usuario está bloqueado
  const attempts = failedAttempts.get(email) || 0
  if (attempts >= LOCK_THRESHOLD) {
    throw new Error('Cuenta bloqueada temporalmente. Intente más tarde.')
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Reset intentos fallidos al lograr login exitoso
    failedAttempts.delete(email)
    return data
  } catch (error) {
    // Incrementar intentos fallidos
    const currentAttempts = (failedAttempts.get(email) || 0) + 1
    failedAttempts.set(email, currentAttempts)

    if (currentAttempts >= LOCK_THRESHOLD) {
      // Programar el desbloqueo
      setTimeout(() => failedAttempts.delete(email), LOCK_DURATION)
    }

    throw error
  }
}

export const registerUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
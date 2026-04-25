import AsyncStorage from "@react-native-async-storage/async-storage"
import { STORAGE_KEYS } from "./constants"

export async function getSessionToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
}

export async function setSessionToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token)
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.SESSION_TOKEN,
    STORAGE_KEYS.USER_DATA,
  ])
}

export async function getUserData<T>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setUserData<T>(data: T): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data))
}

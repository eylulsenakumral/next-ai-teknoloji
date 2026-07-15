import Constants, { ExecutionEnvironment } from "expo-constants"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { api } from "../api/client"

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

let Notifications: typeof import("expo-notifications") | null = null
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications")
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    })
  } catch {
    // expo-notifications not available
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device.isDevice) return null

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") return null

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      })
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data
    return token
  } catch {
    return null
  }
}

export async function savePushToken(token: string): Promise<void> {
  await api.post("/api/account/push-token", { token, platform: Platform.OS })
}

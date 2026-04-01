// NETGSM SMS Gönderim Servisi
// Kaynak: TamirHanem projesi

const NETGSM_USERCODE = process.env.NETGSM_USERCODE ?? "8503027264"
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD ?? "DA923-4"
const NETGSM_HEADER = process.env.NETGSM_HEADER ?? "NEXTAI"
const NETGSM_OTP_URL = "https://api.netgsm.com.tr/sms/send/otp"

// Türkçe karakterleri ASCII'ye dönüştür
function toAscii(text: string): string {
  return text
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
}

// Telefon numarasını normalize et (90XXXXXXXXXX formatı)
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) cleaned = "90" + cleaned.slice(1)
  if (!cleaned.startsWith("90")) cleaned = "90" + cleaned
  return cleaned
}

const ERROR_MESSAGES: Record<string, string> = {
  "20": "Mesaj metni hatalı veya eksik",
  "30": "Geçersiz kullanıcı adı/şifre",
  "40": "Mesaj başlığı tanımlı değil",
  "50": "Abone SMS alma izni yok",
  "51": "Tekrar eden gönderim",
  "70": "Parametre hatası",
  "80": "Gönderim sınırı aşıldı",
  "85": "Mükerrer gönderim",
}

export interface SMSResult {
  success: boolean
  message: string
  jobId?: string
}

export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  const normalizedPhone = normalizePhone(phone)
  const asciiMessage = toAscii(message)

  if (asciiMessage.length > 160) {
    return { success: false, message: "Mesaj 160 karakteri geçemez." }
  }

  const url = new URL(NETGSM_OTP_URL)
  url.searchParams.set("usercode", NETGSM_USERCODE)
  url.searchParams.set("password", NETGSM_PASSWORD)
  url.searchParams.set("msgheader", NETGSM_HEADER)
  url.searchParams.set("msg", asciiMessage)
  url.searchParams.set("no", normalizedPhone)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const text = await res.text()
    const parts = text.trim().split(" ")
    const code = parts[0]

    if (code === "00") {
      return {
        success: true,
        message: "SMS başarıyla gönderildi.",
        jobId: parts[1],
      }
    }

    return {
      success: false,
      message: ERROR_MESSAGES[code] ?? `NETGSM hata kodu: ${code}`,
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError"
    return {
      success: false,
      message: isTimeout ? "SMS gönderim zaman aşımı (30s)." : "SMS gönderim hatası.",
    }
  }
}

export function isNetGSMConfigured(): boolean {
  return Boolean(NETGSM_USERCODE && NETGSM_PASSWORD && NETGSM_HEADER)
}

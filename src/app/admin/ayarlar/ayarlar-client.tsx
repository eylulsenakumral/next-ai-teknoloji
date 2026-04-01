"use client"

import { useState } from "react"
import {
  Settings,
  MessageSquare,
  TrendingUp,
  Bell,
  Plug,
  Loader2,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toaster"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingMeta {
  value: unknown
  group: string
  description?: string
}

interface Props {
  initialSettings: Record<string, unknown>
}

// ─── Yardımcı — DB'den gelen değeri stringe çevir ─────────────────────────────

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  if (typeof v === "object" && v !== null && "v" in v) return str((v as { v: unknown }).v, fallback)
  return fallback
}

function bool(v: unknown, fallback = false): boolean {
  if (v === null || v === undefined) return fallback
  if (typeof v === "boolean") return v
  if (typeof v === "string") return v === "true" || v === "1"
  if (typeof v === "object" && v !== null && "v" in v) return bool((v as { v: unknown }).v, fallback)
  return fallback
}

// ─── API çağrısı ──────────────────────────────────────────────────────────────

async function saveSettings(
  settings: Record<string, SettingMeta>
): Promise<void> {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? "Bilinmeyen hata oluştu.")
  }
}

// ─── Kaydet Butonu ────────────────────────────────────────────────────────────

function SaveButton({ loading }: { loading: boolean }) {
  return (
    <Button type="submit" disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {loading ? "Kaydediliyor..." : "Kaydet"}
    </Button>
  )
}

// ─── Form Row Helper ──────────────────────────────────────────────────────────

function FormRow({
  id,
  label,
  description,
  children,
}: {
  id?: string
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

// ─── Switch Row ───────────────────────────────────────────────────────────────

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

// ─── TAB: Genel ───────────────────────────────────────────────────────────────

function GenelAyarlar({ initial }: { initial: Record<string, unknown> }) {
  const [siteName, setSiteName] = useState(str(initial["general.site_name"], "Next AI Teknoloji"))
  const [contactEmail, setContactEmail] = useState(str(initial["general.contact_email"]))
  const [contactPhone, setContactPhone] = useState(str(initial["general.contact_phone"]))
  const [currency, setCurrency] = useState(str(initial["general.currency"], "TRY"))
  const [vatRate, setVatRate] = useState(str(initial["general.vat_rate"], "20"))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await saveSettings({
        "general.site_name": { value: siteName, group: "GENERAL", description: "Site adı" },
        "general.contact_email": { value: contactEmail, group: "GENERAL", description: "İletişim e-postası" },
        "general.contact_phone": { value: contactPhone, group: "GENERAL", description: "İletişim telefonu" },
        "general.currency": { value: currency, group: "GENERAL", description: "Para birimi kodu" },
        "general.vat_rate": { value: vatRate, group: "GENERAL", description: "KDV oranı (%)" },
      })
      toast({ title: "Kaydedildi", description: "Genel ayarlar başarıyla güncellendi." })
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Kayıt başarısız.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Site Bilgileri</CardTitle>
          <CardDescription>Platformun temel kimlik ve iletişim bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormRow id="site-name" label="Site Adı">
            <Input
              id="site-name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Next AI Teknoloji"
            />
          </FormRow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow id="contact-email" label="İletişim E-postası">
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@example.com"
              />
            </FormRow>
            <FormRow id="contact-phone" label="İletişim Telefonu">
              <Input
                id="contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+90 850 000 00 00"
              />
            </FormRow>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vergi ve Para Birimi</CardTitle>
          <CardDescription>Fiyatlandırma ve vergi hesaplamalarında kullanılır.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow
              id="currency"
              label="Para Birimi"
              description="ISO 4217 kodu (TRY, USD, EUR)"
            >
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="TRY"
                maxLength={3}
              />
            </FormRow>
            <FormRow
              id="vat-rate"
              label="KDV Oranı (%)"
              description="Varsayılan KDV yüzdesi"
            >
              <Input
                id="vat-rate"
                type="number"
                min="0"
                max="100"
                step="1"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                placeholder="20"
              />
            </FormRow>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SaveButton loading={loading} />
      </div>
    </form>
  )
}

// ─── TAB: WhatsApp ────────────────────────────────────────────────────────────

function WhatsAppAyarlar({ initial }: { initial: Record<string, unknown> }) {
  const [botActive, setBotActive] = useState(bool(initial["WHATSAPP.BOT_ACTIVE"], true))
  const [aiModel, setAiModel] = useState(str(initial["AI_MODEL"] ?? initial["WHATSAPP.AI_MODEL"], "YEDEK"))
  const [baseUrl, setBaseUrl] = useState(str(initial["WHATSAPP.AI_BASE_URL"], "http://192.168.5.249:20128/v1"))
  const [maxTokens, setMaxTokens] = useState(str(initial["WHATSAPP.MAX_TOKENS"], "1024"))
  const [systemPromptExtra, setSystemPromptExtra] = useState(str(initial["WHATSAPP.SYSTEM_PROMPT_EXTRA"]))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await saveSettings({
        "WHATSAPP.BOT_ACTIVE": { value: botActive, group: "WHATSAPP", description: "Bot aktif/pasif" },
        "AI_MODEL": { value: aiModel, group: "WHATSAPP", description: "WhatsApp AI model adı" },
        "WHATSAPP.AI_BASE_URL": { value: baseUrl, group: "WHATSAPP", description: "AI servis base URL" },
        "WHATSAPP.MAX_TOKENS": { value: maxTokens, group: "WHATSAPP", description: "Yanıt başına max token" },
        "WHATSAPP.SYSTEM_PROMPT_EXTRA": { value: systemPromptExtra, group: "WHATSAPP", description: "Sistem prompt eki" },
      })
      toast({ title: "Kaydedildi", description: "WhatsApp bot ayarları güncellendi." })
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Kayıt başarısız.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bot Durumu</CardTitle>
          <CardDescription>AI botun gelen mesajlara otomatik yanıt verip vermeyeceği.</CardDescription>
        </CardHeader>
        <CardContent>
          <SwitchRow
            label="Otomatik Yanıt Aktif"
            description="Kapalıyken gelen mesajlar sadece kaydedilir, yanıtlanmaz."
            checked={botActive}
            onCheckedChange={setBotActive}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AI Model Yapılandırması</CardTitle>
          <CardDescription>Kullanılacak dil modeli ve servis ayarları.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormRow
            id="wa-model"
            label="Model Adı"
            description="LLM servisindeki model tanımlayıcısı (ör: gpt-4o, llama-3.1-70b)"
          >
            <Input
              id="wa-model"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="YEDEK"
            />
          </FormRow>
          <FormRow
            id="wa-base-url"
            label="API Base URL"
            description="OpenAI uyumlu LLM servisinin adresi"
          >
            <Input
              id="wa-base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://192.168.5.249:20128/v1"
            />
          </FormRow>
          <FormRow
            id="wa-max-tokens"
            label="Maks. Token Sayısı"
            description="Her yanıtta üretilebilecek maksimum token"
          >
            <Input
              id="wa-max-tokens"
              type="number"
              min="128"
              max="8192"
              step="128"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              placeholder="1024"
            />
          </FormRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sistem Prompt Eki</CardTitle>
          <CardDescription>
            Varsayılan sistem promptuna ek olarak eklenecek özel talimatlar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={systemPromptExtra}
            onChange={(e) => setSystemPromptExtra(e.target.value)}
            placeholder="Örn: Müşterilere her zaman kampanyaları hatırlat."
            rows={5}
            className="resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {systemPromptExtra.length} karakter
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SaveButton loading={loading} />
      </div>
    </form>
  )
}

// ─── TAB: Fiyatlandırma ───────────────────────────────────────────────────────

function FiyatlandirmaAyarlar({ initial }: { initial: Record<string, unknown> }) {
  const [showVatIncluded, setShowVatIncluded] = useState(bool(initial["pricing.show_vat_included"], true))
  const [roundingRule, setRoundingRule] = useState(str(initial["pricing.rounding_rule"], "none"))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await saveSettings({
        "pricing.show_vat_included": { value: showVatIncluded, group: "PRICING", description: "Fiyatlarda KDV dahil göster" },
        "pricing.rounding_rule": { value: roundingRule, group: "PRICING", description: "Fiyat yuvarlama kuralı" },
      })
      toast({ title: "Kaydedildi", description: "Fiyatlandırma ayarları güncellendi." })
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Kayıt başarısız.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fiyat Gösterimi</CardTitle>
          <CardDescription>Müşterilere fiyatların nasıl gösterileceği.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            label="KDV Dahil Göster"
            description="Aktifken müşterilere KDV dahil fiyat gösterilir."
            checked={showVatIncluded}
            onCheckedChange={setShowVatIncluded}
          />

          <Separator />

          <FormRow
            id="rounding-rule"
            label="Fiyat Yuvarlama"
            description="Hesaplanan satış fiyatına uygulanacak yuvarlama kuralı"
          >
            <select
              id="rounding-rule"
              value={roundingRule}
              onChange={(e) => setRoundingRule(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            >
              <option value="none">Yuvarlama Yok</option>
              <option value="round_up_99">En Yakın .99&apos;a Yuvarla (ör: 149.99)</option>
              <option value="round_10">En Yakın 10&apos;a Yuvarla</option>
              <option value="round_1">En Yakın 1 TL&apos;ye Yuvarla</option>
              <option value="ceil">Yukarı Yuvarla (tavan)</option>
              <option value="floor">Aşağı Yuvarla (taban)</option>
            </select>
          </FormRow>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SaveButton loading={loading} />
      </div>
    </form>
  )
}

// ─── TAB: Bildirimler ─────────────────────────────────────────────────────────

function BildirimAyarlar({ initial }: { initial: Record<string, unknown> }) {
  const [smsActive, setSmsActive] = useState(bool(initial["notification.sms_active"], false))
  const [emailActive, setEmailActive] = useState(bool(initial["notification.email_active"], false))
  const [orderNotify, setOrderNotify] = useState(bool(initial["notification.order_notify"], true))
  const [orderEmailTo, setOrderEmailTo] = useState(str(initial["notification.order_email_to"]))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await saveSettings({
        "notification.sms_active": { value: smsActive, group: "NOTIFICATION", description: "SMS bildirimleri aktif" },
        "notification.email_active": { value: emailActive, group: "NOTIFICATION", description: "E-posta bildirimleri aktif" },
        "notification.order_notify": { value: orderNotify, group: "NOTIFICATION", description: "Sipariş bildirimleri aktif" },
        "notification.order_email_to": { value: orderEmailTo, group: "NOTIFICATION", description: "Sipariş bildirimi gönderilecek e-posta" },
      })
      toast({ title: "Kaydedildi", description: "Bildirim ayarları güncellendi." })
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Kayıt başarısız.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bildirim Kanalları</CardTitle>
          <CardDescription>Hangi kanallar üzerinden bildirim gönderileceği.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 divide-y">
          <div className="pb-4">
            <SwitchRow
              label="SMS Bildirimleri (NetGSM)"
              description="Kritik olaylar için SMS gönderimini etkinleştirir."
              checked={smsActive}
              onCheckedChange={setSmsActive}
            />
          </div>
          <div className="py-4">
            <SwitchRow
              label="E-posta Bildirimleri"
              description="Özet raporlar ve uyarılar e-postayla gönderilir."
              checked={emailActive}
              onCheckedChange={setEmailActive}
            />
          </div>
          <div className="pt-4">
            <SwitchRow
              label="Sipariş Bildirimleri"
              description="Yeni sipariş oluşturulduğunda bildirim gönderilir."
              checked={orderNotify}
              onCheckedChange={setOrderNotify}
            />
          </div>
        </CardContent>
      </Card>

      {(emailActive || orderNotify) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">E-posta Ayarları</CardTitle>
            <CardDescription>Bildirimlerin iletileceği e-posta adresleri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow
              id="order-email-to"
              label="Sipariş Bildirimi Alıcısı"
              description="Birden fazla adres için virgülle ayırın"
            >
              <Input
                id="order-email-to"
                type="text"
                value={orderEmailTo}
                onChange={(e) => setOrderEmailTo(e.target.value)}
                placeholder="admin@example.com, satis@example.com"
              />
            </FormRow>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <SaveButton loading={loading} />
      </div>
    </form>
  )
}

// ─── TAB: Entegrasyonlar ──────────────────────────────────────────────────────

function EntegrasyonAyarlar({ initial }: { initial: Record<string, unknown> }) {
  // BizimHesap
  const [bhApiKey, setBhApiKey] = useState(str(initial["bizimhesap.api_key"]))
  const [bhSyncInterval, setBhSyncInterval] = useState(str(initial["bizimhesap.sync_interval_minutes"], "60"))
  const [bhActive, setBhActive] = useState(bool(initial["bizimhesap.active"], true))

  // NetGSM
  const [netgsmUsercode, setNetgsmUsercode] = useState(str(initial["netgsm.usercode"]))
  const [netgsmPassword, setNetgsmPassword] = useState(str(initial["netgsm.password"]))
  const [netgsmHeader, setNetgsmHeader] = useState(str(initial["netgsm.header"], "NEXTAI"))

  const [loadingBh, setLoadingBh] = useState(false)
  const [loadingNetgsm, setLoadingNetgsm] = useState(false)

  async function handleBizimHesapSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoadingBh(true)
    try {
      await saveSettings({
        "bizimhesap.api_key": { value: bhApiKey, group: "BIZIMHESAP", description: "BizimHesap API anahtarı" },
        "bizimhesap.sync_interval_minutes": { value: bhSyncInterval, group: "BIZIMHESAP", description: "Senkronizasyon aralığı (dakika)" },
        "bizimhesap.active": { value: bhActive, group: "BIZIMHESAP", description: "BizimHesap entegrasyonu aktif" },
      })
      toast({ title: "Kaydedildi", description: "BizimHesap ayarları güncellendi." })
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Kayıt başarısız.",
        variant: "destructive",
      })
    } finally {
      setLoadingBh(false)
    }
  }

  async function handleNetgsmSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoadingNetgsm(true)
    try {
      await saveSettings({
        "netgsm.usercode": { value: netgsmUsercode, group: "NETGSM", description: "NetGSM kullanıcı kodu" },
        "netgsm.password": { value: netgsmPassword, group: "NETGSM", description: "NetGSM şifre" },
        "netgsm.header": { value: netgsmHeader, group: "NETGSM", description: "SMS başlığı (gönderici adı)" },
      })
      toast({ title: "Kaydedildi", description: "NetGSM ayarları güncellendi." })
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Kayıt başarısız.",
        variant: "destructive",
      })
    } finally {
      setLoadingNetgsm(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* BizimHesap */}
      <form onSubmit={handleBizimHesapSubmit}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">BizimHesap ERP</CardTitle>
                <CardDescription className="mt-0.5">
                  Ürün, stok ve müşteri senkronizasyonu için API yapılandırması.
                </CardDescription>
              </div>
              <SwitchRow
                label=""
                checked={bhActive}
                onCheckedChange={setBhActive}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow
              id="bh-api-key"
              label="API Anahtarı"
              description="BizimHesap hesabınızdan alınan API anahtarı"
            >
              <Input
                id="bh-api-key"
                type="password"
                value={bhApiKey}
                onChange={(e) => setBhApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="off"
              />
            </FormRow>
            <FormRow
              id="bh-sync-interval"
              label="Senkronizasyon Aralığı (dakika)"
              description="Otomatik sync işleminin ne sıklıkla çalışacağı"
            >
              <Input
                id="bh-sync-interval"
                type="number"
                min="10"
                max="1440"
                step="10"
                value={bhSyncInterval}
                onChange={(e) => setBhSyncInterval(e.target.value)}
                placeholder="60"
              />
            </FormRow>
          </CardContent>
          <div className="flex justify-end px-6 pb-6">
            <SaveButton loading={loadingBh} />
          </div>
        </Card>
      </form>

      {/* NetGSM */}
      <form onSubmit={handleNetgsmSubmit}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">NetGSM SMS</CardTitle>
            <CardDescription>
              OTP ve bildirim SMS&apos;leri için NetGSM hesabı yapılandırması.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormRow
                id="netgsm-usercode"
                label="Kullanıcı Kodu"
                description="NetGSM hesap kullanıcı kodu"
              >
                <Input
                  id="netgsm-usercode"
                  value={netgsmUsercode}
                  onChange={(e) => setNetgsmUsercode(e.target.value)}
                  placeholder="8503XXXXXXX"
                  autoComplete="off"
                />
              </FormRow>
              <FormRow
                id="netgsm-password"
                label="Şifre"
                description="NetGSM hesap şifresi"
              >
                <Input
                  id="netgsm-password"
                  type="password"
                  value={netgsmPassword}
                  onChange={(e) => setNetgsmPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="off"
                />
              </FormRow>
            </div>
            <FormRow
              id="netgsm-header"
              label="SMS Başlığı"
              description="Alıcıda görünecek gönderici adı (max 11 karakter)"
            >
              <Input
                id="netgsm-header"
                value={netgsmHeader}
                onChange={(e) => setNetgsmHeader(e.target.value.slice(0, 11))}
                placeholder="NEXTAI"
                maxLength={11}
              />
            </FormRow>
          </CardContent>
          <div className="flex justify-end px-6 pb-6">
            <SaveButton loading={loadingNetgsm} />
          </div>
        </Card>
      </form>
    </div>
  )
}

// ─── Root Client Component ────────────────────────────────────────────────────

export function AyarlarClient({ initialSettings }: Props) {
  return (
    <Tabs defaultValue="genel">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="genel">
          <Settings className="h-4 w-4" />
          Genel
        </TabsTrigger>
        <TabsTrigger value="whatsapp">
          <MessageSquare className="h-4 w-4" />
          WhatsApp Bot
        </TabsTrigger>
        <TabsTrigger value="fiyatlandirma">
          <TrendingUp className="h-4 w-4" />
          Fiyatlandırma
        </TabsTrigger>
        <TabsTrigger value="bildirimler">
          <Bell className="h-4 w-4" />
          Bildirimler
        </TabsTrigger>
        <TabsTrigger value="entegrasyonlar">
          <Plug className="h-4 w-4" />
          Entegrasyonlar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="genel" className="mt-4">
        <GenelAyarlar initial={initialSettings} />
      </TabsContent>

      <TabsContent value="whatsapp" className="mt-4">
        <WhatsAppAyarlar initial={initialSettings} />
      </TabsContent>

      <TabsContent value="fiyatlandirma" className="mt-4">
        <FiyatlandirmaAyarlar initial={initialSettings} />
      </TabsContent>

      <TabsContent value="bildirimler" className="mt-4">
        <BildirimAyarlar initial={initialSettings} />
      </TabsContent>

      <TabsContent value="entegrasyonlar" className="mt-4">
        <EntegrasyonAyarlar initial={initialSettings} />
      </TabsContent>
    </Tabs>
  )
}

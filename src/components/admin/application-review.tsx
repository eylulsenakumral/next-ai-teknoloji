"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ApplicationDetail {
  id: string
  companyName: string
  contactName: string
  phone: string
  email: string
  city: string | null
  address: string | null
  taxOffice: string | null
  taxNumber: string | null
  taxCertificateUrl: string | null
  businessType: string | null
  referenceInfo: string | null
  adminNotes: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO"
  createdAt: string
  reviewedAt: string | null
  customer: { dealerCode: string; status: string } | null
}

interface ApproveResult {
  dealerCode: string
  tempPassword: string
}

interface Props {
  applicationId: string
  open: boolean
  onClose: () => void
  onDone: () => void
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekleyen",
  APPROVED: "Onaylı",
  REJECTED: "Reddedilmiş",
  NEEDS_INFO: "Bilgi Bekleniyor",
}

export function ApplicationReview({ applicationId, open, onClose, onDone }: Props) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [approveResult, setApproveResult] = useState<ApproveResult | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !applicationId) return

    setLoading(true)
    setError(null)
    setApproveResult(null)
    setAdminNotes("")

    fetch(`/api/applications/${applicationId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setApplication(json.data)
          setAdminNotes(json.data.adminNotes ?? "")
        } else {
          setError("Başvuru yüklenemedi.")
        }
      })
      .catch(() => setError("Sunucu hatası."))
      .finally(() => setLoading(false))
  }, [open, applicationId])

  async function handleAction(action: "approve" | "reject" | "needs_info") {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? "İşlem başarısız.")
        return
      }

      if (action === "approve" && json.dealerCode) {
        setApproveResult({
          dealerCode: json.dealerCode,
          tempPassword: json.tempPassword,
        })
      } else {
        onDone()
      }
    } catch {
      setError("Sunucu hatası.")
    } finally {
      setSubmitting(false)
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const canAct =
    application &&
    !["APPROVED", "REJECTED"].includes(application.status) &&
    !approveResult

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Başvuru Detayı</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Onay Sonucu */}
        {approveResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Başvuru onaylandı! Bayi hesabı oluşturuldu.</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded border p-3">
                <p className="text-xs text-slate-500 mb-1">Bayi Kodu</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lg">{approveResult.dealerCode}</span>
                  <button
                    onClick={() => copyToClipboard(approveResult.dealerCode, "code")}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    {copiedField === "code" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded border p-3">
                <p className="text-xs text-slate-500 mb-1">Geçici Şifre</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lg">{approveResult.tempPassword}</span>
                  <button
                    onClick={() => copyToClipboard(approveResult.tempPassword, "pass")}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    {copiedField === "pass" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-green-600">
              Bu bilgiler e-posta ile bayiye iletildi. Sayfayı kapatmadan önce
              geçici şifreyi not alın.
            </p>
            <Button onClick={onDone} className="w-full">
              Kapat
            </Button>
          </div>
        )}

        {application && !approveResult && (
          <div className="space-y-4">
            {/* Durum badge */}
            <div className="flex items-center justify-between">
              <Badge
                variant={
                  application.status === "APPROVED"
                    ? "default"
                    : application.status === "REJECTED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {STATUS_LABELS[application.status]}
              </Badge>
              <span className="text-xs text-slate-400">
                {new Date(application.createdAt).toLocaleString("tr-TR")}
              </span>
            </div>

            {/* Firma */}
            <section className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-blue-600" />
                Firma Bilgileri
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-slate-400">Firma Adı</dt>
                  <dd className="font-medium">{application.companyName}</dd>
                </div>
                {application.businessType && (
                  <div>
                    <dt className="text-slate-400">Faaliyet Alanı</dt>
                    <dd>{application.businessType}</dd>
                  </div>
                )}
                {application.taxOffice && (
                  <div>
                    <dt className="text-slate-400">Vergi Dairesi</dt>
                    <dd>{application.taxOffice}</dd>
                  </div>
                )}
                {application.taxNumber && (
                  <div>
                    <dt className="text-slate-400">Vergi No</dt>
                    <dd className="font-mono">{application.taxNumber}</dd>
                  </div>
                )}
                {application.taxCertificateUrl && (
                  <div className="col-span-2">
                    <dt className="text-slate-400 mb-1">Vergi Levhası</dt>
                    <dd>
                      {application.taxCertificateUrl.startsWith("data:") ? (
                        <div className="space-y-2">
                          {application.taxCertificateUrl.startsWith("data:image/") ? (
                            <img
                              src={application.taxCertificateUrl}
                              alt="Vergi Levhası"
                              className="max-w-xs max-h-48 rounded border object-contain"
                            />
                          ) : (
                            <embed
                              src={application.taxCertificateUrl}
                              type="application/pdf"
                              className="w-full h-48 rounded border"
                            />
                          )}
                          <a
                            href={application.taxCertificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline text-xs inline-block"
                          >
                            Yeni sekmede aç
                          </a>
                        </div>
                      ) : (
                        <a
                          href={application.taxCertificateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs"
                        >
                          Görüntüle
                        </a>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* İletişim */}
            <section className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                İletişim
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> Yetkili
                  </dt>
                  <dd className="font-medium">{application.contactName}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefon
                  </dt>
                  <dd>{application.phone}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-posta
                  </dt>
                  <dd>{application.email}</dd>
                </div>
              </dl>
            </section>

            {/* Adres */}
            {(application.city || application.address) && (
              <section className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Adres
                </h3>
                <div className="text-sm">
                  {application.city && (
                    <span className="font-medium">{application.city}</span>
                  )}
                  {application.address && (
                    <p className="text-slate-600 mt-0.5">{application.address}</p>
                  )}
                </div>
              </section>
            )}

            {/* Referans */}
            {application.referenceInfo && (
              <section className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Referans Bilgisi
                </h3>
                <p className="text-sm text-slate-600">{application.referenceInfo}</p>
              </section>
            )}

            {/* Admin Notu */}
            <div>
              <Label htmlFor="adminNotes" className="text-sm font-medium">
                Admin Notu
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ret sebebi, ek bilgi talebi veya onay notu..."
                rows={3}
                disabled={!canAct}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Aksiyonlar */}
        {canAct && (
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => handleAction("needs_info")}
              disabled={submitting}
              className="flex-1"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Bilgi İste
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction("reject")}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reddet
            </Button>
            <Button
              onClick={() => handleAction("approve")}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Onayla
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

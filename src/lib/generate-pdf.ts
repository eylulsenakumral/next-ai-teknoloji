import jsPDF from "jspdf"
import html2canvas from "html2canvas"

/**
 * HTML alıp PDF olarak indiren yardımcı fonksiyon.
 * Puppeteer gerektirmez — tüm işlemler client-side yapılır.
 */
export async function downloadPdfFromHtml(
  apiUrl: string,
  filename: string,
): Promise<void> {
  // 1. HTML'i API'den al
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error("PDF oluşturulamadı")
  const html = await res.text()

  // 2. Gizli container'a HTML'i yerleştir
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = "794px" // A4 genişliği ~210mm @ 96dpi
  container.style.background = "white"
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    // 3. html2canvas ile görüntüye çevir
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
    })

    // 4. jsPDF ile PDF oluştur
    const imgWidth = 210 // A4 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pdf = new jsPDF("p", "mm", "a4")

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      position,
      imgWidth,
      imgHeight,
    )
    heightLeft -= 297 // A4 yüksekliği mm

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
      )
      heightLeft -= 297
    }

    // 5. İndir
    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}

import { PageContentManager, type PageConfig } from "../page-content-manager"

const config: PageConfig = {
  title: "Anasayfa Yönetimi",
  description: "Anasayfadaki tüm içerik bloklarını yönetin — hero, neden biz, süreç, özellikler, yorumlar ve SSS.",
  sections: [
    {
      type: "heroSlides",
      label: "Hero Slaytları",
      filter: undefined,
      columns: [
        { key: "label", label: "Etiket" },
        { key: "title", label: "Başlık" },
      ],
      fields: [
        { key: "label", label: "Etiket (Güvenlik, Yangın...)", type: "text" },
        { key: "title", label: "Başlık", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
        { key: "accent", label: "Vurgu kelimesi", type: "text" },
        { key: "ctaText", label: "Buton yazısı", type: "text" },
        { key: "ctaHref", label: "Buton linki", type: "text" },
      ],
    },
    {
      type: "brands",
      label: "Marka Logoları",
      filter: undefined,
      columns: [
        { key: "name", label: "Marka" },
        { key: "logoUrl", label: "Logo" },
      ],
      fields: [
        { key: "name", label: "Marka Adı", type: "text" },
        { key: "slug", label: "Slug (URL)", type: "text" },
        { key: "logoUrl", label: "Logo", type: "image" },
        { key: "websiteUrl", label: "Web Sitesi", type: "text" },
      ],
    },
    {
      type: "categories",
      label: "Kategoriler",
      filter: undefined,
      columns: [
        { key: "name", label: "Kategori" },
        { key: "sortOrder", label: "Sıra" },
      ],
      fields: [
        { key: "name", label: "Kategori Adı", type: "text" },
        { key: "slug", label: "Slug (URL)", type: "text" },
        { key: "imageUrl", label: "Görsel", type: "image" },
        { key: "sortOrder", label: "Sıra", type: "text" },
      ],
    },
    {
      type: "pageSections",
      label: "Neden Biz?",
      filter: { key: "section", value: "WHY" },
      columns: [
        { key: "title", label: "Başlık" },
        { key: "iconName", label: "İkon" },
      ],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
        { key: "iconName", label: "İkon (lucide: ShieldCheck, Truck...)", type: "text" },
        { key: "bgClass", label: "Arka plan class", type: "text" },
        { key: "page", label: "Sayfa", type: "select" },
        { key: "section", label: "Section adı", type: "text" },
      ],
    },
    {
      type: "pageSections",
      label: "Süreç",
      filter: { key: "section", value: "PROCESS" },
      columns: [
        { key: "label", label: "No" },
        { key: "title", label: "Başlık" },
      ],
      fields: [
        { key: "label", label: "Numara (01, 02...)", type: "text" },
        { key: "title", label: "Başlık", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
        { key: "iconName", label: "İkon", type: "text" },
        { key: "page", label: "Sayfa", type: "select" },
        { key: "section", label: "Section adı", type: "text" },
      ],
    },
    {
      type: "pageSections",
      label: "Hakkımızda Özellikleri",
      filter: { key: "section", value: "ABOUT_FEATURES" },
      columns: [{ key: "title", label: "Başlık" }],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
        { key: "page", label: "Sayfa", type: "select" },
        { key: "section", label: "Section adı", type: "text" },
      ],
    },
    {
      type: "testimonials",
      label: "Bayi Yorumları",
      filter: undefined,
      columns: [
        { key: "authorName", label: "Ad" },
        { key: "rating", label: "Puan" },
      ],
      fields: [
        { key: "authorName", label: "Ad Soyad", type: "text" },
        { key: "authorTitle", label: "Ünvan / Şehir", type: "text" },
        { key: "authorInitials", label: "Baş harfler (MK)", type: "text" },
        { key: "quote", label: "Yorum", type: "textarea" },
        { key: "rating", label: "Puan (1-5)", type: "text" },
      ],
    },
    {
      type: "faqs",
      label: "SSS (Anasayfa)",
      filter: { key: "group", value: "GENERAL" },
      columns: [
        { key: "question", label: "Soru" },
        { key: "group", label: "Sayfa" },
      ],
      fields: [
        { key: "question", label: "Soru", type: "text" },
        { key: "answer", label: "Cevap", type: "textarea" },
        { key: "group", label: "Sayfa", type: "select" },
      ],
    },
    {
      type: "blog",
      label: "Blog Yazıları",
      filter: undefined,
      columns: [
        { key: "title", label: "Başlık" },
        { key: "readTime", label: "Süre" },
      ],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "slug", label: "URL (slug)", type: "text" },
        { key: "excerpt", label: "Özet", type: "textarea" },
        { key: "content", label: "İçerik (Markdown)", type: "textarea" },
        { key: "imageUrl", label: "Görsel URL", type: "text" },
        { key: "readTime", label: "Okuma Süresi", type: "text" },
      ],
    },
  ],
}

export default function AnasayfaPage() {
  return <PageContentManager config={config} />
}

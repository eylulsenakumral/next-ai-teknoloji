import { PageContentManager, type PageConfig } from "../page-content-manager"

const config: PageConfig = {
  title: "Çözümler Sayfası Yönetimi",
  description: "Çözümler, ileri analitik, sektörler, referans projeler, değer önermeleri ve SSS yönetimi.",
  sections: [
    {
      type: "solutions",
      label: "Ana Çözümler",
      filter: { key: "category", value: "MAIN" },
      columns: [
        { key: "number", label: "#" },
        { key: "title", label: "Başlık" },
        { key: "category", label: "Tip" },
      ],
      fields: [
        { key: "number", label: "Numara", type: "text" },
        { key: "title", label: "Başlık", type: "text" },
        { key: "tagline", label: "Alt Başlık", type: "text" },
        { key: "icon", label: "İkon (IcnCamera...)", type: "text" },
        { key: "gradient", label: "Gradient", type: "text" },
        { key: "category", label: "Kategori", type: "select" },
        { key: "description", label: "Açıklama", type: "textarea" },
        { key: "brands", label: "Markalar (virgülle)", type: "list" },
        { key: "features", label: "Özellikler (satır başına)", type: "list" },
      ],
    },
    {
      type: "solutions",
      label: "İleri Analitik",
      filter: { key: "category", value: "ANALYTICS" },
      columns: [{ key: "title", label: "Başlık" }],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "icon", label: "İkon", type: "text" },
        { key: "gradient", label: "Gradient", type: "text" },
        { key: "category", label: "Kategori", type: "select" },
        { key: "description", label: "Açıklama", type: "textarea" },
      ],
    },
    {
      type: "sectors",
      label: "Sektörler",
      filter: undefined,
      columns: [{ key: "title", label: "Başlık" }],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "icon", label: "İkon", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
      ],
    },
    {
      type: "references",
      label: "Referans Projeler",
      filter: undefined,
      columns: [{ key: "title", label: "Başlık" }],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "icon", label: "İkon", type: "text" },
        { key: "tags", label: "Etiketler (virgülle)", type: "list" },
        { key: "description", label: "Açıklama", type: "textarea" },
      ],
    },
    {
      type: "pageSections",
      label: "Değer Önermeleri",
      filter: { key: "section", value: "VALUE_PROPS" },
      columns: [{ key: "title", label: "Başlık" }],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
        { key: "iconName", label: "İkon", type: "text" },
        { key: "page", label: "Sayfa", type: "select" },
        { key: "section", label: "Section adı", type: "text" },
      ],
    },
    {
      type: "faqs",
      label: "SSS (Çözümler)",
      filter: { key: "group", value: "COZUMLER" },
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
  ],
}

export default function CozumlerPage() {
  return <PageContentManager config={config} />
}

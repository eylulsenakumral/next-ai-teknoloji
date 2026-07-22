import { PageContentManager, type PageConfig } from "../page-content-manager"

const config: PageConfig = {
  title: "Hakkımızda Sayfası Yönetimi",
  description: "Değerler, tarihçe ve kurumsal bilgiler yönetimi.",
  sections: [
    {
      type: "pageSections",
      label: "Değerler",
      filter: { key: "section", value: "VALUES" },
      columns: [
        { key: "title", label: "Başlık" },
        { key: "iconName", label: "İkon" },
      ],
      fields: [
        { key: "title", label: "Başlık", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
        { key: "iconName", label: "İkon (IcnTarget...)", type: "text" },
        { key: "page", label: "Sayfa", type: "select" },
        { key: "section", label: "Section adı", type: "text" },
      ],
    },
    {
      type: "milestones",
      label: "Tarihçe",
      filter: undefined,
      columns: [
        { key: "year", label: "Yıl" },
        { key: "title", label: "Başlık" },
      ],
      fields: [
        { key: "year", label: "Yıl", type: "text" },
        { key: "title", label: "Başlık", type: "text" },
        { key: "description", label: "Açıklama", type: "textarea" },
      ],
    },
  ],
}

export default function HakkimizdaPage() {
  return <PageContentManager config={config} />
}

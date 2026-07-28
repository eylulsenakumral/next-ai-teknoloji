import { PageContentManager, type PageConfig } from "../page-content-manager"

const config: PageConfig = {
  title: "Blog Yönetimi",
  description: "Blog yazılarını ekleyin, düzenleyin, silin. Markdown desteklenir.",
  sections: [
    {
      type: "blog",
      label: "Tüm Yazılar",
      filter: undefined,
      columns: [
        { key: "title", label: "Başlık" },
        { key: "readTime", label: "Okuma Süresi" },
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

export default function BlogPage() {
  return <PageContentManager config={config} />
}

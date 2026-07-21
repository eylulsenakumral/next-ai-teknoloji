import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, CalendarDays, Clock } from "lucide-react"
import { POSTS } from "./posts"

export const metadata: Metadata = {
  title: "Blog — Güvenlik ve Network Uzman Görüşleri",
  description:
    "IP kamera seçimi, yangın ihbar sistemleri ve network altyapısı üzerine pratik rehberler ve uzman görüşleri.",
  alternates: { canonical: "/blog" },
}

export default function BlogPage() {
  return (
    <div className="bg-[#F5F5F5] font-nx-sans text-slate-900">
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="max-w-2xl">
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
              Blog
            </span>
            <h1 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
              Güvenlik ipuçları ve uzman görüşleri
            </h1>
            <p className="mt-3 text-slate-500">
              Pratik kurulum ipuçları, ürün karşılaştırmaları ve proje deneyimleri.
            </p>
          </div>
          <div className="mt-12 grid gap-[15px] md:grid-cols-3">
            {POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-[15px] bg-white"
              >
                <div className="h-[220px] overflow-hidden">
                  <img
                    src={post.img}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(post.date).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {post.readTime}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold leading-snug text-nx-dark">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{post.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-1 border-b border-nx-dark pb-1 text-xs font-bold uppercase tracking-wider text-nx-dark transition group-hover:border-nx-accent group-hover:text-nx-accent">
                    Devamını Oku <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

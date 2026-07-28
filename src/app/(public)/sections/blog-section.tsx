import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Reveal } from "../reveal"
import { NewsletterForm } from "../newsletter-form"
import { POSTS } from "../home-content"
import { getBlogPosts } from "@/lib/content"

export async function BlogSection() {
  let posts = POSTS

  try {
    const dbPosts = await getBlogPosts(3)
    if (dbPosts.length > 0) {
      posts = dbPosts.map((p) => ({
        title: p.title,
        desc: p.excerpt,
        img: p.imageUrl ?? "/images/cards/blog-kamera.jpg",
        href: `/blog/${p.slug}`,
      }))
    }
  } catch {
    // fallback
  }

  return (
    <>
      <section className="bg-[#F5F5F5] py-20">
        <Reveal>
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
                Blog
              </span>
              <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
                Güvenlik ipuçları ve{" "}
                <span className="font-nx-serif italic text-nx-accent">uzman görüşleri</span>
              </h2>
              <p className="mt-3 text-slate-500">
                Pratik kurulum ipuçları, ürün karşılaştırmaları ve proje deneyimleri.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border-2 border-nx-dark/15 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-nx-dark transition hover:border-nx-accent hover:text-nx-accent"
            >
              Tüm Yazılar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-[15px] md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.title}
                href={post.href}
                className="group overflow-hidden rounded-[15px] bg-white"
              >
                <div className="relative h-[220px] overflow-hidden">
                  <Image
                    src={post.img}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <h3 className="text-lg font-bold leading-snug text-nx-dark">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{post.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 border-b border-nx-dark pb-1 text-xs font-bold uppercase tracking-wider text-nx-dark transition group-hover:border-nx-accent group-hover:text-nx-accent">
                    Devamını Oku <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      <section className="bg-nx-dark py-16 text-white">
        <Reveal>
        <div className="mx-auto grid max-w-[1300px] items-center gap-8 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-nx-heading font-extrabold tracking-tight md:text-3xl">
              Bayi bültenimize abone olun, yeni ürün ve proje fırsatlarından ilk siz haberdar olun.
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              İstediğiniz zaman abonelikten ayrılabilirsiniz.
            </p>
          </div>
          <NewsletterForm />
        </div>
        </Reveal>
      </section>
    </>
  )
}

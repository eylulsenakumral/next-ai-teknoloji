import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react"
import { POSTS, getPost } from "../posts"

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, images: [post.img] },
  }
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const idx = POSTS.findIndex((p) => p.slug === slug)
  const next = POSTS[(idx + 1) % POSTS.length]

  return (
    <div className="bg-[#F5F5F5] font-nx-sans text-slate-900">
      <article className="mx-auto max-w-[860px] px-6 py-16 md:py-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-nx-dark/70 transition hover:text-nx-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Tüm yazılar
        </Link>
        <h1 className="mt-6 text-3xl font-nx-heading font-extrabold tracking-tight md:text-[40px] md:leading-[1.15]">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {new Date(post.date).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {post.readTime} okuma
          </span>
        </div>
        <div className="mt-8 overflow-hidden rounded-[15px]">
          <Image src={post.img} alt={post.title} width={1200} height={340} className="h-[340px] w-full object-cover" />
        </div>
        <div className="mt-10 space-y-10">
          {post.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-nx-heading font-bold tracking-tight text-nx-dark">
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="leading-7 text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
        {/* Sonraki yazı */}
        <Link
          href={`/blog/${next.slug}`}
          className="group mt-14 flex items-center justify-between gap-4 rounded-[15px] bg-white p-6 transition hover:shadow-lg"
        >
          <div>
            <p className="font-nx-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Sonraki yazı
            </p>
            <p className="mt-1 font-bold text-nx-dark group-hover:text-nx-accent">
              {next.title}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nx-accent text-white transition group-hover:bg-nx-dark">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </article>
    </div>
  )
}

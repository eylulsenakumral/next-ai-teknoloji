"use client"

import Link from "next/link"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  image: string
  date: string
  author: string
  link: string
}

interface BlogSectionProps {
  posts: BlogPost[]
  className?: string
}

export function BlogSection({ posts, className = "" }: BlogSectionProps) {
  return (
    <section className={`py-16 bg-[#f4f7fa] ${className}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold mb-12 text-[#0040a4]">Son Blog Yazıları</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px]">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-[20px] overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <p className="text-xs text-[#0040a4]/60 mb-2">
                  {new Date(post.date).toLocaleDateString("tr-TR")} &bull; {post.author}
                </p>
                <h3 className="text-xl font-bold mb-3 text-[#0040a4] leading-snug">
                  {post.title}
                </h3>
                <p className="text-[#0040a4]/70 mb-4 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <Link
                  href={post.link}
                  className="inline-block text-[#0040a4] font-semibold hover:text-[#0040a4] transition-colors duration-200 text-sm"
                >
                  Devamını Oku &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

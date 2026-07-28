import Link from "next/link"

interface PromoBannerItem {
  image: string
  title: string
  discount: string
  cta: string
  href?: string
}

interface PromoBanner2ColProps {
  banners: [PromoBannerItem, PromoBannerItem]
}

export function PromoBanner2Col({ banners }: PromoBanner2ColProps) {
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {banners.map((banner, idx) => (
          <div
            key={idx}
            className="relative rounded-lg overflow-hidden h-[400px]"
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-center pl-8">
              <h3 className="text-4xl font-bold text-white leading-tight">
                {banner.title}
              </h3>
              <p className="text-white mt-2 text-lg">{banner.discount}</p>
              <Link
                href={banner.href ?? "/katalog"}
                className="w-fit mt-4 bg-white text-[var(--color-foreground)] px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                {banner.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

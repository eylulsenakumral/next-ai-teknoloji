"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export interface HeroSlide {
  id: string
  subHeading: string
  title: string
  description: string
  image: string
  mobileImage?: string
  buttonText: string
  buttonLink: string
  textAlign: "left" | "right" | "center"
}

export interface HeroFeature {
  id: string
  image: string
  title: string
  description: string
  link?: string
}

interface HeroBannerProps {
  slides: HeroSlide[]
  features?: HeroFeature[]
}

/**
 * HeroBanner - DT Elektrix template two-column grid hero.
 *
 * Uses the first slide's data for the main hero content.
 * Renders a staggered 2x2 image grid on the left and
 * text content (subheading, title, description, CTA) on the right.
 * Optionally displays 3 feature cards below the hero.
 */
export function HeroBanner({ slides, features }: HeroBannerProps) {
  const slide = slides[0]

  const defaultFeatures: HeroFeature[] = [
    {
      id: "hf-1",
      image:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
      title: "Özel Klavye Fiyatları",
      description: "Premium klavyelerde sınırlı süre özel fırsatlar",
      link: "/katalog?categorySlug=klavye-mouse",
    },
    {
      id: "hf-2",
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      title: "Telefonlarda %25 İndirim",
      description: "En yeni akıllı telefonlarda en iyi fırsatlar",
      link: "/katalog?categorySlug=telefon",
    },
    {
      id: "hf-3",
      image:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80",
      title: "En İyi Kalite Kameralar",
      description: "Profesyonel kameralar en uygun fiyatlara",
      link: "/katalog?categorySlug=kamera",
    },
  ]

  const displayFeatures = features ?? defaultFeatures

  return (
    <section role="banner" className="bg-[#f3f3f3] pt-10 pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* -- Two-column Hero Grid -- */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left column: Staggered 2x2 Image Grid */}
          <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80"
                  alt="VR Headset"
                  fill
                  sizes="(max-width: 1024px) 45vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  priority
                />
              </div>
              <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=400&q=80"
                  alt="Controller"
                  fill
                  sizes="(max-width: 1024px) 45vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
            <div className="space-y-4 mt-8">
              <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80"
                  alt="Laptop"
                  fill
                  sizes="(max-width: 1024px) 45vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
                  alt="Headphones"
                  fill
                  sizes="(max-width: 1024px) 45vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Right column: Content Area */}
          <div className="flex flex-col justify-center animate-fade-in-up animate-delay-200">
            {/* Subheading */}
            <p className="text-sm text-[#0040a4] mb-2 tracking-[2px] uppercase font-medium">
              {slide?.subHeading ?? "COMPUTER & ACCESSORIES"}
            </p>

            {/* Main Title - gradient text */}
            <h1 className="text-[40px] lg:text-[60px] font-bold leading-tight mb-4 bg-gradient-to-r from-[#1e1e1e] to-[#0040a4] bg-clip-text text-transparent">
              {slide?.title ?? "High Quality Laptops & Accessories"}
            </h1>

            {/* Description */}
            <p className="text-[16px] text-[#767676] leading-relaxed mb-6 max-w-[540px]">
              {slide?.description ??
                "En yeni ürünler, en uygun fiyatlar. Kurumsal ve bireysel ihtiyaçlarınıza özel çözümler sunuyoruz."}
            </p>

            {/* CTA Button - gradient with scale */}
            <div>
              <Link
                href={slide?.buttonLink ?? "/katalog"}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0040a4] to-[#1a6fe0] hover:from-[#1e1e1e] hover:to-[#1e1e1e] text-white font-bold py-[9px] px-[32px] rounded-lg transition-all duration-300 text-[16px] hover:scale-[1.02] hover:shadow-lg"
              >
                {slide?.buttonText ?? "Keşfet"}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* -- Feature Cards Section (3 cards) -- */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {displayFeatures.slice(0, 3).map((feature, idx) => (
            <Link
              key={feature.id}
              href={feature.link ?? "#"}
              className="group bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${(idx + 1) * 100}ms` }}
            >
              <div className="relative w-full h-40 overflow-hidden">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-[#1e1e1e] mb-2 text-[16px] group-hover:text-[#0040a4] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#767676] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

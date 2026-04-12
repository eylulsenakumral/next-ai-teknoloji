"use client"

import Link from "next/link"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

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

interface HeroBannerProps {
  slides: HeroSlide[]
}

export function HeroBanner({ slides }: HeroBannerProps) {
  return (
    <section
      role="banner"
      className="relative w-full"
    >
      <div className="container-fluid">
        <div className="row">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            speed={800}
            navigation={true}
            pagination={{ clickable: true }}
            className="w-full rounded-[10px] overflow-hidden"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id} className="relative">
                {/* Desktop Image */}
                <Image
                  src={slide.image}
                  alt={slide.title}
                  width={3840}
                  height={500}
                  priority
                  className="w-full h-[500px] max-[1199px]:h-[450px] max-[767px]:h-[460px] object-cover"
                  sizes="100vw"
                />

                {/* Mobile Image (if provided) */}
                {slide.mobileImage && (
                  <Image
                    src={slide.mobileImage}
                    alt={slide.title}
                    width={750}
                    height={950}
                    className="w-full h-[460px] object-cover hidden max-[767px]:block"
                    sizes="100vw"
                  />
                )}

                {/* Slider Content Overlay */}
                <div
                  className={`absolute inset-0 flex px-[60px] max-[767px]:px-[20px] pointer-events-none ${
                    slide.textAlign === "right"
                      ? "justify-end text-right"
                      : slide.textAlign === "center"
                        ? "justify-center text-center"
                        : "justify-start text-left"
                  }`}
                >
                  {/* Content Box */}
                  <div
                    className={`pointer-events-auto flex flex-col flex-wrap max-w-[750px] w-full py-[20px] px-[40px] max-[767px]:px-[20px] my-[60px] max-[767px]:my-[30px] self-center rounded-[10px]`}
                  >
                    {/* Sub-heading with decorative line */}
                    <p
                      className="text-[10px] max-[767px]:text-[7.5px] font-medium uppercase tracking-[2px] text-[#1e1e1e] inline-block relative w-max mb-[15px]"
                    >
                      {slide.subHeading}
                      {/* Decorative line */}
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 w-[184px] h-px bg-[#2189ff] ${
                          slide.textAlign === "right"
                            ? "right-[110%]"
                            : "left-[110%]"
                        } ${slide.textAlign === "center" ? "hidden" : ""}`}
                      />
                    </p>

                    {/* Heading */}
                    <h2
                      className="text-[25px] md:text-[42px] lg:text-[60px] font-normal text-[#1e1e1e] leading-[1.2em] my-[10px]"
                    >
                      {slide.title}
                    </h2>

                    {/* Description */}
                    <div
                      className="text-[16px] text-[#1e1e1e] leading-[1.5em] mb-[15px]"
                    >
                      {slide.description}
                    </div>

                    {/* Button */}
                    <div className={`mt-[20px] flex flex-wrap ${
                      slide.textAlign === "right"
                        ? "justify-end"
                        : slide.textAlign === "center"
                          ? "justify-center"
                          : "justify-start"
                    }`}>
                      <Link
                        href={slide.buttonLink}
                        className="inline-block bg-[#2189ff] hover:bg-[#1e1e1e] text-white font-bold py-[9px] px-[32px] rounded-lg transition-all duration-300 capitalize text-[16px]"
                      >
                        {slide.buttonText}
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

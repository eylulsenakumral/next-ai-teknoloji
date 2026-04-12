import { Gauge, Palette, Cable, Bot, CheckCircle, Eye, Leaf, MonitorPlay, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { FooterNav } from '../components/FooterNav';

const relatedProducts = [
  {
    id: 5,
    name: 'Next Sound Pro X1',
    price: '8.499,00',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiY7Bm1neQZW9lR2mEJ79lFcBWsSRwMUPWTzCm-3YNH4AFw0E1U7xohqbYBZJq06XUA3hyNQOHiWETL3bYqkqvmBrSzab5UgqankKXYWVUFTlNrfEbgKdQ1HrZPBQJT68QGbWilWekRZm4g3O7eoBeUg7UiiYFiENkfqpgn4tvG4rAbIZiQlXk2O4z7bOvZYm7i0Hwb_0IqHEk0WBexsyd7eZCjstsAAW-TAyMXcbB43vQIy77KLRT0FJwBXSeYxWxcxMUCJuQgKJF',
  },
  {
    id: 6,
    name: 'Next Click Mechanical',
    price: '4.299,00',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwsQeqMGLmghV6AeqLQ0WuCNoYSw-SdYexwVRWcUFq9nQjIx1ggNfVbQZch9KlnYptJfuR9qQd64NCShyab_j_e3m4oIFZSLLn0rGrfJKdnbExBlGs8KpDLurgQjOgyMqXfwEg1OHpHUfjur6YnBHZgfYoVhp-1dY3_u0bQyM7rhE5Smb7lUKP_g-ijP9bh6aLhVb7uKoM-iPi4IJlJh3NheoFzGwRiX6SM8U-p2VAreoa0RqIrTF8pQS2hOqSdN99HvbBMiAlKzxt',
  },
  {
    id: 7,
    name: 'Next Precision Mouse',
    price: '2.199,00',
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&q=80',
  },
  {
    id: 8,
    name: 'Next Echo AI Speaker',
    price: '5.999,00',
    image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=600&q=80',
  },
];

export function ProductDetailPage() {
  return (
    <div className="scroll-smooth bg-[#fcf8fb] text-[#1b1b1d] antialiased">
      <Navbar cartItemCount={2} />
      
      <main className="pt-32 pb-24 max-w-[1440px] mx-auto px-8">
        {/* Product Detail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left: Large Gallery */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="col-span-2 aspect-[4/5] rounded-xl overflow-hidden bg-[#f6f3f5] shadow-sm">
              <img 
                alt="Premium Monitor" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3f5]">
              <img 
                alt="Monitor Side View" 
                className="w-full h-full object-cover hover:opacity-90 transition-opacity" 
                src="https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&q=80"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3f5]">
              <img 
                alt="Technical Ports" 
                className="w-full h-full object-cover hover:opacity-90 transition-opacity" 
                src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&q=80"
              />
            </div>
          </div>
          
          {/* Right: Product Info */}
          <div className="lg:col-span-5 sticky top-32 space-y-10">
            <header className="space-y-4">
              <span className="text-[#0050cb] font-bold tracking-widest text-xs uppercase">
                Premium Koleksiyon
              </span>
              <h1 className="text-4xl font-extrabold text-[#1b1b1d] tracking-tight leading-tight">
                Next Vision Pro AI-X 32" Curved OLED
              </h1>
              <p className="text-lg text-[#424656] font-medium">
                Next AI Teknoloji Signature Series
              </p>
            </header>

            {/* Pricing & CTA */}
            <div className="p-8 rounded-2xl bg-white shadow-[0px_16px_32px_rgba(27,27,29,0.04)] space-y-6">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#1b1b1d]">₺34.999,00</span>
                <a className="text-[#0050cb] text-sm font-medium hover:underline underline-offset-4" href="#">
                  Taksit Seçenekleri
                </a>
              </div>
              <div className="space-y-4">
                <Link
                  to="/sepet"
                  className="block w-full py-4 rounded-xl bg-gradient-to-br from-[#0050cb] to-[#0066ff] text-white font-bold text-center hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Sepete Ekle
                </Link>
                <p className="text-xs text-center text-[#424656]/60">
                  Ücretsiz kargo ve 14 gün iade garantisi ile güvenle alışveriş yapın.
                </p>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f0edef] flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-[#0050cb]" />
                </div>
                <div>
                  <p className="text-xs text-[#424656]">Yenileme Hızı</p>
                  <p className="text-sm font-bold">240Hz Ultra</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f0edef] flex items-center justify-center">
                  <Palette className="w-5 h-5 text-[#0050cb]" />
                </div>
                <div>
                  <p className="text-xs text-[#424656]">Renk Gamutu</p>
                  <p className="text-sm font-bold">%99 DCI-P3</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f0edef] flex items-center justify-center">
                  <Cable className="w-5 h-5 text-[#0050cb]" />
                </div>
                <div>
                  <p className="text-xs text-[#424656]">Bağlantı</p>
                  <p className="text-sm font-bold">HDMI 2.1 & DP</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f0edef] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#0050cb]" />
                </div>
                <div>
                  <p className="text-xs text-[#424656]">Yapay Zeka</p>
                  <p className="text-sm font-bold">AI Image Upscaling</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#c2c6d8]/15">
              <h3 className="font-bold text-[#1b1b1d]">Öne Çıkan Özellikler</h3>
              <ul className="space-y-3 text-sm text-[#424656] leading-relaxed">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#0050cb] mt-0.5 flex-shrink-0" />
                  Dünyanın ilk AI entegreli kavisli OLED paneli ile benzersiz derinlik.
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#0050cb] mt-0.5 flex-shrink-0" />
                  0.03ms (GtG) tepki süresi ile profesyonel gaming performansı.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <section className="mt-32 space-y-12">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-tight mb-8">Ürün Açıklaması</h2>
            <div className="space-y-6 text-lg text-[#424656] leading-relaxed">
              <p>
                Next Vision Pro AI-X, dijital içerik üreticileri ve oyun tutkunları için özel olarak tasarlandı. 
                Geleneksel ekran teknolojilerinin ötesine geçen AI Image Upscaling özelliği, düşük çözünürlüklü 
                içerikleri gerçek zamanlı olarak 4K kalitesine yükseltir.
              </p>
              <p>
                Ergonomik standı ve minimalist metal gövdesi ile çalışma alanınıza sofistike bir dokunuş katar. 
                Her pikselin bağımsız aydınlatıldığı OLED teknolojisi, sonsuz kontrast ve gerçek siyah deneyimi sunar.
              </p>
            </div>
          </div>

          {/* Technical Highlights Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-[#f6f3f5] border border-[#c2c6d8]/10 aspect-video md:aspect-square flex flex-col justify-end">
              <Eye className="w-9 h-9 text-[#0050cb] mb-4" />
              <h4 className="text-xl font-bold mb-2">Göz Sağlığı</h4>
              <p className="text-sm text-[#424656]">
                TÜV Rheinland onaylı düşük mavi ışık ve titreşimsiz ekran teknolojisi.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-[#f6f3f5] border border-[#c2c6d8]/10 aspect-video md:aspect-square flex flex-col justify-end">
              <Leaf className="w-9 h-9 text-[#0050cb] mb-4" />
              <h4 className="text-xl font-bold mb-2">Sürdürülebilirlik</h4>
              <p className="text-sm text-[#424656]">
                %100 geri dönüştürülebilir alüminyum gövde ve çevreci paketleme.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-[#f6f3f5] border border-[#c2c6d8]/10 aspect-video md:aspect-square flex flex-col justify-end">
              <MonitorPlay className="w-9 h-9 text-[#0050cb] mb-4" />
              <h4 className="text-xl font-bold mb-2">Çoklu Bağlantı</h4>
              <p className="text-sm text-[#424656]">
                Aynı anda 3 farklı cihaz girişi ve akıllı geçiş asistanı.
              </p>
            </div>
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="mt-32">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Bunları da sevebilirsiniz</h2>
              <p className="text-[#424656] mt-2">Sizin için seçtiğimiz benzer teknolojik ürünler.</p>
            </div>
            <a className="text-[#0050cb] font-bold hover:underline underline-offset-4 flex items-center gap-2" href="#">
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((product) => (
              <div 
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden hover:shadow-[0px_32px_64px_rgba(27,27,29,0.02)] transition-all duration-300"
              >
                <div className="aspect-square bg-[#f6f3f5] relative overflow-hidden">
                  <img 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    src={product.image}
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-[#1b1b1d]">{product.name}</h3>
                  <p className="text-lg font-black text-[#0050cb]">₺{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <FooterNav />
    </div>
  );
}

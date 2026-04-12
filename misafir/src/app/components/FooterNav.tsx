import { Send, Share2, Globe, Users } from 'lucide-react';

export function FooterNav() {
  return (
    <footer className="w-full mt-32 bg-[#f0edef]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-24 max-w-[1440px] mx-auto">
        <div className="space-y-6">
          <div className="text-lg font-bold text-[#1b1b1d]">Next AI Teknoloji</div>
          <p className="text-sm leading-relaxed text-[#1b1b1d]/60">
            Geleceğin teknolojisini bugünden sizinle buluşturan Türkiye'nin en inovatif AI teknoloji marketi.
          </p>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-[#eae7ea] flex items-center justify-center hover:text-[#0050cb] transition-colors">
              <Users className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#eae7ea] flex items-center justify-center hover:text-[#0050cb] transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#eae7ea] flex items-center justify-center hover:text-[#0050cb] transition-colors">
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="font-bold text-[#1b1b1d]">Kurumsal</div>
          <ul className="space-y-4 text-sm">
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                Hakkımızda
              </a>
            </li>
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                İletişim
              </a>
            </li>
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                Mağazalarımız
              </a>
            </li>
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                Kariyer
              </a>
            </li>
          </ul>
        </div>
        <div className="space-y-6">
          <div className="font-bold text-[#1b1b1d]">Destek</div>
          <ul className="space-y-4 text-sm">
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                Taksit Seçenekleri
              </a>
            </li>
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                İade ve Değişim
              </a>
            </li>
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                Sıkça Sorulan Sorular
              </a>
            </li>
            <li>
              <a className="text-[#1b1b1d]/60 hover:text-[#0050cb] underline-offset-4 hover:underline transition-all" href="#">
                Kargo Takip
              </a>
            </li>
          </ul>
        </div>
        <div className="space-y-6">
          <div className="font-bold text-[#1b1b1d]">Bülten</div>
          <p className="text-sm leading-relaxed text-[#1b1b1d]/60">
            Yeni ürünlerden ve kampanyalardan haberdar olun.
          </p>
          <div className="flex gap-2">
            <input 
              className="bg-[#eae7ea] border-none rounded-xl text-sm px-4 py-2 w-full focus:ring-1 focus:ring-[#0050cb]/30 focus:outline-none" 
              placeholder="E-posta adresiniz" 
              type="email"
            />
            <button className="bg-[#0050cb] text-white px-4 py-2 rounded-xl active:scale-95 transition-transform">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto border-t border-[#c2c6d8]/10 px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-[#1b1b1d]/60">
          © 2024 Next AI Teknoloji. Tüm hakları saklıdır.
        </div>
        <div className="flex gap-8 text-sm">
          <a className="text-[#1b1b1d]/60 hover:text-[#0050cb]" href="#">
            Gizlilik Politikası
          </a>
          <a className="text-[#1b1b1d]/60 hover:text-[#0050cb]" href="#">
            Kullanım Koşulları
          </a>
          <a className="text-[#1b1b1d]/60 hover:text-[#0050cb]" href="#">
            KVKK
          </a>
        </div>
      </div>
    </footer>
  );
}

import { Heart, ShoppingCart, Search } from 'lucide-react';
import { Link } from 'react-router';

interface NavbarProps {
  activeLink?: 'home' | 'categories' | 'campaigns';
  cartItemCount?: number;
}

export function Navbar({ activeLink = 'home', cartItemCount = 0 }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-[100] bg-[#fcf8fb]/80 backdrop-blur-xl shadow-[0px_4px_12px_rgba(27,27,29,0.02),0px_16px_32px_rgba(27,27,29,0.04)]">
      <div className="flex items-center justify-between px-8 py-4 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-12">
          <Link 
            to="/"
            className="text-2xl font-black tracking-tighter bg-gradient-to-br from-[#1b1b1d] to-[#0050cb] bg-clip-text text-transparent"
          >
            Next AI Teknoloji
          </Link>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm tracking-tight">
            <Link 
              to="/" 
              className={
                activeLink === 'home'
                  ? "text-[#0050cb] font-bold border-b-2 border-[#0050cb] pb-1"
                  : "text-[#1b1b1d] opacity-70 hover:opacity-100 hover:text-[#0050cb] transition-all duration-300"
              }
            >
              Anasayfa
            </Link>
            <Link 
              to="/kategori/telefonlar" 
              className={
                activeLink === 'categories'
                  ? "text-[#0050cb] font-bold border-b-2 border-[#0050cb] pb-1"
                  : "text-[#1b1b1d] opacity-70 hover:opacity-100 hover:text-[#0050cb] transition-all duration-300"
              }
            >
              Kategoriler
            </Link>
            <a 
              href="#" 
              className={
                activeLink === 'campaigns'
                  ? "text-[#0050cb] font-bold border-b-2 border-[#0050cb] pb-1"
                  : "text-[#1b1b1d] opacity-70 hover:opacity-100 hover:text-[#0050cb] transition-all duration-300"
              }
            >
              Kampanyalar
            </a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-[#eae7ea] px-4 py-2 rounded-full w-64 group focus-within:bg-white focus-within:ring-1 focus-within:ring-[#0050cb]/20 transition-all">
            <Search className="text-[#424656] w-4 h-4" />
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 placeholder:text-[#424656]/60" 
              placeholder="Ürün ara..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-4 text-[#1b1b1d]">
            <button className="hover:text-[#0050cb] transition-colors">
              <Heart className="w-6 h-6" />
            </button>
            <Link to="/sepet" className="relative hover:text-[#0050cb] transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#0050cb] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button className="ml-2 px-6 py-2 bg-[#0050cb] text-white rounded-full text-sm font-semibold active:scale-95 transition-transform">
              Giriş Yap/Kayıt Ol
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

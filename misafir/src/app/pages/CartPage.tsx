import { useState } from 'react';
import { Minus, Plus, Trash2, Shield, Package, CreditCard } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { FooterNav } from '../components/FooterNav';

interface CartItem {
  id: number;
  name: string;
  specs: string;
  price: number;
  quantity: number;
  image: string;
}

export function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: 'NextGen AI Pro Book 16"',
      specs: '32GB RAM / 1TB SSD / M3 Ultra',
      price: 84999,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCios-2YJXYRCA641iL4_DbzioiEZlgikO6djobBUAql0Jmn8aOaE40j4_34oiBvBmf1YmhYHy_4mP7LNVeWsloCzjr2MqqNgquWUZoicwTqEUUWscJIvYQyoE-3G8q0-of0eWcDfj86b2W2ZRMKRTHsuXanDLToKFGkxfHj1gUGzWQHxaAoGO9Fjm1HoJhPKOxbVREljxicDTAu1bkqZ6-l0AUJhpa0QjSnEkUy6NkhOhgVSJzwONwVah5xf4HYgubMfXQvOu4bJDs',
    },
    {
      id: 2,
      name: 'NextSense ANC Headphones',
      specs: 'Uzay Grisi / Aktif Gürültü Engelleme',
      price: 12499,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDADqgqgD1nEyoFpaPV__NNJMTsVlwN2DLkFqpp6KauDwBCpvT3d_wMvqqF91kIOsRSbHJkq5ld7zYkB6GO2l-7WKrC1Au-eq6vxpdxv5ZVv569SPWykKZvZStOA4dFQCYs8qd1eWxn2Bo3YBOYpEKwsNEcdIIFgoYbj9Qxoisrfp56t-Wg27SGMiaAKvxnFn0hXPHUbtht6eAAM_FcM4kDALKvaU0340ZcjQlcdhuMFDpuU01ru62ejAjZb4DVX3zfkKevMq8DnRmg',
    },
  ]);

  const [discountCode, setDiscountCode] = useState('');

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  return (
    <div className="bg-[#fcf8fb] text-[#1b1b1d] font-['Inter',sans-serif] selection:bg-[#0050cb] selection:text-white min-h-screen">
      <Navbar cartItemCount={cartItems.length} />
      
      <main className="pt-32 pb-24 px-8 max-w-[1440px] mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1b1b1d] mb-2">
            Sepetim
          </h1>
          <p className="text-[#424656] font-medium">
            Toplam {cartItems.length} adet ürün sepetinizde bekliyor.
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            {cartItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-[0px_4px_12px_rgba(27,27,29,0.02)] border border-[#c2c6d8]/10"
              >
                <div className="w-32 h-32 rounded-lg bg-[#f0edef] overflow-hidden flex-shrink-0">
                  <img 
                    alt={item.name}
                    className="w-full h-full object-cover" 
                    src={item.image}
                  />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-lg font-bold text-[#1b1b1d] mb-1">{item.name}</h3>
                  <p className="text-sm text-[#424656] mb-4">{item.specs}</p>
                  <div className="flex items-center justify-center md:justify-start space-x-4">
                    <div className="flex items-center bg-[#f0edef] rounded-full px-3 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:text-[#0050cb] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:text-[#0050cb] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="flex items-center text-[#ba1a1a] hover:underline text-xs font-medium"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Sil
                    </button>
                  </div>
                </div>
                <div className="text-xl font-black text-[#0050cb]">
                  ₺{item.price.toLocaleString('tr-TR')},00
                </div>
              </div>
            ))}
            
            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="flex items-center gap-3 p-4 bg-[#f6f3f5] rounded-xl">
                <Shield className="w-6 h-6 text-[#0050cb]" />
                <span className="text-sm font-medium">256-BİT SSL KORUMA</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#f6f3f5] rounded-xl">
                <Package className="w-6 h-6 text-[#0050cb]" />
                <span className="text-sm font-medium">3D SECURE ÖDEME</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#f6f3f5] rounded-xl">
                <CreditCard className="w-6 h-6 text-[#0050cb]" />
                <span className="text-sm font-medium">ÜCRETSİZ KARGO</span>
              </div>
            </div>
          </div>
          
          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-[#f6f3f5] rounded-2xl p-8 sticky top-32">
              <h2 className="text-2xl font-extrabold mb-8">Sipariş Özeti</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[#424656]">
                  <span>Ürün Toplamı</span>
                  <span className="font-bold">₺{subtotal.toLocaleString('tr-TR')},00</span>
                </div>
                <div className="flex justify-between text-[#424656]">
                  <span>Kargo</span>
                  <span className="font-bold text-[#0050cb]">Ücretsiz</span>
                </div>
              </div>
              
              <div className="border-t border-[#c2c6d8]/20 pt-6 mb-8">
                <div className="flex justify-between text-xl">
                  <span className="font-bold">Genel Toplam</span>
                  <span className="font-black text-[#0050cb]">₺{total.toLocaleString('tr-TR')},00</span>
                </div>
              </div>
              
              {/* Discount Code */}
              <div className="mb-6">
                <h3 className="font-bold mb-4 uppercase text-sm tracking-wide">İndirim Kodu</h3>
                <div className="flex gap-2">
                  <input 
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#0050cb]/20 focus:outline-none" 
                    placeholder="Kodu giriniz..." 
                    type="text"
                  />
                  <button className="px-6 py-3 bg-[#1b1b1d] text-white rounded-xl font-bold text-sm hover:bg-[#0050cb] transition-colors">
                    Uygula
                  </button>
                </div>
              </div>
              
              <button className="w-full py-4 bg-gradient-to-br from-[#0050cb] to-[#0066ff] text-white rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                Ödemeye Geç
              </button>
              
              <p className="text-xs text-center text-[#424656]/60 mt-4">
                Ödemeye geç butonuna tıklayarak kullanım koşullarını ve gizlilik politikasını kabul etmiş olursunuz.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <FooterNav />
    </div>
  );
}

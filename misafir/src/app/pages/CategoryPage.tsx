import { useState } from 'react';
import { ChevronRight, Heart } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { FooterNav } from '../components/FooterNav';

const products = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max 256GB',
    price: '78.999 TL',
    description: 'Titanyum yapısı, A17 Pro çip, 48MP kamera sistemi ve USB-C bağlantısı...',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdjlBrav7cK30vzSyRG9aqatpBDb9IXHBfQgXQTWwn6JRffmq7lSGRdNPaY-Tai1CmxmD4YXpDTfpkCdxWs6_pVvX0Qstp-WrMXLbsiknWlio5rIg3KDoNaCehIPjwWso6ywfqTKnJ3dZ5M0oHZlib3YVI5j0SupBTwRxHGPg-DuUCkHLaCopVL4fpRgKSGzE-RIsALUiUAtIWBgX2tEnBOBBa83PPhKWAQ6_p2l2ghERYd7_7840GQlZeqoaQRQirAgFwZPzDCgpD',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    price: '65.499 TL',
    description: 'Galaxy AI desteği, 200MP kamera, 12GB RAM ve en akıcı 6.8" ekran deneyimi...',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
  },
  {
    id: 3,
    name: 'Xiaomi 14 Ultra 5G',
    price: '48.200 TL',
    description: 'Leica optik kamera, Snapdragon 8 Gen 3 ve akıllı görüntüleme teknolojisi...',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80',
  },
  {
    id: 4,
    name: 'Huawei P60 Pro Art',
    price: '42.999 TL',
    description: 'Ultra aydınlık Telefoto Kamera, Kunlun Cam teknolojisi ve 5G desteği...',
    image: 'https://images.unsplash.com/photo-1592286927505-b095f08d5fc0?w=600&q=80',
  },
];

export function CategoryPage() {
  const { categoryName } = useParams();
  const [brands, setBrands] = useState({
    apple: false,
    samsung: true,
    xiaomi: false,
    huawei: false,
  });
  const [features, setFeatures] = useState({
    fiveG: true,
    oled: false,
    storage: false,
    fastCharge: false,
  });

  return (
    <div className="bg-[#fcf8fb] text-[#1b1b1d] min-h-screen">
      <Navbar activeLink="categories" />
      
      <main className="pt-24 max-w-[1440px] mx-auto px-8 pb-32">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-[#424656] mb-8">
          <Link to="/" className="hover:text-[#0050cb] transition-colors">
            Ana Sayfa
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1b1b1d] font-medium capitalize">{categoryName}</span>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar: Filter Options */}
          <aside className="w-full lg:w-72 shrink-0 space-y-12">
            <div>
              <h3 className="text-lg font-bold mb-6 text-[#1b1b1d]">Marka</h3>
              <div className="space-y-4">
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={brands.apple}
                    onChange={(e) => setBrands({...brands, apple: e.target.checked})}
                    className="w-5 h-5 rounded-md border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]/20 bg-[#f0edef] transition-all"
                  />
                  <span className="ml-3 text-[#424656] group-hover:text-[#1b1b1d]">Apple</span>
                </label>
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={brands.samsung}
                    onChange={(e) => setBrands({...brands, samsung: e.target.checked})}
                    className="w-5 h-5 rounded-md border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]/20 bg-[#f0edef] transition-all"
                  />
                  <span className="ml-3 text-[#424656] group-hover:text-[#1b1b1d]">Samsung</span>
                </label>
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={brands.xiaomi}
                    onChange={(e) => setBrands({...brands, xiaomi: e.target.checked})}
                    className="w-5 h-5 rounded-md border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]/20 bg-[#f0edef] transition-all"
                  />
                  <span className="ml-3 text-[#424656] group-hover:text-[#1b1b1d]">Xiaomi</span>
                </label>
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={brands.huawei}
                    onChange={(e) => setBrands({...brands, huawei: e.target.checked})}
                    className="w-5 h-5 rounded-md border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]/20 bg-[#f0edef] transition-all"
                  />
                  <span className="ml-3 text-[#424656] group-hover:text-[#1b1b1d]">Huawei</span>
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6 text-[#1b1b1d]">Fiyat Aralığı</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <input 
                    className="w-full bg-[#eae7ea] border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-[#0050cb]/20 focus:outline-none" 
                    placeholder="Min" 
                    type="text"
                  />
                  <span className="text-[#727687]">-</span>
                  <input 
                    className="w-full bg-[#eae7ea] border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-[#0050cb]/20 focus:outline-none" 
                    placeholder="Max" 
                    type="text"
                  />
                </div>
                <div className="relative h-1.5 bg-[#e4e2e4] rounded-full">
                  <div className="absolute h-full w-2/3 bg-[#0050cb] rounded-full left-4"></div>
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 w-4 h-4 bg-white shadow-md border-2 border-[#0050cb] rounded-full cursor-pointer"></div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-[30%] w-4 h-4 bg-white shadow-md border-2 border-[#0050cb] rounded-full cursor-pointer"></div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6 text-[#1b1b1d]">Özellikler</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setFeatures({...features, fiveG: !features.fiveG})}
                  className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    features.fiveG 
                      ? 'bg-[#0050cb] text-white' 
                      : 'bg-[#e4e2e4] text-[#424656] hover:bg-[#eae7ea]'
                  }`}
                >
                  5G Desteği
                </button>
                <button 
                  onClick={() => setFeatures({...features, oled: !features.oled})}
                  className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    features.oled 
                      ? 'bg-[#0050cb] text-white' 
                      : 'bg-[#e4e2e4] text-[#424656] hover:bg-[#eae7ea]'
                  }`}
                >
                  OLED Ekran
                </button>
                <button 
                  onClick={() => setFeatures({...features, storage: !features.storage})}
                  className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    features.storage 
                      ? 'bg-[#0050cb] text-white' 
                      : 'bg-[#e4e2e4] text-[#424656] hover:bg-[#eae7ea]'
                  }`}
                >
                  128GB+
                </button>
                <button 
                  onClick={() => setFeatures({...features, fastCharge: !features.fastCharge})}
                  className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    features.fastCharge 
                      ? 'bg-[#0050cb] text-white' 
                      : 'bg-[#e4e2e4] text-[#424656] hover:bg-[#eae7ea]'
                  }`}
                >
                  Hızlı Şarj
                </button>
              </div>
            </div>
          </aside>
          
          {/* Grid: Technology Products */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#1b1b1d] mb-2 capitalize">
                  {categoryName}
                </h1>
                <p className="text-[#424656]">Toplam 248 ürün listeleniyor</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-[#424656] whitespace-nowrap">Sıralama:</span>
                <select className="bg-[#eae7ea] border-none rounded-xl px-6 py-2.5 text-sm focus:ring-1 focus:ring-[#0050cb]/20 focus:outline-none text-[#1b1b1d] cursor-pointer">
                  <option>En Yeniler</option>
                  <option>Fiyat: Düşükten Yükseğe</option>
                  <option>Fiyat: Yüksekten Düşüğe</option>
                  <option>En Çok Değerlendirilenler</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="group relative bg-white rounded-xl p-4 shadow-[0px_4px_12px_rgba(27,27,29,0.02)] hover:shadow-[0px_16px_32px_rgba(27,27,29,0.06)] transition-all duration-300"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#fcf8fb] mb-6 relative">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={product.name}
                      src={product.image}
                    />
                    <button className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-md text-[#424656] hover:text-[#ba1a1a] transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold leading-tight group-hover:text-[#0050cb] transition-colors flex-1">
                        {product.name}
                      </h3>
                      <span className="text-[#0050cb] font-bold text-lg whitespace-nowrap ml-2">
                        {product.price}
                      </span>
                    </div>
                    <p className="text-sm text-[#424656] line-clamp-2">
                      {product.description}
                    </p>
                    <Link
                      to={`/urun/${product.id}`}
                      className="block w-full py-3 bg-[#0050cb] text-white rounded-xl font-bold text-sm text-center hover:bg-[#0066ff] transition-colors"
                    >
                      Sepete Ekle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-16">
              <button className="px-4 py-2 rounded-lg border border-[#c2c6d8]/30 hover:bg-[#f0edef] transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <button className="px-4 py-2 rounded-lg bg-[#0050cb] text-white font-bold">1</button>
              <button className="px-4 py-2 rounded-lg hover:bg-[#f0edef] transition-colors">2</button>
              <button className="px-4 py-2 rounded-lg hover:bg-[#f0edef] transition-colors">3</button>
              <span className="px-2">...</span>
              <button className="px-4 py-2 rounded-lg hover:bg-[#f0edef] transition-colors">12</button>
              <button className="px-4 py-2 rounded-lg border border-[#c2c6d8]/30 hover:bg-[#f0edef] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <FooterNav />
    </div>
  );
}

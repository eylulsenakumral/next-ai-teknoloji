import { Smartphone, Laptop, Home, Headphones, Watch, Tablet, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

const categories = [
  { icon: Smartphone, label: 'Telefonlar', slug: 'telefonlar' },
  { icon: Laptop, label: 'Laptoplar', slug: 'laptoplar' },
  { icon: Home, label: 'Akıllı Ev', slug: 'akilli-ev' },
  { icon: Headphones, label: 'Aksesuar', slug: 'aksesuar' },
  { icon: Watch, label: 'Giyilebilir', slug: 'giyilebilir' },
  { icon: Tablet, label: 'Tabletler', slug: 'tabletler' },
];

export function CategoriesSection() {
  return (
    <section className="mt-32 px-8 overflow-hidden">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-black tracking-tighter">Ekosistemi Keşfedin</h2>
          <div className="flex gap-2">
            <button className="w-12 h-12 rounded-full border border-[#c2c6d8]/30 flex items-center justify-center hover:bg-[#f0edef] transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="w-12 h-12 rounded-full border border-[#c2c6d8]/30 flex items-center justify-center hover:bg-[#f0edef] transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex gap-8 overflow-x-auto pb-8 scroll-smooth">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.slug}
                to={`/kategori/${category.slug}`}
                className="flex-none w-48 aspect-square rounded-[2rem] bg-[#f0edef] flex flex-col items-center justify-center gap-4 group cursor-pointer hover:bg-[#0050cb] transition-all duration-500"
              >
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Icon className="w-8 h-8 text-[#0050cb]" />
                </div>
                <span className="font-bold text-[#1b1b1d] group-hover:text-white transition-colors">
                  {category.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

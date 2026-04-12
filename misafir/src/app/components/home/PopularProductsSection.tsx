import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

const products = [
  {
    id: 1,
    name: 'Next Tab Ultra',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnZ9QWUGIwsaIpVioSgCNpNr95RC27url-aNBCyFN-OCq_hIyPn408JexFd7oaAJqHJHfFArjm1cvtcXGW-CAQ000cDMQv8bl5ilT-1lJmA_O7b_zDT5ftItSB2BrBVQaauP6IwQOFbZw8D9cnfLByNrPgBMLZ-RPYhhQRF9Y_8tisraKA23J5kNrzyagdLIktksBgHLHho6PHJTep2qVKf4UzXnW53oxJi5MxIoTMc-WXzHFJjxZ_H6PbCrH8yYFJzMkF06elwoQU',
  },
  {
    id: 2,
    name: 'Next Watch S4',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZAsXRva0Bdzfy8jLc_tbQ75vX-sKxBdEhDMtjRYs1lDSFtmSW8FD9fBedSnGrd6POe6w8nYvx6qpC7xTOwgNyt7LJt0qJPixjHPT_CXvJWuYkJHZJEWwRnTmzRXhQ7xBj6SuoUETNpOPDQBElR6WpjSKChycNZnxxtkcjl-3Q-o-Prw9QCW7ZWCIsmEOlaNEt3WhnqvvZ75tshiHytYAU3ynHCDEqabB7bIXChHce1blORPyc-lbx_ipNobqzWB8K8TQrvNsv3ux1',
  },
  {
    id: 3,
    name: 'Next Mini Speaker',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh7EsXxn8bQz_Uco5guANDCJseWAe9ycdAnHxBjMMCn6yoG3CtbYoQZW_YmpAY7s6lunNHBa-KBYouQCgORQqFMXuU9m9eBMe1eibmeW8jkaJjehTVAMyV4b4YrT4jW_ux_GNu7ALpg_3TaU48BlD8snbRK8CzkWCj3OPCcnyvQ2VTMK2rCuPeYvmJNxiYOPrTGA_wBRF2ZBa3hEg5B6-0dxnmAC1DSijArJtq2cIkIQZt8nBTovGenXfANSLfUoQ4PAuCqXGtlpHg',
  },
  {
    id: 4,
    name: 'Next Hub Pro',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd-VobbcaarIUrg_bNWY2jSK_2v2Pol54F_-nH3U351AOdZEXpORJS6YOm57YSduznAK6XmbBvvQfSU6Bp44u6Oo144eJ0bHoeEF9dLEc0gKVoPjDK5CkFWBBPe4-Eh59n_JJbOOgPNMZJQFI2f_6Ixs8eVl9z_lRRocLO1j5DJaEIatpDxUgwiIucEJFmzpj93wx2LdDTo8SagZpeK7u1jgz090lS0LOk7wRYqcmGv-truBeIJfPliM1VGcEhUfwAB8YYNDQHkpa5',
  },
];

export function PopularProductsSection() {
  return (
    <section className="mt-32 px-8 py-24 bg-[#f6f3f5]">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-4xl font-black tracking-tighter">Popüler Ürünler</h2>
          <a className="text-[#0050cb] font-bold flex items-center gap-2 group" href="#">
            Tümünü Gör
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-[2rem] p-4 group transition-all duration-300 hover:shadow-[0px_32px_64px_rgba(27,27,29,0.04)]"
            >
              <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-6 bg-[#eae7ea]">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={product.name}
                  src={product.image}
                />
              </div>
              <div className="px-4 pb-4">
                <span className="text-[#424656] text-xs font-semibold uppercase tracking-widest">
                  Next AI
                </span>
                <h4 className="text-xl font-bold text-[#1b1b1d] mt-1">{product.name}</h4>
                <div className="h-4"></div>
                <Link
                  to={`/urun/${product.id}`}
                  className="block w-full py-4 rounded-xl border border-[#c2c6d8]/30 font-bold text-sm text-[#0050cb] hover:bg-[#0050cb] hover:text-white transition-all text-center"
                >
                  Fiyat için giriş yapın
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

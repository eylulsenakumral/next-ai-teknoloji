import { Truck, Shield, Headset } from 'lucide-react';

export function TrustSection() {
  return (
    <section className="mt-32 px-8 mb-32">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center text-center p-12 bg-[#f0edef] rounded-[3rem]">
          <div className="w-20 h-20 rounded-full bg-[#0066ff] flex items-center justify-center mb-6 shadow-lg shadow-[#0050cb]/20">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h4 className="text-xl font-bold mb-4">Ücretsiz Kargo</h4>
          <p className="text-[#424656]">
            Tüm alışverişlerinizde kapınıza kadar ücretsiz teslimat.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-12 bg-[#f0edef] rounded-[3rem]">
          <div className="w-20 h-20 rounded-full bg-[#0066ff] flex items-center justify-center mb-6 shadow-lg shadow-[#0050cb]/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h4 className="text-xl font-bold mb-4">Güvenli Ödeme</h4>
          <p className="text-[#424656]">
            256-bit SSL korumasıyla alışverişiniz güvende.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-12 bg-[#f0edef] rounded-[3rem]">
          <div className="w-20 h-20 rounded-full bg-[#0066ff] flex items-center justify-center mb-6 shadow-lg shadow-[#0050cb]/20">
            <Headset className="w-10 h-10 text-white" />
          </div>
          <h4 className="text-xl font-bold mb-4">7/24 Destek</h4>
          <p className="text-[#424656]">
            Uzman ekibimiz her sorunuz için bir tık uzağınızda.
          </p>
        </div>
      </div>
    </section>
  );
}

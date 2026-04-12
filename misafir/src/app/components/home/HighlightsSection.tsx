export function HighlightsSection() {
  return (
    <section className="mt-32 px-8">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="text-4xl font-black tracking-tighter mb-12">Öne Çıkanlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[900px]">
          {/* Large Feature Card */}
          <div className="md:col-span-8 relative rounded-[2.5rem] overflow-hidden bg-white shadow-[0px_16px_32px_rgba(27,27,29,0.04)] group">
            <img 
              className="w-full h-full object-cover" 
              alt="Next Phone 15 Pro"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvLhmH_PGyshfVpBS_TbjlsoPSsYyZv3wG11pzMpTlzIU9K6gHDNKEfw9caIfrmFZ368ul4xD2r-ATprs7mDGd2Jg_UUISkOG8PXOx8nsb654S6jXWo3aL2EAjZUT_g-wEwWSYzSyKzHvlHz91YzZA3GoSnXHPGoGgfWusm60DzrB-t1p9EWqGHrkMJ_X5yQXjQHfIvGGGUzvf9p-17XJCak4xS7AqKyq0Q0MKPa_wXFDNlpdC59r7HnvrG1W0dormJQht22Z_f76O"
            />
            <div className="absolute bottom-0 left-0 right-0 p-12 bg-white/40 backdrop-blur-md">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[#0050cb] font-bold tracking-widest text-xs uppercase mb-2 block">
                    Yeni Sezon
                  </span>
                  <h3 className="text-3xl font-extrabold text-[#1b1b1d]">Next Phone 15 Pro</h3>
                  <p className="text-[#424656] mt-2 max-w-sm">
                    Yapay zeka işlemci mimarisi ile sınırları zorlayın.
                  </p>
                </div>
                <button className="px-8 py-3 bg-[#1b1b1d] text-white rounded-full font-bold hover:bg-[#0050cb] transition-colors">
                  Fiyat için giriş yapın
                </button>
              </div>
            </div>
          </div>
          
          {/* Column for smaller cards */}
          <div className="md:col-span-4 grid grid-rows-2 gap-8">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-[#f0edef] group">
              <img 
                className="w-full h-full object-cover" 
                alt="Sonic Pro X"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSQ1lVxzl67XOrbU1k8Xyeq2b_gEjDnMGuX7rYtj4L8XZmQWjt2dVaIXzwhPRN1kM6xyOUNYsElWVtmKlAIfSIufSXiX4vxuoIcIhfQ8Azt2pdnIJPOe5KDgIvyNS0I8RJ6IVRmVloSsQ3f1n2vWYBzHZLeN3Sebe1SLmGKWawmmbtWQk7e3Awl2xVr5WocX5daPrKHJvpQlN4bb8d0-MMEuZDe3UbXP9aiAkrdL7Viq7YLmf5XoGeMc3zvorQ_I-HuVOkfY5El_Zd"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
              <div className="absolute bottom-8 left-8">
                <h3 className="text-xl font-bold text-white mb-4">Sonic Pro X</h3>
                <button className="px-6 py-2 bg-white/40 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-bold">
                  İncele
                </button>
              </div>
            </div>
            <div className="relative rounded-[2.5rem] overflow-hidden bg-[#0066ff] group">
              <img 
                className="w-full h-full object-cover" 
                alt="Next Home Hub"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJcjbyAK-2LdvLR-N5Z2Rw5D408ryADfEwjWPZLPcPpShwjezJ1UdsLfNlmTxspStvxAbmz1BR4-AVg35s-fHGuqj4xm_3jLtkuRTjGx1xbNPWTKvoVGBiWOQtQIqOMG1-VyFoKmAs8T0By5T1FTR9-GAltebszfT2gBorBSde4_g0XvhufQ051lWgn-yQpRg31Cki49GUUmKDSJqgBoofTbt21rdGrlCcSq2GwhXgkJGH91LWgMVSjGyvw416hkDEn7rX5tMNKiL3"
              />
              <div className="absolute inset-0 bg-[#0050cb]/20 group-hover:bg-[#0050cb]/0 transition-colors"></div>
              <div className="absolute bottom-8 left-8">
                <h3 className="text-xl font-bold text-white mb-4">Next Home Hub</h3>
                <button className="px-6 py-2 bg-white/40 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-bold">
                  İncele
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

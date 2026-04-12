export function HeroSection() {
  return (
    <section className="relative px-8 py-12 max-w-[1440px] mx-auto">
      <div className="relative w-full h-[700px] rounded-[2.5rem] overflow-hidden group">
        <img 
          className="w-full h-full object-cover" 
          alt="Ultra-modern laptop"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJUk8PNUXi53PaUXvBiy0XOhDR_kibDDzd2aB0aL7vvYR6GdAp1rghOV2Hv1pMHv3XgCZK_HbW_djaXKL0DvCvdPUK9acB8eWOXcfMXQH8tGn_s2hZGMPjVHVJwaiDPhDgglISVdK9o98bRXZGt2_Xuoz5O6DUkk7ZhWV44XWrgN_Wh_YgksFqtGHzp4lVvGvUTeOoVIo3kihfmifRW2s_u6KtrPO-r40Shjm2q-Q-D_8-Eh-aCJPqcg-BfF_AiUtSt4FE4NA0DL5a"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent flex flex-col justify-center px-20">
          <span className="text-white/80 font-semibold tracking-widest text-sm mb-4 uppercase">
            Teknolojinin Zirvesi
          </span>
          <h1 className="text-white text-7xl font-extrabold tracking-tighter mb-6 leading-none max-w-2xl">
            Gelecek Burada.<br/>Next AI ile Tanışın.
          </h1>
          <p className="text-white/70 text-xl max-w-lg mb-10 leading-relaxed">
            Yapay zeka ile güçlendirilmiş donanımlar, kusursuz tasarım ve rakipsiz performans bir arada.
          </p>
          <div className="flex items-center gap-6">
            <button className="px-10 py-4 bg-gradient-to-br from-[#0050cb] to-[#0066ff] text-white rounded-xl font-bold text-lg shadow-xl shadow-[#0050cb]/20 hover:scale-105 active:scale-95 transition-all">
              Hemen İncele
            </button>
            <button className="px-10 py-4 bg-white/40 backdrop-blur-md text-white rounded-xl font-bold text-lg border border-white/20 hover:bg-white/10 transition-all">
              Video İzle
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

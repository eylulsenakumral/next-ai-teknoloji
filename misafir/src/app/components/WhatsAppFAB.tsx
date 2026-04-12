import { MessageCircle } from 'lucide-react';

export function WhatsAppFAB() {
  return (
    <a 
      className="fixed bottom-8 right-8 z-[110] w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-transform group" 
      href="#"
    >
      <MessageCircle className="w-8 h-8 fill-white" />
      <div className="absolute right-full mr-4 bg-[#1b1b1d] text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Destek Hattı
      </div>
    </a>
  );
}

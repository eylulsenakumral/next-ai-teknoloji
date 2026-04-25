"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton({ phone = "905529895959" }: { phone?: string }) {
  const handleClick = () => {
    const url = `https://wa.me/${phone.replace(/^0/, "90")}?text=Merhaba%2C%20NexaDepo%27dan%20bilgi%20almak%20istiyorum.`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="group fixed bottom-6 right-6 z-40 flex w-[200px] items-center gap-2 rounded-full bg-green-500 pl-4 pr-5 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-green-600 hover:shadow-xl"
      aria-label="WhatsApp ile iletişim"
    >
      <MessageCircle className="h-6 w-6 shrink-0" />
      <div className="flex flex-col items-start">
        <span className="text-[11px] font-semibold leading-tight opacity-90">WhatsApp</span>
        <span className="text-[12px] font-bold leading-tight">Müşteri Temsilcisi</span>
      </div>
    </button>
  );
}

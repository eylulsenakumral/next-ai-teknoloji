"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

export function WhatsAppButton({ phone = "905321234567" }: { phone?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    const url = `https://wa.me/${phone.replace(/^0/, "90")}?text=Merhaba%2C%20NexaDepo%27dan%20bilgi%20almak%20istiyorum.`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300"
      aria-label="WhatsApp ile iletişim"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );
}
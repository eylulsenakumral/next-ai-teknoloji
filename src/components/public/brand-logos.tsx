// SVG brand logo components — styled to match each brand's visual identity
// Each exports a React component rendering an inline SVG

type P = { className?: string };

export function LogoDahua({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* dot above the 'a' — brand mark */}
      <circle cx="14" cy="6" r="5" fill="#0075C2" />
      {/* wordmark */}
      <text x="0" y="32" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#0075C2" letterSpacing="-0.5">alhua</text>
      <text x="0" y="44" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="400" fill="#0075C2" letterSpacing="2">TECHNOLOGY</text>
    </svg>
  );
}

export function LogoHikvision({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 160 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="26" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="#E31F26" letterSpacing="0.5">HIKVISION</text>
    </svg>
  );
}

export function LogoUNV({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 110 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* arc / swoosh above */}
      <path d="M8 10 Q55 0 102 10" stroke="#0061AF" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <text x="4" y="36" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" fill="#0061AF" letterSpacing="3">UNV</text>
    </svg>
  );
}

export function LogoTtec({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 90 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 't' in teal, 'tec' in dark */}
      <text x="0" y="28" fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fontSize="28" fontWeight="800" fill="#00B4C8">t</text>
      <text x="18" y="28" fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fontSize="28" fontWeight="800" fill="#1A1A2E">tec</text>
    </svg>
  );
}

export function LogoReolink({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* small camera dot */}
      <circle cx="6" cy="18" r="5" fill="#0066CC" />
      <circle cx="6" cy="18" r="2.5" fill="white" />
      <text x="18" y="26" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" fill="#0066CC">Reolink</text>
    </svg>
  );
}

export function LogoINOX({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="28" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" fill="#1A1A2E" letterSpacing="1">INOX</text>
      <text x="2" y="40" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="400" fill="#555" letterSpacing="3">DIGITAL</text>
    </svg>
  );
}

export function LogoSeagate({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* diamond mark */}
      <polygon points="12,4 20,18 12,32 4,18" fill="#6DB33F"/>
      <text x="28" y="26" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="700" fill="#1A1A1A" letterSpacing="0.5">SEAGATE</text>
    </svg>
  );
}

export function LogoWD({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 150 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* WD badge */}
      <rect x="0" y="2" width="34" height="28" rx="4" fill="#0060A9"/>
      <text x="4" y="24" fontFamily="Arial Black, sans-serif" fontSize="18" fontWeight="900" fill="white">WD</text>
      <text x="0" y="42" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="500" fill="#0060A9" letterSpacing="0.3">Western Digital</text>
    </svg>
  );
}

export function LogoToshiba({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 155 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="26" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="#E60026" letterSpacing="1">TOSHIBA</text>
    </svg>
  );
}

export function LogoNovato({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* geometric N mark */}
      <polygon points="4,32 4,8 14,8 24,24 24,8 34,8 34,32 24,32 14,16 14,32" fill="#2D5BE3"/>
      <text x="40" y="28" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" fill="#1A1A2E">novato</text>
    </svg>
  );
}

export function LogoNinova({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 145 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* leaf/smart home mark */}
      <path d="M6 30 Q6 8 20 8 Q20 22 6 30Z" fill="#4CAF50"/>
      <text x="28" y="24" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" fill="#1A1A2E">ninova</text>
      <text x="28" y="40" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="400" fill="#4CAF50" letterSpacing="1">SmartLife</text>
    </svg>
  );
}

export function LogoAjax({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 110 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* circular security mark */}
      <circle cx="16" cy="20" r="14" stroke="#DC1F26" strokeWidth="2.5"/>
      <path d="M10 20 L16 12 L22 20 L16 28Z" fill="#DC1F26"/>
      <text x="36" y="27" fontFamily="Arial Black, sans-serif" fontSize="20" fontWeight="900" fill="#1A1A2E" letterSpacing="1">AJAX</text>
    </svg>
  );
}

export function LogoHoneywell({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 165 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* diamond logo mark */}
      <polygon points="10,4 18,18 10,32 2,18" fill="#FC4C02"/>
      <text x="26" y="26" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="700" fill="#FC4C02">Honeywell</text>
    </svg>
  );
}

export function LogoSens({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 100 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="28" fontFamily="Arial Black, sans-serif" fontSize="26" fontWeight="900" fill="#E31F26" letterSpacing="2">SENS</text>
    </svg>
  );
}

export function LogoRuijie({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 145 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* stylised R mark */}
      <path d="M4 8h14a8 8 0 010 16H4V8zM18 24l10 12" stroke="#005BAC" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <text x="32" y="24" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="700" fill="#005BAC">Ruijie</text>
      <text x="32" y="40" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="400" fill="#005BAC" letterSpacing="1.5">Networks</text>
    </svg>
  );
}

export function LogoUbiquiti({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 150 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* U-shape mark */}
      <path d="M4 8v18a12 12 0 0024 0V8" stroke="#0559C9" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <text x="36" y="24" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="900" fill="#0559C9" letterSpacing="1">UBIQUITI</text>
      <text x="36" y="40" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="500" fill="#0559C9" letterSpacing="2">NETWORKS</text>
    </svg>
  );
}

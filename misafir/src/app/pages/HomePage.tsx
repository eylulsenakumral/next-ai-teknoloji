import { Navbar } from '../components/Navbar';
import { FooterNav } from '../components/FooterNav';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { HeroSection } from '../components/home/HeroSection';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { HighlightsSection } from '../components/home/HighlightsSection';
import { PopularProductsSection } from '../components/home/PopularProductsSection';
import { TrustSection } from '../components/home/TrustSection';

export function HomePage() {
  return (
    <div className="scroll-smooth bg-[#fcf8fb] text-[#1b1b1d] antialiased">
      <Navbar activeLink="home" />
      
      <main className="pt-24">
        <HeroSection />
        <CategoriesSection />
        <HighlightsSection />
        <PopularProductsSection />
        <TrustSection />
      </main>
      
      <WhatsAppFAB />
      <FooterNav />
    </div>
  );
}

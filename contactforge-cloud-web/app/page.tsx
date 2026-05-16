import Hero from '@/components/Hero';
import ProductSplit from '@/components/ProductSplit';
import HowItWorks from '@/components/HowItWorks';
import WhyJoin from '@/components/WhyJoin';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Hero />
      <ProductSplit />
      <HowItWorks />
      <WhyJoin />
      <FAQ />
      <Footer />
    </main>
  );
}

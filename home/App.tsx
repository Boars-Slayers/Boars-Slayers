import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MembersSection } from './components/MembersSection';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-950 text-gray-200 selection:bg-gold-500/30 selection:text-gold-200">
      <Navbar />
      <main>
        <Hero />
        <MembersSection />
        
        {/* About / History Section - Simple filler for completeness */}
        <section id="about" className="py-20 bg-stone-950 border-t border-stone-900">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-serif font-bold text-3xl text-gray-100 mb-8">Nuestra Historia</h2>
            <div className="prose prose-invert prose-gold mx-auto">
              <p className="text-lg text-gray-400 leading-relaxed">
                Boars Slayers nació de la necesidad de sobrevivir al "Boar Lure". Lo que comenzó como un grupo de amigos perdiendo aldeanos contra la fauna salvaje, se ha convertido en una hermandad competitiva. Luchamos en Arabia, Arena y más allá, siempre honrando el código del guerrero (y evitando el "idle TC").
              </p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default App;
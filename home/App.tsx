import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MembersSection } from './components/MembersSection';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './AuthContext';
import { JoinModal } from './components/JoinModal';
import { Routes, Route } from 'react-router-dom';
import { ProfilePage } from './components/ProfilePage';
import { AdminPanel } from './components/AdminPanel';
import { TournamentList } from './components/tournaments/TournamentList';

const HomePage: React.FC = () => {
  const { user, login, profile, refreshProfile } = useAuth();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Check if we are returning from a login flow initiated by the join process
  React.useEffect(() => {
    const isJoining = localStorage.getItem('joining_clan');
    if (isJoining && user) {
      setIsJoinModalOpen(true);
      localStorage.removeItem('joining_clan');
    }
  }, [user]);

  const handleJoinClick = () => {
    setIsJoinModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-gray-200">
      <Navbar />
      <main>
        <Hero onJoinClick={handleJoinClick} />
        <MembersSection />

        {/* About / History Section */}
        <section id="about" className="py-20 bg-stone-950 border-t border-stone-900">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-serif font-bold text-3xl text-gray-100 mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-stone-500">Nuestra Historia</h2>
            <div className="prose prose-invert prose-gold mx-auto">
              <p className="text-lg text-stone-400 leading-relaxed italic font-serif">
                "Boars Slayers nació de la necesidad de sobrevivir al Boar Lure. Lo que comenzó como un grupo de amigos perdiendo aldeanos contra la fauna salvaje, se ha convertido en una hermandad competitiva..."
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {isJoinModalOpen && (
        <JoinModal
          user={user}
          profile={profile}
          onClose={() => setIsJoinModalOpen(false)}
          onSuccess={refreshProfile}
          onLogin={login}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/user/:username" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/tournaments" element={
          <div className="min-h-screen bg-stone-950 text-gray-200">
            <Navbar />
            <TournamentList />
            <Footer />
          </div>
        } />
        {/* Fallback to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
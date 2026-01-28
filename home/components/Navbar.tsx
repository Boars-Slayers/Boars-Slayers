import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { NAV_ITEMS } from '../constants';
import { AuthStatus } from './AuthStatus';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();

      if (location.pathname !== '/') {
        await navigate('/');
        // Give time for home page to mount
        setTimeout(() => scrollToElement(href), 100);
      } else {
        scrollToElement(href);
      }
      setIsMobileMenuOpen(false);
    }
  };

  const scrollToElement = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-stone-950/90 backdrop-blur-md border-b border-white/5 py-3 shadow-lg'
        : 'bg-transparent py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 md:w-12 md:h-12" />
          <span className="font-serif font-bold text-lg md:text-2xl text-gray-100 tracking-wider">
            BOARS <span className="text-gold-500">SLAYERS</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="relative group h-full flex items-center">
              {item.children ? (
                <>
                  <button
                    className="flex items-center gap-1 text-sm uppercase tracking-widest text-gray-400 hover:text-gold-400 transition-colors font-medium h-full"
                    onClick={() => { }}
                  >
                    {item.label}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-stone-900 border border-stone-800 rounded-md shadow-xl overflow-hidden">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(child.href);
                          }}
                          className="block px-4 py-3 text-sm text-gray-300 hover:bg-stone-800 hover:text-gold-400 border-b border-stone-800 last:border-0"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm uppercase tracking-widest text-gray-400 hover:text-gold-400 transition-colors font-medium relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              )}
            </div>
          ))}
          <AuthStatus />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-300 hover:text-gold-500 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-stone-900 border-b border-gold-900/50 shadow-2xl transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col p-6 gap-4">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-serif text-gold-500">{item.label}</span>
                  <div className="pl-4 flex flex-col gap-2 border-l border-stone-800 ml-2">
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(child.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-base font-serif text-gray-400 hover:text-gold-400"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-lg font-serif text-gray-300 hover:text-gold-500"
                >
                  {item.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};
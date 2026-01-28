import React from 'react';
import { Shield } from 'lucide-react';

interface LogoProps {
  className?: string;
}

// ESTE COMPONENTE REPRESENTA EL ARCHIVO PNG DEL LOGO
// Cuando tengas el archivo real, reemplaza el contenido de este componente por:
// <img src="/logo.png" alt="Boars Slayers Logo" className={className} />

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-gold-600 to-wood-900 rounded-full border-2 border-gold-500 shadow-lg ${className}`}>
        {/* Icono de escudo temporal representando el jabalí */}
        <Shield className="text-stone-900 w-2/3 h-2/3" fill="currentColor" />
    </div>
  );
};
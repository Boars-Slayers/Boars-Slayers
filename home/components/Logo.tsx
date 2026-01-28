import React from 'react';


interface LogoProps {
  className?: string;
}

// ESTE COMPONENTE REPRESENTA EL ARCHIVO PNG DEL LOGO
// Cuando tengas el archivo real, reemplaza el contenido de este componente por:
// <img src="/logo.png" alt="Boars Slayers Logo" className={className} />

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <img
      src="/logo.png"
      alt="Boars Slayers Logo"
      className={`object-contain ${className}`}
    />
  );
};
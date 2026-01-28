import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Badge } from '../types';

interface BadgePopupProps {
    badge: Badge;
    onClose: () => void;
}

export const BadgePopup: React.FC<BadgePopupProps> = ({ badge, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState({});

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!cardRef.current) return;

            const card = cardRef.current;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -20; // Max rotation 20deg
            const rotateY = ((x - centerX) / centerX) * 20;

            setStyle({
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
            });
        };

        const handleMouseLeave = () => {
            setStyle({
                transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        // We only want to track mouse relative to window for a global effect or keep it local?
        // Let's keep it somewhat local or centered. 
        // Actually, for a popup "following mouse" effect usually implies the tilt reacts to mouse position relative to center of element.
        // But since it's a fixed popup, we attach listener to the card or the window?

        // Better approach for the requested "react to movement" on a 3d card:
        // Attach to the card container itself.
        const cardElement = cardRef.current;
        if (cardElement) {
            cardElement.addEventListener('mousemove', handleMouseMove as any);
            cardElement.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (cardElement) {
                cardElement.removeEventListener('mousemove', handleMouseMove as any);
                cardElement.removeEventListener('mouseleave', handleMouseLeave);
            }
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm" style={{ perspective: '1000px' }}>
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-stone-400 hover:text-white transition-colors bg-stone-900/50 rounded-full border border-stone-700"
                >
                    <X size={24} />
                </button>

                <div
                    ref={cardRef}
                    className="relative bg-gradient-to-br from-stone-900 to-stone-950 border-2 border-gold-600 rounded-xl p-8 shadow-[0_0_50px_rgba(217,119,6,0.3)] transition-transform duration-100 ease-out"
                    style={{
                        transformStyle: 'preserve-3d',
                        ...style
                    }}
                >
                    {/* Glossy reflection effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-xl pointer-events-none" style={{ transform: 'translateZ(1px)' }} />

                    <div className="flex flex-col items-center text-center" style={{ transform: 'translateZ(20px)' }}>
                        <div className="relative w-48 h-48 mb-8 group">
                            <div className="absolute inset-0 bg-gold-500/20 blur-2xl rounded-full animate-pulse-slow"></div>
                            <img
                                src={badge.image_url}
                                alt={badge.description}
                                className="relative w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform transition-transform group-hover:scale-110 duration-300"
                            />
                        </div>

                        <h3 className="text-2xl font-bold text-gold-400 font-serif mb-4 tracking-wide border-b border-gold-900 pb-2 w-full">
                            Insignia de Honor
                        </h3>

                        <p className="text-stone-300 text-lg leading-relaxed font-medium">
                            {badge.description}
                        </p>

                        <div className="mt-6 pt-4 border-t border-stone-800 w-full flex justify-between items-center text-xs text-stone-500 uppercase tracking-widest">
                            <span>Boars Slayers</span>
                            <span>{new Date(badge.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

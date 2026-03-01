import { useCallback } from "react";
import type { Container, Engine } from "tsparticles-engine";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export const FireParticles = () => {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    const particlesLoaded = useCallback(async (_container: Container | undefined) => {
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            loaded={particlesLoaded}
            options={{
                background: {
                    color: {
                        value: "transparent",
                    },
                },
                fpsLimit: 60,
                particles: {
                    color: {
                        value: ["#ffffff", "#fff0a0", "#ffd700", "#ff8c00", "#ff4500", "#ff0000"],
                    },
                    move: {
                        direction: "top",
                        enable: true,
                        outModes: {
                            default: "out",
                        },
                        random: true,
                        speed: { min: 2, max: 5 }, // Slightly slower for more "organic" feel
                        straight: false,
                        // Using 'vibrate' or just random direction for dance, as wobble might be version-locked
                        vibrate: true,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 30, // Even lower count for better focus on each "lick"
                    },
                    opacity: {
                        value: { min: 0, max: 0.7 },
                        animation: {
                            enable: true,
                            speed: 1,
                            startValue: "min",
                            sync: false,
                        }
                    },
                    shape: {
                        type: "path",
                        options: {
                            path: {
                                // Custom SVG Path for a "Flame Lick / Drop" shape
                                d: "M20 40 Q25 30 20 20 Q15 10 20 0 Q25 10 30 20 Q35 30 20 40",
                            }
                        }
                    },
                    size: {
                        value: { min: 2, max: 10 },
                        animation: {
                            enable: true,
                            speed: 4,
                            sync: false,
                            startValue: "min",
                            destroy: "max"
                        }
                    },
                    rotate: {
                        value: { min: -15, max: 15 },
                        animation: {
                            enable: true,
                            speed: 5,
                            sync: false
                        },
                    },
                },
                detectRetina: true,
            }}
            className="pointer-events-none w-full h-full"
        />
    );
};

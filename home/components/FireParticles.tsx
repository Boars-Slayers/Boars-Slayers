import { useCallback } from "react";
import type { Container, Engine } from "tsparticles-engine";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export const FireParticles = () => {
    const particlesInit = useCallback(async (engine: Engine) => {
        // you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
        // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
        // starting from v2 you can add only the features you need reducing the bundle size
        await loadSlim(engine);
    }, []);

    const particlesLoaded = useCallback(async (_container: Container | undefined) => {
        // await console.log(container);
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
                fpsLimit: 60, // Capped at 60 for consistency and performance
                interactivity: {
                    events: {
                        onHover: {
                            enable: true,
                            mode: "bubble",
                        },
                        resize: true,
                    },
                    modes: {
                        bubble: {
                            distance: 200,
                            duration: 2,
                            opacity: 0,
                            size: 0,
                            speed: 3
                        },
                    },
                },
                particles: {
                    color: {
                        value: ["#ffffff", "#ffcc00", "#ff9900", "#ff6600", "#ff3300"], // Added white/bright yellow for 'hot' sparks
                    },
                    links: {
                        enable: false,
                    },
                    move: {
                        direction: "top",
                        enable: true,
                        outModes: {
                            default: "out",
                        },
                        random: true,
                        speed: { min: 2, max: 6 }, // Faster, more erratic movement
                        straight: false,
                        vibrate: false,
                        warp: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 50, // Reduced count for performance
                    },
                    opacity: {
                        value: { min: 0.1, max: 1 },
                        animation: {
                            enable: true,
                            speed: 2,
                            sync: false,
                        }
                    },
                    shape: {
                        type: "polygon", // Polygonal shape for 'spark' look
                        options: {
                            polygon: {
                                sides: 3, // Triangles look like sharp sparks
                            }
                        }
                    },
                    size: {
                        value: { min: 1, max: 4 },
                        animation: {
                            enable: true,
                            speed: 5,
                            sync: false
                        }
                    },
                    rotate: {
                        value: { min: 0, max: 360 },
                        animation: {
                            enable: true,
                            speed: 30, // Fast spinning
                            sync: false
                        },
                        direction: "random",
                    },
                    // Removed shadow blur as it causes the main performance lag
                },
                detectRetina: true,
            }}
            className="absolute inset-0 z-10 pointer-events-none"
        />
    );
};

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
                fpsLimit: 120,
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
                            distance: 250,
                            duration: 2,
                            opacity: 0,
                            size: 0,
                            speed: 3
                        },
                    },
                },
                particles: {
                    color: {
                        value: ["#ffcc00", "#ff6600", "#ff3300", "#ff0000"],
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
                        speed: { min: 1, max: 4 },
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 100,
                    },
                    opacity: {
                        value: { min: 0.1, max: 0.8 },
                        animation: {
                            enable: true,
                            speed: 1,
                            sync: false,
                        }
                    },
                    shape: {
                        type: "circle",
                    },
                    size: {
                        value: { min: 1, max: 6 },
                        animation: {
                            enable: true,
                            speed: 3,
                            sync: false
                        }
                    },
                    shadow: {
                        blur: 15,
                        color: "#ff3300",
                        enable: true,
                    },
                },
                detectRetina: true,
            }}
            className="absolute inset-0 z-10 pointer-events-none"
        />
    );
};

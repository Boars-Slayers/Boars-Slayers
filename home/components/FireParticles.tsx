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
                fpsLimit: 120,
                particles: {
                    color: {
                        value: ["#fdcf58", "#757676", "#f27d0c", "#800909", "#f07f13"],
                    },
                    move: {
                        direction: "top",
                        enable: true,
                        outModes: {
                            default: "out",
                        },
                        random: true,
                        speed: { min: 3, max: 7 },
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 80,
                    },
                    opacity: {
                        value: { min: 0.1, max: 0.6 },
                        animation: {
                            enable: true,
                            speed: 1,
                            startValue: "min",
                            sync: false,
                        }
                    },
                    shape: {
                        type: "circle",
                    },
                    size: {
                        value: { min: 1, max: 5 },
                        animation: {
                            enable: true,
                            speed: 4,
                            sync: false,
                            startValue: "min",
                            destroy: "max"
                        }
                    },
                    life: {
                        duration: {
                            sync: false,
                            value: 3
                        },
                        count: 0
                    },
                    wobble: {
                        enable: true,
                        distance: 10,
                        speed: 10
                    }
                },
                detectRetina: true,
            }}
            className="absolute inset-0 pointer-events-none"
        />
    );
};

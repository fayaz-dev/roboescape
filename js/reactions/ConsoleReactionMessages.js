export class ConsoleReactionMessages {
    constructor() {
        this.messages = {
            gameStart: [
                "Robonaut mission initiated! Collect those particles to save Earth! 🚀",
                "Robonaut systems online! Time to analyze exotic particles! 🚀",
                "The black hole awaits... humanity's fate depends on your data collection! 🚀",
                "Mission active! Let's gather intelligence on this cosmic threat! 🚀",
                "Mission control: Robonaut, you're cleared for particle harvesting! 🚀",
                "Engines primed, sensors active - time to fulfill Earth's last hope! 🚀",
                "The void beckons... Robonaut's sensors are ready for data collection! 🚀",
                "Robonaut activated! Let's collect particles to save our planet! 🚀"
            ],
            shardCollected: [
                "Exotic Particle collected—valuable data for Earth's scientists! 🚀",
                "Another Exotic Particle analyzed; critical research data incoming! 🚀",
                "Particle sample collected—one step closer to understanding the threat! 🚀",
                "Exotic Particle acquired; Robonaut's mission progressing well! 🚀",
                "Robonaut's sensors recording exotic particle properties! 🚀",
                "Exotic Particle data packaged for Earth's research team! 🚀",
                "Caught an Exotic Particle! Earth's scientists will be thrilled! 🚀",
                "Exotic Particle secured, valuable intel for humanity's defense! 🚀",
                "Particle analysis complete—transmitting data to Earth! 🚀",
                "Exotic Particle collected, mission objectives being fulfilled! 🚀"
            ],
            playerTrapped: [
                "Gravitational forces exceeding safety parameters! 😰",
                "Houston, Robonaut is caught in gravitational flux! 😰",
                "Alert—Robonaut's thrusters cannot compensate for gravity pull! 😰",
                "Caught in the gravitational snare, emergency protocols activated! 😰",
                "Warning! Robonaut systems straining against blackhole forces! 😰",
                "Data collection paused; Robonaut trapped in gravity well! 😰",
                "Robonaut immobilized, gravitational forces overwhelming! 😰",
                "System alert: Robonaut unable to break free from gravity field! 😰",
                "Trapped in the blackhole's influence; calculating escape vectors! 😰",
                "Gravity's grip threatens mission integrity—emergency escape needed! 😰"
            ],
            playerEscaped: [
                "Emergency thrusters engaged! Robonaut breaks free from gravity well! 🎉",
                "Escape successful; Exotic Particles converted to thrust energy! 🎉",
                "Particle-powered emergency boost activates—Robonaut is free! 🎉",
                "Robonaut overcomes gravity field, mission continues! 🎉",
                "Advanced escape algorithms successful! Robonaut resumes data collection! 🎉",
                "Breaking free from blackhole influence, mission parameters restored! 🎉",
                "Robonaut escapes gravitational pull, Earth receives positive telemetry! 🎉",
                "Emergency systems effective: gravity escape successful! 🎉",
                "Robonaut's adaptive systems overcome blackhole forces! 🎉",
                "Mission continues—Robonaut escapes with critical particle data intact! 🎉"
            ],
            playerDestroyed: [
                "Robonaut systems catastrophically compromised. Mission failure... 💀",
                "The blackhole has consumed Robonaut—Earth's last hope lost. 💀",
                "Catastrophic systems failure; Robonaut's mission ends prematurely. 💀",
                "All systems offline, Robonaut's vital mission terminated. 💀",
                "Robonaut destroyed; humanity loses critical data on the threat. 💀",
                "Mission critical failure: Robonaut pulled beyond event horizon. 💀",
                "Final telemetry received from Robonaut before destruction. 💀",
                "Robonaut's components scattered into the singularity. 💀",
                "Earth control confirms loss of Robonaut and all collected data. 💀",
                "Robonaut's mission ends here—humanity must find another way. 💀"
            ],
            gameStart: [
                "Systems online. Mission commencing... 🚀",
                "Reactor core stable. Let's navigate this void! 🚀",
                "Artificial Intelligence activated. Time to collect some particles! 🚀",
                "Black hole proximity detected. Stay alert, pilot! 🚀",
                "Welcome to the edge of reality. Good luck out there! 🚀",
                "All systems nominal. Beginning exotic particle collection. 🚀",
                "Thrusters calibrated. The black hole awaits your skill! 🚀",
                "Pilot interface engaged. Let's dance with gravity! 🚀",
                "Mission parameters loaded. Collect and survive! 🚀",
                "Event horizon detected. Watch your distance, Robonaut! 🚀"
            ],
            default: [
                "Floating aimlessly in the cosmic sea. ⭐",
                "Lost in the universe, just another day. ⭐",
                "Drifting through the void, seeking a spark. ⭐",
                "Celestial journey continues without incident. ⭐",
                "Quiet as the vacuum; nothing extraordinary happening. ⭐",
                "Space: infinitely mysterious and mundane. ⭐",
                "The universe keeps turning, indifferent to chaos. ⭐",
                "Silent stars watch over an insignificant journey. ⭐",
                "Casual cosmic meandering in endless night. ⭐",
                "Another calm day in the expanse of space. ⭐"
            ]
        };
    }

    getRandomMessage(eventType) {
        const messageCategory = this.messages[eventType] || this.messages.default;
        return messageCategory[Math.floor(Math.random() * messageCategory.length)];
    }
}

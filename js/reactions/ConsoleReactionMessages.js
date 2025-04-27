export class ConsoleReactionMessages {
    constructor() {
        this.messages = {
            gameStart: [
                "Mission initiated! Collect those particles and escape the void! 🚀",
                "Systems online! Time to hunt some exotic particles! 🚀",
                "The black hole awaits... let's show it who's boss! 🚀",
                "Game on! Let's defy the laws of physics! 🚀",
                "Mission control: You're cleared for particle harvesting! 🚀",
                "Engines primed, sensors active - time to ride! 🚀",
                "The void beckons... let's dance with gravity! 🚀",
                "Particle hunter ready! Let's set a new record! 🚀"
            ],
            shardCollected: [
                "Exotic Particles collected—cash in hand, universe smiling. 🚀",
                "Another Exotic Particle snagged; cosmic jackpot incoming! 🚀",
                "If I had a dime for each Exotic Particle... I'd be interstellar rich! 🚀",
                "Exotic Particles acquired; defying gravity one particle at a time. 🚀",
                "Rider's riding high after catching an Exotic Particle! 🚀",
                "Exotic Particle loot: the universe pays dividends. 🚀",
                "Caught an Exotic Particle! Score's lighting up the cosmos. 🚀",
                "Exotic Particle in hand, mission proceeding in style. 🚀",
                "Exotic Particle reels in universal fortune—easy stash! 🚀",
                "Exotic Particle secured, cosmic ledger updated. 🚀"
            ],
            playerTrapped: [
                "Gravity's got me clutched tight! 😰",
                "Houston, we have a problem... I'm in a trap! 😰",
                "Twisted fate—Rider's stalled in the void! 😰",
                "Caught in the gravitational snare, no escape? 😰",
                "Trapped! Even the cosmos lends a noose! 😰",
                "Exotic Particle hunt paused; entangled in gravity. 😰",
                "Stuck in space, with gravity playing tug-of-war! 😰",
                "Inescapable gravity... Rider's in a bind. 😰",
                "Trapped in the cosmic maze; no exit in sight. 😰",
                "Gravity's grip tightens—time to break free! 😰"
            ],
            playerEscaped: [
                "Freedom! The cosmos can't hold me down! 🎉",
                "Escape achieved; Exotic Particles spent daringly! 🎉",
                "Exotic Particle burn paves the way to freedom. 🎉",
                "Outrun gravity, outplay the black hole! 🎉",
                "Rider escapes by living on the edge! 🎉",
                "Breaking free, one Exotic Particle at a time! 🎉",
                "Defying the void, leaving a trail of Exotic Particles. 🎉",
                "Cosmic freedom: Exotic Particles incinerated in triumph! 🎉",
                "Escaped the clutches of gravity; score intact! 🎉",
                "Victory over gravity—Exotic Particles lighting the path! 🎉"
            ],
            playerDestroyed: [
                "Rider's been obliterated! End of the journey... 💀",
                "The cosmos has swallowed Rider—game over. 💀",
                "Catastrophe strikes; Rider meets a fiery end. 💀",
                "All systems down, Rider's journey ceases. 💀",
                "Rider is no more; the void claims another. 💀",
                "Fate's cruel twist: Rider's downfall is complete. 💀",
                "A spectacular collapse; Rider's final act. 💀",
                "Rider's particles scattered across the universe. 💀",
                "Universe declares game over as Rider vanishes. 💀",
                "Rider's run ends here—a cosmic farewell. 💀"
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
                "Event horizon detected. Watch your distance, captain! 🚀"
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

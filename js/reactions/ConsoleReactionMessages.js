export class ConsoleReactionMessages {
    constructor() {
        this.messages = {
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

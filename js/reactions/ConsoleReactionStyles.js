export class ConsoleReactionStyles {
    constructor() {
        this.styles = {
            shardCollected: [
                "color: #FF5733; font-weight: bold", 
                "color: #C70039; background: #FDFEFE",
                "color: #FFD700; font-size: 15px; text-shadow: 2px 2px #FF4500",
                "color: #FFA500; background: #000; font-weight: bold; font-style: italic"
            ],
            playerTrapped: [
                "color: #900C3F; font-size: 14px", 
                "color: #581845; text-shadow: 1px 1px #FFC300",
                "color: #FF0000; background: #333; font-size: 16px; font-weight: bold",
                "color: #8B0000; text-decoration: underline wavy"
            ],
            playerEscaped: [
                "color: #28B463; font-style: italic", 
                "color: #239B56; background: #E8F8F5",
                "color: #00FF00; font-size: 16px; text-shadow: 1px 1px #006400",
                "color: #32CD32; background: #F0FFF0; font-weight: bold; letter-spacing: 2px"
            ],
            playerDestroyed: [
                "color: #566573; text-decoration: line-through", 
                "color: #A93226; font-weight: 700",
                "color: #FF4444; background: #1a1a1a; font-size: 15px; text-decoration: line-through wavy",
                "color: #B22222; font-weight: bold; text-shadow: 2px 2px #000"
            ],
            default: [
                "color: #5D6D7E", 
                "color: #1F618D; font-size: 13px",
                "color: #4682B4; background: #F8F9F9; font-style: italic",
                "color: #6495ED; text-shadow: 1px 1px #B0C4DE"
            ],
            powerUpCollected: [
                "color: #9B59B6; font-weight: bold; font-size: 15px",
                "color: #8E44AD; background: #F5EEF8; text-shadow: 1px 1px #D7BDE2"
            ],
            nearBlackHole: [
                "color: #E74C3C; font-size: 16px; font-weight: bold; text-shadow: 2px 2px #000",
                "color: #C0392B; background: #FADBD8; animation: blink 1s infinite"
            ],
            speedBoost: [
                "color: #3498DB; font-style: italic; text-decoration: underline",
                "color: #2874A6; background: #EBF5FB; font-size: 14px"
            ],
            shieldActivated: [
                "color: #27AE60; font-weight: bold; border: 1px solid #2ECC71",
                "color: #229954; background: #E9F7EF; text-shadow: 1px 1px #A9DFBF"
            ],
            timeWarp: [
                "color: #F1C40F; font-size: 15px; text-shadow: 1px 1px #B7950B",
                "color: #D4AC0D; background: #FEF9E7; font-weight: bold"
            ]
        };
    }

    getRandomStyle(eventType) {
        const styleCategory = this.styles[eventType] || this.styles.default;
        return styleCategory[Math.floor(Math.random() * styleCategory.length)];
    }
}

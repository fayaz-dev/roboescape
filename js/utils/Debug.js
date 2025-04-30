/**
 * Debug utility class for handling logging with different severity levels
 */
export default class Debug {
    // Log level constants
    static NONE = 0;
    static ERROR = 1;
    static WARN = 2;
    static LOG = 3;
    static INFO = 4;

    // Current log level (default to NONE)
    static currentLevel = Debug.NONE;

    /**
     * Sets the logging level
     * @param {number} level - The log level to set
     */
    static setLevel(level) {
        if (level >= Debug.NONE && level <= Debug.INFO) {
            Debug.currentLevel = level;
            // Use direct console.log here to avoid recursion when level is NONE
            console.log(`Debug level set to ${level}`);
        } else {
            // Direct console.error to always show this critical error
            console.error(`Invalid debug level: ${level}. Must be between 0-4`);
        }
    }

    /**
     * Log an error message if level is ERROR or higher
     * @param {...any} args - Arguments to log
     */
    static error(...args) {
        if (Debug.currentLevel >= Debug.ERROR) {
            console.error(...args);
        }
    }

    /**
     * Log a warning message if level is WARN or higher
     * @param {...any} args - Arguments to log
     */
    static warn(...args) {
        if (Debug.currentLevel >= Debug.WARN) {
            console.warn(...args);
        }
    }

    /**
     * Log a regular message if level is LOG or higher
     * @param {...any} args - Arguments to log
     */
    static log(...args) {
        if (Debug.currentLevel >= Debug.LOG) {
            console.log(...args);
        }
    }

    /**
     * Log an info message if level is INFO
     * @param {...any} args - Arguments to log
     */
    static info(...args) {
        if (Debug.currentLevel >= Debug.INFO) {
            console.info(...args);
        }
    }

    /**
     * Initialize the debug module and expose the setLevel function to the browser console
     */
    static initialize() {
        // Make Debug class accessible in the browser console
        window.DebugUtils = {
            setLevel: Debug.setLevel,
            NONE: Debug.NONE,
            ERROR: Debug.ERROR,
            WARN: Debug.WARN,
            LOG: Debug.LOG,
            INFO: Debug.INFO
        };

        Debug.log('Debug module initialized. Use DebugUtils.setLevel(level) to change log level.');
    }
}

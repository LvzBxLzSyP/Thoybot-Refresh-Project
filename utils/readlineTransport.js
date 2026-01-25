const Transport = require('winston-transport');
const readline = require('readline');
const winston = require('winston');

/**
 * Custom Winston Transport that handles readline prompt gracefully with colors
 */
class ReadlineTransport extends Transport {
    constructor(opts) {
        super(opts);
        
        // Use Winston's colorizer
        this.colorizer = winston.format.colorize();
        
        // Define custom colors
        winston.addColors({
            silly: 'grey',
            input: 'grey',
            verbose: 'cyan',
            prompt: 'grey',
            debug: 'blue',
            info: 'green',
            data: 'grey',
            help: 'cyan',
            warn: 'yellow',
            error: 'red',
            fatal: 'bold red'
        });
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        const rl = global.rl;
        const level = info.level;
        
        // Use Winston colorizer to apply color.
        const coloredLevel = this.colorizer.colorize(level, level.toUpperCase());
        
        // Formatting messages
        let message;
        if (level === 'error' || level === 'fatal') {
            // Error and Fatal: Color the entire line.
            const coloredMessage = this.colorizer.colorize(level, info.message);
            message = `${info.timestamp} [${coloredLevel}]: ${coloredMessage}`;
        } else {
            // Other levels: Only level shading is available.
            message = `${info.timestamp} [${coloredLevel}]: ${info.message}`;
        }

        if (rl && rl.terminal) {
            // When Readline is enabled, the current line is cleared and the prompt is redisplayed.
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            
            // Output logs
            if (level === 'error' || level === 'fatal') {
                process.stderr.write(message + '\n');
            } else {
                process.stdout.write(message + '\n');
            }
            
            // Redisplay prompt
            rl.prompt(true);
        } else {
            // If there is no readline, output directly.
            if (level === 'error' || level === 'fatal') {
                process.stderr.write(message + '\n');
            } else {
                process.stdout.write(message + '\n');
            }
        }

        callback();
    }
}

module.exports = ReadlineTransport;
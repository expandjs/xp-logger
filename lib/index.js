/**
 * @license
 * Copyright (c) 2015 The expand.js authors. All rights reserved.
 * This code may only be used under the BSD style license found at https://expandjs.github.io/LICENSE.txt
 * The complete set of authors may be found at https://expandjs.github.io/AUTHORS.txt
 * The complete set of contributors may be found at https://expandjs.github.io/CONTRIBUTORS.txt
 */

// Const
const fs = require('xp-fs'),
    Path = require('path'),
    XP   = require('expandjs');

/*********************************************************************/

/**
 * A class used to provide fs logging functionality.
 *
 * @class XPLogger
 * @since 1.0.0
 * @description A class used to provide fs logging functionality
 * @keywords nodejs, expandjs
 * @source https://github.com/expandjs/xp-logger/blob/master/lib/index.js
 */
module.exports = global.XPLogger = new XP.Class('XPLogger', {

    /**
     * @constructs
     * @param {Object} options The logger options
     *   @param {string} options.path The path of the dir where logs will be saved
     *   @param {boolean} [options.debug = false] Specifies if the entire errors stack should be logged, instead of the errors message
     */
    initialize(options) {

        // Setting
        this.options = options;
        this.path    = this.options.path;
        this.debug   = this.options.debug || false;
    },

    /*********************************************************************/

    /**
     * A fs version of the usual console.log.
     * The file will be wrote asynchronously.
     *
     * @method log
     * @param {...*} args The arguments to log
     */
    log(...args) {

        // Preparing
        let date = `${new Date().toDateString()} ${new Date().toTimeString().slice(0, 17)}`,
            mess = `${args.reduce((reduced, value) => `${reduced}${reduced ? ` ` : ``}${XP.toString(value)}`, ``)}`,
            path = `${Path.resolve(`${this.path}/logs.log`)}`,
            text = `${date} >>> ${mess}\n`;

        // Attempting
        XP.attempt(() => {
            fs.ensureFileSync(path); // ensuring
            fs.appendFileSync(path, text); // appending
        });
    },

    /*********************************************************************/

    /**
     * Logs the provided `error`.
     * The file will be wrote asynchronously.
     * The `callback` is invoked with one argument: (`error`).
     *
     * A 2nd parameter can be provided to specify a `prefix` for the error's message.
     *
     * @method error
     * @param {Error} error
     * @param {string} [prefix]
     * @param {Function} [callback]
     * @returns {Error}
     */
    error: {
        callback: true,
        value(error, prefix, callback) {

            // Checking
            if (!error || error.logged) { callback(null, false); return error; }

            // Overriding
            Object.assign(error, {
                logged: true,
                code: error.code || 500,
                message: error.message || 'Unknown error',
                stack: error.stack || error.message || 'Unknown error'
            });

            // Preparing
            let code = error.code,
                mess = error[this.debug ? 'stack' : 'message'],
                date = `${new Date().toDateString()} ${new Date().toTimeString().slice(0, 17)}`,
                path = `${Path.resolve(`${this.path}/errors.log`)}`,
                text = `${date} >>> Error ${code}: ${error.prefix || prefix ? `${error.prefix || prefix} - ` : ``}${mess}\n`;

            // Waterfall
            XP.waterfall([
                next => fs.ensureFile(path, next), // ensuring
                next => fs.appendFile(path, text, next) // appending
            ], callback);

            return error;
        }
    },

    /*********************************************************************/

    /**
     * If set to true, the entire errors stack should be logged, instead of the errors message.
     *
     * @property debug
     * @type boolean
     */
    debug: {
        set(val) { return XP.isDefined(this.debug) ? this.debug : !!val; }
    },

    /**
     * The path of the dir where logs will be saved.
     *
     * @property path
     * @type string
     */
    path: {
        set(val) { return this.path || val; },
        validate(val) { return !XP.isString(val, true) && 'string'; }
    }
});

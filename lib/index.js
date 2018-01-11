/**
 * @license
 * Copyright (c) 2017 The expand.js authors. All rights reserved.
 * This code may only be used under the BSD style license found at https://expandjs.github.io/LICENSE.txt
 * The complete set of authors may be found at https://expandjs.github.io/AUTHORS.txt
 * The complete set of contributors may be found at https://expandjs.github.io/CONTRIBUTORS.txt
 */

// Const
const fs      = require('xp-fs'),
    Path      = require('path'),
    XP        = require('expandjs'),
    XPEmitter = require('xp-emitter');

/*********************************************************************/

/**
 * A class used to provide fs logging functionality.
 *
 * @class XPLogger
 * @extends XPEmitter /bower_components/xp-emitter/lib/index.js
 * @description A class used to provide fs logging functionality
 * @keywords nodejs, expandjs
 * @source https://github.com/expandjs/xp-logger/blob/master/lib/index.js
 */
module.exports = new XP.Class('XPLogger', {

    // EXTENDS
    extends: XPEmitter,

    /*********************************************************************/

    /**
     * Emitted when an error has been logged.
     *
     * @event error
     * @param {Object} error
     */

    /*********************************************************************/

    /**
     * @constructs
     * @param {Object} options The logger options
     *   @param {string} options.path The directory where logs will be saved
     *   @param {boolean} [options.debug = false] Specifies if the error stack should be logged
     *   @param {boolean} [options.every = false] Specifies if every error should be logged (default is only `5xx`)
     */
    initialize(options) {

        // Super
        XPEmitter.call(this);

        // Setting
        this.options = options;
        this.path    = this.options.path;
        this.debug   = this.options.debug || false;
        this.every   = this.options.every || false;
    },

    /*********************************************************************/

    /**
     * A fs version of the usual console.log.
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

        // Logging
        try { fs.ensureFileSync(path); } catch (err) { }
        try { fs.appendFileSync(path, text); } catch (err) { }
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
     * @returns {Promise}
     */
    error: {
        promise: true,
        value(error, prefix, callback) {

            // Checking
            if (!error || error.code && error.code < 500 && !this.every) { callback(); return error; }

            // Defaults
            error.code    = error.code || 500;
            error.message = error.message || 'Unknown error';
            error.stack   = error.stack || error.message;

            // Preparing
            let code = error.code,
                mess = error[this.debug ? 'stack' : 'message'],
                date = `${new Date().toDateString()} ${new Date().toTimeString().slice(0, 17)}`,
                path = `${Path.resolve(`${this.path}/errors.log`)}`,
                text = `${date} >>> Error ${code}: ${prefix ? `${prefix} - ` : ``}${mess}\n`;

            // Waterfall
            XP.waterfall([
                next => fs.ensureFile(path, next), // ensuring
                next => fs.appendFile(path, text, next) // appending
            ], error => callback(error, this.emit('error', error)));
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
        set(val) { return XP.isDefined(this.debug) ? this.debug : Boolean(val); }
    },

    /**
     * If set to true, every error should be logged, instead of 5xx only.
     *
     * @property every
     * @type boolean
     */
    every: {
        set(val) { return XP.isDefined(this.every) ? this.every : Boolean(val); }
    },

    /**
     * The directory where logs will be saved.
     *
     * @property path
     * @type string
     */
    path: {
        set(val) { return this.path || val; },
        validate(val) { return !XP.isString(val, true) && 'string'; }
    }
});

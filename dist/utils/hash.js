"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha1 = void 0;
const crypto = require("crypto");
const sha1 = (text) => {
    return crypto.createHash('sha1').update(text).digest('hex');
};
exports.sha1 = sha1;

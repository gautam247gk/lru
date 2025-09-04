"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class LRU extends events_1.EventEmitter {
    constructor(opts) {
        var _a, _b;
        super();
        if (typeof opts === "number")
            opts = { max: opts };
        if (!opts)
            opts = {};
        this.cache = {};
        this.head = this.tail = null;
        this.length = 0;
        this.max = (_a = opts.max) !== null && _a !== void 0 ? _a : 1000;
        this.maxAge = (_b = opts.maxAge) !== null && _b !== void 0 ? _b : 0;
    }
    get keys() {
        return Object.keys(this.cache);
    }
    clear() {
        this.cache = {};
        this.head = this.tail = null;
        this.length = 0;
    }
    remove(key) {
        if (typeof key !== "string")
            key = "" + key;
        if (!Object.prototype.hasOwnProperty.call(this.cache, key))
            return undefined;
        const element = this.cache[key];
        delete this.cache[key];
        if (element) {
            this._unlink(key, element.prev, element.next);
            return element.value;
        }
        return undefined;
    }
    _unlink(key, prev, next) {
        this.length--;
        if (this.length === 0) {
            this.head = this.tail = null;
        }
        else {
            if (this.head === key) {
                this.head = prev;
                if (this.head && this.cache[this.head] !== undefined) {
                    this.cache[this.head].next = null;
                }
            }
            else if (this.tail === key) {
                this.tail = next;
                if (this.tail && this.cache[this.tail])
                    this.cache[this.tail].prev = null;
            }
            else {
                if (prev && this.cache[prev])
                    this.cache[prev].next = next;
                if (next && this.cache[next])
                    this.cache[next].prev = prev;
            }
        }
    }
    peek(key) {
        if (typeof key !== "string")
            key = "" + key;
        if (!Object.prototype.hasOwnProperty.call(this.cache, key))
            return undefined;
        const element = this.cache[key];
        if (!element)
            return undefined;
        if (!this._checkAge(key, element))
            return undefined;
        return element.value;
    }
    set(key, value) {
        if (typeof key !== "string")
            key = "" + key;
        let element;
        if (Object.prototype.hasOwnProperty.call(this.cache, key)) {
            element = this.cache[key];
            if (element) {
                element.value = value;
                if (this.maxAge)
                    element.modified = Date.now();
                if (key === this.head)
                    return value;
                this._unlink(key, element.prev, element.next);
            }
        }
        else {
            element = { value, modified: 0, next: null, prev: null };
            if (this.maxAge)
                element.modified = Date.now();
            this.cache[key] = element;
            if (this.length === this.max)
                this.evict();
        }
        this.length++;
        if (element) {
            element.next = null;
            element.prev = this.head;
        }
        if (this.head)
            this.cache[this.head].next = key;
        this.head = key;
        if (!this.tail)
            this.tail = key;
        return value;
    }
    _checkAge(key, element) {
        if (!element)
            return false;
        if (this.maxAge && Date.now() - element.modified > this.maxAge) {
            this.remove(key);
            this.emit("evict", { key, value: element.value });
            return false;
        }
        return true;
    }
    get(key) {
        if (typeof key !== "string")
            key = "" + key;
        if (!Object.prototype.hasOwnProperty.call(this.cache, key))
            return undefined;
        const element = this.cache[key];
        if (!element)
            return undefined;
        if (!this._checkAge(key, element))
            return undefined;
        if (this.head !== key) {
            if (key === this.tail) {
                this.tail = element.next;
                if (this.tail && this.cache[this.tail])
                    this.cache[this.tail].prev = null;
            }
            else {
                if (element.prev && this.cache[element.prev])
                    this.cache[element.prev].next = element.next;
            }
            if (element.next && this.cache[element.next])
                this.cache[element.next].prev = element.prev;
            if (this.head)
                this.cache[this.head].next = key;
            element.prev = this.head;
            element.next = null;
            this.head = key;
        }
        return element.value;
    }
    evict() {
        if (!this.tail)
            return;
        const key = this.tail;
        const value = this.remove(this.tail);
        this.emit("evict", { key, value });
    }
}
module.exports = LRU;
//# sourceMappingURL=index.js.map
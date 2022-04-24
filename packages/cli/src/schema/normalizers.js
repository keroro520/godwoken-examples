"use strict";
// TODO Use lumos/codec instead.
exports.__esModule = true;
exports.normalizeScript = exports.toNormalize = exports.normalizeObject = exports.normalizeRawData = exports.normalizeHexNumber = void 0;
var toolkit_1 = require("@ckb-lumos/toolkit");
function normalizeHexNumber(length) {
    return function (debugPath, value) {
        if (!(value instanceof ArrayBuffer)) {
            var intValue = BigInt(value).toString(16);
            if (intValue.length % 2 !== 0) {
                intValue = "0" + intValue;
            }
            if (intValue.length / 2 > length) {
                throw new Error(debugPath + " is " + intValue.length / 2 + " bytes long, expected length is " + length + "!");
            }
            var view = new DataView(new ArrayBuffer(length));
            for (var i = 0; i < intValue.length / 2; i++) {
                var start = intValue.length - (i + 1) * 2;
                view.setUint8(i, parseInt(intValue.substr(start, 2), 16));
            }
            value = view.buffer;
        }
        if (value.byteLength < length) {
            var array = new Uint8Array(length);
            array.set(new Uint8Array(value), 0);
            value = array.buffer;
        }
        return value;
    };
}
exports.normalizeHexNumber = normalizeHexNumber;
function normalizeRawData(length) {
    return function (debugPath, value) {
        value = new toolkit_1.Reader(value).toArrayBuffer();
        if (length > 0 && value.byteLength !== length) {
            throw new Error(debugPath + " has invalid length " + value.byteLength + ", required: " + length);
        }
        return value;
    };
}
exports.normalizeRawData = normalizeRawData;
function normalizeObject(debugPath, obj, keys) {
    var result = {};
    for (var _i = 0, _a = Object.entries(keys); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], f = _b[1];
        var value = obj[key];
        if (!value) {
            throw new Error(debugPath + " is missing " + key + "!");
        }
        result[key] = f(debugPath + "." + key, value);
    }
    return result;
}
exports.normalizeObject = normalizeObject;
function toNormalize(normalize) {
    return function (debugPath, value) {
        return normalize(value, {
            debugPath: debugPath
        });
    };
}
exports.toNormalize = toNormalize;
function normalizeScript(script, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.debugPath, debugPath = _c === void 0 ? "script" : _c;
    return normalizeObject(debugPath, script, {
        code_hash: normalizeRawData(32),
        hash_type: function (debugPath, value) {
            switch (value) {
                case "data":
                    return 0;
                case "type":
                    return 1;
                case 0:
                    return value;
                case 1:
                    return value;
                default:
                    throw new Error(debugPath + ".hash_type has invalid value: " + value);
            }
        },
        args: normalizeRawData(-1)
    });
}
exports.normalizeScript = normalizeScript;

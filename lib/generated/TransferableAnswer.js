var _ = require('underscore'),
    kirinBridge = require('kirin/lib/core/kirin-validation');

function TransferableAnswer (params) {
    if (typeof params === 'object') {
        _.extend(this, params);
    }
}

var instance = TransferableAnswer.prototype;
module.exports = TransferableAnswer;

instance.kirin_bridgeUtils = new kirinBridge.BridgeUtils({
    "properties": {
        "resultToHtml": "string",
        "resultToString": "string",
        "unitScheme": "string"
    }
}, true);
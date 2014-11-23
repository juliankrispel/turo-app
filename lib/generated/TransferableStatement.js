var _ = require('underscore'),
    kirinBridge = require('kirin/lib/core/kirin-validation');

function TransferableStatement (params) {
    if (typeof params === 'object') {
        _.extend(this, params);
    }
}

var instance = TransferableStatement.prototype;
module.exports = TransferableStatement;

instance.kirin_bridgeUtils = new kirinBridge.BridgeUtils({
    "properties": {
        "id": "string",
        "expressionToString": "string",
        "expressionLength": "int",
        "expressionIsString": "boolean",
        "autoSuffix": "string",
        "identifierToString": "string",
        "expressionErrorToString": "string",
        "identifierErrorToString": "string",
        "resultToString": "string",
        "cursorPosition": "int",
        "unitScheme": "string"
    },
    "mandatory": [
        "id",
        "expressionToString"
    ]
}, true);
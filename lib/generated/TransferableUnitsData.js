var _ = require('underscore'),
    kirinBridge = require('kirin/lib/core/kirin-validation');

function TransferableUnitsData (params) {
    if (typeof params === 'object') {
        _.extend(this, params);
    }
}

var instance = TransferableUnitsData.prototype;
module.exports = TransferableUnitsData;

instance.kirin_bridgeUtils = new kirinBridge.BridgeUtils({
    "properties": {
        "units": "object",
        "schemes": "array",
        "dimensions": "array"
    }
}, true);
var mqtt = require("mqtt");
var debug = require('debug')('queen');

function Queen(brokerAddress) {
    this.brokerAddress = brokerAddress;
    this._subscriptions = [];
    this.network = {};

    this._client = mqtt.connect(brokerAddress);//('mqtt://localhost:1883');

    function subscriptionHandler(topic, message) {
        var strMessage = message.toString();
        debug("Received message: " + strMessage + " on topic: " + topic);

        _subscriptions.forEach(function (spec) {
            var regex = spec[0];
            if (regex.test(topic)) {
                spec[1].call(undefined, topic, strMessage);
            }
        });
    }

    this._client.on('message', subscriptionHandler);
}

Queen.prototype.publish = function(topic, message) {
    debug("Publishing data on %s : ", topic);
    debug(message);

    this._client.publish(topic, message)
}

Queen.prototype.subscribe = function(topic, regExp, callback) {
    this._client.subscribe(topic);
    this._subscriptions.push([regExp, callback]);
}

Queen.prototype.getService = function(deviceId, serviceId) {
    return deviceId + ":" + serviceId;
}

Queen.prototype.onConnect = function(callback) {
    this._client.on('connect', callback);
}

module.exports = Queen;
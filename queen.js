var mqtt = require("mqtt");
var debug = require('debug')('queen');

function Queen(brokerAddress) {
    var _subscriptions = []
        , _network = {}
        , _client = mqtt.connect(brokerAddress);

    _client.on('message', function (topic, message) {
        var strMessage = message.toString();
        debug("Received message: " + strMessage + " on topic: " + topic);

        _subscriptions.forEach(function (spec) {
            var regex = spec[0];
            if (regex.test(topic)) {
                spec[1].call(undefined, topic, strMessage);
            }
        });
    });

    return {
        publish : function(topic, message) {
            debug("Publishing data on %s : ", topic);
            debug(message);

            _client.publish(topic, message)
        },
        subscribe : function(topic, regExp, callback) {
            _client.subscribe(topic);
            _subscriptions.push([regExp, callback]);
        },
        onConnect : function(callback) {
            _client.on('connect', callback);
        },
        getService : function(deviceId, serviceId) {
            if (!serviceId) return _network[deviceId];
            return _network[deviceId + ":" + serviceId];
        },
        addService : function(service) {
            _network[service.serviceAddress()] = service;
            return this;
        }
    };
}

module.exports = Queen;
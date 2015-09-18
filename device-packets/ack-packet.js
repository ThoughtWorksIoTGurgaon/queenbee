var DevicePacket = require("../device-packet");

function AckPacket(serviceId) {
    var ackPacket = {};

    ackPacket.__proto__ = DevicePacket(5, serviceId);

    ackPacket.emitPacket = function() {
        return ackPacket.emitHeader();
    };

    ackPacket.consumePacket = function(packet) {
        return ackPacket.consumeHeader(packet);
    };

    return ackPacket;
}

module.exports = AckPacket;

(function(){
    var assert = require("assert");

    (function(){
        console.log("Should create a ack packet.");

        var serviceId = 3;
        var expectedPacket = new Buffer([1, 5, 0, 0, 0, serviceId]);
        var packet = AckPacket(serviceId).emitPacket();

        assert.deepEqual(packet, expectedPacket);
    })();
})(this);
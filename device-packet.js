function DevicePacket(type, serviceId) {
    var _version = 1
        , _type = type
        , _serviceId = serviceId;

    var _emitHeader = function() {
        return new Buffer([_version, _type, 0, 0, 0, _serviceId]);
    };

    var _consumeHeader = function(packet) {
        _version = packet[0];
        _type = packet[1];
        _serviceId = packet[5];

        return packet.slice(6);
    };

    return {
        version : function () {return _version},
        type : function () {return _type},
        serviceId : function () {return _serviceId},

        emitHeader : _emitHeader,
        consumeHeader : _consumeHeader
    };
}

module.exports = DevicePacket;

(function(){
    var assert = require("assert");

    (function(){
        console.log("Should read header of a device packet and return remaining as it is.");

        var version = 1;
        var type = 1;
        var serviceId = 3;
        var expectedRemainingPacket = new Buffer("remaining packet");
        var packet = Buffer.concat([
            new Buffer([version, type, 0, 0, 0, serviceId])
            , expectedRemainingPacket
        ]);
        var devicePacket = DevicePacket()
            , remainingPacket = devicePacket.consumeHeader(packet);

        assert.deepEqual(devicePacket.version(), version);
        assert.deepEqual(devicePacket.type(), type);
        assert.deepEqual(devicePacket.serviceId(), serviceId);
        assert.deepEqual(remainingPacket, expectedRemainingPacket);
    })();

    (function(){
        console.log("Should emit header of a device packet.");

        var version = 1;
        var type = 1;
        var serviceId = 3;
        var expectedPacket = new Buffer([version, type, 0, 0, 0, serviceId]);
        var devicePacket = DevicePacket(type, serviceId)
            , headerPacket = devicePacket.emitHeader();

        assert.deepEqual(headerPacket, expectedPacket);
    })();
})(this);
var DevicePacket = require("../device-packet");

function ReadPacket(serviceId) {
    var readPacket = {};

    readPacket.__proto__ = DevicePacket(1, serviceId);

    readPacket.emitPacketForChar = function(chIds) {
        return Buffer.concat([
            readPacket.emitHeader()
            , new Buffer([chIds.length])
            , new Buffer(chIds)
        ]);
    };

    return readPacket;
}

(function(){
    var assert = require("assert");

    (function(){
        console.log("Should create a read packet with for all characteristics.");

        var serviceId = 3;
        var expectedPacket = new Buffer([1, 1, 0, 0, 0, serviceId, 0]);
        var packet = ReadPacket(serviceId).emitPacketForChar([]);

        assert.deepEqual(packet, expectedPacket);
    })();

    (function(){
        console.log("Should create a read packet with for only 1 characteristic.");

        var serviceId = 3;
        var chId = 2;
        var expectedPacket = new Buffer([1, 1, 0, 0, 0, serviceId, 1, chId]);
        var packet = ReadPacket(serviceId).emitPacketForChar([chId]);

        assert.deepEqual(packet, expectedPacket);
    })();

    (function(){
        console.log("Should create a read packet with for two characteristics.");

        var serviceId = 3;
        var chIdOne = 4;
        var chIdTwo = 3;
        var expectedPacket = new Buffer([1, 1, 0, 0, 0, serviceId, 2, chIdOne, chIdTwo]);
        var packet = ReadPacket(serviceId).emitPacketForChar([chIdOne, chIdTwo]);

        assert.deepEqual(packet, expectedPacket);
    })();
})(this);
var DevicePacket = require("../device-packet");

function ObservePacket(serviceId) {
    var observePacket = {};

    observePacket.__proto__ = DevicePacket(3, serviceId);

    observePacket.emitPacketForChar = function(chIds) {
        return Buffer.concat([
            observePacket.emitHeader()
            , new Buffer([chIds.length])
            , new Buffer(chIds)
        ]);
    };

    return observePacket;
}

module.exports = ObservePacket;

(function(){
    var assert = require("assert");

    (function(){
        console.log("Should create a observe packet with for all characteristics.");

        var serviceId = 3;
        var expectedPacket = new Buffer([1, 3, 0, 0, 0, serviceId, 0]);
        var packet = ObservePacket(serviceId).emitPacketForChar([]);

        assert.deepEqual(packet, expectedPacket);
    })();

    (function(){
        console.log("Should create a observe packet with for only 1 characteristic.");

        var serviceId = 3;
        var chId = 2;
        var expectedPacket = new Buffer([1, 3, 0, 0, 0, serviceId, 1, chId]);
        var packet = ObservePacket(serviceId).emitPacketForChar([chId]);

        assert.deepEqual(packet, expectedPacket);
    })();

    (function(){
        console.log("Should create a observe packet with for two characteristics.");

        var serviceId = 3;
        var chIdOne = 4;
        var chIdTwo = 3;
        var expectedPacket = new Buffer([1, 3, 0, 0, 0, serviceId, 2, chIdOne, chIdTwo]);
        var packet = ObservePacket(serviceId).emitPacketForChar([chIdOne, chIdTwo]);

        assert.deepEqual(packet, expectedPacket);
    })();
})(this);
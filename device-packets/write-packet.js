var DevicePacket = require("../device-packet");

function WritePacket(serviceId) {
    var writePacket = {};

    writePacket.__proto__ = DevicePacket(2, serviceId);

    writePacket.emitPacketForChar = function(chDataInfos) {
        var chDataPackets = chDataInfos.map(function(chInfo) {
                return Buffer.concat([
                    new Buffer([chInfo.id, chInfo.data.length])
                    , new Buffer(chInfo.data)
                ]);
            })
            , chDataFlattened = chDataPackets.reduce(function(a, b){
                return Buffer.concat([a, b]);
            });

        return Buffer.concat([
            writePacket.emitHeader()
            , new Buffer([chDataPackets.length])
            , chDataFlattened
        ]);
    };

    return writePacket;
}

module.exports = WritePacket;

(function(){
    var assert = require("assert");

    (function(){
        console.log("Should create a write packet for one characteristic.");

        var serviceId = 3;
        var chId = 10, chData = "hello";
        var expectedPacket = Buffer.concat([
            new Buffer([1, 2, 0, 0, 0, serviceId, 1, chId, chData.length])
            , new Buffer(chData)
        ]);
        var packet = WritePacket(serviceId).emitPacketForChar([{id: chId, data: chData}]);

        assert.deepEqual(packet, expectedPacket);
    })();

    (function(){
        console.log("Should create a write packet for two characteristics.");

        var serviceId = 3;
        var chIdOne = 10, chDataOne = "hello";
        var chIdTwo = 10, chDataTwo = "helloooo";
        var expectedPacket = Buffer.concat([
            new Buffer([1, 2, 0, 0, 0, serviceId, 2])
            , new Buffer([chIdOne, chDataOne.length]), new Buffer(chDataOne)
            , new Buffer([chIdTwo, chDataTwo.length]), new Buffer(chDataTwo)
        ]);
        var packet = WritePacket(serviceId).emitPacketForChar([
            {id: chIdOne, data: chDataOne},
            {id: chIdTwo, data: chDataTwo}
        ]);

        assert.deepEqual(packet, expectedPacket);
    })();
})(this);
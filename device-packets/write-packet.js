var DevicePacket = require("../device-packet");

function WritePacket(serviceId) {
    var writePacket = {};

    writePacket.__proto__ = DevicePacket(2, serviceId);

    writePacket.emitPacketForChar = function(chDataInfos) {
        var chDataPackets = chDataInfos.map(function(chInfo) {
                return [chInfo.id, chInfo.data.length, chInfo.data];
            })
            , chDataFlattened = chDataPackets.reduce(function(a, b){
                return a.concat(b);
            });

        return Buffer.concat([
            writePacket.emitHeader()
            , new Buffer([chDataPackets.length])
            , new Buffer(chDataFlattened)
        ]);
    };

    return writePacket;
}

(function(){
    var assert = require("assert");

    (function(){
        console.log("Should create a write packet for one characteristic.");

        var serviceId = 3;
        var chId = 10, chData = "hello";
        var expectedPacket = new Buffer([1, 2, 0, 0, 0, serviceId, 1, chId, chData.length, chData]);
        var packet = WritePacket(serviceId).emitPacketForChar([{id: chId, data: chData}]);

        assert.deepEqual(packet, expectedPacket);
    })();

    (function(){
        console.log("Should create a write packet for two characteristics.");

        var serviceId = 3;
        var chIdOne = 10, chDataOne = "hello";
        var chIdTwo = 10, chDataTwo = "helloooo";
        var expectedPacket = new Buffer([1, 2, 0, 0, 0, serviceId, 2,
            chIdOne, chDataOne.length, chDataOne,
            chIdTwo, chDataTwo.length, chDataTwo
        ]);
        var packet = WritePacket(serviceId).emitPacketForChar([
            {id: chIdOne, data: chDataOne},
            {id: chIdTwo, data: chDataTwo}
        ]);

        assert.deepEqual(packet, expectedPacket);
    })();
})(this);
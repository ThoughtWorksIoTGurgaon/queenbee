var DevicePacket = require("../device-packet");

function ResponsePacket(packet) {
    var responsePacket = {};

    responsePacket.__proto__ = DevicePacket();

    responsePacket.charData = {};

    (function(packet) {
        var remainingPacket = responsePacket.consumeHeader(packet)
            , noChar = remainingPacket[0];

        remainingPacket = remainingPacket.slice(1);

        for(var i=0; i<noChar; ++i){
            var chId = remainingPacket[0]
                , chDataLen = remainingPacket[1]
                , chData = remainingPacket.slice(2, 2+chDataLen);

            responsePacket.charData[chId] = chData.toString();
            remainingPacket = remainingPacket.slice(2 + chDataLen);
        }

        return remainingPacket;
    })(packet);

    return responsePacket;
}

(function(){
    var assert = require("assert");

    (function(){
        console.log("Should read a response packet for one characteristic.");

        var serviceId = 3;
        var chId = 10, chData = "hello";
        var packet =
            Buffer.concat([
                new Buffer([1, 1, 0, 0, 0, serviceId, 1, chId, chData.length])
                , new Buffer(chData)
            ]);
        var responsePacket = ResponsePacket(packet);

        assert.deepEqual(responsePacket.charData[chId], chData);
    })();

    (function(){
        console.log("Should read a response packet for two characteristics.");

        var serviceId = 3;
        var chIdOne = 10, chDataOne = "hello";
        var chIdTwo = 5, chDataTwo = "world";
        var packet =
            Buffer.concat([
                new Buffer([1, 1, 0, 0, 0, serviceId, 2])
                , new Buffer([chIdOne, chDataOne.length]), new Buffer(chDataOne)
                , new Buffer([chIdTwo, chDataTwo.length]), new Buffer(chDataTwo)
            ]);
        var responsePacket = ResponsePacket(packet);

        assert.deepEqual(responsePacket.charData[chIdOne], chDataOne);
        assert.deepEqual(responsePacket.charData[chIdTwo], chDataTwo);
    })();

})(this);
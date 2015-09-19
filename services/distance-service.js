var Service = require("./../service.js");

function DistanceService(deviceId, serviceId) {
    var distanceService = {}
        , _characteristics = {
            'distance' : 0
            , 'unit' : 1
        }
        , _requests = {
            'read-distance' : function () {
                return {
                    packetType : 'read'
                    , packetData :[_characteristics['distance']]
                }
            }
            , 'read-unit' : function () {
                return {
                    packetType : 'read'
                    , packetData :[_characteristics['unit']]
                }
            }
            , 'set-unit' : function (unit) {
                return {
                    packetType : 'write'
                    , packetData :[
                        {id : _characteristics['unit'], data : new Buffer(unit)}
                    ]
                }
            }
        }
        , _responses = {};

    _responses[_characteristics['distance']] = function (distanceBufer) {
        return {
            response : 'distance'
            , data : distanceBufer.readUInt8(0)
        };
    };
    _responses[_characteristics['unit']] = function (unitBuffer) {
        return {
            response : 'unit'
            , data : unitBuffer.toString()
        };
    };

    distanceService.__proto__ = Service(
        deviceId
        , serviceId
        , _requests
        , _responses
    );

    return distanceService;
}

module.exports = DistanceService;

(function(){
    var assert = require("assert");
    var ResponsePacket = require("../device-packets/response-packet");

    var serviceId = 3
        , distanceService = DistanceService("my-device-id", serviceId);

    (function(){
        console.log("Should process read distance json message.");
        assert.deepEqual(
            distanceService.processRequest(JSON.stringify(
                {request: 'read-distance'}
            )),
            new Buffer([1, 1, 0, 0, 0, serviceId, 1, 0])
        );
    })();
    (function(){
        console.log("Should process read unit json message.");
        assert.deepEqual(
            distanceService.processRequest(JSON.stringify(
                {request: 'read-unit'}
            )),
            new Buffer([1, 1, 0, 0, 0, serviceId, 1, 1])
        );
    })();
    (function(){
        console.log("Should process set unit json message.");

        var unit = "cm"
            , unitBuffer = new Buffer(unit);

        assert.deepEqual(
            distanceService.processRequest(JSON.stringify(
                {request: 'set-unit', data: unit}
            )),
            Buffer.concat([
                new Buffer([1, 2, 0, 0, 0, serviceId, 1, 1, unitBuffer.length])
                , unitBuffer
            ])

        );
    })();
    (function(){
        console.log("Should process distance response packet.");
        assert.deepEqual(
            distanceService.processResponse(ResponsePacket(new Buffer([
                1, 4, 0, 0, 0, serviceId, 1, 0, 1, 23
            ]))),
            [{response: 'distance', data: 23}]
        );
    })();
    (function(){
        console.log("Should process unit response packet.");
        var unit = "cm"
            , unitBuffer = new Buffer(unit);

        assert.deepEqual(
            distanceService.processResponse(ResponsePacket(Buffer.concat([
                new Buffer([1, 4, 0, 0, 0, serviceId, 1, 1, unitBuffer.length])
                , unitBuffer
             ]))),
            [{response: 'unit', data: 'cm'}]
        );
    })();
})(this);
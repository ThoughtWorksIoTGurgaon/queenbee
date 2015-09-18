var WritePacket = require("./device-packets/write-packet.js");
var ReadPacket = require("./device-packets/read-packet.js");
var ObservePacket = require("./device-packets/observe-packet.js");

function Service(deviceId, serviceId, requests, responses) {
    var _deviceId = deviceId
        , _serviceId = serviceId
        , _requests = requests
        , _responses = responses
        , _processRequest = function(jsonString) {
            var jsonObject = JSON.parse(jsonString)
                , requestType = jsonObject.request
                , requestData = jsonObject.data
                , request = _requests[requestType](requestData)
                , packet;

            switch (request.packetType){
                case 'write':
                    packet = WritePacket(serviceId)
                        .emitPacketForChar(request.packetData);
                    break;
                case 'read':
                    packet = ReadPacket(serviceId)
                        .emitPacketForChar(request.packetData);
                    break;
                case 'observe':
                    packet = ObservePacket(serviceId)
                        .emitPacketForChar(request.packetData);
                    break;
            }

            return packet;
        }
        , _processResponse = function (responsePacket) {
            var charsData = responsePacket.charsData()
                , charIds = Object.keys(charsData);

            return charIds.map(function(charId) {
                return _responses[charId](charsData[charId])
            });
        };

    return {
        deviceId : function() {return _deviceId},
        serviceId : function() {return _serviceId},
        serviceAddress : function() {return _deviceId + ":" + _serviceId},
        processRequest : _processRequest,
        processResponse : _processResponse
    };
}

module.exports = Service;

(function() {
    var assert = require("assert");
    var ResponsePacket = require("./device-packets/response-packet");

    (function() {
        console.log("Should construct a service");
        var switchService = Service("my-device-id", 2);

        assert.equal(switchService.deviceId(), "my-device-id");
        assert.equal(switchService.serviceId(), 2);
        assert.equal(switchService.serviceAddress(), "my-device-id:2");

    })();

    (function() {
        console.log("Should read json request (which requires write op) message and emit write packet");
        var serviceId = 2
            , charId = 5
            , switchService = Service("my-device-id", serviceId, {
                'request-name' : function (requestData) {
                    return {
                        packetType: 'write'
                        , packetData :[
                            {id : charId, data : new Buffer(requestData)}
                        ]
                    }
                }
            })
            , jsonMessage = JSON.stringify({
                request : 'request-name'
                , data : 'some-request-data'
            })
            , dataBuffer = new Buffer('some-request-data')
            , expectedWritePacket = Buffer.concat([
            new Buffer([1, 2, 0, 0, 0, serviceId, 1, charId, dataBuffer.length]), dataBuffer
        ]);
        assert.deepEqual(switchService.processRequest(jsonMessage), expectedWritePacket);
    })();

    (function() {
        console.log("Should read json request (which requires read) message and emit read packet");
        var serviceId = 2
            , charId = 5
            , switchService = Service("my-device-id", serviceId, {
                'request-name' : function () {
                    return {
                        packetType: 'read'
                        , packetData :[charId]
                    }
                }
            })
            , jsonMessage = JSON.stringify({
                request : 'request-name'
                , data : 'some-request-data'
            })
            , expectedWritePacket = new Buffer([1, 1, 0, 0, 0, serviceId, 1, charId]);

        assert.deepEqual(switchService.processRequest(jsonMessage), expectedWritePacket);
    })();

    (function() {
        console.log("Should read json request (which requires observe) message and emit observe packet");
        var serviceId = 2
            , charId = 5
            , switchService = Service("my-device-id", serviceId, {
                'request-name' : function () {
                    return {
                        packetType: 'observe'
                        , packetData :[charId]
                    }
                }
            })
            , jsonMessage = JSON.stringify({
                request : 'request-name'
                , data : 'some-request-data'
            })
            , expectedWritePacket = new Buffer([1, 3, 0, 0, 0, serviceId, 1, charId]);

        assert.deepEqual(switchService.processRequest(jsonMessage), expectedWritePacket);
    })();

    (function() {
        console.log("Should read device response packet and emit json");
        var serviceId = 2
            , charId = 5
            , switchService = Service("my-device-id", serviceId, undefined, {
                5 : function (buffer) {
                    return {
                        response: 'response-name'
                        , data : buffer.toString()
                    }
                }
            })
            , expectedJsonMessage = [{
                response : 'response-name'
                , data : 'some-request-data'
            }]
            , charDataBuffer = new Buffer('some-request-data')
            , responsePacket = Buffer.concat([
                new Buffer([1, 4, 0, 0, 0, serviceId, 1, charId, charDataBuffer.length])
                , charDataBuffer
            ]);

        assert.deepEqual(
            switchService.processResponse(ResponsePacket(responsePacket)),
            expectedJsonMessage
        );
    })();
})(this);
var Service = require("./../service.js");

function SwitchService(deviceId, serviceId) {
    var switchService = {}
        , _characteristics = {
          'switch' : 1
           , 'toggle' : 2
           , 'toggle-period' : 3
        }
        , _requests = {
            'switch-on' : function () {
                return {
                    packetType : 'write'
                    , packetData :[
                        {id : _characteristics['switch'], data : new Buffer([2])}
                    ]
                }
            }
            , 'switch-off' : function () {
                return {
                    packetType : 'write'
                    , packetData :[
                        {id : _characteristics['switch'], data : new Buffer([1])}
                    ]
                }
            }
            , 'toggle-on' : function () {
                return {
                    packetType : 'write'
                    , packetData :[
                        {id : _characteristics['toggle'], data : new Buffer([1])}
                    ]
                }
            }
            , 'toggle-off' : function () {
                return {
                    packetType : 'write'
                    , packetData :[
                        {id : _characteristics['toggle'], data : new Buffer([0])}
                    ]
                }
            }
            , 'toggle-period' : function (timePeriod) {
                return {
                    packetType : 'write'
                    , packetData :[
                        {id : _characteristics['toggle-period'], data : new Buffer([timePeriod])}
                    ]
                }
            }
            , 'read-status' : function () {
                return {
                    packetType : 'read'
                    , packetData :[_characteristics['switch']]
                }
            }
            , 'read-toggle-enabled' : function () {
                return {
                    packetType : 'read'
                    , packetData :[_characteristics['toggle']]
                }
            }
            , 'read-toggle-period' : function () {
                return {
                    packetType : 'read'
                    , packetData :[_characteristics['toggle-period']]
                }
            }
            , 'read-everything' : function () {
                return {
                    packetType : 'read'
                    , packetData :[]
                }
            }
            , 'observe-status' : function () {
                return {
                    packetType : 'observe'
                    , packetData :[_characteristics['switch']]
                }
            }
        }
        , _responses = {};

        _responses[_characteristics['switch']] = function (statusBuffer) {
            return {
                response : 'status'
                , data : new Buffer([2]).equals(statusBuffer) ? "on" : "off"
            };
        };
        _responses[_characteristics['toggle']] = function (statusBuffer) {
            return {
                response : 'toggle-enabled'
                , data : new Buffer([1]).equals(statusBuffer) ? "on" : "off"
            };
        };
        _responses[_characteristics['toggle-period']] = function (togglePeriodBuffer) {
            return {
                response : 'toggle-period'
                , data : "" + togglePeriodBuffer.readUInt8(0)
            };
        };

    switchService.__proto__ = Service(
        deviceId
        , serviceId
        , _requests
        , _responses
    );

    return switchService;
}

module.exports = SwitchService;

(function(){
    var assert = require("assert");
    var ResponsePacket = require("../device-packets/response-packet");

    var serviceId = 3
        , switchService = SwitchService("my-device-id", serviceId);

    (function(){
        console.log("Should process switch on json message.");
        assert.deepEqual(
            switchService.processRequest(JSON.stringify(
                {request: 'switch-on'}
            )),
            new Buffer([1, 2, 0, 0, 0, serviceId, 1, 1, 1, 2])
        );
    })();
    (function(){
        console.log("Should process switch off json message.");
        assert.deepEqual(
            switchService.processRequest(JSON.stringify(
                {request: 'switch-off'}
            )),
            new Buffer([1, 2, 0, 0, 0, serviceId, 1, 1, 1, 1])
        );
    })();
    (function(){
        console.log("Should process toggle on json message.");
        assert.deepEqual(
            switchService.processRequest(JSON.stringify(
                {request: 'toggle-on'}
            )),
            new Buffer([1, 2, 0, 0, 0, serviceId, 1, 2, 1, 1])
        );
    })();
    (function(){
        console.log("Should process toggle off json message.");
        assert.deepEqual(
            switchService.processRequest(JSON.stringify(
                {request: 'toggle-off'}
            )),
            new Buffer([1, 2, 0, 0, 0, serviceId, 1, 2, 1, 0])
        );
    })();
    (function(){
        console.log("Should process toggle period set json message.");
        assert.deepEqual(
            switchService.processRequest(JSON.stringify(
                {request: 'toggle-period', data: 12}
            )),
            new Buffer([1, 2, 0, 0, 0, serviceId, 1, 3, 1, 12])
        );
    })();
    (function(){
        console.log("Should process read-everything json message.");
        assert.deepEqual(
            switchService.processRequest(JSON.stringify(
                {request: 'read-everything', data: 12}
            )),
            new Buffer([1, 1, 0, 0, 0, serviceId, 0])
        );
    })();
    (function(){
        console.log("Should process status response packet.");
        assert.deepEqual(
            switchService.processResponse(ResponsePacket(new Buffer([
                1, 4, 0, 0, 0, serviceId, 1, 1, 1, 1
            ]))),
            [{response: 'status', data: 'off'}]
        );
        assert.deepEqual(
            switchService.processResponse(ResponsePacket(new Buffer([
                1, 4, 0, 0, 0, serviceId, 1, 1, 1, 2
            ]))),
            [{response: 'status', data: 'on'}]
        );
    })();
    (function(){
        console.log("Should process toggle-enable response packet.");
        assert.deepEqual(
            switchService.processResponse(ResponsePacket(new Buffer([
                1, 4, 0, 0, 0, serviceId, 1, 2, 1, 0
            ]))),
            [{response: 'toggle-enabled', data: 'off'}]
        );
        assert.deepEqual(
            switchService.processResponse(ResponsePacket(new Buffer([
                1, 4, 0, 0, 0, serviceId, 1, 2, 1, 1
            ]))),
            [{response: 'toggle-enabled', data: 'on'}]
        );
    })();
    (function(){
        console.log("Should process toggle-period response packet.");
        assert.deepEqual(
            switchService.processResponse(ResponsePacket(new Buffer([
                1, 4, 0, 0, 0, serviceId, 1, 3, 1, 12
            ]))),
            [{response: 'toggle-period', data: 12}]
        );
    })();
})(this);
var Service = require("./../service.js");
var SwitchService = require("./switch-service");

function DeviceService(deviceId, serviceId, queen) {
    var deviceService = {}
        , _queen = queen
        , _characteristics = {
            'services' : 0
        }
        , _requests = {
            'discover-services' : function () {
                return {
                    packetType : 'read'
                    , packetData :[_characteristics['services']]
                }
            }
        }
        , _responses = {};

    _responses[_characteristics['services']] = function (servicesBuffer) {
        var supportedServiceCount = servicesBuffer[0];

        servicesBuffer = servicesBuffer.slice(1);

        for(var i=0; i< supportedServiceCount; ++i) {
            _queen.addService(SwitchService(deviceId, servicesBuffer[0]));

            servicesBuffer = servicesBuffer.slice(3);
        }

        return {
            response : 'discover-services'
            , data : "service discovery finished"
        };
    };

    deviceService.__proto__ = Service(
        deviceId
        , serviceId
        , _requests
        , _responses
    );

    return deviceService;
}

module.exports = DeviceService;

(function(){
    var assert = require("assert");
    var ResponsePacket = require("../device-packets/response-packet");

    var deviceId = "my-device-id"
        , serviceId = 3
        , service
        , queen = {
            addService : function(s) {
                service = s;
            }
        }
        , deviceService = DeviceService(deviceId, serviceId, queen);

    (function(){
        console.log("Should process discover-services json message.");
        assert.deepEqual(
            deviceService.processRequest(JSON.stringify(
                {request: 'discover-services'}
            )),
            new Buffer([1, 1, 0, 0, 0, serviceId, 1, 0])
        );
    })();
    (function(){
        console.log("Should process discover-services response packet.");

        var switchServiceId = 8;

        assert.deepEqual(
            deviceService.processResponse(ResponsePacket(new Buffer([
                1, 4, 0, 0, 0, serviceId, 1, 0, 5, 1, switchServiceId, 'S', 'W', 'H'
            ]))),
            [{response: 'discover-services', data: "service discovery finished"}]
        );
        assert.equal(service.deviceId(), deviceId);
        assert.equal(service.serviceId(), switchServiceId);
    })();
})(this);
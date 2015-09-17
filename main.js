var queen = new (require("./queen"))("mqtt://localhost:1883");

var deviceResponse = new (require("./device-response"))();

var ActionRequest = require("./command-packet/action-packet");
var ServiceDiscoveryRequest = require("./command-packet/service-discovery-packet");
var ServiceDiscoveryResponse = require("./data-packet/service-discovery-packet");
var ServiceStatusResponse = require("./data-packet/service-status-packet");

var deviceId = "my-device-id";

deviceResponse
    .registerHandler(
        new ServiceDiscoveryResponse(
            function(supportedServices){
                for (var i = supportedServices.length - 1; i >= 0; i--) {
                    queen.network[supportedServices[i].serivceAddress] = supportedServices[i];
                }

                console.log("After adding services of device id: " + deviceId + " network look like: ");
                console.log(queen.network);
            }
        )
    )
    .registerHandler(
        new ServiceStatusResponse(
            function(deviceId, serviceId, statusData){
                var service = queen.getService(deviceId, serviceId)
                    , serviceStatusJson =
                        service.readDeviceStatusDataMessage(statusData);

                queen.publish("/service/" + service.serivceAddress + "/data", serviceStatusJson);
            }
        )
    );

function onDeviceData(topic, message){
    var deviceId = /device\/(.+?)\/data/.exec(topic)[1];

    deviceResponse
        .getHandler(message)
        .readResponse(deviceId, new Buffer(message));
}

function onServiceCmd(topic, message){
    var serviceAddress = /service\/(.+?)\/cmd/.exec(topic)[1]
        , service = queen.network[serviceAddress]
        , packet = 
            new ActionRequest()
                .addServiceCmd(
                    service.serviceId, 
                    service.readServiceCmdMessage(message)
                )
                .emitPacketForChar();

    queen.publish("/device/" + service.deviceId + "/cmd", packet)
}

queen.onConnect(function () {
    // discover all services of "my-device-id"
    queen.publish("/device/" + deviceId + "/cmd", new ServiceDiscoveryRequest().emitPacketForChar());

    queen.subscribe(
        "/device/+/data", 
        /\/device\/.*\/data/, 
        onDeviceData
    );

    queen.subscribe(
        "/service/+/cmd", 
        /\/service\/.*\/cmd/, 
        onServiceCmd
    );
});

//Tests for the applications

(function() {
    var assert = require("assert");
    var SwitchService = require("./switch-service");

    var network_old = queen.network;
    queen.network = {"my-switch-service-address" : new SwitchService("my-device-id", 2)};

    (function() {
        console.log("Should Relay command messages from service to device");
        
        var publish_old = queen.publish;
        var publishedMessages = [];
        queen.publish = function(topic, data) {
            publishedMessages.push([topic, data]);
        };

        onServiceCmd(
            "/service/my-switch-service-address/cmd", 
            JSON.stringify({serviceAddress: 'my-switch-service-address', data: "off"})
        );
        
        onServiceCmd(
            "/service/my-switch-service-address/cmd", 
            JSON.stringify({serviceAddress: 'my-switch-service-address', data: "on"})
        );

        var packetForOff = new Buffer([1, 1, 0, 0, 0, 1, 2, 1, 0]);
        var packetForOn = new Buffer([1, 1, 0, 0, 0, 1, 2, 1, 1]);

        assert.equal(publishedMessages[0][0], "/device/my-device-id/cmd");
        assert.deepEqual(publishedMessages[0][1], packetForOff);

        assert.equal(publishedMessages[1][0], "/device/my-device-id/cmd");
        assert.deepEqual(publishedMessages[1][1], packetForOn);

        queen.publish = publish_old;
    })(this);

    queen.network = network_old;
})(this);

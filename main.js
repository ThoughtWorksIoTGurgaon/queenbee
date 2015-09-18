var Queen = require("./queen");

var ResponsePacket = require("./device-packets/response-packet");
var SwitchService = require("./services/switch-service");

var deviceId = "my-device-id"
    , serviceId = 1
    , switchService = SwitchService(deviceId, serviceId);

var queen = Queen("mqtt://localhost:1883");

queen.addService(switchService);

function onDeviceData(topic, packet){
    var deviceId = /device\/(.+?)\/data/.exec(topic)[1]
        , responsePacket = ResponsePacket(packet)
        , service = queen.getService(deviceId, responsePacket.serviceId())
        , jsonResponse = service.processResponse(responsePacket);

    queen.publish("/service/" + service.serviceAddress() + "/data", jsonResponse);
}

function onServiceCmd(topic, message){
    var serviceAddress = /service\/(.+?)\/cmd/.exec(topic)[1]
        , service = queen.getService(serviceAddress)
        , packet = service.processRequest(message);

    queen.publish("/device/" + service.deviceId() + "/cmd", packet)
}

queen.onConnect(function () {
    queen.subscribe("/device/+/data", /\/device\/.*\/data/, onDeviceData);
    queen.subscribe("/service/+/cmd", /\/service\/.*\/cmd/, onServiceCmd);
});

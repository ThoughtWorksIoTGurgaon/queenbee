var queen = (require("./queen"))("mqtt://localhost:1883");

var ResponsePacket = require("./device-packets/response-packet");
var DeviceService = require("./services/device-service");

function onDeviceData(topic, packet){
    var deviceId = /device\/(.+?)\/data/.exec(topic)[1]
        , responsePacket = ResponsePacket(new Buffer(packet))
        , serviceId = responsePacket.serviceId()
        , service = queen.getService(deviceId, serviceId);

    if (service === undefined){
        // Device discovery is handled here.
        service = DeviceService(deviceId, serviceId, queen);
        queen.addService(service);
    }

    var jsonResponse = service.processResponse(responsePacket);

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

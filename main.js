var debug = require('debug')('main');
var queen = (require("./queen"))("mqtt://localhost:1883");

var ResponsePacket = require("./device-packets/response-packet");
var DeviceService = require("./services/device-service");

function onDeviceData(topic, packet){
    debug("onDeviceData");
    debug("topic : " + topic);
    debug("packet : " + packet);

    var deviceId = /device\/(.+?)\/data/.exec(topic)[1]
        , responsePacket = ResponsePacket(new Buffer(packet))
        , serviceId = responsePacket.serviceId()
        , service = queen.getService(deviceId, serviceId);

    debug("Response packet : " + responsePacket);
    debug("deviceId: " + deviceId);
    debug("serviceId: " + serviceId);
    debug("service: " + service);

    if (service === undefined && serviceId == 1){
        // Device discovery is handled here.
        service = DeviceService(deviceId, serviceId, queen);
        queen.addService(service);
    }

    if (service !== undefined){
        var jsonResponse = JSON.stringify(service.processResponse(responsePacket));

        debug("serviceAddress: " + service.serviceAddress());
        debug("json resp : " + jsonResponse);

        queen.publish("/service/"+service.serviceAddress()+"/data", jsonResponse);
    } else {
        debug("Got response for unknown service");
    }
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

var mqtt = require("mqtt");
var client = mqtt.connect('mqtt://localhost:1883');

var _debug = true;

function debug(msg) {
    if(_debug) console.log(msg);
}

var network = {
    phy: {},

    link: {}
};


function publish(topic, message) {
    debug("Publishing data on " + topic + " : " + message);
    client.publish(topic, message)
}

var _subscriptions = [];
function subscribe(regExp, callback) {
    _subscriptions.push([regExp, callback]);
}


function publishDataForService(serviceAddress, data) {
    var topic = "/service/" + serviceAddress + "/data";
    var message = JSON.stringify(data);

    publish(topic, message);
}

function publishCmdToDevice(deviceId, message) {
    publish("/device/" + deviceId + "/cmd", message)
}


client.on('connect', function () {
    client.subscribe("/device/+/data");
    client.subscribe("/device/+/cmd");
    client.subscribe("/service/+/cmd");


    subscribe(/\/device\/.*\/data/, onDeviceData);
    subscribe(/\/service\/.*\/cmd/, onServiceCmd);
});

client.on('message', function (topic, message) {

    var strMessage = message.toString();
    debug("Received message " + strMessage + "On topic: " + topic);

    _subscriptions.forEach(function (spec) {
        var regex = spec[0];
        if (regex.test(topic)) {
            spec[1].call(undefined, topic, strMessage);
        }
    });

});

function onDeviceData(topic, message) {
    var deviceId = /device\/(.+?)\/data/.exec(topic)[1];

    var data = JSON.parse(message);

    data.forEach(function (service) {
        /** @namespace service.sid */
        var serviceAddress = deviceId + ":" + service.sid;

        //todo: remove once service discovery is played
        createEntryInNetworkTable(serviceAddress, deviceId, service.sid);

        network.link[serviceAddress].data = service.data;

        publishDataForService(serviceAddress, service.data);
    });
}

function onServiceCmd(topic, message){
    var serviceAddress = /service\/(.+?)\/cmd/.exec(topic)[1];
    var deviceId = network.link[serviceAddress].device;

    publishCmdToDevice(deviceId, message);
}

function createEntryInNetworkTable(serviceAddress, deviceId, serviceId) {
    if (!network.link[serviceAddress]) {
        network.link[serviceAddress] = {
            device: deviceId,
            service: serviceId
        }
    }

    if (!network.phy[deviceId]) {
        network.phy[deviceId] = {
            device: deviceId,
            services: [{
                sid: serviceId
            }]
        }
    }

    var found = true;
    network.phy[deviceId].services.forEach(function(servDesc) {
        found = servDesc.sid == serviceId
    });

    if(!found) {
        network.phy[deviceId].services.push({sid: serviceId});
    }
}

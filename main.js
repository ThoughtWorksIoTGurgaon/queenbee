var mqtt = require("mqtt");
var client = mqtt.connect('mqtt://192.168.43.11:1883');

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
    publish(topic, data);
}

function publishCmdToDevice(deviceId, serviceId, cmd) {
    var packet = createPacket(serviceId, cmd);

    publish("/device/" + deviceId + "/cmd", packet)
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

    var data = parsePacket(message);

    data.forEach(function (service) {
        /** @namespace service.sid */
        var serviceAddress = deviceId + ":" + service.sid;

        //todo: remove once service discovery is played
        createEntryInNetworkTable(serviceAddress, deviceId, service.sid);

        network.link[serviceAddress].data = service.data;

        publishDataForService(serviceAddress, {serviceAddress: serviceAddress, data: service.data});
    });
}

function onServiceCmd(topic, message){
    var serviceAddress = /service\/(.+?)\/cmd/.exec(topic)[1];
    var deviceId = network.link[serviceAddress].device;
    var serviceId = network.link[serviceAddress].service;

    var cmd = message.data == "on" ? 1 : 0;

    publishCmdToDevice(deviceId, serviceId, cmd);
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

function createPacket(serviceId, data) {
    return new Buffer([1, 1, 0, 4, 0, 1, parseInt(serviceId), 1, data]);
}

function parsePacket(packet) {
    var parsedMessage = [];
    var buffer = new Buffer(packet, "ascii");
    debug("Received the packet" + buffer);

    if (buffer[0] == 1) { //version
        //buffer[1] type of packet
        var ptr = 5;
        var serviceCount = buffer[ptr];
        while(serviceCount-- > 0) {
            var serviceId = buffer[++ptr];
            var len = buffer[++ptr];
            var data = buffer.slice(++ptr, ptr + len)[0];
            ptr = ptr + len-1;

            parsedMessage.push({sid: serviceId, data: data == 0 ? "off" : "on"});
        }
        debug("Converted the Received packet to " + parsedMessage);
    } else {
        debug("Invalid Message");
    }

    return parsedMessage;
}



//Tests for the applications

(function() {

    (function() {
        console.log("Should parse a packet");
        var packet = new Buffer([1, 1, 0, 4, 0, 1, 2, 1, 0]);
        var jsonPacket = parsePacket(packet);

        assert.equal(jsonPacket.length, 1);
        assert.equal(jsonPacket[0].sid, 2);
        assert.equal(jsonPacket[0].data, "off");

    })();

    (function() {
        console.log("\n\nShould parse a packet with Multiple services");
        var packet = new Buffer([1, 1, 0, 4, 0, 2, 2, 1, 0, 4, 1, 1]);
        var jsonPacket = parsePacket(packet);

        assert.equal(jsonPacket.length, 2);
        assert.equal(jsonPacket[0].sid, 2);
        assert.equal(jsonPacket[0].data, "off");
        assert.equal(jsonPacket[1].sid, 4);
        assert.equal(jsonPacket[1].data, "on");
    })();

    (function(){
        console.log("Should create a packet")
        var data=1
        var serviceId=5

        var expectedPacket = new Buffer([1, 1, 0, 4, 0, 1, serviceId, 1, data]);
        var packet = createPacket(serviceId, data);

        assert.equal(packet.toString(),expectedPacket.toString())
    })();

    (function() {
        console.log("Should Relay message from device to service topic");
        var publish_old = this.publish;
        var publishedMessages = [];
        this.publish = function(topic, data) {
            publishedMessages.push([topic, data]);
        };

        var packet = new Buffer([1, 1, 0, 4, 0, 1, 2, 1, 0]);
        onDeviceData("/device/my-device-id/data", packet);

        assert.equal(publishedMessages[0][0], "/service/abc:2/data");
        assert.deepEqual(publishedMessages[0][1], {serviceAddress: 'abc:2', data: "off"});

        this.publish = publish_old;
    })(this);


    (function() {
        console.log("Should Relay message from service to device topic");
        var publish_old = this.publish;
        var publishedMessages = [];
        this.publish = function(topic, data) {
            publishedMessages.push([topic, data]);
        };

        onServiceCmd("/service/abc:2/cmd", {serviceAddress: 'abc:2', data: "off"});
        var packet = new Buffer([1, 1, 0, 4, 0, 1, 2, 1, 0]);

        assert.equal(publishedMessages[0][0], "/device/abc/cmd");
        assert.deepEqual(publishedMessages[0][1], packet);

        this.publish = publish_old;
    })(this);

})(this);

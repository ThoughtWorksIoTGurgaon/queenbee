var SwitchService = require("../switch-service");

function ServiceStatusPacket(callback) {
	this.version = 1;
	this.type = 1;
    this.callback = callback
}

ServiceStatusPacket.prototype.readResponse = function(deviceId, statusResponsePacket) {
    var servicesId = statusResponsePacket[5]
        , serviceStatusDataLength = statusResponsePacket[6]
        , serviceStatusData = statusResponsePacket.slice(7);

    return this.callback(deviceId, servicesId, serviceStatusData);
};

module.exports = ServiceStatusPacket;

(function() {
    var assert = require("assert");

    (function(){
        console.log("Should read status response packet of a service and call callback with its status.")

        var deviceId = "my-device-id";
        var serviceId = 2;
        var data = "my-data";
        var packet = Buffer.concat([new Buffer([1, 1, 0, 0, 0, serviceId, data.length]), new Buffer(data)]);
        var actualDeviceId, actualServiceId, actualServiceStatusData;

        new ServiceStatusPacket(function(did, sid, data){
            actualDeviceId = did;
            actualServiceId = sid;
            actualServiceStatusData = data;
        }).readResponse(deviceId, packet);

        assert.equal(actualDeviceId, deviceId);
        assert.equal(actualServiceId, serviceId);
        assert.equal(actualServiceStatusData, data);
    })();

})(this);
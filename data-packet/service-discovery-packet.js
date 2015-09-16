var SwitchService = require("../switch-service");

function SeriveDiscoveryPacket(callback) {
	this.version = 1;
	this.type = 2;
    this.callback = callback
}   

SeriveDiscoveryPacket.prototype.readResponse = function(deviceId, supportedServicesPacket) {
    var services = []
        , servicesCount = supportedServicesPacket[5]
        , servicesPacket = supportedServicesPacket.slice(6);

    for (var i = 0; i < servicesCount; i++) {
        var serviceId = servicesPacket[i*2]
            , serviceProfileId = servicesPacket[i*2 + 1];

        services.push(new SwitchService(deviceId, serviceId));
    }

    return this.callback(services);
};

module.exports = SeriveDiscoveryPacket;

(function() {
    var assert = require("assert");
	
    (function(){
        console.log("Should parse a service discovery data/response packet with single service");
        var deviceId = "my-device-id";
        var serviceId = 2;
        var serviceProfileId = 1;

        var packet = new Buffer([1, 2, 0, 0, 0, 1, serviceId, serviceProfileId]);
        var services = 
            new SeriveDiscoveryPacket(function(s){ return s; })
                .readResponse(deviceId, packet);

        assert.equal(services.length, 1);
        assert.equal(services[0].deviceId, deviceId);
        assert.equal(services[0].serviceId, serviceId);
    })();

    (function(){
        console.log("Should parse a service discovery data/response packet with two services");
        var deviceId = "my-device-id";
        var serviceIdOne = 2;
        var serviceProfileIdOne = 1;
        var serviceIdTwo = 3;
        var serviceProfileIdTwo = 4;

        var packet = new Buffer([1, 2, 0, 0, 0, 2, serviceIdOne, serviceProfileIdOne, serviceIdTwo, serviceProfileIdTwo]);
        var services = 
            new SeriveDiscoveryPacket(function(s){ return s; })
                .readResponse(deviceId, packet);

        assert.equal(services.length, 2);
        assert.equal(services[0].deviceId, deviceId);
        assert.equal(services[0].serviceId, serviceIdOne);
        assert.equal(services[1].deviceId, deviceId);
        assert.equal(services[1].serviceId, serviceIdTwo);
    })();

})(this);
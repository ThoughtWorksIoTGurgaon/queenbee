function SwitchService(deviceId, serviceId) {
	this.deviceId = deviceId;
	this.serviceId = serviceId;
    this.serivceAddress = deviceId + ":" + serviceId;
}

SwitchService.prototype.readServiceCmdMessage = function(message) {
    var jsonObj = JSON.parse(message);
    return jsonObj.data == "on" ? "1" : "0";
};

SwitchService.prototype.readDeviceStatusDataMessage = function(message) {
    var data = message == "1" ? "on" : "off";
    return JSON.stringify({serviceAddress : this.serviceAddress, data : data});
};

module.exports = SwitchService;

(function() {
    var assert = require("assert");

    (function() {
        console.log("Should construct a switch service");
        var switchService = new SwitchService("my-device-id", 2);

        assert.equal(switchService.deviceId, "my-device-id");
        assert.equal(switchService.serviceId, 2);
        assert.equal(switchService.serivceAddress, "my-device-id:2");

    })();

    (function() {
        console.log("Should read json service message for a switch service");
        var switchService = new SwitchService("my-device-id", 2);

        assert.equal(switchService.readServiceCmdMessage('{"data": "on"}'), '1');
        assert.equal(switchService.readServiceCmdMessage('{"data": "off"}'), '0');

    })();
})(this);
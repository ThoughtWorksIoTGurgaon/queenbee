function DeviceResponse() {
	this.version = 1;
    this.responseHandlers = {};
}

DeviceResponse.prototype.registerHandler = function(responseHandler) {
	this.responseHandlers[responseHandler.type] = responseHandler;

	return this;
}

DeviceResponse.prototype.getHandler = function(packet) {
    var type = packet[1];

    return this.responseHandlers[type];
}

module.exports = DeviceResponse;

(function() {
    var assert = require("assert");

    (function(){
        console.log("Should register handler with its type as key.")

        var responseHandler = {type : 2};
        var packet = new Buffer([1, 2, 0, 0, 0]);
        var deviceResponseFactory = 
            new DeviceResponse()
                .registerHandler(responseHandler);

        assert.deepEqual(deviceResponseFactory.getHandler(packet), responseHandler);
    })();

})(this);
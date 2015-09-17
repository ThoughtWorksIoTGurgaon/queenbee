function ActionPacket() {
	this.version = 1;
	this.type = 1;
	this.services = [];
    this.packetHeader = [
            this.version,
            this.type,
            0,
            0,
            0
        ];
}

ActionPacket.prototype.addServiceCmd = function(serviceId, data) {
	this.services.push({id: serviceId, data: data});

	return this;
};

ActionPacket.prototype.emitPacketForChar = function() {
	var serviceCmdsPackets = this.services.map(function(service){
		  return [service.id, service.data.length, service.data];
	   })
    , flattenedPacket = [].concat.apply([], serviceCmdsPackets)
    , packet = [this.packetHeader, [serviceCmdsPackets.length], flattenedPacket];

	return new Buffer([].concat.apply([], packet));
};

module.exports = ActionPacket;

(function() {
    var assert = require("assert");
	
    (function(){
        console.log("Should create a command packet for a single service");
        var data = "1"
        	, serviceId = 5;

        var expectedPacket = new Buffer([1, 1, 0, 0, 0, 1, serviceId, 1, data]);
        var packet = 
        	new ActionPacket()
        		.addServiceCmd(serviceId, data)
        		.emitPacketForChar();

        assert.equal(packet.toString(),expectedPacket.toString())
    })();

    (function(){
        console.log("Should create a command packet for two services");
        var dataOne = "1"
        	, serviceIdOne = 5
        	, dataTwo = "23"
        	, serviceIdTwo = 7;

        var expectedPacket = new Buffer([1, 1, 0, 0, 0, 2, serviceIdOne, 1, dataOne, serviceIdTwo, 2, dataTwo]);
        var packet = 
        	new ActionPacket()
                .addServiceCmd(serviceIdOne, dataOne)
        		.addServiceCmd(serviceIdTwo, dataTwo)
        		.emitPacketForChar();

        assert.equal(packet.toString(),expectedPacket.toString())
    })();

})(this);
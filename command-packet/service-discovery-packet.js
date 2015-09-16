function SeriveDiscoveryPacket() {
	this.version = 1;
	this.type = 2;
	this.services = [];
    this.packetHeader = [
            this.version,
            this.type,
            0,
            0,
            0
        ];
}

SeriveDiscoveryPacket.prototype.createPacket = function() {
	return new Buffer(this.packetHeader);
};

module.exports = SeriveDiscoveryPacket;

(function() {
	var assert = require("assert");

    (function(){
        console.log("Should create a service discovery packet to query device for its supported services.");

        var expectedPacket = new Buffer([1, 2, 0, 0, 0]);
        var packet = new SeriveDiscoveryPacket().createPacket();

        assert.equal(packet.toString(),expectedPacket.toString())
    })();

})(this);
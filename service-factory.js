
function ServiceFactory() {
    var _services = {};

    return {
        addService : function(profileId, serviceFunction) {
            _services[profileId] = serviceFunction;
            return this;
        }
        , getService : function(profileId) {
            return _services[profileId];
        }
    };
}

module.exports = ServiceFactory()
    .addService("SWH", require("./services/switch-service"))
    .addService("DST", require("./services/distance-service"));

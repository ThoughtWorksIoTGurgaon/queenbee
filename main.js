var mqtt = require("mqtt");
var client  = mqtt.connect('mqtt://localhost:1883');

var device = {};
var sensors = {};

var dataRegex = /\/data\/(.*)/;
var messageCallbacks = [];


client.on('connect', function () {
    client.subscribe("/data/#");
    client.subscribe("/device/#");


    addMessageCallback(/\/data\//, onData);
});

client.on('message', function (topic, message) {

    messageCallbacks.forEach(function(spec) {
        var regex = spec[0];
        if (regex.test(topic)) {
            spec[1].call(topic, message);
        }
    });
    console.log(message.toString());
});

function addMessageCallback(regExp, callback) {
    messageCallbacks.push([regExp, callback]);
}

function onData(topic, message) {
    message = JSON.parse(message.toString());

    var result = topic.exec(dataRegex);
    var deviceId = undefined;
    if(result) {
        deviceId = result[1];
        device[deviceId] = device[deviceId] || {lastMessage: null, messages: []};

        device[deviceId].lastMessage = message;
        device[deviceId].messages.push(message);

        message.data.forEach(function(sensorData) {
            var currentTime = Date.now();

            var sensorObj = sensors[sensorData['id']] || {value: null, updateAt: null, history: {}};
            sensorObj.value = sensorData['value'];
            sensorObj.updatedAt = currentTime;

            sensorObj.history[currentTime.toString()] = value;

            sensors[sensorData['id']] = sensorObj;
        });
    }
}
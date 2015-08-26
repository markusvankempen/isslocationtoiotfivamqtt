//------------------------------------------------------------------------------
//
// ISS Location to IOTF via mqtt
//
// Markus van Kempen - mvk@ca.ibm.com
//------------------------------------------------------------------------------
var mqtt = require('mqtt');
var url = require('url');
var macUtil = require('getmac');
var properties = require('properties');
var connected = false;
var request = require('request');

/**
 *
 */

"option strict";

properties.parse('./config.properties', {path: true}, function(err, cfg) {
  if (err) {
    console.error('A file named config.properties containing the device registration from the IBM IoT Cloud is missing.');
    console.error('The file must contain the following properties: org, type, id, auth-token.');
    throw e;
  }
  macUtil.getMac(function(err, macAddress) {
    if (err) throw err;
    var deviceId = macAddress.replace(/:/gi, '');
    console.log('Device MAC Address: ' + deviceId);

//    if(cfg.id != deviceId) {
//    	console.warn('The device MAC address does not match the ID in the configuration file.');
//    }
//cfg.org = 'quickstart';
    var clientId = ['d', cfg.org, cfg.type, cfg.id].join(':');


//    client = mqtt.createSecureClient('8883', cfg.org + '.messaging.internetofthings.ibmcloud.com',
    client = mqtt.createClient('1883',   cfg.org + '.messaging.internetofthings.ibmcloud.com',
      {
        "clientId" : clientId,
//		 "clientId" : 'd:quickstart:paho-client:8c705ae36b0c',
        "keepalive" : 30,
//        "username" : "",
//        "password" : ""
        "username" : "use-token-auth",
        "password" : cfg['auth-token']
      });

    client.on('connect', function() {
	  console.log('MQTT client connected to IBM IoT Cloud.');
	  console.log("We are DeviceID  : "+cfg.id);


// does not work
//iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/cmd/MVK/fmt/json
//client.subscribe('iot-2/type/+/id/00-21-CC-C8-6F-1B/+/MVK/fmt/json');
//console.log("Subscribe : "+'iot-2/type/+/id/00-21-CC-C8-6F-1B/+/MVK/fmt/json');

// Note - as a device you can only subscribe to CMD
//publish to : iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/cmd/MVK/fmt/json
/* example message
    {
        "d": {"myName": "Paho client",
             "TargetTemp": 60
        }
    }
*/

// received events: iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/evt/+/fmt/json

client.subscribe('iot-2/cmd/+/fmt/json');
console.log("Subscribe : "+'iot-2/cmd/+/fmt/json');

     pushissidata();

    });//client.on


	client.on('message', function(topic, message) {
    console.log(">>>>> Topic: " +topic + "  Msg: "+message);

	myData = JSON.parse(message);

	if (myData.d.TargetTemp != null)
	{
		myNewTargetTemp = myData.d.TargetTemp;
		console.log("Setting tempature " + myData.d.TargetTemp);

	}else{
		console.log("Error ins message item TargetTemp not found in topic"+message);
				console.log("Set to 70 default");
		myNewTargetTemp = 70;
	}


	});///client.on('message', f

    client.on('error', function(err) {
	  console.log('client error' + err);
	  process.exit(1);
    });
    client.on('MQTT close', function(msg) {
	  console.log('client closed: '+msg);
	  process.exit(1);
    });


  });
});

function pushissidata() {
	getissidata();
}
function getissidata() {
/*
{
    "name": "iss",
    "id": 25544,
    "latitude": 50.11496269845,
    "longitude": 118.07900427317,
    "altitude": 408.05526028199,
    "velocity": 27635.971970874,
    "visibility": "daylight",
    "footprint": 4446.1877699772,
    "timestamp": 1364069476,
    "daynum": 2456375.3411574,
    "solar_lat": 1.3327003598631,
    "solar_lon": 238.78610691196,
    "units": "kilometers"
}

*/
request({
    "rejectUnauthorized": false,
//    "url": "https://api.wheretheiss.at/v1/satellites/25544",
    "url": "http://open-notify-api.herokuapp.com/iss-now.json",
    "method": "GET",

}, function(err, response, body){
    if (response.statusCode != 200) {
    console.log("Error"+err);
    console.log(response);
    console.log(response.statusCode);
    console.log(body);
  }else{
    console.log("Result:");
    console.log(body);
    var obj = JSON.parse( body );
//    console.log(obj.name);


  var myJsonData = {
         "d": {
           "myName": "Space Station Data",
//           "deviceName" : obj.name,
//           "deviceId"    : obj.id,
           "deviceName" : "ISSI",
           "deviceId"    : 25544,

           "ts"  : obj.timestamp,
//           "alt" : obj.altitude,
//           "lat" :  obj.latitude, //21.1,//,"lat":0,"lng":0,"
//           "lng" :  obj.longitude
           "lat" :  obj.iss_position.latitude, //21.1,//,"lat":0,"lng":0,"
           "lng" :  obj.iss_position.longitude


          }
        };


//subscribe to iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/evt/+/fmt/json
    //   client.publish('iot-2/evt/MVK/fmt/json', JSON.stringify(myJsonData), function() {
client.publish('iot-2/evt/status/fmt/json', JSON.stringify(myJsonData), function() {
       });
  }

});
setTimeout(pushissidata, 1000);
}



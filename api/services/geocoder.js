var jwt = require('jwt-simple');
var moment = require('moment');

var filter = function (result) {
    console.log('result', result);
    address = {};
    if (result && result[0] != null) {
        address['state'] = result[0].administrativeLevels.level1short;
        address['city'] = result[0].city;
        address['zip'] = result[0].zipcode;
        address['formattedAddress'] = result[0].formattedAddress;
    }
    return address;
}

var init = function () {
    var geocoderProvider = 'google';
    var httpAdapter = 'https';
    var extra = {
      apiKey: 'AIzaSyDKWFToCiCc18ZRHcMQaxvVaIg-rTITcLs', // for Mapquest, OpenCage, Google Premier
      formatter: null         // 'gpx', 'string', ...
    };
    var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);
    return geocoder;
}

module.exports = {
    getLocationByCoord: function (lon, lat, cb) {
        geocoder = init();

        if (lon && lat) {
          var query = { "$near": {
               "$geometry": {
                  "type": "Point" ,
                  "coordinates": [ Number(lon) , Number(lat) ]
               },
               "$maxDistance": 10000,
               "$minDistance": 100
            }
          }
          Survey.find({"coordinates": query}).exec(function(err, surveys){
              if (err) throw err;
              if (surveys && surveys.length > 0){
                var result =  {
                  'state' : surveys[0].state,
                  'city' : surveys[0].city,
                  'zip' : surveys[0].zipcode,
                  'formattedAddress' : surveys[0].formattedAddress
                }
                cb(result);
              }else{
                geocoder.reverse({lat: lat, lon: lon}, function (err, res) {
                    if (err) throw err;
                    var result = filter(res);
                    cb(result);
                });
              }
          });

        }
    },
    getLocationByAddress: function (address, cb) {
        geocoder = init();

        if (address) {
            geocoder.geocode(address, function (err, res) {
                var result = filter(res);
                console.log(result);
                cb(result);
            });
        }
    },

    getFullLocationByCoord: function (lon, lat, cb) {
        geocoder = init();
        if (lon && lat) {
            var query = { "$near": {
                 "$geometry": {
                    "type": "Point" ,
                    "coordinates": [ lon , lat ]
                 },
                 "$maxDistance": 10000,
                 "$minDistance": 100
              }
            }
            Survey.find(query).exec(function(err, surveys){
                console.log('SURVEYS LAT LNG', surveys);
                cb(surveys);
            });
            // geocoder.reverse({lat: lat, lon: lon}, function (err, res) {
            //     cb(res);
            // });
        }
    },
    getFullLocationByAddress: function (address, cb) {
        geocoder = init();
        if (address) {
            geocoder.geocode(address, function (err, res) {
                cb(res);
            });
        }
    }

}

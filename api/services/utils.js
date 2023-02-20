/**
 * Created by guinetik on 6/27/15.
 */
var Geocoder = require('./geocoder');
var moment = require('moment');

module.exports = {
    getCity: function (address, lon, lat, cb) {
        if (address) {
            Geocoder.getLocationByAddress(address, function (result) {
                return cb(result.city);
            });
        } else if (lat && lon) {
            Geocoder.getLocationByCoord(lon, lat, function (result) {
                return cb(result.city);
            });
        }
    },
    getLocation: function (address, lon, lat, cb) {
        if (address) {
            Geocoder.getLocationByAddress(address, function (result) {
                return cb(result);
            });
        } else if (lat && lon) {
            Geocoder.getLocationByCoord(lon, lat, function (result) {
                return cb(result);
            });
        }
    },
    getFullLocation: function (address, lon, lat, cb) {
        if (address) {
            Geocoder.getFullLocationByAddress(address, function (result) {
                return cb(result);
            });
        } else if (lat && lon) {
            Geocoder.getFullLocationByCoord(lon, lat, function (result) {
                return cb(result);
            });
        }
    },
    getWeekOf: function () {
        return moment().day(0).format('YYYY-MM-DD');
    }
}

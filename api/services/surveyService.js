/**
 * Created by guinetik on 6/27/15.
 */
var Geocoder = require('./geocoder');

module.exports = {
    
    totalSurveysByDiseaseWeekOf: function (city, week_of, cb) {
        result = {}
        Survey.getSurveysByDisease(null, 'diarreica', city, week_of, function (data1) {
            result['diarreica'] = data1.length;
            Survey.getSurveysByDisease(null, 'exantematica', city, week_of, function (data2) {
                result['exantematica'] = data2.length;
                Survey.getSurveysByDisease(null, 'respiratoria', city, week_of, function (data3) {
                    result['respiratoria'] = data3.length;
                    cb({diseases: result});
                });
            });
        });
    },

    totalSurveysByDisease: function (city, firstDate, lastDate, cb) {
        result = {}
        Survey.getAllSurveysByDisease(null, 'diarreica', city, firstDate, lastDate, function (data1) {
            result['diarreica'] = data1.length;
            Survey.getAllSurveysByDisease(null, 'exantematica', city, firstDate, lastDate, function (data2) {
                result['exantematica'] = data2.length;
                Survey.getAllSurveysByDisease(null, 'respiratoria', city, firstDate, lastDate, function (data3) {
                    result['respiratoria'] = data3.length;
                    cb({diseases: result});
                });
            });
        });
    }
}
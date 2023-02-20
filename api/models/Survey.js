/**
 * Survey.js
 *
 * @description :: Represents a Survey taken by the User. Surveys are collection of reported Symptoms, and other queries like if User has sought Healthcare, had contact with symptomatic people or had traveled abroad. The user's gps coords are also required
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var Geocoder = require('../services/geocoder');
var moment = require('moment');

module.exports = {

    attributes: {
        /**
         * The user that submitted this survey. Can be null
         */
        user: {model: 'User'},
        /**
         * The household member target for this survey. Can be null
         */
        household: {model: 'Household'},
        /**
         * GPS Coords
         */
        lat: {type: 'float', required: true},
        lon: {type: 'float', required: true},
        coordinates: {type: 'json'},
        /**
         * User's zip. can be null
         */
        zip: {type: 'string', required: false},
        /**
         * User's no_symptom. can be null
         */
        no_symptom: {type: 'string', enum: ['Y', 'N'], defaultsTo: 'N', required: true},

        week_of: {
            type: 'date', defaultsTo: function () {
                return moment().day(1).format('YYYY-MM-DD');
            }, required: true
        },

        /**
         * If the user has had contact with any symptomatic person
         */
        hadContagiousContact: {type: 'boolean'},
        /**
         * If the user has sought healthcare attention
         */
        hadHealthCare: {type: 'boolean'},
        /**
         * If the user had travelled abroad
         */
        hadTravelledAbroad: {type: 'boolean'},
        /**
         * Where the user had travelled to. Can be null
         */
        travelLocation: {type: 'string'},
        /**
         * App token for this survey
         */
        app_token: {type: 'string'},
        /**
         * The platform in which this survey was submitted. usually: web, ios, android
         */
        platform: {type: 'string', enum: ['web', 'ios', 'android', 'wp']}
    },
    beforeValidate: function (survey, next) {
        var isZika = this.isExantematica(survey);
        var isDiarrheal = this.isDiarrheal(survey);
        var isRespiratory = this.isRespiratory(survey);

        survey.exantematica = isZika;
        survey.diarreica = isDiarrheal;
        survey.respiratoria = isRespiratory;

        if (survey.coordinates == null) {
            survey.coordinates = [
                survey.lon,
                survey.lat
            ];
            next();
        } else {
            // console.log("survey coordinates", survey.coordinates);
            next();
        }

    },
    beforeCreate: function (survey, next) {
        var isZika = this.isExantematica(survey);
        var isDiarrheal = this.isDiarrheal(survey);
        var isRespiratory = this.isRespiratory(survey);

        survey.exantematica = isZika;
        survey.diarreica = isDiarrheal;
        survey.respiratoria = isRespiratory;

        if (survey.lon && survey.lat) {
            Geocoder.getLocationByCoord(survey.lon, survey.lat, function (res) {
                survey.state = res.state;
                survey.city = res.city;
                survey.zip = res.zip;
                survey.formattedAddress = res.formattedAddress;
                User.findOne(survey.user).populateAll().exec(function (err, user) {
                    if (user && !user.zip) {
                        user.zip = survey.zip;
                        user.state = survey.state;
                        user.city = survey.city;
                        user.formattedAddress = survey.formattedAddress;
                        user.lastSurvey = new Date();
                        user.save(function (err, user_new) {
                            if (err) throw err;
                        });
                    }
                    next();
                });
            });
        } else {
            next();
        }
    },
    search: function (location) {
        // Let's build up a MongoDB query
        var query = {};
        // We need to use `native` for geo queries
        Survey.native(function (err, collection) {
            // Co-ordinates are passed from the client side (GMaps JS API)
            // Note that we don't get them server-side because apparently
            // the server-side API isn't designed for real-time user searches.
            // Probably too slow or something.
            collection.find(
                query.coordinates = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [ // long then lat
                                location.coordinates.longitude,
                                location.coordinates.latitude
                            ]
                        },
                        $maxDistance: 100
                    }
                });

        });
    },
    getSurveysByDisease: function (id_disease, code_disease, city, week_of, next) {
        // return next([]);
            if (code_disease == "exantematica") {
                Survey.find({exantematica: true, week_of: new Date(week_of), city: city}).exec(function(err, surveys){
                    next(surveys);
                });
            } else if (code_disease == "diarreica"){
                Survey.find({diarreica: true, week_of: new Date(week_of), city: city}).exec(function(err, surveys){
                    next(surveys);
                });
            } else if (code_disease == "respiratoria"){
            Survey.find({respiratoria: true, week_of: new Date(week_of), city: city}).exec(function(err, surveys){
                    next(surveys);
                });
            }else{
                return next([]);
            }
    },

    getAllSurveysByDisease: function (id_disease, code_disease, city, firstDate, lastDate, next) {
            if (code_disease == "exantematica") {
                Survey.find(
                        {
                            $and : [ {createdAt: {$gte: firstDate}} , {createdAt: {$lte: lastDate }}, {city: city }],
                            exantematica: true
                        }
                    ).exec(function(err, surveys){
                    next(surveys);
                });
            } else if (code_disease == "diarreica"){
                Survey.find(
                        {
                            $and : [ {createdAt: {$gte: firstDate}} , {createdAt: {$lte: lastDate }}, {city: city }],
                            diarreica: true
                        }
                    ).exec(function(err, surveys){
                    next(surveys);
                });
            } else if (code_disease == "respiratoria"){
            Survey.find(
                    {
                        $and : [ {createdAt: {$gte: firstDate}} , {createdAt: {$lte: lastDate }}, {city: city }],
                        respiratoria: true
                    }
                ).exec(function(err, surveys){
                    next(surveys);
                });
            }else{
                return next([]);
            }
    },
    /*
    Regras para sindromes

    - Síndrome exantemática (quando o usuário selecionar essa conjugação dos sintomas, ele deverá ser alertado na tela com a mensagem do Zika):
      - Manchas Vermelhas (variável obrigatória) E (pelo menos mais UM desses sintomas abaixo):
          - Febre OU
          - Dores no corpo OU
          - Dor nas juntas OU
          - Dor de cabeça OU
          - Coceira OU
          - Olhos vermelhos OU
          - Sangramento
  - Síndrome diarreica
      - Febre E Náusea/Vômito E diarréia (tres variáveis obrigatórias) e, pelo menos mais UM dos sintomas:
          - Dores no Corpo OU
          - Dor de cabeça
  - Síndrome respiratória
      - Febre E Tosse (duas variáveis obrigatórias) e pelo menos UM dos sintomas:
          - Dor de garganta OU
          - Falta de Ar
    */
    isExantematica: function (symptoms) {
        var keys = _.keys(symptoms);
        var isExan = (keys.indexOf('manchas-vermelhas') != -1);
        console.log("Exantematica", isExan);
        return isExan;
        // != -1 && !(keys.indexOf('tosse') != -1) && !(keys.indexOf('nausea-vomito') != -1))
        // && !(keys.indexOf('diarreia') != -1) && !(keys.indexOf('falta-de-ar') != -1)
        // && !(keys.indexOf('dor-de-garganta') != -1));
        //
        // if (isExan) {
        //     var opcionais = ['febre', 'dor-no-corpo', 'dor-nas-juntas', 'dor-de-cabeca', 'coceira', 'olhos-vermelhos', 'sangramento'];
        //     var k = 0;
        //     _.forEach(keys, function (s) {
        //         _.forEach(opcionais, function (o) {
        //             if (s == o) {
        //                 k++;
        //             }
        //         });
        //     });
        //     return k >= 1;
        // } else {
        //     return false;
        // }
    },
    isDiarrheal: function (symptoms) {
        var keys = _.keys(symptoms);
        // var isDia =  (keys.indexOf('febre') != -1 && keys.indexOf('nausea-vomito') != -1 && keys.indexOf('diarreia') != -1)
        // && (!(keys.indexOf('dor-nas-juntas') != -1) && !(keys.indexOf('olhos-vermelhos') != -1) && !(keys.indexOf('falta-de-ar') != -1)
        // && !(keys.indexOf('sangramento') != -1) && !(keys.indexOf('manchas-vermelhas') != -1) && !(keys.indexOf('dor-de-garganta') != -1)
        // && !(keys.indexOf('coceira') != -1) && !(keys.indexOf('tosse') != -1));

        var isDia =  (keys.indexOf('diarreia') != -1);
        // console.log("Diarreica", isDia);
        return isDia;
        // if (isDia) {
        //     var opcionais = ['dor-no-corpo', 'dor-de-cabeca', 'febre'];
        //     var k = 0;
        //     _.forEach(keys, function (s) {
        //         _.forEach(opcionais, function (o) {
        //             if (s == o) {
        //                 k++;
        //             }
        //         });
        //     });
        //     return k >= 1;
        // } else {
        //     return false;
        // }
    },
    isRespiratory: function (symptoms) {
        var keys = _.keys(symptoms);
        var isResp = (keys.indexOf('febre') != -1 && keys.indexOf('tosse') != -1);
        // console.log("Respisratoria", isResp);
        return isResp;
        // && (!(keys.indexOf('olhos-vermelhos') != -1) && !(keys.indexOf('dor-de-cabeca') != -1) && !(keys.indexOf('sangramento') != -1)
        // && !(keys.indexOf('manchas-vermelhas') != -1) && !(keys.indexOf('diarreia') != -1)
        // && !(keys.indexOf('coceira') != -1) && !(keys.indexOf('dor-nas-juntas') != -1));
        // if (isResp) {
        //     var opcionais = ['dor-de-garganta', 'falta-de-ar'];
        //     var k = 0;
        //     _.forEach(keys, function (s) {
        //         _.forEach(opcionais, function (o) {
        //             if (s == o) {
        //                 k++;
        //             }
        //         });
        //     });
        //     return k >= 1;
        // } else {
        //     return false;
        // }
    }
};

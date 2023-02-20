/**
 * HouseholdMember.js
 *
 * @description :: Describes a model for household member
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    attributes: {
        user: {model: 'User', required: true},
        email: {type: 'email', unique: true, required: false},
        nick: {type: 'string', required: true},
        gender: {type: 'string', required: true},
        dob: {type: 'string', required: true},
        relationship: {type: 'string', required: false},
        picture: {type: 'string', required: false},
        photo: {type: 'string', required: false},
        race: {type: 'string', enum: ['branco', 'preto', 'pardo', 'amarelo', 'indigena', 'france'], required: true},
        surveys: {
            collection: 'Survey',
            via: 'household'
        }
    },
    beforeValidate: function (attr, next) {
        if (attr.picture == null || attr.picture == "") {
            attr.picture = 0;
        }
        if (attr.dob == null && attr.dob_month != null && attr.dob_year != null) {
            attr.dob = attr.dob_month + '/' + attr.dob_year;
            delete attr.dob_month;
            delete attr.dob_year;
        }
        if(attr.email == "" || attr.email == " ") {
            delete attr.email;
        }
        next();
    }
};

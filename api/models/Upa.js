/**
* Upa.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    name : { type: 'string' },

    latitude : { type: 'float' },

    longitude : { type: 'float' },

    logradouro : { type: 'string' },
    
    coords: {type: 'json'},
    
    numero : { type: 'string' },

    bairro : { type: 'string' },

    cep : { type: 'string' },

    telefone : { type: 'string' }
  }
};

// Use this to rename collection after import data from upas.json
/*
db.upa.find().snapshot().forEach(
  function (e) {
    // update document, using its own properties
    e.coords = [e.longitude, e.latitude];
    // save the updated document
    db.upa.save(e);
  }
);
var cood = [-34.8802210,-8.0526380]
db.upa.find({
                    coords: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: coord
                            },
                            $maxDistance: 50000,
                        }
                    }
                });

*/


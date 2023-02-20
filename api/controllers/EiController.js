/**
 * EiController
 *
 * @description :: Server-side logic for managing eis
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


var moment = require('moment');
var _ = require('underscore');

module.exports = {
	getSymptons: function(req, res){
		Ei_symptoms.find().exec(function(err, docs){
      return res.json(docs);
    });
	},
	getUserRoles: function(req, res){
		var roles = {
			1:"Atleta/Delegação",
	    2:"Trabalhador/Voluntário",
	    3:"Fã/Espectador",
	    0:"Fã/Espectador"
		};
    User.native(function(err, collection){
      collection.aggregate([
        { '$match': { city: { '$in': [ 'São Paulo', 'Rio de Janeiro', 'Manaus', 'Belo Horizonte', 'Brasília', 'Salvador'] }}},
        { "$group": {
              "_id": {
                  "city": "$city",
                  "role": "$role"
              },
              "cityCount": { "$sum": 1 }
          }},
          { "$group": {
              "_id": "$_id.city",
              "roles": {
                  "$push": {
                      "role": "$_id.role",
                      "total": "$cityCount"
                  },
              },
              "total": { "$sum": "$cityCount" }
          }}
          // {'$project': {"_id": "$_id", "roles": "$roles.total"}}
      ], function(err, result){
        return res.json(result);
      });
    });
	},
	getSyndrome: function(req, res){
		var query = {"$and" : [
					{"symptoms" : {"$ne": [""]}},
					{"syndrome": {"$ne": "Nenhuma sindrome"}}
				]
		};
		Ei_syndrome.find(query).exec(function(err, docs){
      return res.json(docs);
    });
	},
	getWarnings: function(req, res){
		var days = moment().subtract(3, 'days');
    var myQuery = Alertas.find();
    myQuery.sort('data DESC');
    myQuery.limit(10);
		myQuery.exec(function(err, docs){
      // var data = [
      //   {
      //     cidade: 'Rio de Janeiro',
      //     data: new Date(),
      //     sintoma: 'Febre',
      //     cor: '#d00216',
      //     tipo: Math.floor((Math.random() * 3) + 1),
      //     msg: 'Alerta no Rio de Janeiro',
      //     parametros: 'E=mc**2'
      //   },
      //   {
      //     cidade: 'São Paulo',
      //     data: new Date(),
      //     sintoma: 'Febre',
      //     cor: '#e8a512',
      //     tipo: Math.floor((Math.random() * 3) + 1),
      //     msg: 'Alerta no São Paulo',
      //     parametros: 'E=mc**2'
      //   },
      //   {
      //     cidade: 'Manaus',
      //     data: new Date(),
      //     sintoma: 'Febre',
      //     cor: '#f478821',
      //     tipo: Math.floor((Math.random() * 3) + 1),
      //     msg: 'Alerta em Manaus',
      //     parametros: 'E=mc**2'
      //   },
      //   {
      //     cidade: 'Brasilia',
      //     data: new Date(),
      //     sintoma: 'Febre',
      //     cor: '#d00216',
      //     tipo: Math.floor((Math.random() * 3) + 1),
      //     msg: 'Alerta em Brasilia',
      //     parametros: 'E=mc**2'
      //   },
      //   {
      //     cidade: 'Salvador',
      //     data: new Date(),
      //     sintoma: 'Febre',
      //     cor: '#68ba44',
      //     tipo: Math.floor((Math.random() * 3) + 1),
      //     msg: 'Alerta em Salvador',
      //     parametros: 'E=mc**2'
      //   },
      //   {
      //     cidade: 'Belo Horizonte',
      //     data: new Date(),
      //     sintoma: 'Febre',
      //     cor: '#e8a512',
      //     tipo: Math.floor((Math.random() * 3) + 1),
      //     msg: 'Alerta em Belo Horizonte',
      //     parametros: 'E=mc**2'
      //   },
      //   {
      //     cidade: 'Brasil',
      //     data: new Date(),
      //     sintoma: 'Febre',
      //     cor: '#68ba44',
      //     tipo: Math.floor((Math.random() * 3) + 1),
      //     msg: 'Alerta em Brasil',
      //     parametros: 'E=mc**2'
      //   }
      // ]
      // if (docs.length > 0){
      //     return res.json(docs);
      // }else{
      var group = _.groupBy(docs, 'regiao');
      return res.json(group);
      // }
    });
	}
};

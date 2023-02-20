var flash500 = require('../services/flash500');


module.exports = {

    mostSearched: function (req, res) {
        var limit = parseInt(req.param('limit')) || 5;
        Search.native(function (err, search) {
            if (!err) {
                search.aggregate([
                    {"$match": {city: {$exists: true}}},
                    {"$group": {_id: "$city", count: {$sum: 1}}},
                    {"$sort": {count: -1}},
                    {"$limit": limit}
                ], function (err, result) {
                    // var data = {total: 0};
                    // _.forEach(result, function (row) {
                    //     data[row._id] = row.count;
                    //     data['total'] += row.count;
                    // });
                    return res.json({error: 'false', data: result});
                });
            }
        });
    }
}
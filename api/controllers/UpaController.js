/**
 * UpaController
 *
 * @description :: Server-side logic for managing upas
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	


  /**
   * `UpaController.read()`
   */
  read: function (req, res) {
		var lat = req.param('lat');
        var lon = req.param('lon');        
        var radius = req.param('radius') || 10000;
        var coord = [];
        if (lat && lon) {
            coord = [parseFloat(lon), parseFloat(lat)];
            Upa.find({
                    coords: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: coord
                            },
                            $maxDistance: radius,
                        }
                    }
                })
                .exec(function (err, upas) {
                    if (err) return flash500(req, res, {
                        error: true,
                        message: 'There was an error processing your request: \n' + err
                    });
                    return res.json({error: false, data: upas});
                });
  		}else{
  			return res.json({
                error: true,
                message: 'Você deve informar latitude e longitude' + err
            });
  		}
  	}
};


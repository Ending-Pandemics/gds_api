/**
 * Created by guinetik on 6/27/15.
 */
module.exports = function (req, res, error) {
    req.session.flash = error;
    // return res.serverError(error);
    return res.status(200).json(200, error);
};
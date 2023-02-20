/**
 * Created by juliomelo on 26/02/16.
 */

module.exports = function (paylod, cb) {
    try {
        Admin.findOneByEmail(email, function (err, foundUser) {
            if (!foundUser) {
                cb(false)
            }
        });

    } catch (err) {
        console.log("findAdminByToken", err);
        cb(false);
    }
};

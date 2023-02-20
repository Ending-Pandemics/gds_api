module.exports = {
    identity: "Hashtag",
    attributes: {
        name: {type: 'string', required: true},
        code: {type: 'string', unique: true, required: true},
        owners: {
            collection: 'User',
            via: 'hashtags'
        }
    }
};
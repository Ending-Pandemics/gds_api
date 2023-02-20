var Twitter = require('twitter');

module.exports = {
    getClient: function (cb) {
        var client = new Twitter({
            consumer_key: 'btijYH36dtguxb6CcHTprkERG',
            consumer_secret: 'UJR1qUL7ReNnEnFulMKumaP84Ff9JUxffNybxbr5oyMdIo6wro',
            access_token_key: '940062594-RwTd0tLyuX9WPEz08Un8tZ96xxpRHzXz1nv2QgyM',
            access_token_secret: 'CgokNilO4ucgZB3mHRd175Ta5rLzZjilO1newHND0iaVA'
        });
        cb(client);
    }
}
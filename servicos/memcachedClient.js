const memcached = require('memcached');

function createMemcachedClient(){
    let client = new memcached('localhost:11211', {
        retries: 10,
        retry: 10000,
        remove: true
    });

    return client;
}

module.exports = function(){
    return createMemcachedClient;
}



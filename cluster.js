const cluster = require('cluster');
const os = require('os');

let cpus = os.cpus();

if(cluster.isMaster){
    console.log('thread master');
    cpus.forEach(function(){
        cluster.fork();
    });
    
} else {
    console.log('thread slave');    
    require('./index');
}

module.exports = function(app){
    app.get('/teste', function(req, res){
        console.log('Acessada a rota teste');
        res.send('Acessada a rota teste pelo cliente');
    });    
}

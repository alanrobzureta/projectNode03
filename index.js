const app = require('./config/custom-express')();

require('./controllers/pagamentos')(app);

app.listen(3000, function(){
    console.log('Projeto rodando na porta 3000');
});

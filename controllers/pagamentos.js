let logger = require('../servicos/logger');

module.exports = function(app){
    app.get('/teste', function(req, res){
        console.log('Acessada a rota teste');
        var json = {
            'teste': 'alan',
            'teste2' : 'adonai'
        }
        res.send(json);
    });   
    
    //consulta
    app.get('/pagamentos/pagamento/:id', function(req, res){
        let id = req.params.id;

        logger.info('consultando pagamento: ' + id);

        const memcachedClient = app.servicos.memcachedClient();

        memcachedClient.get('pagamento-' + id, function (err, data) {        
            if (err || !data){
                console.log('MISS - chave não encontrada no cache');

                pagamentoDao.buscaPorId(id, function(err, result){
                    if(err){
                        console.log(err);
                        res.status(404).send('Erro encontrado: ' + err);
                        return;
                    }
        
                    console.log(result);
                    //res.status(202).send('Dados de consulta: ' + JSON.stringify(result));
                    res.status(202).send(result);
                    return;
                });
            } else {
                console.log('HIT - valor:' + JSON.stringify(data));
                res.json(data);
                return;
            }
        });

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentosDao(connection);

        

        //console.log('consultando dados do ID: ' + id);
        //res.send('consultando dados do ID: '+ id);
    });

    app.post('/pagamentos/pagamento', function(req, res){
        var body = req.body;
        var pagamento = body['pagamento'];

        req.assert('pagamento.forma_de_pagamento','Forma de pagamento eh obrigatório.').notEmpty();
        req.assert("pagamento.valor", "Valor é obrigatório e deve ser um decimal.").notEmpty().isFloat();
        req.assert("pagamento.moeda", "Moeda é obrigatória e deve ter 3 caracteres").notEmpty().len(3,3);

        const errors = req.validationErrors();

        if(errors){
            console.log('Erros de validação encontrados');
            res.status(400).send(errors);
            return;
        }
        
        if (pagamento.forma_de_pagamento == 'cartao'){
            var cartao = req.body["cartao"];
            console.log(cartao);
    
            var clienteCartoes = new app.servicos.CartoesClient();
    
            clienteCartoes.autoriza(cartao, function(exception, request, response, retorno){
                  if(exception){
                    console.log(exception);
                    res.status(400).send(exception);
                    return;
                  }
                  console.log(retorno);
    
                  res.location('/pagamentos/pagamento/' + pagamento.id);
    
                  var response = {
                    dados_do_pagamanto: pagamento,
                    cartao: retorno,
                    links: [
                      {
                        href:"http://localhost:3000/pagamentos/pagamento/"
                                + pagamento.id,
                        rel:"confirmar",
                        method:"PUT"
                      },
                      {
                        href:"http://localhost:3000/pagamentos/pagamento/"
                                + pagamento.id,
                        rel:"cancelar",
                        method:"DELETE"
                      }
                    ]
                  }
                  res.status(201).json(response);
                  return;
            });
    
          } else {
                console.log('processsando pagamentos');
                var connection = app.persistencia.connectionFactory();
                var pagamentoDao = new app.persistencia.PagamentosDao(connection);
        
                const PAGAMENTO_CRIADO = "CRIADO";
                const PAGAMENTO_CONFIRMADO = "CONFIRMADO";
                const PAGAMENTO_CANCELADO = "CANCELADO";
        
                pagamento.status = PAGAMENTO_CRIADO;
                pagamento.data = new Date;
        
                pagamentoDao.salva(pagamento, function(err, result){
                    if(err){
                        console.log(err);
                    }
                    console.log('pagamento criado' + result);

                    res.location('/pagamentos/pagamento/' + result.insertId);
                    pagamento.id = result.insertId;

                    // ISERINDO NO CACHE
                    var cache = app.servicos.memcachedClient();
                    cache.set('pagamento-' + pagamento.id, result, 100000, function (err) {
                    console.log('nova chave: pagamento-' + pagamento.id)
                    });
                    
                    var response = {
                        dados_do_pagamento: pagamento,
                        links: [
                                {
                                    href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                    rel: "confirmar",
                                    method: "PUT"
                                },
                                {
                                    href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                    rel: "cancelar",
                                    method: "DELETE"
                                }
                            ]
                        }
                    res.status(201).json(response);
                }); 
          }
               
    });

    app.put('/pagamentos/pagamento/:id', function(req, res){
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CONFIRMADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentosDao(connection);

        pagamentoDao.atualiza(pagamento, function(err){
            if(err){
                res.status(500).send(err);
                return;
            }
            console.log('Pagamento criado');
            res.send(pagamento);
        });

    });

    app.delete('/pagamentos/pagamento/:id', function(req, res){
        var pagamento = {};
        var id = req.params.id;
        
        pagamento.id = id;
        pagamento.status = 'CANCELADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentosDao(connection);

        pagamentoDao.atualiza(pagamento, function(err){
            if(err){
                res.status(500).send(err);
                return;
            }
            console.log('Pagamento cancelado');
            res.status(204).send(pagamento);
        });
    });
}

const fs = require('fs');

//let arquivo = process.argv[2];

fs.readFile('imagem.jpg', function(err, buffer){
    console.log('Arquivo Lido');

    fs.writeFile('imagem2.jpg', buffer, function(err){
        if(err){
            console.log('Erro =>', err);
            return;
        }

        console.log('Arquivo escrito');
    });
});
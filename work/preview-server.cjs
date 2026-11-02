const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const page=path.resolve(__dirname,'../SIMBOLOGIA DE SOLDAGEM.html');
http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  try{const content=fs.readFileSync(page);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(content);}
  catch(error){res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8'});res.end('Não foi possível carregar o arquivo do jogo.');}
}).listen(8743,'127.0.0.1',()=>console.log('http://127.0.0.1:8743/'));

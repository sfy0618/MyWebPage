var mime = require('mime');
var url = require('url');
var fs = require('fs');
var http = require('http');
var crypto = require('crypto');

var server = http.createServer(function (request, response) {
  var pathname = url.parse(request.url).pathname;
  var search=url.parse(request.url).search;
  if (pathname.endsWith('/')){
    pathname = pathname + 'index.html';
  }
  var relativepathname= decodeURIComponent((process.argv[2] || '.') + pathname);
  fs.stat(relativepathname, function(err, stats) {
    if(!err && stats.isDirectory()){  
      response.writeHead(302, {
        'Location': pathname + '/' + (search || '')
      });  
      response.end();
      return;
    }

    if(!err && stats.isFile()){    
      fs.readFile(relativepathname, function (err, data) {
        if (!err) {
          var hash = crypto.createHash('sha1').update(data).digest('base64');
          if (request.headers['if-none-match'] == hash){
            response.writeHead(304);            
            response.end();
            return;
          }
          var headers={
            'Content-Type': mime.getType(pathname),
            'Etag' : hash
          };
          if (headers['Content-Type'].startsWith('image/')){
            delete headers.Etag;
            headers['cache-control']='max-age=3600';
          }
          response.writeHead(200,headers);
          response.write(data);
          response.end();
        }
      });
    }else{
      response.writeHead(404);
      response.write('File not Found');
      response.end();
    }    
  });  
});

server.listen(3000, '127.0.0.1');
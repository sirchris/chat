const http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime-types');

const cache = {};

function send404(res) {
    res.writeHead(404, {
        'Content-type': 'text/html; charset=utf-8'
    });

    res.write('Błąd 404');

    res.end();
}

function sendFile(res, filePath, fileContents) {
    res.writeHead(200, {
        'Content-type': mime.lookup(path.basename(filePath))
    });

    res.end(fileContents);
}

function serveStatic(res, cache, absPath) {
    if (cache[absPath]) {
        sendFile(res, absPath, cache[absPath]);
    } else {
        fs.exists(absPath, (exists) => {
            if (exists) {
                fs.readFile(absPath, (err, data) => {
                    if (err) {
                        send404(res);
                    } else {
                        cache[absPath] = data;
                        sendFile(res, absPath, cache[absPath]);
                    }
                });
            } else {
                send404(res);
            }
        });
    }
}

const server = http.createServer((req, res) => {
    let filePath = false;

    if (req.url === '/') {
        filePath = 'public/index.html';
    } else {
        filePath = `public${ req.url }`;
    }

    const absPath = `./${ filePath }`;

    serveStatic(res, cache, absPath);
});

server.listen(3000, () => console.log('Server running at port 3000'));

const chatServer = require('./lib/chat_server');

chatServer.listen(server);

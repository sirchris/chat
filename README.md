To print all debug logging, set the environment variable `DEBUG` to `*`. ie: `DEBUG=* node server.js`

To print only socket.io related logging: `DEBUG=socket.io:* node server.js`.

To print logging only from the socket object: `DEBUG=socket.io:socket node server.js`.

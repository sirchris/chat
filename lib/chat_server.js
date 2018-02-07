const socketio = require('socket.io');

const nickNames = {},
    namesUsed = [],
    currentRoom = {};

let io = false,
    guestNumber = 1;

exports.listen = (server) => {
    io = socketio.listen(server);

    io.on('connection', (socket) => {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms', () => {
            socket.emit('rooms', io.of('/').adapter.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    const name = `Gość${ guestNumber }`;

    nickNames[socket.id] = name;

    socket.emit('nameResult', {
        success: true,
        name: name
    });

    namesUsed.push(name);

    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);

    currentRoom[socket.id] = room;

    socket.emit('joinResult', {
        room: room
    });

    socket.broadcast.to(room).emit('message', {
        text: `${ nickNames[socket.id] } dołączył do pokoju ${ room }.`
    });

    const usersInRoom = io.of('/').in(room).clients;

    if (usersInRoom.length > 1) {
        let usersInRoomSummary = `Lista użytkowników w pokoju ${ room }:`;

        for (const index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;

            if (userSocketId !== socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }

                usersInRoomSummary += nickNames[userSocketId];
            }
        }

        usersInRoomSummary += ',';

        socket.emit('message', {
            text: usersInRoomSummary
        });
    }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', (name) => {
        if (name.indexOf('Gość') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Nazwa użytkownika nie może rozpoczynać się od słowa "Gość".'
            });
        } else if (namesUsed.indexOf(name) === -1) {
            const previousName = nickNames[socket.id],
                previousNameIndex = namesUsed.indexOf(previousName);

            namesUsed.push(name);
            nickNames[socket.id] = name;

            delete namesUsed[previousNameIndex];

            socket.emit('nameResult', {
                success: true,
                name: name
            });

            socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                text: `${ previousName } zmienił nazwę na ${ name }.`
            });
        } else {
            socket.emit('nameResult', {
                success: false,
                message: 'Ta nazwa jest używana przez innego użytkownika.'
            });
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on('message', (message) => {
        socket.broadcast.to(message.room).emit('message', {
            text: `${ nickNames[socket.id] }: ${ message.text }`
        });
    });
}

function handleRoomJoining(socket) {
    socket.on('join', (room) => {
        socket.leave(currentRoom[socket.id]);

        joinRoom(socket, room.newRoom);
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', () => {
        const nameIndex = namesUsed.indexOf(nickNames[socket.id]);

        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

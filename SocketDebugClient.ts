// A simple client for the Socket.IO API.

import { io } from 'socket.io-client';
import { createInterface } from 'readline';
import { REPLServer, start } from 'repl';

// Some hacky stuff to make the TypeScript compiler happy.
declare function fetch(url: string, options?: any): Promise<any>;

// Check if the user has provided the correct number of arguments.
if(process.argv.length !== 4) {
    console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <host> <port>`);
    process.exit(1);
}

// Create a readline interface to read the user's input.
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});


// Ask the user for their login and password.
rl.question('Login: ', (login) => {
    rl.question('Password: ', (password) => {
        rl.close();

        // Send a request to the server to get a token.
        fetch(`http://${process.argv[2]}:${process.argv[3]}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login,
                password
            }),
        }).then((res) => res.json()).then((res) => {
            // If an error message is present
            if(res.message) {
                console.error(`Failed to authenticate: ${res.message}`);
                process.exit(1);
            }

            // Try to open a connection to the server.
            const socket = io(`http://${process.argv[2]}:${process.argv[3]}`, {
                auth: {
                    token: res.token,
                }
            });

            let repl: REPLServer;
        
            // Start a REPL session when the connection is established.
            socket.on('connect', () => {
                console.log('Connected to server.');
                repl = start('> ');
                repl.context.socket = socket;
            });

            // Close the REPL session when the connection is closed.
            socket.on('disconnect', () => {
                console.log('Disconnected from server.');
                repl.close();
            });
        });
    });
});
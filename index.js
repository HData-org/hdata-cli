const HData = require('hdata').HData;
var conn;
const readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'HData> '
});
rl.stdoutMuted = false;
rl.query = '';

rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted) {
      rl.output.write("\x1B[2K\x1B[200D"+rl.query);
    } else {
      rl.output.write(stringToWrite);
    }
};

function cli() {
    rl.prompt();
    
    rl.on('line', (line) => {
        switch (line.trim()) {
        case 'status' :
            status();
            break;
        case 'login':
            loginQ();
            break;
        case 'logout' :
            logout();
            break;
        case 'quit' :
            rl.close();
            break;
        case 'exit' :
            rl.close();
            break;
        }
        rl.prompt();
    }).on('close', () => {
        console.log('Goodbye!');
        process.exit(0);
    });
}

function status() {
    conn.status( (res, err) => {
        if (!err) {
            console.log(`\n\rServer has the status: ${res.status}, and has ${res.jobs} pending jobs. ${res.tables} tables exist in the database.`);
            rl.prompt();
        } else {
            console.log(err);
        }
    })
}

function getStatus() {
    conn.status(function(res, err) {
        if (!err) {
            console.clear();
            console.log(`HData server v${res.version}`);
            console.log(`Server has the status: ${res.status}, and has ${res.jobs} pending jobs. ${res.tables} tables exist in the database.\n\r`);
            
            cli();
        } else {
            console.log(err);
        }
    });
}

function login(user, password) {
    conn.login(user, password, function(res, err) {
        if (res.status == "OK") {
            console.log(`\n\rLogged in as ${user}!`);
            rl.prompt();
        } else {
            console.log("\n\rInvalid username or password");
            rl.prompt();
        }
    });
}

function loginQ() {
    rl.question(`User: `, user => {
        rl.history = rl.history.slice(1);
        rl.stdoutMuted = true;
        rl.query = `Password: `;
        rl.question(rl.query, password => {
            rl.history = rl.history.slice(1);
            rl.stdoutMuted = false;
            login(user, password);
        });
    });
}

function logout() {
    conn.logout(function(res, err) {
        if(!err) {
            if(res.status == 'OK') {
                console.log("Successfully logged out");
            } else if(res.status == 'NLI') {
                console.log("You need to be logged in to logout");
            } else {
                console.log(res);
            }
            rl.prompt();
        } else {
            console.log(err);
        }
    });
}

function connectTo(host, port) {
    if(host == '') { host = '127.0.0.1'; }
    if(port == '') { port = '8888'; }
    console.log(`Connecting to ${host} on port ${port}...`);
    var options = {
        "host": host,
        "port": port
    }
    conn = new HData(options);
    getStatus();
}

rl.question(`Connection host: `, hostIn => {
    rl.history = rl.history.slice(1);
    rl.question(`Connection port: `, portIn => {
        rl.history = rl.history.slice(1);
        connectTo(hostIn, portIn);
    });
});

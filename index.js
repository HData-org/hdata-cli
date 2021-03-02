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
		var keys = line.split(" ");
		switch (keys[0]) {
			default :
				console.log("Command does not exist");
				break;
			case 'status' :
				status();
				break;
			case 'login':
				if (keys[1] == undefined || keys[2] == undefined) {
					loginQ();
				} else {
					login(keys[1], keys[2]);
				}
				break;
			case 'logout' :
				logout();
				break;
			case 'createuser' :
				if (keys[1] == undefined || keys[2] == undefined) {
					createUserQ();
				} else {
					var perms = [];
					for (var i = 3; i < keys.length; i++) {
						perms.push(keys[i]);
					}
					createUser(keys[1], keys[2], perms);
				}
				break;
			case 'deleteuser' :
				if (keys[1] == undefined) {
					deleteUserQ();
				} else {
					deleteUser(keys[1]);
				}
				break;
			case 'updateuser' :
				if (keys[1] == undefined || keys[2] == undefined) {
					updateUserQ();
				} else {
					var username = keys[1];
					var property = keys[2];
					var value = JSON.parse(keys.slice(3, keys.length).join(" "));
					updateUser(username, property, value);
				}
				break;
			case 'quit' :
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

function createUser(username, password, perms) {
	conn.createUser(username, password, perms, function(res, err) {
		if(res.status == 'OK') {
			console.log("User created successfully");
		} else {
			console.log("Error creating user: "+res.status);
		}
	});
}

function createUserQ() {
	rl.question("Username: ", username => {
		rl.history = rl.history.slice(1);
		rl.stdoutMuted = true;
		rl.query = "Password: ";
		rl.question(rl.query, password => {
			console.log("");
			rl.history = rl.history.slice(1);
			rl.stdoutMuted = false;
			rl.question("Permissions: ", perms => {
				var perms2 = perms.split(" ");
				createUser(username, password, perms2);
			});
		});
	});
}

function deleteUser(username) {
	conn.deleteUser(username, function(res, err) {
		if (res.status == "OK") {
			console.log("User deleted successfully");
		} else {
			console.log("Error deleting user: "+res.status);
		}
	});
}

function deleteUserQ() {
	rl.question("Username: ", username => {
		deleteUser(username);
	});
}

function updateUser(username, property, value) {
	conn.updateUser(username, property, value, function(res, err) {
		if (res.status == "OK") {
			console.log("User updated successfully");
		} else {
			console.log("Error updating user: "+res.status);
		}
	});
}

function updateUserQ() {
	rl.question("Username: ", username => {
		rl.history = rl.history.slice(1);
		rl.question("Property: ", property => {
			rl.history = rl.history.slice(1);
			rl.question("Value: ", value => {
				rl.history = rl.history.slice(1);
				updateUser(username, property, JSON.parse(value));
			});
		});
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

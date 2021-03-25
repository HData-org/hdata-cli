#!/usr/bin/env node
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
				rl.prompt();
				break;
			case '' :
				rl.prompt();
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
			case 'getuser' :
				if (keys[1] == undefined) {
					getUserQ();
				} else {
					getUser(keys[1])
				}
				break;
			case 'updateuser' :
				if (keys[1] == undefined || keys[2] == undefined) {
					updateUserQ();
				} else {
					var username = keys[1];
					var property = keys[2];
					var value = keys.slice(3, keys.length).join(" ");
					var valuets;
					try {
						valuets = JSON.parse(value);
					} catch(err) {}
					updateUser(username, property, valuets);
				}
				break;
			case 'updatepassword' :
				if (keys[1] == undefined || keys[2] == undefined) {
					updatePasswordQ();
				} else {
					updatePassword(keys[1], keys[2]);
				}
				break;
			case 'createtable' :
				if (keys[1] == undefined) {
					createTableQ();
				} else {
					createTable(keys[1]);
				}
				break;
			case 'deletetable' :
				if (keys[1] == undefined) {
					deleteTableQ();
				} else {
					deleteTable(keys[1]);
				}
				break;
			case 'getkey' :
				if (keys[1] == undefined || keys[2] == undefined) {
					getKeyQ();
				} else {
					getKey(keys[1], keys[2]);
				}
				break;
			case 'setkey' :
				if (keys[1] == undefined || keys[2] == undefined || keys[3] == undefined) {
					setKeyQ();
				} else {
					var table = keys[1];
					var key = keys[2];
					var value;
					try {
						value = JSON.parse(keys.slice(3, keys.length).join(" "));
					} catch(err) {}
					setKey(table, key, value);
				}
				break;
			case 'deletekey' :
				if (keys[1] == undefined || keys[2] == undefined) {
					deleteKeyQ();
				} else {
					deleteKey(keys[1], keys[2]);
				}
				break;
			case 'gettables' :
				getTables();
				break;
			case 'queryall' :
				if (keys[1] == undefined) {
					queryAllQ();
				} else {
					var value = keys.slice(1, keys.length).join(" ");
					queryAll(value);
				}
				break;
			case 'querytable' :
				if (keys[1] == undefined) {
					queryTableQ();
				} else {
					var table = keys[1];
					var value = keys.slice(2, keys.length).join(" ");
					queryTable(table, value);
				}
				break;
			case 'tableexists' :
				if (keys[1] == undefined) {
					tableExistsQ();
				} else {
					tableExists(keys[1]);
				}
				break;
			case 'tablesize' :
				if (keys[1] == undefined) {
					tableSizeQ();
				} else {
					tableSize(keys[1]);
				}
				break;
			case 'tablekeys' :
				if (keys[1] == undefined) {
					tableKeysQ();
				} else {
					tableKeys(keys[1]);
				}
				break;
			case 'quit' :
			case 'exit' :
				rl.close();
				break;
		}
		
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
			console.log(`Logged in as ${user}!`);
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
			console.log("");
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
		rl.prompt();
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
		rl.prompt();
	});
}

function deleteUserQ() {
	rl.question("Username: ", username => {
		rl.history = rl.history.slice(1);
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
		rl.prompt();
	});
}

function updateUserQ() {
	rl.question("Username: ", username => {
		rl.history = rl.history.slice(1);
		rl.question("Property: ", property => {
			rl.history = rl.history.slice(1);
			rl.question("Value: ", value => {
				rl.history = rl.history.slice(1);
				var valuets;
				try {
					valuets = JSON.parse(value);
				} catch(err) {}
				updateUser(username, property, valuets);
			});
		});
	});
}

function getUser(user) {
	conn.getUser(user, function(res, err) {
		console.log(res);
		rl.prompt();
	});
}

function getUserQ() {
	rl.question("Username: ", username => {
		rl.history = rl.history.slice(1);
		getUser(username);
	});
}

function updatePassword(user, password) {
	conn.updatePassword(user, password, function(res, err) {
		if (res.status == "OK") {
			console.log("Password updated successfully");
		} else {
			console.log("Error updating password: "+res.status);
		}
		rl.prompt();
	});
}

function updatePasswordQ() {
	rl.question("Username: ", username => {
		rl.history = rl.history.slice(1);
		rl.stdoutMuted = true;
		rl.query = "Password: ";
		rl.question(rl.query, password => {
			console.log("");
			rl.history = rl.history.slice(1);
			rl.stdoutMuted = false;
			updatePassword(username, password);
		});
	});
}

function createTable(name) {
	conn.createTable(name, function(res, err) {
		if (res.status == "OK") {
			console.log("Table created successfully");
		} else {
			console.log("Error creating table: "+res.status);
		}
		rl.prompt();
	});
}

function createTableQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		createTable(name);
	});
}

function deleteTable(name) {
	conn.deleteTable(name, function(res, err) {
		if (res.status == "OK") {
			console.log("Table deleted successfully");
		} else {
			console.log("Error deleting table: "+res.status);
		}
		rl.prompt();
	});
}

function deleteTableQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		deleteTable(name);
	});
}

function getKey(table, name) {
	conn.getKey(table, name, function(res, err) {
		console.log(res);
		rl.prompt();
	});
}

function getKeyQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		rl.question("Key name: ", key => {
			rl.history = rl.history.slice(1);
			getKey(name, key);
		});
	});
}

function setKey(table, name, value) {
	conn.setKey(table, name, value, function(res, err) {
		if (res.status == "OK") {
			console.log("Key set successfully");
		} else {
			console.log("Error setting key: "+res.status);
		}
		rl.prompt();
	});
}

function setKeyQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		rl.question("Key name: ", key => {
			rl.history = rl.history.slice(1);
			rl.question("Value: ", value => {
				rl.history = rl.history.slice(1);
				var valuets;
				try {
					valuets = JSON.parse(value);
				} catch(err) {}
				setKey(name, key, valuets);
			});
		});
	});
}

function deleteKey(table, name) {
	conn.deleteKey(table, name, function(res, err) {
		if (res.status == "OK") {
			console.log("Key deleted successfully");
		} else {
			console.log("Error deleting key: "+res.status);
		}
		rl.prompt();
	});
}

function deleteKeyQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		rl.question("Key name: ", key => {
			rl.history = rl.history.slice(1);
			deleteKey(name, key);
		});
	});
}

function getTables() {
	conn.getTables(function(res, err) {
		console.log(res);
		rl.prompt();
	});
}

function queryAll(query) {
	conn.queryAll(query, function(res, err) {
		if (res.status == "OK") {
			console.log(res.matches);
		} else {
			console.log("Error querying all tables: "+res.status);
		}
		rl.prompt();
	});
}

function queryAllQ() {
	rl.question("Query: ", query => {
		rl.history = rl.history.slice(1);
		queryAll(query);
	});
}

function queryTable(name, query) {
	conn.queryTable(name, query, function(res, err) {
		if (res.status == "OK") {
			console.log(res.matches);
		} else {
			console.log("Error querying table: "+res.status);
		}
		rl.prompt();
	});
}

function queryTableQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		rl.question("Query: ", query => {
			rl.history = rl.history.slice(1);
			queryTable(name, query);
		});
	});
}

function tableExists(name) {
	conn.tableExists(name, function(res, err) {
		if (res.status == undefined) {
			if (res) {
				console.log(`Table ${name} exists`);
			} else {
				console.log(`Table ${name} does not exist`);
			}
		} else {
			console.log("Error checking if table exists: "+res.status);
		}
		rl.prompt();
	});
}

function tableExistsQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		tableExists(name);
	});
}

function tableSize(name) {
	conn.tableSize(name, function(res, err) {
		if (res.status == "OK") {
			console.log(`Table ${name} has ${res.size} keys`);
		} else {
			console.log("Error getting table size: "+res.status);
		}
		rl.prompt();
	});
}

function tableSizeQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		tableSize(name);
	});
}

function tableKeys(name) {
	conn.tableKeys(name, function(res, err) {
		if (res.status == "OK") {
			console.log(`Table ${name} has the following keys: ${JSON.stringify(res.keys)}`);
		} else {
			console.log("Error getting table keys: "+res.status);
		}
		rl.prompt();
	});
}

function tableKeysQ() {
	rl.question("Table name: ", name => {
		rl.history = rl.history.slice(1);
		tableKeys(name);
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

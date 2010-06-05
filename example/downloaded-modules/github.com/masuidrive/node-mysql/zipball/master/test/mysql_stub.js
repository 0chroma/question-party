#!/usr/bin/env node
var sys = require("sys");
var tcp = require("net");
var test = require("mjsunit");

var streams = {
    "authentication timeout": [
	["server", "38 00 00 00"],
	["server", "0a 35 2e 31 2e 34 33 2d 6c 6f 67 00 7d 13 00 00 52 7a 33 2a 76 38 51 6d 00 ff f7 08 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 53 39 60 58 79 77 69 2b 36 6f 4e 78 00"],
	["client", "4f 00 00 01"],
	["client", "0d a2 00 00 00 00 00 40 21 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 6e 6f 64 65 6a 73 5f 6d 79 73 71 6c 00 14 3a 92 54 0d f9 cc b8 79 34 04 6c f4 2d a0 69 58 4e cc 01 40 6e 6f 64 65 6a 73 5f 6d 79 73 71 6c 00"],
	["sleep", 10*1000] // Timeout
    ],
    
    "shutdown on authentication": [
	["server", "38 00 00 00"],
	["server", "0a 35 2e 31 2e 34 33 2d 6c 6f 67 00 7d 13 00 00 52 7a 33 2a 76 38 51 6d 00 ff f7 08 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 53 39 60 58 79 77 69 2b 36 6f 4e 78 00"],
	["client", "4f 00 00 01"],
	["client", "0d a2 00 00 00 00 00 40 21 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 6e 6f 64 65 6a 73 5f 6d 79 73 71 6c 00 14 3a 92 54 0d f9 cc b8 79 34 04 6c f4 2d a0 69 58 4e cc 01 40 6e 6f 64 65 6a 73 5f 6d 79 73 71 6c 00"],
	["close"]
    ],
    
    "protocol version 11": [
	["server", "38 00 00 00"],
	["server", "0b 35 2e 31 2e 34 33 2d 6c 6f 67 00 7d 13 00 00 52 7a 33 2a 76 38 51 6d 00 ff f7 08 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 53 39 60 58 79 77 69 2b 36 6f 4e 78 00"],
	['close']
    ],
    
    "query timeout": [
	["server", "38 00 00 00"],
	["server", "0a 35 2e 31 2e 34 33 2d 6c 6f 67 00 7d 13 00 00 52 7a 33 2a 76 38 51 6d 00 ff f7 08 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 53 39 60 58 79 77 69 2b 36 6f 4e 78 00"],
	["client", "4f 00 00 01"],
	["client", "0d a2 00 00 00 00 00 40 21 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 6e 6f 64 65 6a 73 5f 6d 79 73 71 6c 00 14 3a 92 54 0d f9 cc b8 79 34 04 6c f4 2d a0 69 58 4e cc 01 40 6e 6f 64 65 6a 73 5f 6d 79 73 71 6c 00"],
	["server", "07 00 00 02"],
	["server", "00 00 00 02 00 00 00"],
	["client", "11 00 00 00"],
	["client", "03 53 45 54 20 4e 41 4d 45 53 20 27 75 74 66 38 27"], // SET NAMES 'utf8'
	["server", "07 00 00 01"],
	["server", "00 00 00 02 00 00 00"],
	["client", "0c 00 00 00"],
	["client", "03 53 45 4c 45 43 54 20 31 2e 32 33"], // SELECT 1.23
	["sleep", 10*1000] // Timeout
    ]
};

var server = tcp.createServer(function (socket) {
    var toString = function(x){
        return x.toString();
    }
    var hex2bin = function(str) {
	str = toString(str);
       	return str.split(' ').map(function(s){return String.fromCharCode(parseInt(s,16));}).join('');
    }
    var bin2hex = function (str){
	str = toString(str);
        return str.split('').map(function(s){return ((s.charCodeAt(0)<16?"0":'')+s.charCodeAt(0).toString(16)).substring();}).join(' ');
    }
    
    var write_process = function() {
	if(current_stream && current_stream.length>0) {
	    if(current_stream[0][0]=="server") {
		var line = current_stream.shift();
		sys.puts("Server> "+bin2hex(hex2bin(line[1])));
		socket.write(hex2bin(line[1]), 'binary');
		write_process();
	    }
	    else if(current_stream[0][0]=="sleep") {
		var line = current_stream.shift();
		sys.puts("Sleep> "+line[1]);
		setTimeout(write_process, line[1]);
	    }
	    else if(current_stream[0][0]=="close") {
		var line = current_stream.shift();
		sys.puts("Close");
		socket.end();
	    }
	}
    }
    
    var current_stream = undefined;
    socket.setEncoding("binary");
    socket.setNoDelay(true);
    socket.setTimeout(0);

    socket.addListener("connect", function () {
	current_stream = undefined;
	sys.puts("Connect");
    });
    socket.addListener("data", function (data) {
	if(current_stream) {
	    sys.puts("Client< "+bin2hex(data)+"\n");
	    var line = current_stream.shift();
      
	    if(line[0]=="server") {
      		return sys.puts("Sequence error");
	    }
	    
	    var bin = hex2bin(line[1]);
	    while(bin.length < data.length) {
		var next_line = current_stream.shift();
		if(typeof(next_line)=='undefined' || next_line[0]=="server") {
      		    return sys.puts("Sequence error");
		}
		bin += hex2bin(next_line[1]);
	    }
	    
	    if(bin!=data) {
		sys.puts("Data mismatch");
		sys.puts("Expected ( '" + bin2hex(bin) + "' )  vs ");
		sys.puts("DATA     ( '" + bin2hex(data) + "' ) \n\n");
		return false;
	    }
	}
	else {
	    sys.puts(data);
	    current_stream = Array.apply(null, streams[data]);
	}
	write_process(socket);
    });
    socket.addListener("end", function () {
	if(current_stream.length>0) sys.puts("Sequence left: "+current_stream.join(", "));
	socket.end();
	current_stream = undefined;
	sys.puts("Closed\n");
    });
});
sys.puts("Start Mysql Stub for test on localhost:33306")
server.listen(33306, "localhost");

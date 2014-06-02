var docopt = require('docopt').docopt;
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var sha1 = require('sha1');
var moment = require('moment');

var doc = 'Usage:' +
    '\n  godo [-d DIR -t TREE] [options] [TEXT]' +
    '\n' +
    '\nOptions:' +
    '\n  -d DIR, --tree-dir=DIR    The directory where to store tree(s) (file[s]) [default: .].' +
    '\n  -t TREE, --tree=TREE      The name of the tree (file) to make changes to [default: todo.txt].' +
    '\n  -l, --list                List tree leafs (tasks) nicely.' +
    '\n  -e HASH, --edit=HASH      Edit a tree leaf (task).' +
    '\n  -f HASH, --finish=HASH    Finished a task, delete leaf in tree.' +
    '\n  -p HASH, --parent=HASH    Parent leaf of leaf.';
var cli = docopt(doc, {help: true, version: '0.0.0'});

var cliTreeDir = cli['--tree-dir'];
var cliTreeFile = cli['--tree'];
var cliTreePath = path.join(cliTreeDir, cliTreeFile);
var cliList_ = cli['--list'];
var cliEdit_ = cli['--edit'];
var cliFinish_ = cli['--finish'];
var cliParent = cli['--parent'];
var cliTEXT = cli['TEXT'];


if (cliTEXT) {
	var task = makeLineFromStr(cliTEXT);
	read(cliTreePath, function(err, data){
		write(task, data, cliTreePath, function(){});
	});

	return;
}

if (cliEdit_) {
	console.log('Edit');

	return;
}

if (cliFinish_) {
	console.log('Finish')

	return;
}

if (cliList_ || !cliEdit_ && !cliFinish_ && !cliTEXT) {
	read(cliTreePath, function(err, data){
		var objsArr = fileToObjsArr(data);
		listTasks(objsArr);
	});

	return;
}


function read(file, callback) {
	fs.readFile(file, function(err, data){
		if (err) {
			if (err.code === 'ENOENT')
				console.log('File doesn\'t exist!')
			else console.log(err);
		}
		
		return callback(err, data);
	});
}

// TODO:
// Check if the file exists and if it doesn't create it
function write(str, data, file, callback) {
	var buffer = data + str;

	fs.writeFile(file, buffer, function(err){
		if (err) return console.log(err);
		callback(arguments);
	});
}

/**
 * Gives you an array of objects like the one readLine() returns. The array is
 * made from the file contents that you give it.
 *
 * Args: {string} data
 */
function fileToObjsArr(data) {
	var lines = data.toString().split('\n');
	lines.pop(); // the last value of of the array is always an empty string
	var linesArr = [];

	lines.forEach(function(val, index, arr){
		var lineObj = readLine(val);
		linesArr[index] = lineObj;
	});

	return linesArr;
}

/**
 * This function prints to the console a nice list of the tasks that are inside
 * the file that it was given as an argument.
 *
 * Args: {array} objsArr
 * Returns prints to console something like:
 *
 * 23 - Todo task that sucks.
 * 2a - Leaf body.
 * 3 - Another one.
 * f - Hey this one's different.
 */
function listTasks(objsArr) {
	var bodies = [];
	var ids = [];

	objsArr.forEach(function(val, index){
		bodies[index] = objsArr[index]['body'];
		ids[index] = objsArr[index]['id'];
	});
	
	var idsSUP = SUP(ids);
	
	idsSUP.forEach(function(val, index){
		console.log(idsSUP[index], '-', bodies[index]);
	});
	
	return;
}

/**
 * From the string that you give it it figures out a key/value pair according to
 * the way Godo handles a task line's syntax.
 * 
 * Args: {string} string
 * Returns something like this:
 *
 * { body: 'test 2',
 *   id: 'a5fa4b2df2f007c7c15ea1e1b047a968b7ca9623',
 *   added: '1401496895159' }
 */
function readLine(str) {
	var string = str.match(/\b[^|]+\b/g);
	var lineObj = {};

	string.forEach(function(val, index, arr){
		keyValue = val.match(/[^:]+/g);
		if (keyValue && keyValue.length === 2)
			lineObj[keyValue[0]] = keyValue[1];
	});

	return lineObj;
}

/**
 * Based on the object you give it (from readLine()) it will return a line ready
 * to be added to a file as a task.
 *
 * Args: {object} obj
 */
function makeLineFromObj(obj) {
	var line = [];
	for (var key in obj)
		line[key] = key + ':' + obj[key];
	line = line.join(' || ');
	line += '\n';
	return line;
}

/**
 * Based on the string you give it it will return a line ready to be added to a
 * file as a task.
 *
 * Args: {string} str
 */
function makeLineFromStr(str) {
	var line = [];

	line[0] = 'body:' + str;
	line[1] = 'id:' + makeHash(str);
	line[2] = 'added:' + moment().utc();
	if (cliParent)
		line[3] = 'parent:' + cliParent;
	line = line.join(' || ');
	line += '\n';

	return line;
}

/**
 * Returns a SHA1 string based on the string you give it plus the UTC time at
 * the time of hash generation.
 *
 * Args: {string} str, {function} callback
 */
function makeHash(str) {
	var hashedStr = sha1(str + moment().utc());
	return hashedStr;
}

/**
 * Big thanks to Bruce who figured this out for me. What this function does is
 * give you the shortest unique prefix of the strings (hashes) that you give it
 * in the array.
 *
 * Args: {array} arr
 * Returns something like this:
 *
 * [ '1c',
 *   '28d',
 *   '4',
 *   '288',
 *   '19',
 *   'f',
 *   '8' ]
 */
function SUP(arr) {
	var result = [];

	arr.forEach(function(val, index){
		var min = 0;

		arr.forEach(function(val2, index2){
			if (index === index2) return;

			var i = 0;
			while (val[i] === val2[i]) {
				if (i >= min)
					min = i + 1;
				i++;
			}
		});

		result[index] = val.substr(0, min + 1);
	});

	return result;
}





/**
 * Deletes a task from the file you give it. It finds the task based on the hash
 * that you give it as argument.
 *
 * Args: {string} hash, {string} file, {function} callback
 * Returns: Not meant to return anything, changes happen in IO
 */
function removeLeaf(hash, file, callback) {
	// Some argument magic to make file optional
	if (arguments.length < 3) {
		var callback = file;
		var file = cliTreePath;
	}

	fs.readFile(file, function(err, data){
		if (err) return console.log(err);

		var buffer = data.toString();
		var leaves = leafArrOfObjs(file, function(a){return a;});

		callback(arguments);
	});
}

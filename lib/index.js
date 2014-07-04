var sha1 = require('sha1');
var moment = require('moment');

var Godo = {};

/**
 * WRITING
 */

/**
 * Based on the string you give it it will return a line ready to be added to a
 * file as a task.
 */
function makeLineFromStr(str, parent) {
	var line = [];

	line[0] = 'body:' + str;
	line[1] = 'id:' + makeHash(str);
	line[2] = 'added:' + moment().utc();
	if (parent)
		line[3] = 'parent:' + parent;
	line = line.join(' | ');
	line += '\n';

	return line;
}

// Makes a SHA1 hash from the string you give it
function makeHash(str) {
	var hashedStr = sha1(str + moment(new Date()).utc());
	return hashedStr;
}

// Makes writing stuff public
Godo.newTask = function(text, path){
	var task = makeLineFromStr(text);
	return task;
};


/**
 * Based on the object you give it (from lineToObject()) it will return a line ready
 * to be added to a file as a task.
 */
function makeLineFromObj(obj) {
	var line = [];
	for (var key in obj)
		line[key] = key + ':' + obj[key];
	line = line.join(' | ');
	line += '\n';
	return line;
}


/**
 * LISTING
 */

/**
 * Big thanks to Bruce who figured this out for me. What this function does is
 * give you the shortest unique prefix of the strings (hashes) that you give it
 * in the array.
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
 * Uses lineToObject() in order to make an array of these from the string you
 * give it, it'll make a new object per line.
 *
 * Give this one the file's data in order to get a bunch of objects to work
 * with.
 */
function fileToObjsArr(data) {
	var lines = data.toString().split('\n');
	lines.pop(); // the last value of of the array is always an empty string
	var linesArr = [];

	lines.forEach(function(val, index, arr){
		var lineObj = lineToObject(val);
		linesArr[index] = lineObj;
	});

	return linesArr;
}

/**
 * From the string that you give it it figures out a key/value pair according to
 * the way Godo handles a task line's syntax.
 *
 * { body: 'test 2',
 *   id: 'a5fa4b2df2f007c7c15ea1e1b047a968b7ca9623',
 *   added: '1401496895159' }
 */
function lineToObject(str) {
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
Godo.listTasks = function(data){
	var objsArr = fileToObjsArr(data);
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
};


/**
 * REMOVING
 */

/**
 * Returns a new string with the task you give it (by hash) removed so that may
 * be written to a file.
 *
 * Args: {string} hash, {string} data
 * Returns: Not meant to return anything, changes happen in IO
 *
 * TODO
 * Be able to remove several tasks, currently only one at a time
 */
function removeTask(hash, data) {
	lines = data.toString().split('\n');	
	lines.pop(); // the last value of of the array is always an empty string
	var regex = new RegExp('id:'+hash, 'g');
	
	lines.forEach(function(val, index, arr){
		if (val.match(regex))
			arr.splice(index, 1);
	});
	
	return lines;
}



// release it to the world!
module.exports = Godo;


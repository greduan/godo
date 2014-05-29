(function(){

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
    '\n  -d DIR, --task-dir=DIR    The directory where to store tree(s) (file[s]) [default: ./godo].' +
    '\n  -t TREE, --tree=TREE      The name of the tree (file) to make changes to [default: todo.txt].' +
    '\n  -l, --list                List tree leafs (tasks) nicely.' +
    '\n  -e HASH, --edit=HASH      Edit a tree leaf (task).' +
    '\n  -f HASH, --finish=HASH    Finished a task, delete leaf in tree.' +
    '\n  -p HASH, --parent=HASH    Parent leaf of leaf.';
var cli = docopt(doc, {help: true, version: '0.0.0'});

var cliTreeDir = cli['--task-dir'];
var cliTreeFile = cli['--tree'];
var cliTreePath = path.join(cliTreeDir, cliTreeFile);
var cliList_ = cli['--list'];
var cliEdit_ = cli['--edit'];
var cliFinish_ = cli['--finish'];
var cliParent = cli['--parent'];
var cliTEXT = cli['TEXT'];

/*
 * WRITING A TREE
 */

function makeLeaf(leafBody, callback) {
	/* This function puts together all the functions that are needed in the
	 * right order so that a nice leafline is prepared to be sorted and then
	 * saved to the tree file.
	 */

	var leafStr = new Array();
	leafStr[0] = 'body:' + leafBody;
	leafStr[1] = 'id:' + makeHash(leafBody, function(a){return a;});
	leafStr[2] = 'added:' + moment().utc();
	if (cliParent)
		leafStr[3] = 'parent:' + cliParent;
	result = leafStr.join(' || ');
	result += '\n';

	return callback(result);
}

function makeHash(string, callback) {
	/* This just returns a SHA1 string based on the string you give it.
	 */

	var hashedStr = sha1(string);

	return callback(hashedStr);
}

function writeToFile(string, callback) {
	/* Writes what you give it to a file, first buffering what was already in
	 * the file, adding to the buffer what string has been given to it and then
	 * putting all of it into the file.
	 *
	 * If the dir/file it's writing to doesn't exist yet it creates it.
	 */

	fs.readFile(cliTreePath, 'utf8', function(err, data){
		if (err) {
			if (err.code === 'ENOENT') {
				console.log('Couldn\'t find directory or path at:', cliTreePath);

				console.log('Creating directory:', cliTreeDir);
				mkdirp.sync(cliTreeDir);

				console.log('Creating file:', cliTreeFile);
				fs.openSync(cliTreePath, 'w');

				// In order to avoid a 'undefinedbody:body' situation
				data = '';
			} else return console.log(err);
		}

		var buffer = data + string;

		fs.writeFile(cliTreePath, buffer, function(err){
			if(err) return console.log(err);
		});
	});

	return;
}

/*
 * READING A TREE
 */

function readTree(tree, callback) {
	/* This function puts together all the functions that are needed in the
	 * right order so that a nice listing comes out in the following format:
	 *
	 * 23 -> Todo task that sucks.
	 * 2a -> Leaf body.
	 * 3  -> Another one.
	 * f  -> Hey this one's different.
	 *
	 * Or something like that.
	 */

	var test = leafArrOfObjs(tree, function(a){return a;})

	return callback(test);
}

function leafArrOfObjs(tree, callback) {
	/* This function simplifies a bit of the work readTree() has to do by
	 * receiving a file and converting each line to it to an object and making
	 * an array out of all those objects.
	 */

	var lines = fs.readFileSync(tree).toString().split('\n');
	lines.pop(); // the last value of of the array is always an empty string
	var linesArr = new Array();

	lines.forEach(function(val, index, arr){
		readLeaf(val, function(obj){
			// console.log(obj);
			linesArr[index] = obj;
		});
	});

	return callback(linesArr);
}

function readLeaf(leafLine, callback) {
	/* Figure out the contents of a leaf and return an object with the meta
	 * values assigned to them. Used when listing existing tree. Given this as
	 * the input:
	 *
	 * 'body:the body || id:long ass sha1 || added:a date string'
	 *
	 * It would return the following object:
	 *
	 * { body: 'the body',
	 *   id: 'long ass sha1',
	 *   added: 'a date string' }
	 */

	var bodyAndMeta = leafLine.match(/\b[^|]+\b/g);
	var leafObject = new Object;

	bodyAndMeta.forEach(function(val, index, arr){
		metaValue = val.match(/[^:]+/g);
		if (metaValue && metaValue.length === 2)
			leafObject[metaValue[0]] = metaValue[1];
	});

	return callback(leafObject);
}

// testing stuff
/*
makeLeaf(cliTEXT, function(a){
	console.log(a);
	readLeaf(a, function(b){console.log(b)});
	writeToFile(a, function(c){console.log('WRITING');console.log(c);});
});
*/
readTree(cliTreePath, function(a){console.log(a);});

})();

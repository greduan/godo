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
    '\n  -t TREE, --tree=TREE      The name of the tree (file) to make changes to [default: default.txt].' +
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
fs.stat(cliTreePath, function(err, stat){
	/* Based on the error we get or that we don't get when we read the path to
	 * the tree, make any necessary directories and touch the tree file.
	 * /
	if (err) {
		if (err.code === 'ENOENT') {
			console.log('Couldn\'t find directory or path at:', cliTreePath);

			console.log('Creating directory:', cliTreeDir);
			mkdirp.sync(cliTreeDir);
			console.log('Created directory.');

			console.log('Creating file:', cliTreeFile)
			fs.openSync(cliTreePath, 'w')
			console.log('Created file.')

			return;
		} else {
			return console.error(err);
		}
	}

	return;
});
*/

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
	leafStr[1] = 'id:' + makeSHA1(leafBody, function(a){return a;});
	leafStr[2] = 'added:' + moment().format('YYYY-MM-DD');
	if (cliParent)
		leafStr[3] = 'parent:' + cliParent;
	result = leafStr.join(' || ');
	result += '\n';

	return callback(result);
}

function makeSHA1(string, callback) {
	/* This just returns a SHA1 string based on the string you give it.
	 */

	var hashedStr = sha1(string);

	return callback(hashedStr);
}

function writeToFile(string, callback) {
	/* Writes what you give it to a file, first buffering what was already in
	 * the file, adding to the buffer what string has been given to it and then
	 * putting all of it into the file.
	 */

	fs.readFile(cliTreePath, 'utf8', function(err, data){
		if (err) {
			if (err.code === 'ENOENT') {
				console.log('Couldn\'t find directory or path at:', cliTreePath);

				console.log('Creating directory:', cliTreeDir);
				mkdirp.sync(cliTreeDir);

				console.log('Creating file:', cliTreeFile)
				fs.openSync(cliTreePath, 'w')

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

function listTree(tree, callback) {
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

	/* leafLine(str, cb) is useable at this point to read each line and parse it
	 * into an object so that something can be done with it.
	 */
}

function readLeaf(string, callback) {
	/* Figure out the contents of a leaf and return an object with the meta
	 * values assigned to them. Used when listing existing tree. Given this as
	 * the input:
	 *
	 * 'body:the body || id:long ass sha1 || added:a date string'
	 *
	 * It would return the following:
	 *
	 * { body: 'the body',
	 *   id: 'long ass sha1',
	 *   added: 'a date string' }
	 */

	var bodyAndMeta = string.match(/\b[^|]+\b/g);
	var leafObject = new Object;

	bodyAndMeta.forEach(function(val, index, arr){
		metaValue = val.match(/[^:]+/g);
		if (metaValue && metaValue.length === 2)
			leafObject[metaValue[0]] = metaValue[1];
	});

	return callback(leafObject);
}

})();

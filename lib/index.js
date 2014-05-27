(function(){

var docopt = require('docopt').docopt;
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var sha1 = require('sha1');

// Docopt magic
var doc = 'Usage:' +
    '\n  godo [-d DIR -t TREE] [options] [TEXT]' +
    '\n' +
    '\nOptions:' +
    '\n  -d DIR, --task-dir=DIR    The directory where to store tree(s) (file[s]) [default: ./godo].' +
    '\n  -t TREE, --tree=TREE      The name of the tree (file) to make changes to [default: default.txt].' +
    '\n  -l, --list                List tree leafs (tasks) nicely.' +
    '\n  -e HASH, --edit=HASH      Edit a tree leaf (task).' +
    '\n  -f HASH, --finish=HASH    Finished a task, delete leaf in tree.';
var cli = docopt(doc, {argv: ['long ass text that serves for shit'], help: true, version: '0.0.0'});

// Figure out tree's (file's) path
var treeDir = cli['--task-dir'];
var treeFile = cli['--tree'];
var treePath = path.join(treeDir, treeFile);

// Check if file/dir exists, if not create it
fs.statSync(treePath, function(err, stat){
	if (err) {
		if (err.code === 'ENOENT') {
			console.log('No directory/file at:', treePath);

			console.log('Creating directory:', treeDir);
			mkdirp.sync(cli['--task-dir']);
			console.log('Created directory.');

			console.log('Creating file:', treeFile)
			fs.openSync(treePath, 'w')
			console.log('Created file.')

			return;
		}

		console.error(err);
		return;
	}

	console.log('Nothing to do here...');
	return;
});

// Define listing the contents tree
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
}

function leafLine(string, callback) {
	/* Figure out the contents of a leaf and return an object with the meta
	 * values assigned to them. Used when listing existing tree. Given this as
	 * the input:
	 *
	 * 'the body || id:long ass sha1 || added:a date string'
	 *
	 * It would return the following:
	 *
	 * { body: 'the body',
	 *   id: 'long ass sha1',
	 *   added: 'a date string' }
	 */

	var bodyMeta = string.match(/\b[^|]+\b/g);

	var result = new Object;

	bodyMeta.forEach(function(val, index, arr){
		metaValue = val.match(/[^:]+/g);
		result[metaValue[0]] = metaValue[1];
	});

	return callback(result);
}

})();

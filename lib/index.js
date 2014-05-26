var docopt = require('docopt').docopt;
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

var doc = 'Usage:' +
    '\n  godo [-d DIR -t TREE] [options] [TEXT...]' +
    '\n' +
    '\nOptions:' +
    '\n  -d DIR, --task-dir=DIR    The directory where to store tree(s) (file[s]) [default: ./godo].' +
    '\n  -t TREE, --tree=TREE      The name of the tree (file) to make changes to [default: default.txt].' +
    '\n  -l, --list                List tree leafs (tasks) nicely.' +
    '\n  -e HASH, --edit=HASH      Edit a tree leaf (task).' +
    '\n  -f HASH, --finish=HASH    Finished a task, delete leaf in tree.';
var cli = docopt(doc, {argv: ['TEXT', 'text'], help: true, version: '0.0.0'});
//console.log(cli);

// Figure out tree's (file's) path
var treeDir = cli['--task-dir'];
var treeFile = cli['--tree'];
var treePath = path.join(treeDir, treeFile);
//console.log(treePath);

// Check if file/dir exists, if not create it
fs.stat(treePath, function(err, stat){
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

	console.log('Nothing to do here...')
	return;
});


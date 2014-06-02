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


	/**
	 * CLI SWITCH
	 */

	if (cliTEXT) {
		console.log('New task');

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
		console.log('List');

		return;
	}


	/**
	 * CREATE
	 */

	/**
	 * Makes a new task line from the string you give it.
	 * 
	 * Args: {string} str
	 * Returns: Something like this:
	 * 
	 * 'body:Just another test || id:b22781d285abf62ca9d57079b74ad30ea52aa89f || added:1401496907440'
	 */
	function makeLeaf(str) {
		var taskLine = new Array();

		taskLine[0] = 'body:' + str;
		taskLine[1] = 'id:' + makeHash(str, function(a){return a;});
		taskLine[2] = 'added:' + moment().utc();
		if (cliParent)
			taskLine[3] = 'parent:' + cliParent;
		taskLine = taskLine.join(' || ');
		taskLine += '\n';

		return taskLine;
	}

	/**
	 * Adds the string that you give it to the tail of the file. Creates the dir/file
	 * if it can't find it.
	 * 
	 * Args: {string} str, {string} file, {function} callback
	 * Returns: Not meant to return anything, changes happen in IO
	 */
	function writeToFile(str, file, callback) {
		// Some argument magic to make file optional
		if (arguments.length < 3) {
			var callback = file;
			var file = cliTreePath;
		}

		fs.readFile(file, function(err, data){
			if (err) {
				if (err.code === 'ENOENT') {
					console.log('Couldn\'t find directory or path at:', cliTreePath);

					console.log('Creating directory...');
					mkdirp.sync(cliTreeDir);

					console.log('Creating file...');
					fs.openSync(cliTreePath, 'w');

					// In order to avoid a 'undefinedbody:body' situation
					data = '';
				} else return console.log(err);
			}

			var buffer = data + str;

			fs.writeFile(cliTreePath, buffer, function(err){
				if (err) return console.log(err);
				callback(arguments);
			});
		});
	}


	/**
	 * READ
	 */

	/**
	 * From the string that you give it it figures out a key/value pair according to
	 * the way Godo handles a task line's syntax.
	 * 
	 * Args: {string} string, {function} callback
	 * Returns: Something like this:
	 *
	 * { body: 'test 2',
	 *   id: 'a5fa4b2df2f007c7c15ea1e1b047a968b7ca9623',
	 *   added: '1401496895159' }
	 */
	function readLeaf(str) {
		var string = str.match(/\b[^|]+\b/g);
		var leafObject = new Object;

		string.forEach(function(val, index, arr){
			keyValue = val.match(/[^:]+/g);
			if (keyValue && keyValue.length === 2)
				string[keyValue[0]] = keyValue[1];
		});

		return leafObject;
	}

	/**
	 * This function prints to the console a nice list of the tasks that are inside
	 * the file that it was given as an argument.
	 *
	 * Args: {string} file, {function} callback
	 * Returns: Prints to console something like:
	 *
	 * 23 - Todo task that sucks.
	 * 2a - Leaf body.
	 * 3 - Another one.
	 * f - Hey this one's different.
	 */
	function readTree(file, callback) {
		var objs = leafArrOfObjs(file, function(a){return a;});

		getHashesBodies(objs, function(leafIDsArr, leafBodiesArr){
			var hashes = minHash(leafIDsArr, function(minHashes){return minHashes;});
			var output = new Array();

			hashes.forEach(function(val, index, arr){
				console.log(arr[index], '-', leafBodiesArr[index]);
			});

			callback(arguments);
		});
	}


	/**
	 * UPDATE
	 */


	/**
	 * DELETE
	 */

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


	/**
	 * HELPER FUNCTIONS
	 */

	/**
	 * Returns a SHA1 string based on the string you give it plus the UTC time at
	 * the time of hash generation.
	 *
	 * Args: {string} str, {function} callback
	 * Returns: {string} hashedStr, through callback
	 */
	function makeHash(str, callback) {
		var hashedStr = sha1(str + moment().utc());

		return callback(hashedStr);
	}

	/**
	 * Returns an array of objects. The values inside the objects inside the array
	 * it returns are the body and meta of whatever file you give it to read.
	 *
	 * Args: {string} file, {function} callback
	 * Returns: {array} linesArr, through callback. Something like this:
	 *
	 * [ { body: 'test 1',
	 *     id: '97b78fd056c36e95bceb93a3de26eabaa394d576',
	 *     added: '1401496880797' },
	 *   { body: 'test 2',
	 *     id: 'a5fa4b2df2f007c7c15ea1e1b047a968b7ca9623',
	 *     added: '1401496895159' },
	 *   { body: 'LET ME WRITE MY DAMN TESTS',
	 *     id: 'a66c59ed24a4445f0f11a5a13c22cb0befcaf3b0',
	 *     added: '1401496941014' } ]
	 */
	function leafArrOfObjs(file, callback) {
		// TODO:
		// Add an error check for the case where the file doesn't exist
		var lines = fs.readFileSync(file).toString().split('\n');
		lines.pop(); // the last value of of the array is always an empty string
		var linesArr = new Array();

		lines.forEach(function(val, index, arr){
			readLeaf(val, function(obj){
				linesArr[index] = obj;
			});
		});

		return callback(linesArr);
	}

	/**
	 * Big thanks to Bruce who figured this out for me. What this function does is
	 * give you the shortest unique prefix of the strings (hashes) that you give it
	 * in the array.
	 *
	 * Args: {array} hashesArr, {function} callback
	 * Returns: {array} minHashes, through callback. Something like this:
	 *
	 * [ '1c',
	 *   '28d',
	 *   '4',
	 *   '288',
	 *   '19',
	 *   'f',
	 *   '8' ]
	 */
	function minHash(hashesArr, callback) {
		var minHashes = new Array();

		hashesArr.forEach(function (val, index) {
			var min = 0;

			hashesArr.forEach(function (val2, index2) {
				if (index === index2) return;

				var i = 0;
				while (val[i] === val2[i]) {
					if(i >= min) min = i + 1;
					i++;
				}
			});

			minHashes[index] = val.substr(0, min + 1);
		});

		return callback(minHashes);
	}

})();

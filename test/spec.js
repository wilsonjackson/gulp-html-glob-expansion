/* global describe, it */
var chai = require('chai');
var expect = chai.expect;
var htmlGlobExpansion = require('..');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var Buffer = require('buffer').Buffer;
var fs = require('fs');
var path = require('path');

describe('Plugin', function () {
	this.timeout(1000);

	function readFile(path) {
		return fs.readFileSync(path).toString('utf-8');
	}

	it('should pass through null files', function (done) {
		var stream = htmlGlobExpansion({root: 'test/fixtures'});

		stream.on('data', function (file) {
			expect(file.isNull()).to.equal(true);
			done();
		});

		stream.write(new File({
			path: path.resolve('test/fixtures/nullfile.html'),
			contents: null
		}));

		stream.end();
	});

	it('should emit an error on a stream', function (done) {
		var stream = htmlGlobExpansion({root: 'test/fixtures'});
		var error;

		stream.on('error', function (e) {
			expect(e).to.be.instanceof(PluginError);
			error = e;
			done();
		});

		stream.write(new File({
			path: path.resolve('test/fixtures/streamfile.html'),
			contents: gutil.noop()
		}));

		stream.end();
	});

	function runTest(desc, options, fixture, expected) {
		if (typeof options === 'string') {
			expected = fixture;
			fixture = options;
			options = {root: 'test/fixtures'};
		}
		it(desc, function (done) {
			var stream = htmlGlobExpansion(options);

			stream.on('data', function (file) {
				expect(file.contents.toString('utf-8')).to.equal(readFile(expected));
				done();
			});

			stream.write(new File({
				path: path.resolve(fixture),
				contents: new Buffer(readFile(fixture))
			}));

			stream.end();
		});
	}

	runTest('should replace glob URLs in script tags',
		'test/fixtures/js-glob.html', 'test/expected/js-glob.html');

	runTest('should retain non-glob URLs script tags',
		'test/fixtures/js-literal.html', 'test/expected/js-literal.html');

	runTest('should not modify absolute URLs in script tags',
		'test/fixtures/js-absolute.html', 'test/expected/js-absolute.html');

	runTest('should use relative URLs if the source script tag uses a relative URL',
		'test/fixtures/relative/js-relative.html', 'test/expected/relative/js-relative.html');

	runTest('should replace glob URLs in link tags',
		'test/fixtures/css-glob.html', 'test/expected/css-glob.html');

	runTest('should retain non-glob URLs in link tags',
		'test/fixtures/css-literal.html', 'test/expected/css-literal.html');

	runTest('should use relative URLs if the source link tag uses a relative URL',
		'test/fixtures/relative/css-relative.html', 'test/expected/relative/css-relative.html');

	runTest('should not modify absolute URLs in link tags',
		'test/fixtures/js-absolute.html', 'test/expected/js-absolute.html');

	runTest('should create a starting script tag even if the glob matches nothing',
		'test/fixtures/js-no-matched-files.html', 'test/expected/js-no-matched-files.html');

	runTest('should not modify script tag without src',
		'test/fixtures/js-no-src.html', 'test/expected/js-no-src.html');

	runTest('should respect wacky formatting',
		'test/fixtures/ugly.html', 'test/expected/ugly.html');

	runTest('should retain Windows line endings if present in the file',
		'test/fixtures/windows.html', 'test/expected/windows.html');

	runTest('should default the root directory to the cwd', undefined,
		'test/fixtures/default-root.html', 'test/fixtures/default-root.html');
});

var through = require('through2');
var PluginError = require('gulp-util').PluginError;
var tokenize = require('html-tokenize');
var glob = require('glob');
var path = require('path');
var defaults = require('lodash-node/modern/objects/defaults');
var url = require('url');

module.exports = function (options) {
	options = defaults(options || {}, {
		root: './'
	});

	var urlFindRe = /((?:src|href)\s*=\s*(['"]?))(.+?)(\2[ >])/i;

	function isAbsoluteUrl(u) {
		return url.resolve('http://example.org', u).indexOf('http://example.org') !== 0;
	}

	function parseTag(tag, relativePath, glue) {
		if (urlFindRe.test(tag)) {
			var resourceUrl = RegExp.$3;
			var prefix = RegExp.$1;
			var suffix = RegExp.$4;

			if (isAbsoluteUrl(resourceUrl)) {
				return tag;
			}

			var isAbsolute = resourceUrl.indexOf('/') === 0;
			var files = glob.sync(resourceUrl, {cwd: isAbsolute ? options.root : relativePath, root: options.root});

			return files.map(function (s) {
				var filePath = isAbsolute ? '/' + path.relative(options.root, s) : s;
				return tag.replace(urlFindRe, prefix + filePath + suffix);
			}).join(glue);
		}
		return tag;
	}

	function getLastWhitespace(html) {
		return html.split(/[\r\n]/).pop().replace(/.*?(\s*)$/, '$1');
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return;
		}
		if (file.isStream()) {
			this.emit('error', new PluginError('gulp-html-glob-expansion',  'Streaming not supported'));
			return;
		}

		var lastText = '';
		var lineEnding = /\r\n/g.test(file.contents.toString('utf-8')) ? '\r\n' : '\n';
		var content = [];
		var toReplace = [];

		var stream = tokenize()
			.on('data', function (d) {
				var html = d[1].toString('utf-8');
				if (d[0] === 'open' && html.toLowerCase().indexOf('<script') === 0) {
					toReplace.push({
						i: content.length,
						html: html,
						default: '<script>',
						glue: '</script>' + lineEnding + getLastWhitespace(lastText)
					});
					content.push('');
				}
				else if (d[0] === 'open' && html.toLowerCase().indexOf('<link') === 0) {
					toReplace.push({
						i: content.length,
						html: html,
						glue: lineEnding + getLastWhitespace(lastText)
					});
					content.push('');
				}
				else {
					if (d[0] === 'text') {
						lastText = html;
					}
					content.push(html);
				}
			})
			.on('finish', function () {
				var relativePath = path.dirname(file.path);
				toReplace.forEach(function (tag) {
					content[tag.i] = parseTag(tag.html, relativePath, tag.glue) || tag.default;
				});
				file.contents = new Buffer(content.join(''));
				this.push(file);
				cb();
			}.bind(this));

		stream.write(file.contents);
		stream.end();
	});
};

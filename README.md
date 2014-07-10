gulp-html-glob-expansion
========================

[![Build Status](https://travis-ci.org/wilsonjackson/gulp-html-glob-expansion.svg?branch=master)](https://travis-ci.org/wilsonjackson/gulp-html-glob-expansion)

Expands glob expressions in HTML resource URLs.

Usage
-----

```javascript
var htmlGlob = require('gulp-html-glob-expansion');

gulp.task('default', function () {
	return gulp.src('app/index.html')
		.pipe(htmlGlob({root: 'app'}))
		.pipe(gulp.dest('dist'));
});
```

Options
-------

- `root`

    Specify the directory used to expand root-relative paths.

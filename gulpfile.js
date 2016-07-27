var gulp = require("gulp");
var uglify  = require( 'gulp-uglify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');

// by default, we call the babel task
gulp.task('default',['build','min']);

gulp.task('build', function () {
	browserify({entries: ['./src/index.js'], debug: false})
		.bundle()
		.pipe(source('brite.js'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('min', function(){
	gulp.src('./dist/brite.js')
	.pipe(uglify())
	.pipe(rename({
		suffix: '.min'
	}))		
	.pipe(gulp.dest('dist/'));
});

// watch files (for dev)
gulp.task('watch', function(){
	gulp.watch('src/*.js', ['build']);
});


// --------- /Helpers --------- //
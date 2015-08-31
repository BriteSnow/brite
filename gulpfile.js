var gulp = require("gulp");
var concat  = require( 'gulp-concat' );
var uglify  = require( 'gulp-uglify' );

// by default, we call the babel task
gulp.task('default',["snapshot"]);

// compile the *.jsx to dist folders
gulp.task('snapshot', function() {

	concatSources("brite-snapshot.js").pipe(gulp.dest('dist/'));

	concatSources("brite-snapshot.min.js").pipe(uglify()).pipe(gulp.dest('dist/'));
		
});

// watch files (for dev)
gulp.task('watch', function(){
	gulp.watch('src/js/*.js', ['snapshot']);
});

// --------- Helpers --------- //
function concatSources(fileName){
	return gulp.src('src/js/*.js').pipe(concat(fileName));
}
// --------- /Helpers --------- //
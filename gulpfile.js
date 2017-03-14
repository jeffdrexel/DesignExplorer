var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var sass = require('gulp-sass');
var shell = require('gulp-shell');
var fs = require('fs');

// Settings
var builds = ['design-explorer-lib','main'];
var buildDevNames = [];
var allJsSrcFolder = 'js/src/**/*';
var allJsSrc = allJsSrcFolder + '.js';
var allCssSrcFolder = 'css/src/**/*';

// Build node dependencies
gulp.task('build-dependencies', function () {
	return gulp.src(
			[
				// './node_modules/bootstrap-sass/javascripts/bootstrap.min.js',
				'./node_modules/angular/angular.min.js',
				'./node_modules/angular-ui-router/release/angular-ui-router.min.js',
				'./node_modules/promise-polyfill/promise.min.js',
			]
		)
		.pipe(concat('dependencies.js'))
		.pipe(gulp.dest('./js/builds'));
});

// Init each build task
builds.forEach(function (buildFolder) {

	var buildName = 'build-' + buildFolder;

	gulp.task(buildName, function () {
		return gulp.src(
				[
					'./js/src/' + buildFolder + '/header.js',
					'./js/src/' + buildFolder + '/*dependencies/**/*.js',
					'./js/src/' + buildFolder + '/*constructors/**/*.js',
					'./js/src/' + buildFolder + '/**/*.js',
					'./js/src/' + buildFolder + '/footer.js'
				]
			)
			.pipe(sourcemaps.init())
			.pipe(concat(buildFolder + '.js'))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest('./js/builds'));
	});

	buildDevNames.push(buildName);

});

// Set up lint
gulp.task('lint', function () {

	return gulp.src(allJsSrc)
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));

});

// Build All Dev
gulp.task('build-dev', /*['clean'],*/ function () {

	runSequence(buildDevNames);

});

// Sass
gulp.task('sass', function () {

	return gulp.src('./css/src/style.scss')
		.pipe(sourcemaps.init())
		.pipe(sass()
			.on('error', sass.logError))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./css'));

});

// documentation
gulp.task('document', shell.task([
  'jsdoc ' +
    '-c node_modules/angular-jsdoc/common/conf.json ' + // config file
    '-t docs/src/angular-template ' + // template file
    '-d docs/auto/angular ' + // output directory
    './readme.md ' + // to include README.md as index contents
    '-r js/src/main/ng-partials js/src/main/header.js' //+ // source code directory
    // '-u tutorials'                              // tutorials directory
    ,
		// 'jsdoc -c docs/src/jsdocConf.json -d docs/auto/js'
		'jsdoc -c docs/src/jsdocConfInkDocstrap.json -d docs/auto/js -t ./node_modules/ink-docstrap/template'
]));

// serve documentation folder
gulp.task('view-documentation', shell.task([
  'http-server ./docs -p 8000'
]));


// Default gulp task: build dev
gulp.task('default', ['build-dependencies'], function () {

	var devBuildJsTasks = ['lint', 'build-dev'];
	var devBuildCssTasks = ['sass'];

	gulp.start(devBuildJsTasks);
	gulp.start(devBuildCssTasks);

	gulp.watch(allJsSrcFolder, devBuildJsTasks);
	gulp.watch(allCssSrcFolder, devBuildCssTasks);

});

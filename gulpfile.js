const gulp = require('gulp');
const postcss = require('gulp-postcss');
const modules = require('postcss-modules');
const autoprefixer = require('autoprefixer');
const path = require('path');
const fs = require('fs');
const pug = require('gulp-pug');
const concat = require('gulp-concat');
const removeFiles = require('gulp-remove-files');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const map = require('map-stream');

const PATHS = {
  moduleStyles: 'src/templates/**/*.scss',
  globalStyles: 'src/scss/app.scss',
  templates: 'src/templates/pages/**/*.pug'
};

const GLOBAL_IMPOPTS_SCSS = [
  "./src/scss/abstract/vars.scss",
  "./src/scss/abstract/mixins.scss"
];


function getJSONFromCssModules(cssFileName, json) {
  const moduleName = path.basename(path.dirname(cssFileName));
  const currentModulePath = path.dirname(path.relative('src/templates', cssFileName));

  const jsonFileName = path.resolve(`./scoped-modules/${currentModulePath}`, moduleName + '.json');

  fs.writeFileSync(jsonFileName, JSON.stringify(json));
}

function makeMultipleClasses(module, htmlClasses) {
  const classesModule = JSON.parse(module);
  const classesHTML = htmlClasses.split(' ');
  let hashClassesStore = [];

  classesHTML.forEach(item => {
    if (classesModule[item]) {
      hashClassesStore.push(classesModule[item])
    }
    else {
      hashClassesStore.push(item);
    }
  });

  return hashClassesStore;
}

function getClass(module, className) {
  try {
    let moduleFileNamePagesDir = path.resolve(`./scoped-modules/pages/${module}/`, `${ module }.json`);

    return makeMultipleClasses(fs.readFileSync(moduleFileNamePagesDir).toString(), className);

  }
  catch (error) {
    let moduleFileNameComponents = path.resolve(`./scoped-modules/components/${module}/`, `${ module }.json`);

    return makeMultipleClasses(fs.readFileSync(moduleFileNameComponents).toString(), className);
  }
}

gulp.task('copy:structure_folders_modules', function () {
  return gulp.src('./src/templates/**/')
    .pipe(gulp.dest('./scoped-modules'));
});

gulp.task('compile:module_styles', function () {
  return gulp.src([PATHS.moduleStyles])
    .pipe(map(function (file, cb) {
      let contentFileOriginal = file.contents.toString();
      let newFileContent = [];
      let paths = GLOBAL_IMPOPTS_SCSS;

      if (!paths) return cb(null, file);

      paths.forEach(function (path) {
        newFileContent.push("@import '" + path + "';");
      });

      newFileContent.push(contentFileOriginal);

      let output = newFileContent.join('\n');

      let buffer = new Buffer.from(output, 'binary');

      file.contents = buffer;

      return cb(null, file);
    }))

    .pipe(sass({includePaths: ['src/scss']}).on('error', sass.logError))
    .pipe(postcss([
      autoprefixer,
      modules({getJSON: getJSONFromCssModules}),
    ]))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('dist'))

});

gulp.task('compile:global_styles', function () {
  return gulp.src(PATHS.globalStyles)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist'))
});

gulp.task('merge:styles', function () {
  return gulp.src('./dist/*.css')
    .pipe(concat('main.css'))
    .pipe(gulp.dest('dist'));
});

gulp.task('remove:originalStyles', function () {
  return gulp.src('./dist/app.css')
    .pipe(removeFiles())
});

gulp.task('build:styles', gulp.series('compile:global_styles', 'compile:module_styles', 'merge:styles', 'remove:originalStyles'));

gulp.task('remove:templates', function () {
  return gulp.src('./dist/**')
    .pipe(removeFiles())
});

gulp.task('render:templates', function () {
  return gulp.src(PATHS.templates)
    .on('data', function (file) {
      let relativeFilePath = file.relative;
    })
    .pipe(pug({
      pretty: true,
      locals: className = getClass
    }))
    .pipe(gulp.dest('./dist'))
});

gulp.task('remove:json', function () {
  return gulp.src('./scoped-modules/**/*.json')
    .pipe(removeFiles())
});

gulp.task('watch', function () {
  gulp.watch(['./src/**/*.scss', './src/templates/**/*.pug'], gulp.series('compile:module_styles', 'render:templates'));
});

gulp.task('run', gulp.series('remove:json','remove:templates', 'copy:structure_folders_modules', 'build:styles', 'render:templates', 'watch'));


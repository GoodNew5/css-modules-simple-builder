const gulp = require('gulp');
const postcss = require('gulp-postcss');
const modules = require('postcss-modules');
const autoprefixer = require('autoprefixer');
const path = require('path');
const fs =  require('fs');
const pug = require('gulp-pug');
const concat = require( 'gulp-concat');
const removeFiles = require('gulp-remove-files');
const folders = require('gulp-folders');
const pathToFolder = 'src';
const rename = require('gulp-rename');
const precss = require('precss');
const config = require('./postcss.config.js');
const sass = require('gulp-sass');
      sass.compiler = require('node-sass');


const PATHS = {
  styles: './src/**/*.scss',
  templates: 'src/pages/**/*.pug'
}



function getJSONFromCssModules(cssFileName, json) {
  const moduleName = path.basename(path.dirname(cssFileName));
  const currentModulePath = path.dirname(path.relative('src/',  cssFileName));

  const jsonFileName  = path.resolve(`./scoped-modules/${currentModulePath}`, moduleName + '.json');

  fs.writeFileSync(jsonFileName, JSON.stringify(json));
}


function makeMultipleClasses(module, htmlClasses) {
    const classesModule = JSON.parse(module)
    const classesHTML = htmlClasses.split(' ');
    let hashClassesStore = [];

    classesHTML.forEach(item => {

        if(classesModule[item]) {
          hashClassesStore.push(classesModule[item])
        }

        else {
          hashClassesStore.push(item);
        }
    });

    return hashClassesStore;
}


function getClass(module, className, ctx) {
  console.log(ctx);


  try {

    let moduleFileNamePagesDir  = path.resolve(`./scoped-modules/pages/${module}/`, `${ module }.json`);
  
  
    return makeMultipleClasses(fs.readFileSync(moduleFileNamePagesDir).toString(), className);

  }
  catch(error) {

    let moduleFileNameComponents  = path.resolve(`./scoped-modules/components/${module}/`, `${ module }.json`);
  

    return makeMultipleClasses(fs.readFileSync(moduleFileNameComponents).toString(), className);
  }
}


const style = {
  className: getClass
};



gulp.task('copy:structure_folders_modules', function () {
  return gulp.src('src/**/')
    .pipe(gulp.dest('./scoped-modules'));
});



gulp.task('generate:json', function() {
  return gulp.src(PATHS.styles) 
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      precss(),
      autoprefixer,
      modules({ getJSON: getJSONFromCssModules }),
    ]))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('./dist'));
});


gulp.task('remove:json', function() {
  return gulp.src(['./scoped-modules/**/*.json', 'src/components/**/*.json', './src/pages/**/*.json'])
  .pipe(removeFiles())
});


gulp.task('remove:templates', function() {
  return gulp.src('./dist/**/*.html')
  .pipe(removeFiles())
});


gulp.task('render:templates', function() {
  return gulp.src(PATHS.templates)
  .pipe(pug({
    pretty: true,
    locals: style,
    basedir: 'pages'
  }))
  .pipe(gulp.dest('./dist'))
});


gulp.task('default', gulp.series('remove:json', 'copy:structure_folders_modules', 'generate:json', 'remove:templates', 'render:templates'));


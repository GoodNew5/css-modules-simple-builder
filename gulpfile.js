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

// TODO


// задачи выполняться последовательно, образуя цеполчку remove:json => generate:json => 
// и только после того как сгенерировался / обновился json – рендерить шаблоны (render:templates)



// назовем наш json по имени модуля (в данном случае папки)
// затем создадим его и запишем в него json пришедший из модуля postcss-modules
// поместим в папку модуля


function getJSONFromCssModules(cssFileName, json) {
  const moduleName = path.basename(path.dirname(cssFileName));
  const currentModulePath = path.dirname(path.relative('src/',  cssFileName));

  const jsonFileName  = path.resolve(`./scoped-modules/${currentModulePath}`, moduleName + '.json');

  fs.writeFileSync(jsonFileName, JSON.stringify(json));
}


// для вставки сгенерированного класса в шаблон получим файл необходимого модуля
// прочтем его и переведем содержимое в строку
// вернем значение по ключу obj[className]


function makeMultipleClasses(classesFromJson, classNamesFromHTML) {
    const objStyle = JSON.parse(classesFromJson)
    const classes = classNamesFromHTML.split(' ');
    let hashClassesStore = [];

  
    for ( key in objStyle ) {
      hashClassesStore.push(objStyle[key])
    }

    return hashClassesStore;
}


function getClass(module, className) {
  // const currentModulePath = path.dirname(path.relative('src/',  module));
  // console.log(rest)
  try {

    let moduleFileNameComponents  = path.resolve(`./scoped-modules/components/${module}/`, `${ module }.json`);
  

    return makeMultipleClasses(fs.readFileSync(moduleFileNameComponents).toString(), className);
  }

  catch(error) {

    let moduleFileNamePagesDir  = path.resolve(`./scoped-modules/pages/${module}/`, `${ module }.json`);
  
  
    return makeMultipleClasses(fs.readFileSync(moduleFileNamePagesDir).toString(), className);

  }
}


const style = {
  className: getClass
};


// сгенерируем json для каждого модуля на основе наших css (из каждого модуля)
// сгенерируем также файы css с хешоваными классами и смержим их посредством concat


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


// иногда может потребоваться удалить сгенерированные json, чтобы не делать этого руками создадим задачу remove:json


gulp.task('remove:json', function() {
  return gulp.src(['./scoped-modules/*.json', 'src/components/**/*.json', './src/pages/**/*.json'])
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
    locals: style
  }))
  .pipe(gulp.dest('./dist'))
});


gulp.task('default', gulp.series('remove:json', 'copy:structure_folders_modules', 'generate:json', 'remove:templates', 'render:templates'));


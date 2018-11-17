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


const PATHS = {
  styles: './src/**/*.css',
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


function makeMultipleClasses(classesFromJson, classesFromHTML) {
    const classesJson = JSON.parse(classesFromJson)
    const classesHTML = classesFromHTML.split(' ');
    let hashClassesStore = [];

    classesHTML.forEach(item => {
        if(classesJson[item]) {
          hashClassesStore.push(classesJson[item])
        }
        else {
          hashClassesStore.push(item);
        }
    });

    return hashClassesStore;
}


function getClass(module, className) {
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
    .pipe(postcss([
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
    locals: style
  }))
  .pipe(gulp.dest('./dist'))
});


gulp.task('default', gulp.series( 'copy:structure_folders_modules', 'generate:json', 'remove:templates', 'render:templates'));


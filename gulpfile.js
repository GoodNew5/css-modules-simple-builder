const gulp = require('gulp');
const postcss = require('gulp-postcss');
const modules = require('postcss-modules');
const autoprefixer = require('autoprefixer');
const path = require('path');
const fs = require('fs');
const pug = require('gulp-pug');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const map = require('map-stream');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const flatten = require('gulp-flatten');
const sync = require('browser-sync').create();
const clean = require('gulp-clean');

const svgSprite = require('gulp-svg-sprite');
const PATHS = {
  moduleStyles: 'src/templates/**/*.scss',
  globalStyles: 'src/scss/app.scss',
  templates: 'src/templates/pages/**/*.pug'
};

const GLOBAL_IMPOPTS_SCSS = [
  "./src/scss/abstract/vars.scss",
  "./src/scss/abstract/mixins.scss",
  "./src/scss/abstract/_sprite.scss"
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
      modules({
        getJSON: getJSONFromCssModules,
        generateScopedName: '[name]__[local]___[hash:base64:5]'
      }),
    ]))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('dist'))
    .pipe(sync.stream());
});

gulp.task('compile:global_styles', function () {
  return gulp.src(PATHS.globalStyles)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist'))
});

gulp.task('remove:dist', function () {
  return gulp.src('./dist', {read: false})
    .pipe(clean())
});

gulp.task('render:templates', function () {
  return gulp.src(PATHS.templates, { basedir: '' })
    .on('data', function (file) {
        let relativeFilePath = file.relative;
      })

    .pipe(pug({
      pretty: true,
      cache: true,
      basedir: './src/templates',
      locals: className = getClass
    }))
    .pipe(flatten())
    .pipe(gulp.dest('./dist'))
});

gulp.task('remove:json', function () {
  return gulp.src('./scoped-modules', {read: false})
    .pipe(clean())
});


gulp.task('compile:js', function() {
  return gulp.src('./src/assets/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(concat('common.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js'))
});



gulp.task('copy:assets', function(){
  return gulp.src(['src/assets/{fonts,images}/**/*'])
    .pipe(gulp.dest('./dist'));
});


gulp.task('generate:svg', function() {
  return gulp.src('./src/assets/svg/*.svg')
    .pipe(svgSprite({
      // shape:
      //   spacing: { // Add padding
      //     padding: 2
      //   }
      // },
      mode:{
        css:{
          dest: './src/scss/abstract/',
          bust: false,
          sprite: '../../../dist/svg/sprite.svg',
          dimensions: true,
          prefix : "@mixin sprite-%s",
          render:{
            scss: {
              template: './src/scss/abstract/sprite-template.scss',
              dest: '_sprite.scss'
            }
          }
        }
      },
      svg:{
        doctypeDeclaration: false
      }
    }))
    .pipe(gulp.dest('./'));
});


gulp.task('serve', function () {
  sync.init({
      server: "./dist",
      host: '3010',
      open: false,
      notify: false,
      watch: true
    });

    gulp.watch(['./src/assets/js/**/*.js'], gulp.task('compile:js'));
    gulp.watch(['./src/assets/{fonts,images}/**'], gulp.task('copy:assets'));
    gulp.watch(['./src/asset/{svg}/**'], gulp.task('generate:svg'));
    gulp.watch('./src/templates/**/*.scss', gulp.series('compile:module_styles', 'render:templates'));
    gulp.watch('./src/scss/*.scss', gulp.series('compile:global_styles'));
    gulp.watch('./src/templates/**/*.pug', gulp.series('render:templates'));

    gulp.watch("dist/*.html").on('change', function () {
    sync.reload({stream: true})
    })
});


gulp.task('run', gulp.series(
  gulp.parallel(gulp.series('remove:json', 'copy:structure_folders_modules'), 'remove:dist'),
  gulp.parallel('compile:global_styles', 'compile:module_styles'),
  'render:templates',
  'compile:js',
  'copy:assets',
  'generate:svg',
  'serve'));
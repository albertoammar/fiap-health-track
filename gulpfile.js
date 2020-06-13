const gulp = require("gulp");
//
const concat = require("gulp-concat");
const sass = require("gulp-sass");
const size = require("gulp-size");
const prefix = require("gulp-autoprefixer");
const rename = require("gulp-rename");
const cssmin = require("gulp-minify-css");
const config = require("./config.json");
//
const ngAnnotate = require("gulp-ng-annotate");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
const plumber = require("gulp-plumber");
const imagemin = require("gulp-imagemin");
const pngquant = require("imagemin-pngquant");
const inject = require("gulp-inject");
const connect = require("gulp-connect-php");
const fileinclude = require("gulp-file-include");
//
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;

function cssTask() {
    return (
        gulp
            .src(config.css)
            // .pipe(plumber({errorHandler: onError}))
            .pipe(concat("all.scss"))
            .pipe(sass())
            .pipe(size({ gzip: true, showFiles: true }))
            .pipe(prefix())
            .pipe(rename("main.css"))
            .pipe(gulp.dest("dist/css"))
            .pipe(cssmin())
            .pipe(size({ gzip: true, showFiles: true }))
            .pipe(rename({ suffix: ".min" }))
            .pipe(gulp.dest("dist/css"))
            .pipe(reload({ stream: true }))
    );
}

function jsTask() {
    return gulp
        .src(config.js)
        .pipe(ngAnnotate())
        .pipe(
            babel({
                compact: false,
                presets: [
                    [
                        "@babel/env",
                        {
                            modules: false,
                        },
                    ],
                ],
            })
        )
        .pipe(
            uglify({
                mangle: true,
                ie8: true,
                compress: {
                    sequences: true,
                    unused: true,
                },
            })
        )
        .pipe(size({ gzip: true, showFiles: true }))
        .pipe(concat("js.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(reload({ stream: true }));
}

function minifyHtmlTask() {
    var opts = {
        comments: true,
        spare: true,
    };

    return gulp
        .src(["./public/*.html", "./public/**/*.html"])
        .pipe(
            fileinclude({
                prefix: "@@",
                basepath: "@file",
            })
        )
        .pipe(gulp.dest("dist/"))
        .pipe(reload({ stream: true }));
}

function imageMinTask() {
    return (
        gulp
            .src(["public/images/*", "public/images/**/*"])
            // .pipe(imagemin({
            //     progressive: true,
            //     svgoPlugins: [{removeViewBox: false}],
            //     use: [pngquant()]
            // }))
            .pipe(gulp.dest("dist/images"))
            .pipe(reload({ stream: true }))
    );
}

function watchTask(cb) {
    gulp.watch("./config.json", gulp.series([cssTask, jsTask]));
    gulp.watch("./public/css/**/*.scss", gulp.series([cssTask]));
    gulp.watch("./public/js/*.js", gulp.series([jsTask]));
    gulp.watch("./public/**/*.{html,php}", gulp.series([minifyHtmlTask]));
    gulp.watch("./public/**/*.{png,jpg}", gulp.series([imageMinTask]));

    cb();
}

function browserSyncTask() {
    connect.server(
        {
            base: "dist",
            port: 8010,
            keepalive: true,
        },
        function () {
            browserSync.init({
                proxy: "localhost:8010",
                baseDir: "./",
                open: true,
                notify: false,
            });
        }
    );

    return null;
}

// function injectTask() {
//     let target = gulp.src('./public/index.php');
//     // It's not necessary to read the files (will speed up things), we're only after their paths:
//     let sources = gulp.src(['./dist/**/*.js', './dist/**/*.css'], {read: false});
//
//     return target.pipe(inject(sources))
//         .pipe(gulp.dest('./dist'));
// }

exports.default = gulp.series([
    minifyHtmlTask,
    imageMinTask,
    cssTask,
    jsTask,
    watchTask,
    browserSyncTask,
]);
exports.build = gulp.series([minifyHtmlTask, imageMinTask, cssTask, jsTask]);

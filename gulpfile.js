﻿var gulp = require('gulp');
var ts = require('gulp-typescript');
var eventStream = require('event-stream');
var connect = require('gulp-connect');
var inject = require('gulp-inject');
var rename = require("gulp-rename");
var concat = require("gulp-concat");
var addsrc = require('gulp-add-src');

gulp.task('scripts', function () {
    var scripts = gulp.src(['references.ts', 'scripts/**/*.ts', 'main/app.ts'])
               .pipe(ts({
                   target: 'ES6',
                   noExternalResolve: true
               }))
                .js
                .pipe(gulp.dest('build'));

    gulp.src('./index.template.html')
               .pipe(inject(scripts))
               .pipe(rename(function (path) {
                   path.basename = "index";
               }))
               .pipe(gulp.dest('.'));

    return gulp.src(['references.ts', 'scripts/**/*.ts', 'main/js-rasterizer-worker.ts'])
               .pipe(ts({
                   target: 'ES6',
                   noExternalResolve: true
               }))
                .js
                .pipe(concat('worker.js'))
                .pipe(gulp.dest('build-worker'));
});

gulp.task('watch', function() {
    gulp.watch(['./index.template.html', 'scripts/**/*.ts', 'main/**/*.ts', 'references.ts'], { debounceDelay: 200 }, ['scripts']);
    gulp.watch(['./index.html', 'build/**/*.*'], { debounceDelay: 500 }, ['reload']);
});


gulp.task('reload', function() {
    gulp.src('./index.html')
      .pipe(connect.reload());
});

gulp.task('serve', function() {
    connect.server({
        livereload: true
    });
});

gulp.task('default', ['scripts', 'serve', 'watch'], function() { });

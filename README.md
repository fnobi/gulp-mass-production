gulp-mass-production
==============

gulp plugin for generating multiple articles.

## install

### from npm

```
npm install -D gulp-mass-production
```

## usage

### Multiply pug template with post parameters.

```javascript
gulp.task('html', () => {
    const params = {
        hoge: {
            title: 'hoge title',
            tags: ['a', 'b'],
            body: 'body body body body...'
        },
        moge: {
            title: 'moge title',
            tags: [],
            body: 'body body body body...'
        }
    };

    gulp.src('pug/*.pug')
        .pipe(massProduction({
            postParams: params,
            template: 'pug/post.pug'
        }))
        .pipe(pug())
        .pipe(gulp.dest('htdocs'));
});
```

Running this task, and generating `htdocs/hoge/index.html` and `htdocs/moge/index.html`.

### Multiply ejs template with markdown articles.

```coffeescript
gulp.task 'html', ->
  gulp.src "ejs/*.ejs"
    .pipe massProduction
      markdown: "posts/*.md"
      template: "ejs/article.ejs"
    .pipe ejs()
    .pipe gulp.dest "htdocs"
```

Write markdown article by [Frontmatter](https://middlemanapp.com/jp/basics/frontmatter/) format.

```markdown
---
title: moge title
tags:
  - a
  - b
---
body body body body...
```

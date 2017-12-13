gulp-mass-production
==============

gulp plugin for generating multiple articles.

## Install

### from npm

```
npm install -D gulp-mass-production
```
or
```
yarn add gulp-mass-production
```

## Usage

You can choose format from json (as postParams) or markdown.

### Using Json 

```gulpfile.js
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


### Using Markdown

```gulpfile.js
gulp.task('html', () => {
    gulp.src('pug/*.pug')
        .pipe(massProduction({
            markdown: "posts/*.md"
            template: 'pug/post.pug'
        }))
        .pipe(pug())
        .pipe(gulp.dest('htdocs'));
});
```

Write markdown article by [Frontmatter](https://middlemanapp.com/jp/basics/frontmatter/) format.

```posts/hoge.md
---
title: hoge title
tags:
  - a
  - b
---
body body body body...
```

### Pug template & Output
```pug/post.pug
- meta = massProduction.meta
 
h1= meta.title
p= meta.body

```

```htdocs/hoge/index.html
<h1>hoge title</h1>
<p>body body body body...</p>

```

## Post parameters

| Variable | Type | Default | Description |
|:---------|------|---------|-------------|
| hrefRule   | Function | `function (slug, meta) { return slug; };` | Customize html output format ( By default create the directory unless '.html')|
| locals   | Object | null | Locals to compile the Pug with |  
| markdown   | String | null | Markdown file that is used on template File |
| markedOpts   | Object | { breaks: true } | [Read here](https://github.com/chjj/marked#options-1) |
| namespace   | String | 'massProduction' | Object name that is used on template File |
| postParams | Object | null | Data that is used on template File | 


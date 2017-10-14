const path = require('path');

const gulp = require('gulp');
const through = require('through2');
const gutil = require('gulp-util');
const frontMatter = require('gulp-front-matter');
const marked = require('marked');
const _ = require('lodash');
const fs = require('fs');

const PLUGIN_NAME = 'gulp-massProduction';

module.exports = (opts) => {
    opts = opts || {};

    const markdown = opts.markdown;
    const postParams = opts.postParams;
    const template = opts.template;
    const archive = opts.archive || [];

    const locals = opts.locals;
    const metaProperty = opts.metaProperty || 'meta';
    const bodyProperty = opts.bodyProperty || 'body';
    const frontMatterProperty = opts.frontMatterProperty || 'frontMatter';
    // const archiveProperty = opts.archiveProperty || 'archive';
    const markedOpts = opts.markedOpts || {
        breaks: true
    };
    const hrefRule = opts.hrefRule || function (slug, meta) {
        return slug;
    };

    let base;
    const files = [];
    const archiveMap = [];

    if (!template) {
        this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'no template'));
    }

    const templateSource = fs.readFileSync(template, 'utf8');

    function transform (file, encoding, callback) {
        if (!base) {
            base = file.base;
        }

        let skip = false;
        
        // postの元になるテンプレートは、そのままでは使用しない
        if(!path.relative(template, file.path)) {
            skip = true;
        }
        // archive用テンプレートも同様
        archive.forEach((props) => {
            if(!path.relative(props.template, file.path)) {
                skip = true;
            }
        });

        if (!skip) {
            file.data = _.assign({}, file.data, locals);
            files.push(file);
        }
        
        return callback();
    };

    function flush (callback) {
        // const archive = [];

        const createFile = (href, templateSource) => {
            const dest = /\.html$/.test(href) ? href : [ href, 'index.html' ].join('/');
            const src = dest.replace(/\.html$/, path.extname(template));
            
            const post = new gutil.File({
                cwd: '.',
                base: base,
                path: path.resolve(path.join(path.dirname(template), src))
            });

            post.contents = new Buffer(templateSource);

            return post;
        };
        
        const packFiles = () => {
            files.forEach((file) => {
                this.push(file);
            });

            archive.forEach(({ template, hrefRule }, index) => {
                const templateSource = fs.readFileSync(template, 'utf8');
                _.each(archiveMap[index], (archive, slug) => {
                    const href = hrefRule(slug);
                    const f = createFile(href, templateSource);
                    f.data = _.assign({}, locals, {
                        archive
                    });
                    this.push(f);
                });
            });
        };

        const createPostFile = (slug, meta, body='') => {
            const href = hrefRule(slug, meta);
            const post = createFile(href, templateSource);
            
            meta.href = href;
            
            post.data = _.assign({}, locals);
            post.data[metaProperty] = meta;
            post.data[bodyProperty] = body;
            files.push(post);

            archive.forEach(({ slugRule }, index) => {
                const slug = slugRule(meta);
                if (!archiveMap[index]) {
                    archiveMap[index] = {};
                }
                if (!archiveMap[index][slug]) {
                    archiveMap[index][slug] = [];
                }
                archiveMap[index][slug].push(meta);
            });
        };
        
        if (postParams) {
            _.each(postParams, (meta, slug) => {
                createPostFile(slug, meta);
            });
            
            packFiles();
            callback();
            return;
        } else if (markdown) {
            gulp.src(markdown)
                .pipe(frontMatter({
                    property: frontMatterProperty,
                    remove: true
                }))
                .pipe(through.obj((file, encode, callback) => {
                    createPostFile(
                        path.basename(file.path, '.md'),
                        file[frontMatterProperty] || {},
                        marked(file.contents.toString(), markedOpts)
                    );
                    
                    callback();
                }, (cb) => {
                    packFiles();
                    cb();
                    callback();
                }));
        }
    };

    return through.obj(transform, flush);
};

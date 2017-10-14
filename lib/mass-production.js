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
    const archive = opts.archive || {};

    const locals = opts.locals;
    const metaProperty = opts.metaProperty || 'meta';
    const bodyProperty = opts.bodyProperty || 'body';
    const frontMatterProperty = opts.frontMatterProperty || 'frontMatter';
    const markedOpts = opts.markedOpts || {
        breaks: true
    };
    const hrefRule = opts.hrefRule || function (slug, meta) {
        return slug;
    };

    let base;
    const files = [];
    const archiveStuck = {};

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
        _.each(archive, ({ template }) => {
            if(!path.relative(template, file.path)) {
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
        const packFiles = () => {
            files.forEach((file) => {
                this.push(file);
            });

            _.each(archive, ({ template, hrefRule }, type) => {
                const templateSource = fs.readFileSync(template, 'utf8');
                _.each(archiveStuck[type], (posts, slug) => {
                    const href = hrefRule(slug);
                    const file = generateTemplateFile(href, templateSource);
                    file.data = _.assign({}, locals, { posts });
                    this.push(file);
                });
            });
        };

        const createPostFile = (slug, meta, body='') => {
            const href = hrefRule(slug, meta);
            const post = generateTemplateFile(href, templateSource);
            
            meta.href = href;
            
            post.data = _.assign({}, locals);
            post.data[metaProperty] = meta;
            post.data[bodyProperty] = body;
            files.push(post);

            _.each(archive, ({ slugRule }, type) => {
                const slug = slugRule(meta);
                if (!slug) {
                    return;
                }
                if (!archiveStuck[type]) {
                    archiveStuck[type] = {};
                }
                if (!archiveStuck[type][slug]) {
                    archiveStuck[type][slug] = [];
                }
                archiveStuck[type][slug].push(meta);
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

    function generateTemplateFile (href, templateSource) {
        const dest = /\.html$/.test(href) ? href : [ href, 'index.html' ].join('/');
        const src = dest.replace(/\.html$/, path.extname(template));
        
        const file = new gutil.File({
            cwd: '.',
            base: base,
            path: path.resolve(path.join(path.dirname(template), src))
        });

        file.contents = new Buffer(templateSource);

        return file;
    };

    return through.obj(transform, flush);
};

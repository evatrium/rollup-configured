/*
    Builds modern es format libraries and multiBuild apps
 */
// assets
const url = require('@rollup/plugin-url');
const {string} = require('rollup-plugin-string');
const copy = require('rollup-plugin-copy');

// js
const replace = require('@rollup/plugin-replace');
const aliasImports = require('@rollup/plugin-alias');
const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const babel = require('rollup-plugin-babel');
const {terser} = require('rollup-plugin-terser');
const json = require("@rollup/plugin-json");

// html
const indexHTML = require('rollup-plugin-index-html');

// css
const postcss = require('rollup-plugin-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

// serve
const livereload = require('rollup-plugin-livereload');
const serve = require('rollup-plugin-serve');

// misc
const rimraf = require('rimraf');
const glob = require('tiny-glob/sync');
const filesize = require('rollup-plugin-filesize');
const path = require("path");

const customBabel = require('./babel-config');

const clearDir = dir => new Promise(resolve => rimraf(dir, {}, resolve));

module.exports = async (inputOptions, getConfig) => {

    let {env: ENV, project: PROJECT, preset: PRESET, cwd = process.cwd()} = process.env;

    let fromRoot = file => path.join(cwd, file);

    const pkg = require(fromRoot('package.json')) || {};

    // ------- combine and normalize options --------

    inputOptions = inputOptions || pkg.rollupConfig || {};

    let {
        preset,
        env,
        input = 'src/index.js',
        html = 'src/index.html',
        output,
        copyFiles,
        importAsString,
        sourcemap = true,
        alias = {},
        APP_ENVS,
        babelConfig,
        devServer,
        external,
        target = 'web',
        context = 'window',
        modern = true,
        format = 'es',
        multiBuildApp,
        appPolyfills,
        browserslist = pkg.browserslist,
        cssBrowserslist = browserslist,
    } = PROJECT && inputOptions.project && inputOptions.project[PROJECT] ? {
        ...inputOptions, ...inputOptions.project[PROJECT]
    } : inputOptions;


    let DEV = PRESET === 'dev' || preset === 'dev';
    let LIB = PRESET === 'lib' || preset === 'lib';
    let BUILD_APP = PRESET === 'build_app' || preset === 'build_app';

    if (![!!BUILD_APP, !!DEV, !!LIB].includes(true)) {
        throw new Error('You must pass a preset: build_app, dev, lib')
    }

    // --------- input -------------

    let files = [];

    [].concat(input).forEach(file => {
        files = [...files, ...glob(file, {cwd})]
    });

    files = files.map(f => fromRoot(f));

    input = files.length < 2 ? files[0] : files;

    // --------- html -------------

    html = html && fromRoot(html);

    // --------- env -------------

    ENV = ENV || env;

    let app_envs = APP_ENVS && APP_ENVS[ENV];

    process.env.NODE_ENV = (BUILD_APP || LIB) ? 'production' : 'development';

    const envs = {
        'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
        ...(typeof app_envs !== 'object' ? {} :
            Object.keys(app_envs).reduce((acc, curr) =>
                (acc[`process.env.${curr}`] = `'${app_envs[curr]}'`, acc), {}))
    };


    // --------- external -------------

    let externals = [];
    if (target !== 'web') externals.concat(['dns', 'fs', 'path', 'url']);
    if (LIB && external !== 'none') {
        externals = externals
            .concat(Object.keys(pkg.peerDependencies || {}))
            .concat(Object.keys(pkg.dependencies || {}))
            .concat(external);
    }
    const externalPredicate = new RegExp(`^(${externals.join('|')})($|/)`);
    const externalTest = externals.length === 0 ? () => false : id => externalPredicate.test(id);

    // --------- output -------------

    let initial_output = output;

    output = fromRoot(output || (LIB ? 'lib' : 'build'));

    // clear out if not the root directory

    if (!([cwd, './', '/', '.'].some(path => [output, initial_output].includes(path)))) {
        await clearDir(output);
    }

    const config = ({legacy, format, modern}) => {

        return {

            input,

            context,

            external: id => {
                if (!legacy && id === 'babel-plugin-transform-async-to-promises/helpers') return false;
                if (externalTest && externals.length > 0) {
                    return externalTest(id);
                }
            },

            treeshake: {
                propertyReadSideEffects: false,
            },

            output: {
                dir: path.join(output, legacy ? '/legacy' : ''),
                ...(multiBuildApp ? {
                    dynamicImportFunction: !legacy && 'importShim'
                } : {}),
                format,
                sourcemap,
                entryFileNames: (DEV || LIB) ? '[name].js' : '[name]-[hash].js',
                chunkFileNames: (DEV || LIB) ? '[name].js' : '[name]-[hash].js',
            },

            plugins: [].concat(
                replace(envs),

                alias && aliasImports({
                    entries: Object.keys(alias).reduce((acc, curr) => {
                        acc[curr] = require.resolve(alias[curr]);
                        return acc;
                    }, {})
                }),

                postcss({
                    plugins: [
                        autoprefixer({
                            flexbox: true,
                            ...(cssBrowserslist ? {ovverideBrowserslist: cssBrowserslist} : {})
                        }),
                        cssnano({preset: 'default'}),
                    ],
                }),

                (!LIB) && html && indexHTML({
                    indexHTML: html,
                    legacy,
                    multiBuild: multiBuildApp,
                    ...(appPolyfills ? {
                        polyfills: {
                            dynamicImport: true,
                            coreJs: true,
                            regeneratorRuntime: true,
                            webcomponents: true,
                            systemJs: true,
                            fetch: true,
                            ...(typeof appPolyfills === 'object' ? appPolyfills : {})
                        }
                    } : {})
                }),

                nodeResolve({
                    mainFields: ['module', 'jsnext', 'main'],
                    browser: target !== 'node',
                    extensions: ['.mjs', '.js', '.jsx', '.json', '.node'],
                }),

                commonjs({
                    include: /\/node_modules\//,
                }),

                babel(babelConfig || customBabel({
                    legacy,
                    target,
                    modern,
                    browserslist,
                    cssBrowserslist,
                })),

                importAsString && string(importAsString),

                json(),

                url({
                    limit: 0,
                    fileName: (legacy ? '../' : '') + "[dirname][name][extname]"
                }),

                copyFiles && copy({
                    copyOnce: true,
                    targets: copyFiles.map((fileOrObj) => {
                        const isString = typeof fileOrObj === 'string';
                        return {
                            src: fromRoot(isString ? fileOrObj : fileOrObj.src),
                            dest: isString ? output : fromRoot(fileOrObj.dest)
                        }
                    })
                }),

                (BUILD_APP || LIB) && terser({
                    sourcemap: true,
                    compress: {
                        keep_infinity: true,
                        passes: 10,
                        pure_getters: true,
                    },
                    output: {
                        comments: false,
                        wrap_func_args: false
                    },
                    ecma: multiBuildApp ? (legacy ? 5 : 9) : (modern ? 9 : 5),
                    warnings: true,
                    toplevel: true,
                    safari10: true
                }),

                (DEV && !BUILD_APP) && serve({
                    historyApiFallback: true,
                    contentBase: output,
                    port: 3000,
                    ...devServer
                }),

                (DEV && !BUILD_APP) && livereload({
                    watch: output
                }),

                (BUILD_APP || LIB) && filesize(),
            ).filter(Boolean),

            onwarn(message, warn) {
                if (message.code === 'CIRCULAR_DEPENDENCY') {
                    return;
                }
                warn(message)
            },
        }
    };

    const builds = [
        multiBuildApp && config({legacy: true, format: 'system', modern: false}),
        config({legacy: false, format, modern})
    ].filter(Boolean);

    return typeof getConfig === 'function' ? getConfig(builds) : builds;
};
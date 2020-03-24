
module.exports = function (options = {}) {

    const {env, legacy, target, modern, browserslist, cssBrowserslist, pragma, pragmaFrag} = options;

    const isProd = (process.env.BABEL_ENV || process.env.NODE_ENV || env) === 'production';

    const isTest = (process.env.BABEL_ENV || process.env.NODE_ENV || env) === 'test';

    const isNode = target === 'node';

    return {

        "babelrc": false,

        "configFile": false,

        "exclude": "node_modules/**",

        "presets": [
            [
                modern ? "@babel/preset-modules" : "@babel/preset-env",
                {
                    "modules": isTest ? 'commonjs' : false,
                    "loose": true,
                    "useBuiltIns": false,
                    "targets": (isNode || isTest) ? {"node": '8'} : legacy ? ['ie 11'] : modern ? {"esmodules": true} : browserslist,
                    "exclude": legacy ? undefined : [
                        "transform-regenerator",
                        "transform-async-to-generator",
                        "@babel/plugin-transform-template-literals"
                    ]
                }
            ]
        ],

        "plugins": [
            ["babel-plugin-jcss", {"browsers": cssBrowserslist}],
            "babel-plugin-minify-tagged-templates",
            "@babel/plugin-syntax-dynamic-import",
            "@babel/plugin-syntax-import-meta",
            ["babel-plugin-bundled-import-meta", {"importStyle": 'baseUri'}],
            ["@babel/plugin-proposal-nullish-coalescing-operator", {"loose": true}],
            ["@babel/plugin-proposal-optional-chaining", {"loose": true}],
            !modern && ["babel-plugin-transform-async-to-promises", {"inlineHelpers": true, "externalHelpers": true}],
            ["@babel/plugin-transform-react-jsx", {"pragma": pragma || "h", "pragmaFrag": pragmaFrag || "Fragment"}],
            isProd && "babel-plugin-transform-react-remove-prop-types",
            ["@babel/plugin-proposal-class-properties", {"loose": true}],
            !modern && ["@babel/plugin-transform-regenerator", {async: false}],
            "babel-plugin-macros"
        ].filter(Boolean),

        "generatorOpts" : {
            minified: isProd,
            compact: isProd,
            shouldPrintComment: comment => /[@#]__PURE__/.test(comment),
        }
    }
};
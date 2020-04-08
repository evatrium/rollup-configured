const r = file => require.resolve(file);

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
            [r("babel-plugin-jcss"), {"browsers": cssBrowserslist}],
            r("babel-plugin-minify-tagged-templates"),
            r("@babel/plugin-syntax-dynamic-import"),
            r("@babel/plugin-syntax-import-meta"),
            [r("babel-plugin-bundled-import-meta"), {"importStyle": 'baseUri'}],
            [r("@babel/plugin-proposal-nullish-coalescing-operator"), {"loose": true}],
            [r("@babel/plugin-proposal-optional-chaining"), {"loose": true}],
            !modern && [r("babel-plugin-transform-async-to-promises"), {
                "inlineHelpers": true,
                "externalHelpers": true
            }],
            [r("@babel/plugin-transform-react-jsx"), {"pragma": pragma || "h", "pragmaFrag": pragmaFrag || "Fragment"}],
            isProd && r("babel-plugin-transform-react-remove-prop-types"),
            [r("@babel/plugin-proposal-class-properties"), {"loose": true}],
            !modern && [r("@babel/plugin-transform-regenerator"), {async: false}],
            r("babel-plugin-macros")
        ].filter(Boolean),

        "generatorOpts": {
            minified: isProd,
            compact: isProd,
            shouldPrintComment: comment => /[@#]__PURE__/.test(comment),
        }
    }
};
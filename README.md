# rollup-configured

> pre configured rollup config for developing and bundling libraries and apps.

### Installation

```sh
npm install rollup-configured --save-dev
```
Alternatively use [create-scaffold](https://github.com/iosio/create-scaffold) to create a directory structure for you 
and see how rollup-configured works in action.

## Usage
Create a rollup.config.js file at the root of your project and add the following snippet.

Configuration options are consumed via the package.json scripts, 
and a "rollupConfig" object located as a property in the package.json or by passing an object directly to the config 
function in the rollup.config.js.
```js
// rollup.config.js
import config from 'rollup-configured';
// babel config is pre configured. if you'd like access to it 
// its located at 'rollup-configured/babel-config.js';

export default config({
    // include options here or in the package.json 
});
```

## Rollup

If you are unfamiliar with rollup, here are a few quick references to know whats going on for now: 

**rollup** - the rollup command

**-c** - tell rollup to look for rollup.config.js in the root of the directory (adjacent to package.json).

**-w** - tells rollup to watch for changes.

**--environment** - used to set environment variables as well as pass options to our pre configuration. 
key:values are separated by commas. A key with no value indicates a truthy boolean value. 
(remember no spaces)

```json
"start": "rollup -c -w --environment MY_ENV:hello,BOOLEAN_STRING"
```  
Values are accessible via the global process.env in rollup.config.js

```js
console.log(process.env.MY_ENV) // logs string: hello
console.log(process.env.BOOLEAN_STRING) // logs string: true
``` 
## Passing options to pre configuration via script command argument flags 

There are three options to be aware of: **preset**, **project** and **env**

**preset** - pass one of three presets to tell what kind of build to run:

- **dev**  - builds code from src/ to build/ and starts a development server with live reload (requires -w flag)

- **build_app** - builds production code from src/ to build

- **lib** - build a production module from src/ to lib/ 

**project** - pass the property name of which object to select under the "project" property on the "rollupConfig" object 
that you would like to override the default configuration with.

example:
```json
"start": "rollup -c -w --environment preset:dev,project:demo"
```  
```js
"rollupConfig":{
    "project":{
        "demo":{
            //specific options to override base options with
            "input": "demo/src/index.js"
        }
    },
    "input": "src/index.js",
    // all other options still apply
},
```

**env** - pass the property name of which object to select under the "APP_ENVS" property on the "rollupConfig" object 
that you would like to apply to process.env.

By default, process.env.NODE_ENV is set to "development" when preset "dev" is used, otherwise, presets "lib" and "build_app" 
will use "production".

```json
"start": "rollup -c -w --environment preset:dev,env:development"
```  
each key value under "development" will be made accessible on process.env
```js
"rollupConfig":{
    "APP_ENVS":{
        "development":{
            "MY_API_URL" : "https://my-api-dev.com/api"
        },
        "production":{
            "MY_API_URL" : "https://my-api-dev.com/api"
        }
    }
},
```

## other rollupConfig options

**input** - app/lib entry point (default: 'src/index.js') also accepts an array or glob patters, ex:```src/**/*.js```

**html** - the html file to use for preset:dev and preset:build_app (default: 'src/index.html')

**output** - the directory to place the build in (default: 'build' or 'lib' when using preset:lib)

**copyFiles** - an array of file paths locating assets to be copied to output. ex: 'src/favicon.ico' will be placed in 'build'

**importAsString** - file glob pattern to make files importable as string. ```ex: {include: "**/*.md"}```

**sourcemap** - (default:true) set to false to disable 

**alias** - aliases imports ```ex: {"react":"preact/compat", "react-dom":"preact/compat"```

**babelConfig** - override babelConfig with custom one

**devServer** - ```default: {historyApiFallback:true, contentBase: output, port: 3000}``` see rollup-plugin-serve for more info

**preset** and **env** - may be used in place of script options. Script option will override rollupConfig option.

**external** - By default, presets "build_app" and "dev" will bundle everything. Preset "lib", however, will exclude all 
dependencies and peerDependencies listed in the package.json by default. To override the default settings, pass "none" 
to bundle everything or an array of dependencies to exclude from the bundle. If an array is passed, it will be joined with any 
peerDependencies as a list to exclude.

**target** - web or node (default:web)
 
**context** - global 'this' (default: 'window' if target is not "node") 

**modern** - (default:true) configures builds for es-module format.

**format** - (default:'es'. 'es' if modern is set to true) - js format: umd, es, iife... 
see rollup docs for more on supported formats

**multiBuild** - pass true to enable. creates an additional conditionally loaded legacy build for browsers using System es module shims.  

**pragma** - (default: 'h') - jsx pragma

**pragmaFrag** (default: 'Fragment') - jsx Fragment pragma


## other included features

- file/image/url asset bundling
- post css loader
- minifies and autoprefixes css template tag literals with keyword 'jcss'.
- minifies tag template literals using keyword 'minify'
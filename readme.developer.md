## Development structure

### Where is the source code?

The code for the website lives in an open-source fork of CORE studio's Design Explorer: https://github.com/serenayl/DesignExplorer

### npm setup

The site uses Node.js to compile together the source code. Once Node.js and its gulp plugin are globally installed, please run <kbd>npm install</kbd> from the root folder of this repository.

To begin the watch-compile process, type <kpb>gulp</kpb>.

### Javascript source

All the Javascript source files are under `js/src`. There are two folders in here that compile into two different files: `designexplorer.js` and `main.js`.

In theory, the first file is all of the purely-Javascript library that takes care of the Design Explorer logic, while the second file is the Angular application that focuses more on how the interface works and how it is presented. There may be some cross-contamination of logic, as there is not an exact clean line between the two functionalities. The first file only outputs one thing: the `DesignExplorer` constructor and all of its static members and functions. Each load of a Design Explorer set will create an instance of `DesignExplorer`.

If you are trying to figure out the cause of a certain behavior you see visually, it is usually easiest to start tracing it in the Angular portion of the code, from the HTML binding, and trace it backwards from there.

### Testing locally

You can run localhost by using <kbd>http-server .</kbd>. Create a `data` folder and add the correct folder structure in there to test how your dataset would work on your machine before uploading.

### Uploading to our S3 bucket

Create a folder called `.secrets` in the repository's root folder and create an `s3config.json` file in it. This file is not synced to Github. You can find the contents of it in the XIM private folder.

Once this is done, run <kbd>gulp upload-s3</kbd>. This will update all of the site files in S3 but not replace or upload any of the data.

## JSDoc documentation (beta)

The code uses JSDoc commenting standards wherever we remembered to write it in. In order to run the auto-documentation of the code, use <kbd>gulp document</kbd>. You must run this before viewing documentation because the documentation output is not synced to Github. To view that site, use <kbd>gulp view-documentation</kbd>. This essentially serves the documentation site on port 8000, avoiding collision with local testing with default port 8080.

Not very sure what happened to all of the template files in the `docs` folder. The version it spits out right now is quite rudimentary. Feel free to tweak with settings in gulpfile to get this right.

#!/usr/bin/env babel-node

import App from '../lib';

const folder = process.argv[2];
if (!folder) {
  console.error('no folder specified');
  process.exit(0);
}

const csvFileName = process.argv[3];
if (!csvFileName) {
  console.error('no CSV file specified');
  process.exit(0);
}

const jsFileName = process.argv[4];
if (!jsFileName) {
  console.error('no JS file specified');
  process.exit(0);
}

const app = new App(folder, csvFileName, jsFileName);
app.main();

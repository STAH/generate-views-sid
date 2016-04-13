#!/usr/bin/env babel-node

import App from '../app'

const filename = process.argv[2];
if (!filename) {
  console.error('no filename specified');
  process.exit(0);
}

const app = new App(filename);
app.generate();

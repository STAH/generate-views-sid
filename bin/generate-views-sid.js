#!/usr/bin/env babel-node

import App from '../app'

const folder = process.argv[2];
if (!folder) {
  console.error('no folder specified');
  process.exit(0);
}

const app = new App(folder);
app.generate();

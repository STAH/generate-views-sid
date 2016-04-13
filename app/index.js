
import * as fs from 'fs';
import csv from 'csv-parser';
import csvWriter from 'csv-write-stream';
import recursiveReadSync from 'recursive-readdir-sync';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';
import * as uuid from 'node-uuid';

import baseViews from './baseViews';

export default class App {
  constructor(folder, csvFileName, jsFileName) {
    this.folder = folder;
    this.csvFileName = csvFileName;
    this.jsFileName = jsFileName;

    this.viewSids = new Map();
  }

  main() {
    this.parseCsv();
    this.parseFolder();
    this.generateCsv();
    this.generateJs();
  }

  parseCsv() {
    console.log(`Parsing CSV "${this.csvFileName}"`);
    fs.createReadStream(this.csvFileName)
      .pipe(csv(['id', 'className', 'title', 'sid']))
      .on('data', (data) => {
        this.viewSids.set(data.className, { id: data.id, className: data.className, title: data.title, sid: data.sid });
      });
  }

  parseFolder() {
    let files = [];
    try {
      files = recursiveReadSync(this.folder);
    } catch (err) {
      if (err.errno === 34) {
        console.log('Path does not exist');
      } else {
        throw err;
      }
    }

    for (let i = 0, len = files.length; i < len; i++) {
      this.parseFile(files[i]);
    }
  }

  isMatchedCallee(callee, match) {
    if (t.isMemberExpression(callee)
        && t.isCallExpression(callee.object)) {
      return this.isMatchedCallee(callee.object.callee, match);
    }
    const calleeString = this.file.substring(callee.start, callee.end);
    return calleeString === match;
  }

  isExtendsBaseView(calee) {
    const length = baseViews.length;
    for (let i = 0; i < length; i++) {
      if (this.isMatchedCallee(calee, baseViews[i])) {
        return true;
      }
    }

    return false;
  }

  parseFile(filename) {
    console.log(`Parsing "${filename}"`);

    this.file = fs.readFileSync(filename, 'utf8');
    const ast = babylon.parse(this.file);

    traverse(ast, {
      AssignmentExpression: (nodePath) => {
        const node = nodePath.node;
        const parentNode = nodePath.parentPath.node;
        if (t.isCallExpression(node.right)
            && this.isExtendsBaseView(node.right.callee)) {
          const name = this.file.substring(node.left.start, node.left.end);
          const parts = name.split('.');
          const shortName = parts[parts.length - 1];

          const commentsLength = parentNode.leadingComments.length;
          let title = shortName;
          if (commentsLength > 0) {
            for (let i = 0; i < commentsLength; i++) {
              const comment = parentNode.leadingComments[i];
              if (comment.type === 'CommentLine'
                  && comment.value.startsWith('@@')) {
                title = comment.value.slice(2).trim();
              }
            }
          }

          console.log(`Found: ${shortName}`);

          if (this.viewSids.has(shortName)) {
            console.log('Already exists. Update title...');
            const existingView = this.viewSids.get(shortName);
            // Update title
            this.viewSids.set(shortName, { id: '', className: shortName, title: title, sid: existingView.sid });
          } else {
            console.log('Adding new...');
            this.viewSids.set(shortName, { id: '', className: shortName, title: title, sid: uuid.v4() });
          }
        }
      }
    });
  }

  generateCsv() {
    console.log(`Generating CSV "${this.csvFileName}"`);
    const writer = csvWriter({ sendHeaders: false });
    writer.pipe(fs.createWriteStream(this.csvFileName));
    for (const value of this.viewSids.values()) {
      writer.write(value);
    }
    writer.end();
  }

  generateJs() {
    console.log(`Generating JS "${this.jsFileName}"`);
  }
}

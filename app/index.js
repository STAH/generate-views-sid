
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import recursiveReadSync from 'recursive-readdir-sync';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';
import * as uuid from 'node-uuid';
import * as changeCase from 'change-case';

import baseViews from './baseViews';

export default class App {
  constructor(folder, csvFileName, jsFileName) {
    this.folder = folder;
    this.csvFileName = csvFileName;
    this.jsFileName = jsFileName;

    this.originalViewSids = new Map();
    this.viewSids = new Map();
  }

  async main() {
    await this.parseCsv();
    this.parseFolder();
    await this.generateCsv();
    this.generateJs();
  }

  parseCsv() {
    const fullPath = path.resolve(this.csvFileName);
    console.log(`Parsing CSV "${fullPath}"`);
    const stream = fs.createReadStream(fullPath);
    const csvStream = csv.fromStream(stream, {
      headers: ['id', 'className', 'title', 'sid', 'category', 'orderCategory', 'orderInterCategory']
    });
    return new Promise((resolve) => {
      csvStream.on('data', (data) => {
        this.originalViewSids.set(data.className, { 
          id: data.id,
          className: data.className,
          title: data.title,
          sid: data.sid,
          category: data.category,
          orderCategory: data.orderCategory,
          orderInterCategory: data.orderInterCategory,
        });
      });
      csvStream.on('end', () => {
        return resolve();
      });
    });
  }

  parseFolder() {
    let files = [];
    const fullPath = path.resolve(this.folder);
    try {
      files = recursiveReadSync(fullPath);
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
          let title = undefined;
          let category = '';
          let orderCategory = undefined;
          let orderInterCategory = undefined;
          if (commentsLength > 0) {
            for (let i = 0; i < commentsLength; i++) {
              const comment = parentNode.leadingComments[i];
              if (comment.type === 'CommentLine') {
                if (comment.value.startsWith(' @@sid ')) {
                  title = comment.value.slice(' @@sid '.length).trim();
                }
                if (comment.value.startsWith(' @@category ')) {
                  category = comment.value.slice(' @@category '.length).trim();
                }
                if (comment.value.startsWith(' @@orderCategory ')) {
                  orderCategory = comment.value.slice(' @@orderCategory '.length).trim();
                }
                if (comment.value.startsWith(' @@orderInterCategory ')) {
                  orderInterCategory = comment.value.slice(' @@orderInterCategory '.length).trim();
                }
              }
            }
          }

          if (!title) {
            return;
          }

          console.log(`Found: ${shortName}`);

          if (this.originalViewSids.has(shortName)) {
            console.log('Already exists. Update title...');
            const existingView = this.originalViewSids.get(shortName);
            // Update title
            this.viewSids.set(shortName, { id: '', className: shortName, title: title, sid: existingView.sid, category: category, orderCategory: orderCategory, orderInterCategory: orderInterCategory});
          } else {
            console.log('Adding new...');
            this.viewSids.set(shortName, { id: '', className: shortName, title: title, sid: uuid.v4(), category: category, orderCategory: orderCategory, orderInterCategory: orderInterCategory });
          }
        }
      }
    });
  }

  generateCsv() {
    const fullPath = path.resolve(this.csvFileName);
    console.log(`Generating CSV "${fullPath}"`);
    const csvStream = csv.createWriteStream({ headers: false });
    csvStream.pipe(fs.createWriteStream(fullPath));
    for (const value of this.viewSids.values()) {
      csvStream.write(value);
    }
    csvStream.end();

    return new Promise((resolve) => {
      csvStream.on('finish', () => {
        return resolve();
      });
    });
  }

  generateJs() {
    const fullPath = path.resolve(this.jsFileName);
    console.log(`Generating JS "${fullPath}"`);
	  let code = "//\n// This file was generated. Don't edit it!\n//\n\/";
	  code += "\* global App \*\/\n\n";
	  for (const view of this.viewSids.values()) {
		  code += `app.viewSids.${changeCase.constantCase(view.className)}_ID = '${view.sid}';\n`;
		  code += `app.viewSids.${changeCase.constantCase(view.className)}_TITLE = '${view.title}';\n\n`;
	  }
	  code.t
    fs.writeFileSync(fullPath, code);
  }
}

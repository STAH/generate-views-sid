
import * as fs from 'fs';
import recursiveReadSync from 'recursive-readdir-sync';

export default class App {
  constructor(folder, csvFileName, jsFileName) {
    this.folder = folder;
    this.csvFileName = csvFileName;
    this.jsFileName = jsFileName;
  }

  main() {
    this.parseCsv();
    this.parseFolder();
    this.generateCsv();
    this.generateJs();
  }

  parseCsv() {
    console.log(`Parsing CSV "${this.csvFileName}"`);
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

  parseFile(filename) {
    const file = fs.readFileSync(filename, 'utf8');
    console.log(`Parsing "${filename}"`);
  }

  generateCsv() {
    console.log(`Generating CSV "${this.csvFileName}"`);
  }

  generateJs() {
    console.log(`Generating JS "${this.jsFileName}"`);
  }
}

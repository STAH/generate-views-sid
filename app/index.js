
import * as fs from 'fs';
import csv from 'csv-parser';
import csvWriter from 'csv-write-stream';
import recursiveReadSync from 'recursive-readdir-sync';

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
      .pipe(csv(['id', 'filename', 'title', 'sid']))
      .on('data', (data) => {
        this.viewSids.set(data.filename, { id: data.id, filename: data.filename, title: data.title, sid: data.sid });
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

  parseFile(filename) {
    const file = fs.readFileSync(filename, 'utf8');
    console.log(`Parsing "${filename}"`);
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

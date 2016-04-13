
import * as fs from 'fs';
import recursiveReadSync from 'recursive-readdir-sync';

export default class App {
  constructor(folder) {
    this.folder = folder;
  }

  generate() {
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
      const file = fs.readFileSync(files[i], 'utf8');
      console.log('Found: %s', files[i]);
    }

    console.log('OK');
  }
}

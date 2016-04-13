
import * as fs from 'fs';

export default class App {
  constructor(filename) {
    this.filename = filename;
  }

  generate() {
    const file = fs.readFileSync(this.filename, 'utf8');

    console.log('OK');
  }
}

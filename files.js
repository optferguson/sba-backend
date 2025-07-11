const fs = require('fs');

const content = 'This file was created by Node.js!';

// Write content to a new file named 'example.txt'
fs.writeFile('example.txt', content, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('File written successfully!');

  // Now, read the content of the new file
  fs.readFile('example.txt', 'utf8', (readErr, data) => {
    if (readErr) {
      console.error(readErr);
      return;
    }
    console.log('File content:', data);
  });
});
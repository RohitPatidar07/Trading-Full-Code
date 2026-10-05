const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve('Reports/test.html');
const pdfPath = path.resolve('Reports/test.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

fs.writeFileSync(htmlPath, '<html><body style="font-family:sans-serif;padding:40px;"><h1>Hello from Chrome PDF</h1><p>Test generation</p></body></html>');

const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
console.log('Running cmd:', cmd);
execSync(cmd);

console.log('PDF Exists:', fs.existsSync(pdfPath), 'Size:', fs.statSync(pdfPath).size);

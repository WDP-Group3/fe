const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Worker code - ESM .mjs
const workerCode = `
import { parentPort } from 'worker_threads';
(async () => {
  try {
    await import('file:///C:/Users/quanvh/OneDrive/Desktop/wdp2/be/src/controllers/salary.controller.js');
    parentPort.postMessage({ ok: true });
  } catch(e) {
    parentPort.postMessage({ error: e.message, code: e.code, stack: e.stack });
  }
})();
`;
// Use .mjs so worker treats it as ESM
const tmp = path.join(os.tmpdir(), 'salary_worker_' + process.pid + '.mjs');
fs.writeFileSync(tmp, workerCode);
console.log('Worker file:', tmp);
const w = new Worker(tmp);
w.on('message', m => {
  if(m.ok) { console.log('Controller loaded OK!'); }
  else {
    console.log('Error:', m.error);
    console.log('Error code:', m.code);
    if(m.stack) {
      const lines = m.stack.split('\n');
      lines.forEach(l => console.log(l));
    }
  }
  process.exit(0);
});
w.on('error', e => { console.log('Worker error:', e.message); process.exit(1); });
setTimeout(() => { console.log('Timeout'); w.terminate(); process.exit(1); }, 10000);

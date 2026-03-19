const fs = require('fs');
const code = fs.readFileSync('C:/Users/quanvh/OneDrive/Desktop/wdp2/be/src/controllers/salary.controller.js', 'utf8');
const lines = code.split('\n');
console.log('File has', lines.length, 'lines');

// Binary search for the first failing line
let lo = 1, hi = lines.length;
while(lo < hi) {
  const mid = Math.floor((lo+hi)/2);
  const testCode = lines.slice(0, mid).join('\n') + '\n// __END_TEST__';
  try {
    require('vm').compileFunction(testCode, [], { parsingContext: require('vm').createContext({}) });
    console.log('Lines 1-'+mid+' OK');
    lo = mid + 1;
  } catch(e) {
    console.log('Lines 1-'+mid+' FAIL: '+e.message.slice(0,60));
    hi = mid;
  }
}
console.log('First failing line is around:', lo);

import fs from 'fs';
import path from 'path';

function getDirectorySize(dirPath) {
  let totalSize = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    // Ignore node_modules, .next, and other non-tracked artifacts
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
        continue;
      }
      totalSize += getDirectorySize(fullPath);
    } else {
      totalSize += fs.statSync(fullPath).size;
    }
  }

  return totalSize;
}

const rootDir = process.cwd();
const sizeInBytes = getDirectorySize(rootDir);
const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

console.log(`Source repository size (excluding .git, node_modules, .next): ${sizeInMB} MB (${sizeInBytes} bytes)`);

if (sizeInBytes > 10 * 1024 * 1024) {
  console.error(`❌ ERROR: Repository size exceeds 10 MB limit! Current: ${sizeInMB} MB`);
  process.exit(1);
} else {
  console.log(`✅ SUCCESS: Repository size is safely below 10 MB limit (${sizeInMB} MB / 10 MB)`);
}

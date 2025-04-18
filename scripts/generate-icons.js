const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'favicon.ico': 48,
  'favicon-vercel.ico': 48,
  'apple-touch-icon.png': 180,
  'images/cases-og.png': 1200
};

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/icon.svg'));
  
  for (const [filename, size] of Object.entries(sizes)) {
    const outputPath = path.join(__dirname, '../public', filename);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (filename.endsWith('.ico')) {
      await sharp(svgBuffer)
        .resize(size, size)
        .toFile(outputPath);
    } else {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    }
    
    console.log(`Generated ${filename}`);
  }
}

generateIcons().catch(console.error); 
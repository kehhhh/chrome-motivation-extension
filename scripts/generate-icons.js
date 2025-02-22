const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const SIZES = [16, 48, 128];
const SVG_PATH = path.join(__dirname, '..', 'assets', 'icon.svg');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

async function generateIcons() {
    try {
        // Read the SVG file
        const svgBuffer = await fs.readFile(SVG_PATH);
        
        // Generate each size
        await Promise.all(SIZES.map(async (size) => {
            const outputPath = path.join(ASSETS_DIR, `icon${size}.png`);
            
            await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toFile(outputPath);
                
            console.log(`Generated ${size}x${size} icon: ${outputPath}`);
        }));
        
        console.log('All icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons(); 
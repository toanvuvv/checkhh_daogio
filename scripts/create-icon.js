const fs = require('fs');
const path = require('path');

// Tạo icon đơn giản bằng SVG
const createSimpleIcon = () => {
    const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="32" fill="url(#grad1)"/>
  <text x="128" y="140" font-family="Arial, sans-serif" font-size="120" font-weight="bold" text-anchor="middle" fill="white">L</text>
</svg>`;

    return svgIcon;
};

// Tạo các file icon cần thiết
const createIcons = () => {
    const assetsDir = path.join(__dirname, '..', 'assets');
    
    // Đảm bảo thư mục assets tồn tại
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Tạo SVG icon
    const svgPath = path.join(assetsDir, 'icon.svg');
    fs.writeFileSync(svgPath, createSimpleIcon());
    console.log('✓ Created icon.svg');
    
    // Tạo file placeholder cho các icon khác
    const iconFiles = [
        'icon.ico',
        'icon.icns', 
        'icon.png'
    ];
    
    iconFiles.forEach(file => {
        const filePath = path.join(assetsDir, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '');
            console.log(`✓ Created placeholder: ${file}`);
        }
    });
    
    console.log('📁 Icon files created in assets/ directory');
    console.log('💡 You can replace these with your own icons later');
};

if (require.main === module) {
    createIcons();
}

module.exports = { createIcons, createSimpleIcon };

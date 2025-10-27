const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building React app...');

try {
    // Build React app with Vite
    execSync('npm run build:react', { stdio: 'inherit' });
    
    console.log('✅ React app built successfully!');
    console.log('📁 Build output: dist/renderer/');
    
    // Check if build output exists
    const buildPath = path.join(__dirname, '../dist/renderer');
    if (fs.existsSync(buildPath)) {
        console.log('✅ Build files found in dist/renderer/');
    } else {
        console.error('❌ Build files not found in dist/renderer/');
        process.exit(1);
    }
    
} catch (error) {
    console.error('❌ Error building React app:', error.message);
    process.exit(1);
}

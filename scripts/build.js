const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BuildManager {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.distDir = path.join(this.rootDir, 'dist');
    }

    async build() {
        console.log('🚀 Starting build process...');
        
        try {
            // 1. Clean previous builds
            this.cleanBuild();
            
            // 2. Install dependencies
            this.installDependencies();
            
            // 3. Build the application
            this.buildApplication();
            
            // 4. Verify build
            this.verifyBuild();
            
            console.log('✅ Build completed successfully!');
            console.log(`📦 Output directory: ${this.distDir}`);
            
        } catch (error) {
                console.error('❌ Build failed:', error.message);
                process.exit(1);
            }
        }

    cleanBuild() {
        console.log('🧹 Cleaning previous builds...');
        
        if (fs.existsSync(this.distDir)) {
            fs.rmSync(this.distDir, { recursive: true, force: true });
            console.log('  ✓ Cleaned dist directory');
        }
        
        // Clean node_modules cache if needed
        const nodeModulesPath = path.join(this.rootDir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
            console.log('  ✓ Node modules ready');
        }
    }

    installDependencies() {
        console.log('📦 Installing dependencies...');
        
        try {
            execSync('npm install', { 
                cwd: this.rootDir, 
                stdio: 'inherit',
                encoding: 'utf8'
            });
            console.log('  ✓ Dependencies installed');
        } catch (error) {
            console.error('  ❌ Failed to install dependencies:', error.message);
            throw error;
        }
    }

    buildApplication() {
        console.log('🔨 Building application...');
        
        try {
            // Set production environment
            process.env.NODE_ENV = 'production';
            
            execSync('npx electron-builder --publish=never', {
                cwd: this.rootDir,
                stdio: 'inherit',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'production' }
            });
            
            console.log('  ✓ Application built successfully');
        } catch (error) {
            console.error('  ❌ Build failed:', error.message);
            throw error;
        }
    }

    verifyBuild() {
        console.log('🔍 Verifying build...');
        
        if (!fs.existsSync(this.distDir)) {
            throw new Error('Build directory not found');
        }
        
        const files = fs.readdirSync(this.distDir);
        const exeFile = files.find(file => file.endsWith('.exe'));
        
        if (!exeFile) {
            throw new Error('Executable file not found');
        }
        
        const exePath = path.join(this.distDir, exeFile);
        const stats = fs.statSync(exePath);
        
        console.log(`  ✓ Found executable: ${exeFile}`);
        console.log(`  ✓ File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  ✓ Build verification passed`);
    }

    async run() {
        await this.build();
    }
}

// Chạy build
if (require.main === module) {
    const buildManager = new BuildManager();
    buildManager.run().catch(console.error);
}

module.exports = BuildManager;

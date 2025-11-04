const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');

async function build() {
    const distDir = 'dist';
    // Clean up and create dist directory
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir);

    // Build the main JS bundle from index.tsx
    await esbuild.build({
        entryPoints: ['index.tsx'],
        bundle: true,
        minify: true,
        platform: 'browser',
        outfile: path.join(distDir, 'bundle.js'),
        jsx: 'automatic',
    });

    // Read source index.html, modify it for production, and write to dist
    let htmlContent = await fs.readFile('index.html', 'utf-8');
    // Remove importmap script as dependencies are now bundled
    htmlContent = htmlContent.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
    // Change the main script source to our new bundle
    htmlContent = htmlContent.replace(/<script type="module" src="\/index.tsx"><\/script>/, '<script type="module" src="/bundle.js"></script>');
    await fs.writeFile(path.join(distDir, 'index.html'), htmlContent);

    // Copy metadata.json to dist
    await fs.copyFile('metadata.json', path.join(distDir, 'metadata.json'));
    
    console.log('Build successful! Output is in ./dist');
}

build().catch((e) => {
    console.error('Build failed:', e);
    process.exit(1);
});

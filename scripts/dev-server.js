#!/usr/bin/env node

/**
 * Simple Development Server for South University Landing Page
 * Serves static files and demonstrates form functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// MIME types
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
};

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(req, res, filepath) {
    fs.readFile(filepath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }

        const mimeType = getMimeType(filepath);
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Health check endpoint
    if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
    }

    // Mock form submission endpoint
    if (req.url === '/api/submit-lead' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('[DEMO] Form submitted:', {
                    name: `${data.lead?.firstname} ${data.lead?.lastname}`,
                    email: data.lead?.email,
                    phone: data.lead?.phone1,
                    program: data.lead_education?.program_id,
                    state: data.lead_address?.state,
                    timestamp: new Date().toISOString()
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    leadId: 'TEST-' + Date.now(),
                    message: 'Thank you for your application (DEMO MODE)'
                }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
        });
        return;
    }

    // Serve static files
    let url = req.url === '/' ? '/index.html' : req.url;

    // Remove query string
    url = url.split('?')[0];

    // Prevent directory traversal
    url = path.normalize(url).replace(/^(\.\.[\/\\])+/, '');

    let filepath = path.join(PUBLIC_DIR, url);

    // Check if it's a directory and serve index.html
    fs.stat(filepath, (err, stats) => {
        if (err || !stats) {
            // Try appending index.html
            filepath = path.join(filepath, 'index.html');
        } else if (stats.isDirectory()) {
            filepath = path.join(filepath, 'index.html');
        }

        // Final security check
        if (!filepath.startsWith(PUBLIC_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        serveFile(req, res, filepath);
    });
});

server.listen(PORT, HOST, () => {
    console.log('\n' + '═'.repeat(50));
    console.log('  South University Landing Page - Dev Server');
    console.log('═'.repeat(50));
    console.log(`\n✓ Server running at: http://${HOST}:${PORT}/`);
    console.log('\n📋 Available endpoints:');
    console.log(`   http://${HOST}:${PORT}/                 - Main form`);
    console.log(`   http://${HOST}:${PORT}/api/health      - Health check`);
    console.log(`   http://${HOST}:${PORT}/api/submit-lead - Form submission (demo)`);
    console.log('\n🔍 Testing the form:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Verify both logos display correctly');
    console.log('   3. Test form validation and navigation');
    console.log('   4. Check browser console for logs');
    console.log('   5. Open DevTools Network tab to see requests');
    console.log('\n📱 Responsive testing:');
    console.log('   Press Ctrl+Shift+M (Cmd+Shift+M on Mac) to toggle device toolbar');
    console.log('   Test sizes: iPhone 12, iPad, Desktop');
    console.log('   Verify logos display correctly at each size');
    console.log('\n🛑 To stop: Press Ctrl+C');
    console.log('═'.repeat(50) + '\n');
});

process.on('SIGINT', () => {
    console.log('\n\n🛑 Dev server shutting down...');
    process.exit(0);
});

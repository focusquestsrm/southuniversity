#!/usr/bin/env node

/**
 * Build Script for South University Landing Page
 * Prepares assets and validates configuration for deployment
 */

const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';

console.log(`${BLUE}═══════════════════════════════════════════${RESET}`);
console.log(`${BLUE}  South University Landing Page - Build${RESET}`);
console.log(`${BLUE}═══════════════════════════════════════════${RESET}\n`);

let hasErrors = false;

// Task 1: Check Node version
console.log(`${BLUE}→ Checking Node version...${RESET}`);
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
if (majorVersion < 18) {
    console.log(`${RED}✗ Node 18+ required, found ${nodeVersion}${RESET}`);
    hasErrors = true;
} else {
    console.log(`${GREEN}✓ Node ${nodeVersion}${RESET}\n`);
}

// Task 2: Verify required files
console.log(`${BLUE}→ Verifying project structure...${RESET}`);
const requiredFiles = [
    'public/index.html',
    'public/styles/main.css',
    'public/js/app.js',
    'public/js/config.js',
    'public/js/logger.js',
    'public/js/validation.js',
    'public/js/tracking.js',
    'public/js/form.js',
    'public/images/south-university-logo.png',
    'public/images/launch-your-degree-logo.png',
    'package.json',
    'netlify.toml',
    '.env.example'
];

let filesMissing = 0;
requiredFiles.forEach(file => {
    const filepath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filepath)) {
        console.log(`${RED}✗ Missing: ${file}${RESET}`);
        filesMissing++;
    }
});

if (filesMissing > 0) {
    console.log(`${RED}✗ ${filesMissing} files missing${RESET}\n`);
    hasErrors = true;
} else {
    console.log(`${GREEN}✓ All required files present${RESET}\n`);
}

// Task 3: Verify logos exist
console.log(`${BLUE}→ Verifying logo files...${RESET}`);
const logoFiles = [
    {
        path: 'public/images/south-university-logo.png',
        name: 'South University Logo'
    },
    {
        path: 'public/images/launch-your-degree-logo.png',
        name: 'LaunchYourDegree Logo'
    }
];

logoFiles.forEach(logo => {
    const filepath = path.join(__dirname, '..', logo.path);
    if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        console.log(`${GREEN}✓ ${logo.name}${RESET} (${Math.round(stats.size / 1024)}KB)`);
    } else {
        console.log(`${RED}✗ Missing: ${logo.name}${RESET}`);
        hasErrors = true;
    }
});
console.log();

// Task 4: Check for hardcoded credentials
console.log(`${BLUE}→ Scanning for hardcoded credentials...${RESET}`);
const credentialPatterns = [
    { pattern: /apiKey\s*[:=]\s*['"]((?!PLACEHOLDER)[^'"]+)['"]/gi, name: 'API Key' },
    { pattern: /secret\s*[:=]\s*['"]((?!PLACEHOLDER)[^'"]+)['"]/gi, name: 'Secret' },
    { pattern: /password\s*[:=]\s*['"]((?!PLACEHOLDER)[^'"]+)['"]/gi, name: 'Password' },
    { pattern: /token\s*[:=]\s*['"]((?!PLACEHOLDER)[^'"]+)['"]/gi, name: 'Token' }
];

let credentialsFound = 0;
const filesToScan = [
    'public/js/config.js',
    'public/js/form.js',
    'public/js/app.js',
    'public/js/tracking.js'
];

filesToScan.forEach(file => {
    const filepath = path.join(__dirname, '..', file);
    if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        credentialPatterns.forEach(pattern => {
            const matches = content.match(pattern.pattern);
            if (matches) {
                console.log(`${YELLOW}⚠ Possible ${pattern.name} in ${file}${RESET}`);
                credentialsFound++;
            }
        });
    }
});

if (credentialsFound > 0) {
    console.log(`${YELLOW}⚠ Review credentials before deployment${RESET}\n`);
} else {
    console.log(`${GREEN}✓ No hardcoded credentials found${RESET}\n`);
}

// Task 5: Check HTML validity
console.log(`${BLUE}→ Verifying HTML structure...${RESET}`);
const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    let htmlValid = true;
    const checks = [
        { pattern: /<title>/, name: 'Title tag' },
        { pattern: /<meta name="viewport"/, name: 'Viewport meta' },
        { pattern: /<div id="app"><\/div>/, name: 'App container' },
        { pattern: /id="google-places-script"/, name: 'Google Places script' },
        { pattern: /src="\/js\/app\.js(?:\?[^\"]*)?"/, name: 'App.js script' },
        { pattern: /src="\/js\/config\.js(?:\?[^\"]*)?"/, name: 'Config.js script' }
    ];

    checks.forEach(check => {
        if (check.pattern.test(html)) {
            console.log(`${GREEN}✓ ${check.name}${RESET}`);
        } else {
            console.log(`${RED}✗ Missing: ${check.name}${RESET}`);
            htmlValid = false;
        }
    });
    
    if (!htmlValid) hasErrors = true;
} else {
    console.log(`${RED}✗ index.html not found${RESET}`);
    hasErrors = true;
}
console.log();

// Task 6: Verify CSS
console.log(`${BLUE}→ Verifying CSS...${RESET}`);
const cssPath = path.join(__dirname, '..', 'public', 'styles', 'main.css');
if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const cssSize = Math.round(css.length / 1024);
    
    const cssChecks = [
        { pattern: /--primary-blue/, name: 'Color variables' },
        { pattern: /.form-wrapper/, name: 'Form wrapper' },
        { pattern: /@media/, name: 'Responsive media queries' },
        { pattern: /.progress-indicator/, name: 'Progress indicator' }
    ];

    let cssValid = true;
    cssChecks.forEach(check => {
        if (check.pattern.test(css)) {
            console.log(`${GREEN}✓ ${check.name}${RESET}`);
        } else {
            console.log(`${RED}✗ Missing: ${check.name}${RESET}`);
            cssValid = false;
        }
    });
    
    console.log(`${GREEN}✓ CSS size: ${cssSize}KB${RESET}`);
    
    if (!cssValid) hasErrors = true;
} else {
    console.log(`${RED}✗ main.css not found${RESET}`);
    hasErrors = true;
}
console.log();

// Task 7: Verify JavaScript modules
console.log(`${BLUE}→ Verifying JavaScript modules...${RESET}`);
const jsModules = [
    { file: 'public/js/config.js', name: 'Config', requires: ['window.config', 'programs', 'campaign'] },
    { file: 'public/js/logger.js', name: 'Logger', requires: ['window.logger', 'debug', 'error'] },
    { file: 'public/js/validation.js', name: 'Validation', requires: ['window.Validation', 'validateStep1'] },
    { file: 'public/js/tracking.js', name: 'Tracking', requires: ['window.Tracking', 'buildLeadObject'] },
    { file: 'public/js/form.js', name: 'Form', requires: ['window.Form', 'initialize'] }
];

jsModules.forEach(module => {
    const filepath = path.join(__dirname, '..', module.file);
    if (fs.existsSync(filepath)) {
        const js = fs.readFileSync(filepath, 'utf8');
        let found = true;
        
        module.requires.forEach(req => {
            if (!js.includes(req)) {
                console.log(`${YELLOW}⚠ ${module.name}: Missing '${req}'${RESET}`);
                found = false;
            }
        });
        
        if (found) {
            console.log(`${GREEN}✓ ${module.name} module${RESET}`);
        }
    } else {
        console.log(`${RED}✗ ${module.name} (${module.file}) not found${RESET}`);
        hasErrors = true;
    }
});
console.log();

// Task 8: Verify configuration files
console.log(`${BLUE}→ Verifying configuration files...${RESET}`);
const configFiles = [
    { file: 'package.json', name: 'Package config' },
    { file: 'netlify.toml', name: 'Netlify config' },
    { file: '.env.example', name: 'Environment template' }
];

configFiles.forEach(config => {
    const filepath = path.join(__dirname, '..', config.file);
    if (fs.existsSync(filepath)) {
        console.log(`${GREEN}✓ ${config.name}${RESET}`);
    } else {
        console.log(`${RED}✗ Missing: ${config.name}${RESET}`);
        hasErrors = true;
    }
});
console.log();

// Task 9: Check documentation
console.log(`${BLUE}→ Checking documentation...${RESET}`);
const docs = [
    { file: 'README.md', name: 'README' },
    { file: 'MISSING_INFORMATION.md', name: 'Missing items' },
    { file: 'NETLIFY_BUILD_SETTINGS.md', name: 'Netlify setup' }
];

docs.forEach(doc => {
    const filepath = path.join(__dirname, '..', doc.file);
    if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        console.log(`${GREEN}✓ ${doc.name} (${Math.round(content.length / 1024)}KB)${RESET}`);
    } else {
        console.log(`${YELLOW}⚠ Missing: ${doc.name}${RESET}`);
    }
});
console.log();

// Summary
console.log(`${BLUE}═══════════════════════════════════════════${RESET}`);
if (hasErrors) {
    console.log(`${RED}Build validation FAILED${RESET}`);
    console.log(`${RED}Please fix errors before deploying${RESET}\n`);
    process.exit(1);
} else {
    console.log(`${GREEN}✓ Build validation PASSED${RESET}`);
    console.log(`${GREEN}Ready for deployment${RESET}\n`);
    console.log(`${YELLOW}⚠ Remember to:${RESET}`);
    console.log(`  1. Verify both logos display correctly`);
    console.log(`  2. Test form on desktop and mobile`);
    console.log(`  3. Configure environment variables in Netlify`);
    console.log(`  4. Review MISSING_INFORMATION.md`);
    console.log(`  5. Follow NETLIFY_BUILD_SETTINGS.md for deployment\n`);
    process.exit(0);
}

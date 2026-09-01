#!/usr/bin/env node

/**
 * Security Check Script for South University Landing Page
 * Scans for common security issues before deployment
 */

const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';

let issuesFound = 0;
let warningsFound = 0;

console.log(`${BLUE}═══════════════════════════════════════════${RESET}`);
console.log(`${BLUE}  Security Check - South University Form${RESET}`);
console.log(`${BLUE}═══════════════════════════════════════════${RESET}\n`);

/**
 * Check a file for security issues
 */
function checkFile(filepath, checks) {
    if (!fs.existsSync(filepath)) {
        return;
    }

    const content = fs.readFileSync(filepath, 'utf8');
    const relPath = path.relative(process.cwd(), filepath);

    checks.forEach(check => {
        const matches = content.match(check.pattern);
        if (matches) {
            if (check.severity === 'error') {
                console.log(`${RED}✗ ${relPath}${RESET}`);
                console.log(`  ${RED}${check.message}${RESET}`);
                console.log(`  ${RED}  Line(s): ${matches.length} found${RESET}`);
                issuesFound++;
            } else if (check.severity === 'warning') {
                console.log(`${YELLOW}⚠ ${relPath}${RESET}`);
                console.log(`  ${YELLOW}${check.message}${RESET}`);
                warningsFound++;
            }
        }
    });
}

// 1. Check for hardcoded credentials
console.log(`${BLUE}1. Checking for hardcoded credentials...${RESET}`);

const credentialChecks = [
    {
        pattern: /\b(?:api[_-]?key|apikey|secret|password|token|auth)\s*[:=]\s*['"`](?!PLACEHOLDER|SERVER_|process\.env|{)[^'"`]+['"`]/gi,
        message: 'Possible hardcoded credential found',
        severity: 'error'
    },
    {
        pattern: /api[_-]?key\s*[:=]\s*(?!PLACEHOLDER|SERVER_|process\.env|{)[a-zA-Z0-9]{20,}/gi,
        message: 'Possible API key pattern',
        severity: 'error'
    }
];

checkFile(path.join(__dirname, '..', 'public', 'js', 'config.js'), credentialChecks);
checkFile(path.join(__dirname, '..', 'public', 'js', 'tracking.js'), credentialChecks);
checkFile(path.join(__dirname, '..', 'public', 'js', 'form.js'), credentialChecks);
checkFile(path.join(__dirname, '..', 'public', 'js', 'app.js'), credentialChecks);

// 2. Check for unencoded PII in logs
console.log(`${BLUE}2. Checking for PII in logs...${RESET}`);

const piiChecks = [
    {
        pattern: /console\.(log|error|warn|info)\([^)]*\b(?:email|phone|password|credit|ssn|address|zip)\b[^)]*\)/gi,
        message: 'Possible PII exposed in console log',
        severity: 'error'
    },
    {
        pattern: /logger\.\w+\([^)]*\b(?:email|phone|password)\b[^)]*\)/gi,
        message: 'Verify PII is redacted before logging',
        severity: 'warning'
    }
];

checkFile(path.join(__dirname, '..', 'public', 'js', 'form.js'), piiChecks);
checkFile(path.join(__dirname, '..', 'public', 'js', 'tracking.js'), piiChecks);

// 3. Check for common security issues
console.log(`${BLUE}3. Checking for common vulnerabilities...${RESET}`);

const vulnChecks = [
    {
        pattern: /eval\s*\(/gi,
        message: 'eval() usage - security risk',
        severity: 'error'
    },
    {
        pattern: /innerHTML\s*=/gi,
        message: 'innerHTML assignment - check for XSS vulnerability',
        severity: 'warning'
    },
    {
        pattern: /document\.write\s*\(/gi,
        message: 'document.write() - deprecated and unsafe',
        severity: 'warning'
    },
    {
        pattern: /\.replace\([^,]*html\b/gi,
        message: 'Possible HTML sanitization issue',
        severity: 'warning'
    }
];

['app.js', 'form.js', 'tracking.js', 'validation.js'].forEach(file => {
    checkFile(path.join(__dirname, '..', 'public', 'js', file), vulnChecks);
});

// 4. Check .env.example for credentials
console.log(`${BLUE}4. Checking environment template...${RESET}`);

const envChecks = [
    {
        pattern: /=(?!PLACEHOLDER|\[)[a-zA-Z0-9_\-\+\/=]+/gi,
        message: 'Possible actual credential in .env.example',
        severity: 'error'
    }
];

checkFile(path.join(__dirname, '..', '.env.example'), [
    {
        pattern: /LEAD_SUBMISSION_ENABLED\s*=\s*true/gi,
        message: '.env.example has LEAD_SUBMISSION_ENABLED=true - should be false by default',
        severity: 'error'
    },
    {
        pattern: /LEAD_TEST_MODE\s*=\s*false/gi,
        message: '.env.example has LEAD_TEST_MODE=false - should be true for safety',
        severity: 'error'
    }
]);

// 5. Check .gitignore
console.log(`${BLUE}5. Checking .gitignore configuration...${RESET}`);

const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    
    const requiredEntries = [
        { pattern: /\.env$|\.env\n/, name: '.env' },
        { pattern: /node_modules/, name: 'node_modules' },
        { pattern: /\.git\//, name: '.git' }
    ];

    let gitignoreOk = true;
    requiredEntries.forEach(entry => {
        if (!entry.pattern.test(gitignore)) {
            console.log(`${YELLOW}⚠ .gitignore missing entry: ${entry.name}${RESET}`);
            warningsFound++;
            gitignoreOk = false;
        }
    });

    if (gitignoreOk) {
        console.log(`${GREEN}✓ .gitignore properly configured${RESET}`);
    }
} else {
    console.log(`${RED}✗ .gitignore not found${RESET}`);
    issuesFound++;
}

// 6. Check HTML for security
console.log(`${BLUE}6. Checking HTML security...${RESET}`);

const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    let htmlSecure = true;

    // Check for inline scripts (should be minimal)
    if (/<script>.*<\/script>/si.test(html)) {
        const scriptMatches = html.match(/<script>.*?<\/script>/gi) || [];
        // Allow some inline scripts, but check for suspicious content
        scriptMatches.forEach((script, i) => {
            if (script.length > 500 && !script.includes('PLACEHOLDER')) {
                console.log(`${YELLOW}⚠ Large inline script found${RESET}`);
                warningsFound++;
            }
        });
    }

    // Check for onclick handlers
    if (/\bonclick\s*=/gi.test(html)) {
        console.log(`${YELLOW}⚠ Inline onclick handlers found - use addEventListener instead${RESET}`);
        warningsFound++;
        htmlSecure = false;
    }

    if (htmlSecure) {
        console.log(`${GREEN}✓ HTML security checks passed${RESET}`);
    }
} else {
    console.log(`${RED}✗ index.html not found${RESET}`);
    issuesFound++;
}

// 7. Check CSS for security issues
console.log(`${BLUE}7. Checking CSS...${RESET}`);

const cssPath = path.join(__dirname, '..', 'public', 'styles', 'main.css');
if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    
    let cssSecure = true;

    // Check for dangerous CSS properties
    if (/javascript:/gi.test(css)) {
        console.log(`${RED}✗ javascript: protocol found in CSS${RESET}`);
        issuesFound++;
        cssSecure = false;
    }

    if (cssSecure) {
        console.log(`${GREEN}✓ CSS security checks passed${RESET}`);
    }
}

// 8. Check for test data with real PII
console.log(`${BLUE}8. Checking for test data...${RESET}`);

const testDataFiles = [
    'public/js/form.js',
    'public/js/app.js',
    'public/index.html'
];

let testDataFound = false;
testDataFiles.forEach(file => {
    const filepath = path.join(__dirname, '..', file);
    if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        
        // Check for common test email/phone patterns
        if (/(test@|\.test|555[-]?\d{4}|john@example|test\.com)/gi.test(content)) {
            if (!content.includes('placeholder') && !content.includes('example\.com')) {
                console.log(`${YELLOW}⚠ Possible test data in ${file}${RESET}`);
                warningsFound++;
                testDataFound = true;
            }
        }
    }
});

if (!testDataFound) {
    console.log(`${GREEN}✓ No suspicious test data found${RESET}`);
}

// 9. Check package.json for security
console.log(`${BLUE}9. Checking package.json...${RESET}`);

const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for dependencies that might have security issues
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Just verify structure is correct
    if (packageJson.private === true) {
        console.log(`${GREEN}✓ Package marked as private${RESET}`);
    } else {
        console.log(`${YELLOW}⚠ Package not marked as private${RESET}`);
        warningsFound++;
    }
}

// 10. Check netlify.toml for security
console.log(`${BLUE}10. Checking Netlify configuration...${RESET}`);

const netlifyPath = path.join(__dirname, '..', 'netlify.toml');
if (fs.existsSync(netlifyPath)) {
    const netlify = fs.readFileSync(netlifyPath, 'utf8');
    
    let netlifySecure = true;

    // Check for security headers
    if (!/Content-Security-Policy/i.test(netlify)) {
        console.log(`${YELLOW}⚠ CSP header not configured${RESET}`);
        warningsFound++;
        netlifySecure = false;
    }

    if (!/X-Frame-Options/i.test(netlify)) {
        console.log(`${YELLOW}⚠ X-Frame-Options not configured${RESET}`);
        warningsFound++;
        netlifySecure = false;
    }

    if (netlifySecure) {
        console.log(`${GREEN}✓ Security headers configured${RESET}`);
    }
}

// Summary
console.log(`\n${BLUE}═══════════════════════════════════════════${RESET}`);
console.log(`Security Check Summary:`);
console.log(`  ${RED}Critical Issues: ${issuesFound}${RESET}`);
console.log(`  ${YELLOW}Warnings: ${warningsFound}${RESET}`);

if (issuesFound === 0) {
    console.log(`${GREEN}✓ No critical security issues found${RESET}\n`);
    process.exit(0);
} else {
    console.log(`${RED}✗ Critical issues must be fixed before deployment${RESET}\n`);
    process.exit(1);
}

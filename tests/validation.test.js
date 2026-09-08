/**
 * Form Tests for South University Landing Page
 * Run with: npm test
 */

// Mock configuration
global.config = {
    programs: [
        { id: '114281', name: 'Psychology' },
        { id: '114283', name: 'Accounting', restrictions: { states: ['CA'] } }
    ],
    ineligibleStates: ['CT', 'MA', 'NY', 'OR'],
    educationLevels: {
        '1301': 'High School Diploma',
        '1302': 'Some College'
    },
    validation: {
        minNameLength: 2,
        maxNameLength: 50,
        zipCodeLength: 5
    },
    isStateIneligible(state) {
        return this.ineligibleStates.includes(state.toUpperCase());
    },
    getProgramById(id) {
        return this.programs.find(p => p.id === id);
    },
    getProgramRestrictions(id) {
        const program = this.getProgramById(id);
        return program && program.restrictions ? program.restrictions : {};
    },
    isStateIneligibleForProgram(state, programId) {
        const restrictions = this.getProgramRestrictions(programId);
        if (!restrictions.states) return false;
        return restrictions.states.includes(state.toUpperCase());
    }
};

// Mock logger
global.logger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    logValidationError: () => {},
    logGeographicRestriction: () => {}
};

// Load validation module (simplified for testing)
const Validation = (() => {
    function validateEmail(email) {
        if (!email) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? null : 'Invalid email';
    }

    function validatePhone(phone) {
        if (!phone) return 'Phone is required';
        const cleaned = phone.replace(/[\s\-()\.]/g, '');
        return /^\d{10}$/.test(cleaned) ? null : 'Invalid phone';
    }

    function validateName(name) {
        if (!name || name.trim().length === 0) return 'Name is required';
        if (name.trim().length < global.config.validation.minNameLength) {
            return `Name too short`;
        }
        return null;
    }

    function validateZip(zip) {
        if (!zip) return 'ZIP is required';
        return /^\d{5}$/.test(zip) ? null : 'Invalid ZIP';
    }

    function validateState(state) {
        if (!state) return 'State is required';
        if (!/^[A-Z]{2}$/.test(state.toUpperCase())) {
            return 'Invalid state code';
        }
        if (global.config.isStateIneligible(state)) {
            return `Programs not available in ${state}`;
        }
        return null;
    }

    return {
        validateEmail,
        validatePhone,
        validateName,
        validateZip,
        validateState,
        validateStep1(data) {
            const errors = {};
            if (validateName(data.firstName)) errors.firstName = validateName(data.firstName);
            if (validateName(data.lastName)) errors.lastName = validateName(data.lastName);
            if (validateEmail(data.email)) errors.email = validateEmail(data.email);
            if (validatePhone(data.phone)) errors.phone = validatePhone(data.phone);
            return Object.keys(errors).length > 0 ? errors : null;
        },
        validateStep2(data) {
            const errors = {};
            if (validateState(data.state)) errors.state = validateState(data.state);
            if (validateZip(data.zip)) errors.zip = validateZip(data.zip);
            return Object.keys(errors).length > 0 ? errors : null;
        }
    };
})();

global.Validation = Validation;

// ============================================
// TEST SUITE
// ============================================

const test = (description, fn) => {
    try {
        fn();
        console.log(`✓ ${description}`);
    } catch (error) {
        console.error(`✗ ${description}`);
        console.error(`  ${error.message}`);
        process.exit(1);
    }
};

const assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed');
};

console.log('\n📋 Running Form Validation Tests...\n');

// Email Validation Tests
test('Should accept valid email', () => {
    const result = Validation.validateEmail('test@example.com');
    assert(result === null, 'Valid email should pass');
});

test('Should reject invalid email', () => {
    const result = Validation.validateEmail('invalid-email');
    assert(result !== null, 'Invalid email should fail');
});

test('Should require email', () => {
    const result = Validation.validateEmail('');
    assert(result !== null, 'Empty email should require value');
});

// Phone Validation Tests
test('Should accept valid US phone', () => {
    const result = Validation.validatePhone('(555) 123-4567');
    assert(result === null, 'Valid phone should pass');
});

test('Should accept phone without formatting', () => {
    const result = Validation.validatePhone('5551234567');
    assert(result === null, 'Plain digits should pass');
});

test('Should reject short phone', () => {
    const result = Validation.validatePhone('555-1234');
    assert(result !== null, 'Short phone should fail');
});

// Name Validation Tests
test('Should accept valid name', () => {
    const result = Validation.validateName('John');
    assert(result === null, 'Valid name should pass');
});

test('Should reject single character name', () => {
    const result = Validation.validateName('J');
    assert(result !== null, 'Single char name should fail');
});

test('Should require name', () => {
    const result = Validation.validateName('');
    assert(result !== null, 'Empty name should require value');
});

// ZIP Code Validation Tests
test('Should accept valid ZIP', () => {
    const result = Validation.validateZip('12345');
    assert(result === null, 'Valid ZIP should pass');
});

test('Should reject short ZIP', () => {
    const result = Validation.validateZip('1234');
    assert(result !== null, 'Short ZIP should fail');
});

test('Should reject ZIP with letters', () => {
    const result = Validation.validateZip('1234A');
    assert(result !== null, 'ZIP with letters should fail');
});

// State Validation Tests
test('Should accept valid state code', () => {
    const result = Validation.validateState('CA');
    assert(result === null, 'Valid state should pass');
});

test('Should reject invalid state code', () => {
    const result = Validation.validateState('CALIFORNIA');
    assert(result !== null, 'Long state name should fail');
});

test('Should reject ineligible state', () => {
    const result = Validation.validateState('CT');
    assert(result !== null, 'Ineligible state should fail');
});

// Multi-Field Validation Tests
test('Step 1 should pass with valid data', () => {
    const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567'
    };
    const result = Validation.validateStep1(data);
    assert(result === null, 'Valid step 1 data should pass');
});

test('Step 1 should fail with invalid email', () => {
    const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid',
        phone: '5551234567'
    };
    const result = Validation.validateStep1(data);
    assert(result !== null, 'Invalid email should fail');
    assert(result.email, 'Should identify email error');
});

test('Step 2 should pass with valid address data', () => {
    const data = {
        state: 'CA',
        zip: '12345'
    };
    const result = Validation.validateStep2(data);
    assert(result === null, 'Valid step 2 data should pass');
});

test('Step 2 should fail with ineligible state', () => {
    const data = {
        state: 'NY',
        zip: '12345'
    };
    const result = Validation.validateStep2(data);
    assert(result !== null, 'Ineligible state should fail');
});

// Configuration Tests
test('Should identify ineligible state', () => {
    const isIneligible = global.config.isStateIneligible('MA');
    assert(isIneligible, 'MA should be ineligible');
});

const fs = require('fs');
const path = require('path');

const programSource = fs.readFileSync(path.join(__dirname, '../public/js/program-availability.js'), 'utf8');
const pageHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('Campaign includes 11 approved South University programs without degree abbreviations', () => {
    const expectedIds = [
        '114280', '114276', '114278',
        '114281', '114282', '114283', '114284', '114286', '114266', '114273', '114268'
    ];
    expectedIds.forEach((id) => {
        assert(programSource.includes(id), `Missing program ID ${id}`);
    });
    assert(programSource.includes('Allied Health Science'), 'Missing Allied Health Science');
    assert(programSource.includes('Medical Assisting'), 'Missing Medical Assisting');
    assert(programSource.includes('Paralegal Studies'), 'Missing Paralegal Studies');
    assert(!programSource.includes('B.A.'), 'Degree abbreviations should not be present in program names');
    assert(!programSource.includes('B.S.'), 'Degree abbreviations should not be present in program names');
    assert(!programSource.includes('A.S.'), 'Associate abbreviations should not be present in program names');
});

test('Public page reflects the approved South University degree-program wording and no campaign number', () => {
    assert(pageHtml.includes('Discover South University Online'), 'Page should include the South University discovery heading');
    assert(pageHtml.includes('Powered by Launch Your Degree') || pageHtml.includes('Powered by Launch Your Degree'), 'Footer should say Powered by Launch Your Degree');
    assert(!pageHtml.includes('Campaign #12211'), 'Campaign number should be absent from public page');
    assert(!pageHtml.includes('Back2Learn'), 'Back2Learn text should not appear on public page');
    assert(!pageHtml.includes('Bachelor\'s Programs'), 'Bachelor-only wording should not remain on the public page');
});

test('Should identify eligible state', () => {
    const isIneligible = global.config.isStateIneligible('TX');
    assert(!isIneligible, 'TX should be eligible');
});

test('Should identify program-specific restrictions', () => {
    const isRestricted = global.config.isStateIneligibleForProgram('CA', '114283');
    assert(isRestricted, 'CA should be restricted for Accounting');
});

test('Should allow unrestricted program in CA', () => {
    const isRestricted = global.config.isStateIneligibleForProgram('CA', '114281');
    assert(!isRestricted, 'CA should allow Psychology');
});

console.log('\n✓ All tests passed!\n');

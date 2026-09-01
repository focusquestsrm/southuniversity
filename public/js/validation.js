/**
 * Validation Module
 * Form field validation with server-side readiness
 */

window.Validation = (() => {
    const config = window.config;

    /**
     * Validate first and last name
     */
    function validateName(name, fieldName = 'Name') {
        if (!name || name.trim().length === 0) {
            return `${fieldName} is required`;
        }
        if (name.trim().length < config.validation.minNameLength) {
            return `${fieldName} must be at least ${config.validation.minNameLength} characters`;
        }
        if (name.length > config.validation.maxNameLength) {
            return `${fieldName} must not exceed ${config.validation.maxNameLength} characters`;
        }
        // Allow letters, spaces, hyphens, apostrophes
        if (!/^[a-zA-Z\s\-']+$/.test(name)) {
            return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
        }
        return null;
    }

    /**
     * Validate email address
     */
    function validateEmail(email) {
        if (!email || email.trim().length === 0) {
            return 'Email address is required';
        }
        if (email.length > config.validation.maxEmailLength) {
            return `Email must not exceed ${config.validation.maxEmailLength} characters`;
        }
        // Basic email validation pattern
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return null;
    }

    /**
     * Validate US phone number
     */
    function validatePhone(phone) {
        if (!phone || phone.trim().length === 0) {
            return 'Phone number is required';
        }
        if (phone.length > config.validation.maxPhoneLength) {
            return `Phone number must not exceed ${config.validation.maxPhoneLength} characters`;
        }
        // Remove common formatting characters
        const cleaned = phone.replace(/[\s\-()\.]/g, '');
        // Should have 10 digits for US phone
        if (!/^\d{10}$/.test(cleaned)) {
            return 'Please enter a valid 10-digit US phone number';
        }
        return null;
    }

    /**
     * Validate street address
     */
    function validateAddress(address) {
        if (!address || address.trim().length === 0) {
            return 'Street address is required';
        }
        if (address.length > config.validation.maxAddressLength) {
            return `Address must not exceed ${config.validation.maxAddressLength} characters`;
        }
        // Must contain at least one number, one letter, and one space
        const hasNumber = /\d/.test(address);
        const hasLetter = /[a-zA-Z]/.test(address);
        const hasSpace = /\s/.test(address);
        
        if (!hasNumber || !hasLetter || !hasSpace) {
            return 'Address must include house number, street name, and proper format (e.g., "123 Main Street")';
        }
        return null;
    }

    /**
     * Validate city
     */
    function validateCity(city) {
        if (!city || city.trim().length === 0) {
            return 'City is required';
        }
        if (city.length > config.validation.maxCityLength) {
            return `City must not exceed ${config.validation.maxCityLength} characters`;
        }
        // Allow letters, spaces, hyphens, apostrophes
        if (!/^[a-zA-Z\s\-']+$/.test(city)) {
            return 'City name can only contain letters, spaces, hyphens, and apostrophes';
        }
        return null;
    }

    /**
     * Validate state (2-letter abbreviation)
     */
    function validateState(state) {
        if (!state || state.trim().length === 0) {
            return 'State is required';
        }
        const stateCode = state.trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(stateCode)) {
            return 'State must be a valid 2-letter abbreviation (e.g., CA, NY)';
        }
        // Check for ineligible states
        if (config.isStateIneligible(stateCode)) {
            return `Programs are not available in ${stateCode} at this time`;
        }
        return null;
    }

    /**
     * Validate ZIP code
     */
    function validateZip(zip) {
        if (!zip || zip.trim().length === 0) {
            return 'ZIP code is required';
        }
        if (zip.length > config.validation.maxZipLength) {
            return `ZIP code must not exceed ${config.validation.maxZipLength} characters`;
        }
        const zipCode = zip.trim();
        if (!/^\d{5}$/.test(zipCode)) {
            return 'ZIP code must be exactly 5 digits';
        }
        return null;
    }

    /**
     * Validate education level
     */
    function validateEducationLevel(educationLevel) {
        if (!educationLevel || educationLevel.trim().length === 0) {
            return 'Education level is required';
        }
        if (!config.educationLevels[educationLevel]) {
            return 'Please select a valid education level';
        }
        // Reject "No High School Diploma" (1300)
        if (educationLevel === '1300') {
            return 'A high school diploma or equivalent is required';
        }
        return null;
    }

    /**
     * Validate graduation year
     */
    function validateGradYear(gradYear) {
        if (!gradYear || gradYear.toString().trim().length === 0) {
            return 'Graduation year is required';
        }
        const year = parseInt(gradYear, 10);
        if (isNaN(year)) {
            return 'Graduation year must be a valid number';
        }
        if (year < config.gradYearMin || year > config.gradYearMax) {
            return `Graduation year must be between ${config.gradYearMin} and ${config.gradYearMax}`;
        }
        return null;
    }

    /**
     * Validate military service selection
     */
    function validateMilitary(military) {
        if (!military || military.trim().length === 0) {
            return 'Military service status is required';
        }
        if (!config.militaryOptions[military]) {
            return 'Please select a valid military status';
        }
        return null;
    }

    /**
     * Validate start date
     */
    function validateStartDate(startDate) {
        if (!startDate || startDate.trim().length === 0) {
            return 'Start date is required';
        }
        if (!config.startDateOptions[startDate]) {
            return 'Please select a valid start date';
        }
        return null;
    }

    /**
     * Validate program selection
     */
    function validateProgram(programId) {
        if (!programId || programId.trim().length === 0) {
            return 'Program selection is required';
        }
        const program = config.getProgramById(programId);
        if (!program) {
            return 'Please select a valid program';
        }
        return null;
    }

    /**
     * Validate program eligibility by state
     */
    function validateProgramEligibility(programId, state) {
        if (config.isStateIneligibleForProgram(state, programId)) {
            return `${config.getProgramById(programId).name} is not available in ${state}`;
        }
        return null;
    }

    /**
     * Validate TCPA consent
     */
    function validateTcpaConsent(isChecked) {
        if (!isChecked) {
            return 'You must consent to communications to proceed';
        }
        return null;
    }

    /**
     * Validate privacy and terms consent
     */
    function validatePoliciesConsent(privacyChecked, termsChecked) {
        const errors = [];
        if (!privacyChecked) errors.push('You must accept the Privacy Policy');
        if (!termsChecked) errors.push('You must accept the Terms & Conditions');
        return errors.length > 0 ? errors.join('; ') : null;
    }

    /**
     * Validate Jornaya LeadID (if provided)
     */
    function validateJornayaId(leadId) {
        if (!leadId || leadId.trim().length === 0) {
            return null; // Optional field
        }
        if (leadId.length !== config.validation.jornayaIdLength) {
            return `Jornaya LeadID must be exactly ${config.validation.jornayaIdLength} characters`;
        }
        return null;
    }

    /**
     * Validate all step 1 fields
     */
    function validateStep1(data) {
        const errors = {};
        
        const firstNameError = validateName(data.firstName, 'First name');
        if (firstNameError) errors.firstName = firstNameError;

        const lastNameError = validateName(data.lastName, 'Last name');
        if (lastNameError) errors.lastName = lastNameError;

        const emailError = validateEmail(data.email);
        if (emailError) errors.email = emailError;

        const phoneError = validatePhone(data.phone);
        if (phoneError) errors.phone = phoneError;

        return Object.keys(errors).length > 0 ? errors : null;
    }

    /**
     * Validate all step 2 fields (address)
     */
    function validateStep2(data) {
        const errors = {};
        
        const addressError = validateAddress(data.address);
        if (addressError) errors.address = addressError;

        const cityError = validateCity(data.city);
        if (cityError) errors.city = cityError;

        const stateError = validateState(data.state);
        if (stateError) errors.state = stateError;

        const zipError = validateZip(data.zip);
        if (zipError) errors.zip = zipError;

        return Object.keys(errors).length > 0 ? errors : null;
    }

    /**
     * Validate all step 3 fields (background)
     */
    function validateStep3(data) {
        const errors = {};
        
        const educationError = validateEducationLevel(data.educationLevel);
        if (educationError) errors.educationLevel = educationError;

        const gradYearError = validateGradYear(data.gradYear);
        if (gradYearError) errors.gradYear = gradYearError;

        const militaryError = validateMilitary(data.military);
        if (militaryError) errors.military = militaryError;

        const startDateError = validateStartDate(data.startDate);
        if (startDateError) errors.startDate = startDateError;

        return Object.keys(errors).length > 0 ? errors : null;
    }

    /**
     * Validate all step 4 fields (program)
     */
    function validateStep4(data) {
        const errors = {};
        
        const programError = validateProgram(data.program);
        if (programError) {
            errors.program = programError;
        } else {
            const eligibilityError = validateProgramEligibility(data.program, data.state);
            if (eligibilityError) errors.program = eligibilityError;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    /**
     * Validate all step 5 fields (consent)
     */
    function validateStep5(data) {
        const errors = {};
        
        const tcpaError = validateTcpaConsent(data.tcpaConsent);
        if (tcpaError) errors.tcpaConsent = tcpaError;

        const policiesError = validatePoliciesConsent(data.privacyConsent, data.termsConsent);
        if (policiesError) errors.policies = policiesError;

        return Object.keys(errors).length > 0 ? errors : null;
    }

    return {
        validateStep1,
        validateStep2,
        validateStep3,
        validateStep4,
        validateStep5,
        validateName,
        validateEmail,
        validatePhone,
        validateAddress,
        validateCity,
        validateState,
        validateZip,
        validateEducationLevel,
        validateGradYear,
        validateMilitary,
        validateStartDate,
        validateProgram,
        validateProgramEligibility,
        validateTcpaConsent,
        validatePoliciesConsent,
        validateJornayaId
    };
})();

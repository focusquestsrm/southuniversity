/**
 * Application Configuration
 * Centralized configuration for the South University landing page
 */

window.config = {
    // Campaign Information
    campaign: {
        code: 'avK3j_5CahaVgpJ4SicSQw',
        number: '12211',
        offer: 'LYD – South University Web (157)',
        publisher: 'LV – Curious Behaviour Media (304)',
        advertiser: 'South University Online',
        mediaType: 'noncallcenter'
    },

    // Campus Information
    campus: {
        name: 'South University, Online',
        id: 11776,
        country: 'United States'
    },

    // API Endpoints
    api: {
        pingUrl: process.env.LEADHOOP_PING_URL || 'http://back2learn-api.leadhoop.com/v1/pings',
        postUrl: process.env.LEADHOOP_POST_URL || 'http://back2learn-post.leadhoop.com/incoming/leads'
    },

    // Feature Flags
    features: {
        enableLeadSubmission: process.env.LEAD_SUBMISSION_ENABLED === 'true' || false,
        testMode: process.env.LEAD_TEST_MODE === 'true' || true,
        enableGoogleAutocomplete: Boolean(process.env.GOOGLE_MAPS_BROWSER_KEY),
        enableJornaya: Boolean(process.env.JORNAYA_CAMPAIGN_ID),
        enableTrustedForm: Boolean(process.env.TRUSTEDFORM_KEY),
        enableMetaPixel: Boolean(process.env.META_PIXEL_ID),
        enableGoogleAnalytics: Boolean(process.env.GOOGLE_ANALYTICS_ID)
    },

    // Programs (Active Online Bachelor's Only)
    programs: [
        {
            id: '114281',
            name: 'B.A. – Psychology',
            description: 'Build a foundation in psychological principles and human behavior'
        },
        {
            id: '114282',
            name: 'B.B.A. – Business Administration',
            description: 'Develop leadership and business management skills'
        },
        {
            id: '114283',
            name: 'B.S. – Accounting',
            description: 'Master financial reporting and accounting principles',
            restrictions: {
                states: ['CA']
            }
        },
        {
            id: '114284',
            name: 'B.S. – Criminal Justice',
            description: 'Explore the criminal justice system and law enforcement',
            restrictions: {
                states: ['NJ']
            }
        },
        {
            id: '114286',
            name: 'B.S. – Healthcare Management',
            description: 'Lead healthcare organizations and improve patient outcomes',
            restrictions: {
                states: ['NJ']
            }
        },
        {
            id: '114266',
            name: 'B.S. – Information Technology',
            description: 'Develop IT expertise and cybersecurity skills',
            restrictions: {
                states: ['NJ']
            }
        },
        {
            id: '114273',
            name: 'B.S. – Legal Studies',
            description: 'Understand legal systems and paralegal practices',
            restrictions: {
                states: ['NJ']
            }
        },
        {
            id: '114268',
            name: 'B.S. – Public Health',
            description: 'Advance public health and community wellness',
            restrictions: {
                states: ['NJ']
            }
        }
    ],

    // Geographic Restrictions
    ineligibleStates: [
        'CT', // Connecticut
        'MA', // Massachusetts
        'MS', // Mississippi
        'NY', // New York
        'OR', // Oregon
        'RI', // Rhode Island
        'DC', // Washington, DC
        'AA', // Armed Forces Americas
        'AE', // Armed Forces Europe
        'AP', // Armed Forces Pacific
        'PR', // Puerto Rico
        'VI', // Virgin Islands
        'AS', // American Samoa
        'GU', // Guam
        'MP'  // Northern Mariana Islands
    ],

    // Education Levels (Accepted Values)
    educationLevels: {
        '1301': 'High School Diploma or GED',
        '1302': 'Some College',
        '1303': 'Associate\'s Degree',
        '1304': 'Bachelor\'s Degree',
        '1305': 'Master\'s Degree',
        '1306': 'Doctorate/PhD'
    },

    // Start Date Options
    startDateOptions: {
        'immediately': 'Immediately',
        '1-3_months': '1-3 Months',
        '4-6_months': '4-6 Months',
        '7-12_months': '7-12 Months',
        'more_than_1_year': 'More than 1 Year',
        'not_sure': 'Not Sure'
    },

    // Military Service Options
    militaryOptions: {
        'none': 'No Military Service',
        'active': 'Active Duty',
        'reserve': 'Reserve/Guard',
        'veteran': 'Veteran',
        'dependent': 'Military Dependent',
        'spouse': 'Military Spouse'
    },

    // Graduation Year Range
    gradYearMin: 1985,
    gradYearMax: 2025,

    // Validation Settings
    validation: {
        minNameLength: 2,
        maxNameLength: 50,
        maxEmailLength: 100,
        maxPhoneLength: 20,
        maxAddressLength: 100,
        maxCityLength: 50,
        zipCodeLength: 5,
        maxZipLength: 10,
        jornayaIdLength: 36
    },

    // LeadHoop Required Fields
    leadHoopFields: [
        'campaign_code',
        'lead[firstname]',
        'lead[lastname]',
        'lead_address[address]',
        'lead_address[city]',
        'lead_address[state]',
        'lead_address[zip]',
        'lead[email]',
        'lead[phone1]',
        'lead_background[military_type]',
        'lead_background[us_citizen]',
        'lead_education[grad_year]',
        'lead_education[education_level_id]',
        'lead_education[program_id]',
        'lead_education[campus_id]',
        'lead_education[start_date]',
        'lead[service_leadid]',
        'lead[service_trusted_form]',
        'lead_consent[tcpa_consent]',
        'lead[ip]',
        'lead[test]',
        'lead[media_type]'
    ],

    // Delivery Window (Eastern Time)
    deliveryWindows: [
        { day: 1, start: '00:00', end: '00:15' }, // Monday
        { day: 1, start: '09:30', end: '16:15' }, // Monday
        { day: 2, start: '00:00', end: '00:15' }, // Tuesday
        { day: 2, start: '09:30', end: '16:15' }, // Tuesday
        { day: 3, start: '00:00', end: '00:15' }, // Wednesday
        { day: 3, start: '09:30', end: '16:15' }, // Wednesday
        { day: 4, start: '00:00', end: '00:15' }, // Thursday
        { day: 4, start: '09:30', end: '16:15' }, // Thursday
        { day: 5, start: '00:00', end: '00:15' }, // Friday
        { day: 5, start: '09:30', end: '16:15' }, // Friday
        { day: 6, start: '10:00', end: '12:30' }  // Saturday
        // Sunday (day 0) - Paused
    ],

    // External Service Placeholders
    services: {
        googleMapsKey: process.env.GOOGLE_MAPS_BROWSER_KEY || '[PLACEHOLDER: GOOGLE_MAPS_BROWSER_KEY]',
        metaPixelId: process.env.META_PIXEL_ID || '[PLACEHOLDER: META_PIXEL_ID]',
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '[PLACEHOLDER: GOOGLE_ANALYTICS_ID]',
        jornayaCampaignId: process.env.JORNAYA_CAMPAIGN_ID || '[PLACEHOLDER: JORNAYA_CAMPAIGN_ID]',
        trustedFormKey: process.env.TRUSTEDFORM_KEY || '[PLACEHOLDER: TRUSTEDFORM_KEY]',
        emailValidationService: process.env.EMAIL_VALIDATION_SERVICE || '[PLACEHOLDER: EMAIL_VALIDATION_SERVICE]'
    },

    // Consent Placeholders
    consent: {
        tcpaLanguagePlaceholder: '[PLACEHOLDER: APPROVED TCPA CONSENT LANGUAGE]',
        privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || '[PLACEHOLDER: PRIVACY_POLICY_URL]',
        termsConditionsUrl: process.env.TERMS_CONDITIONS_URL || '[PLACEHOLDER: TERMS_CONDITIONS_URL]',
        advertisingDisclosure: '[PLACEHOLDER: ADVERTISING_DISCLOSURE]',
        accreditationDisclaimers: '[PLACEHOLDER: ACCREDITATION_AND_PROGRAM_DISCLAIMERS]'
    },

    // Redirect URLs
    redirects: {
        successUrl: process.env.ACCEPTED_REDIRECT_URL || '/thank-you',
        failureUrl: process.env.FAILED_REDIRECT_URL || '/next-steps'
    },

    /**
     * Get program by ID
     */
    getProgramById(programId) {
        return this.programs.find(p => p.id === programId);
    },

    /**
     * Get program restrictions
     */
    getProgramRestrictions(programId) {
        const program = this.getProgramById(programId);
        return program && program.restrictions ? program.restrictions : {};
    },

    /**
     * Check if state is ineligible
     */
    isStateIneligible(state) {
        return this.ineligibleStates.includes(state.toUpperCase());
    },

    /**
     * Check if state is ineligible for specific program
     */
    isStateIneligibleForProgram(state, programId) {
        const restrictions = this.getProgramRestrictions(programId);
        if (!restrictions.states) return false;
        return restrictions.states.includes(state.toUpperCase());
    },

    /**
     * Is lead submission enabled
     */
    isSubmissionEnabled() {
        return this.features.enableLeadSubmission && !this.features.testMode;
    }
};

// Verify configuration loaded
if (typeof window.config === 'object') {
    console.log('Configuration loaded successfully');
}

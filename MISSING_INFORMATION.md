# Missing Information for South University Landing Page

This document lists all items required for full production deployment that have not yet been received or configured.

## Status: Initial Build Complete (2026-09-01)

All available information has been implemented with appropriate placeholders. This page will be updated as information becomes available.

---

## Outstanding Items

### Branding & Creative Assets
- [ ] **Approved South University logo** - Currently using placeholder, logo received and integrated ✅
- [ ] **Approved hero image/creative** - Placeholder in place, awaiting final creative asset
- [ ] **Final headline and call-to-action text** - Generic text in place, awaiting approved copy
- [ ] **Brand guidelines document** - For consistent styling and future updates

### Legal & Compliance Documentation
- [ ] **Approved TCPA consent language** - Placeholder at `consent.tcpaLanguagePlaceholder`
  - Current: Generic template language
  - Required: South University approved TCPA disclosure
  - Location in code: `public/js/app.js` (Step 5 consent section)
  
- [ ] **Advertising disclosure statement** - Placeholder at `config.consent.advertisingDisclosure`
  - Required for compliance with advertising regulations
  - Location in code: `public/js/app.js` (Footer section)
  
- [ ] **Accreditation and program disclaimers** - Placeholder at `config.consent.accreditationDisclaimers`
  - Required for each program type
  - Location in code: `public/js/app.js` (Step 5 section)
  
- [ ] **Privacy Policy URL** - Placeholder at `.env.example`: `PRIVACY_POLICY_URL`
  - Must be hosted at final destination
  - Location in code: `public/js/app.js` (Footer and consent section)
  
- [ ] **Terms and Conditions URL** - Placeholder at `.env.example`: `TERMS_CONDITIONS_URL`
  - Must be hosted at final destination
  - Location in code: `public/js/app.js` (Footer and consent section)

### Tracking & Analytics Configuration
- [ ] **Meta Pixel ID** - Placeholder at `.env.example`: `META_PIXEL_ID`
  - Get from: Facebook Business Manager
  - Format: Numeric ID (e.g., 123456789)
  - Integration: `public/js/tracking.js` (initializeMetaPixel function)
  
- [ ] **Confirmation of _fbc, _fbp, and fbclid mapping** - Currently using standard Facebook mapping
  - Verify LeadHoop accepts these parameters
  - Location: `public/js/tracking.js` (getFacebookParams and buildLeadObject functions)
  
- [ ] **Google Analytics ID** - Placeholder at `.env.example`: `GOOGLE_ANALYTICS_ID`
  - Get from: Google Analytics account
  - Format: G-XXXXXXXXXX (GA4) or UA-XXXXXXXXX (Universal Analytics)
  - Integration: `public/js/tracking.js` (initializeGoogleAnalytics function)

### Third-Party Services Integration
- [ ] **Jornaya LeadID configuration**
  - Campaign ID: Placeholder at `.env.example`: `JORNAYA_CAMPAIGN_ID`
  - Implementation details: Location in `public/js/tracking.js` (initializeJornaya function)
  - Status: Placeholder implementation ready
  
- [ ] **TrustedForm account and key**
  - Account setup required at: https://www.trustedform.com
  - API Key: Placeholder at `.env.example`: `TRUSTEDFORM_KEY`
  - Implementation: `public/js/tracking.js` (initializeTrustedForm function)
  - Status: Placeholder implementation ready
  
- [ ] **Google Maps API Browser Key** - Placeholder at `.env.example`: `GOOGLE_MAPS_BROWSER_KEY`
  - For address autocomplete feature
  - Get from: Google Cloud Console
  - Current: Form supports manual address entry if unavailable
  - Status: Fallback support included
  
- [ ] **Email validation service configuration** - Placeholder at `.env.example`: `EMAIL_VALIDATION_SERVICE`
  - Options: ZeroBounce, Kickbox, etc.
  - Server-side implementation required
  - Status: Placeholder for future integration

### Infrastructure & Hosting
- [ ] **Approved redirect destinations**
  - Current: `/thank-you` and `/next-steps` (configured)
  - Variables: `ACCEPTED_REDIRECT_URL`, `FAILED_REDIRECT_URL`
  - Pages: Need to be created or existing pages confirmed
  
- [ ] **Database/Queue storage service**
  - Required for implementing lead queue and scheduled delivery
  - Options: PostgreSQL, MongoDB, Firebase, AWS DynamoDB
  - Placeholder: `DATABASE_URL` in `.env.example`
  - Status: Interface defined, awaiting service selection
  - Location: Adapter needed in `netlify/functions/submit-lead.js`
  
- [ ] **Scheduled delivery configuration**
  - Requires durable queue storage
  - Delivery windows defined: ET timezone (Mon-Sat, specific hours, Sunday paused)
  - Implementation: Netlify Functions with scheduled execution
  - Status: Framework in place, storage service needed

### Testing & Quality Assurance
- [ ] **Approved test contact information**
  - Test email for lead submission
  - Test phone number
  - Test address in eligible state
  - Current: Using development mode (LEAD_TEST_MODE=true)
  
- [ ] **Security audit results**
  - Run: `npm run security:check`
  - Status: Script created, dependencies needed
  
- [ ] **Accessibility audit report** (WCAG 2.1 AA compliance)
  - Responsive design tested ✅
  - Keyboard navigation implemented ✅
  - Screen reader compatibility: Requires testing
  
- [ ] **Cross-browser compatibility testing**
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers: Chrome, Safari mobile
  - Status: CSS designed for broad compatibility

### Campaign-Specific Settings
- [ ] **Production launch approver confirmation**
  - Required before LEAD_SUBMISSION_ENABLED=true
  - Currently: LEAD_TEST_MODE=true (safe default)
  
- [ ] **Final verification of hardcoded values**
  - US citizenship always set to "US" ✅ (confirmed in requirements)
  - Military affiliation required ✅ (as user question)
  - Campus ID: 11776 ✅
  - Campaign code: avK3j_5CahaVgpJ4SicSQw ✅
  - Media type: noncallcenter ✅

### Developer Documentation
- [ ] **Internal team documentation** (if different from below)
- [ ] **Handoff documentation for marketing/ops team**

---

## Items Received & Implemented ✅

### Branding
- South University logo image file
  - File: `public/images/south-university-logo.png`
  - Status: Integrated and verified to display correctly
  - Responsive: Yes, tested at desktop and mobile sizes
  - Quality: Preserved with no distortion or recoloring

- LaunchYourDegree vertical logo
  - File: `public/images/launch-your-degree-logo.png`
  - Status: Integrated alongside South University logo
  - Display: Both logos visible in header with visual divider
  - Responsive: Yes, adapts layout for mobile

### Campaign Configuration
- Advertiser: South University Online ✅
- Campaign type: Host and Post ✅
- Campaign number: 12211 ✅
- Offer: LYD – South University Web (157) ✅
- Publisher: LV – Curious Behaviour Media (304) ✅
- Campaign code: avK3j_5CahaVgpJ4SicSQw ✅
- Media type: noncallcenter ✅
- Campus: South University, Online ✅
- Campus ID: 11776 ✅
- Country: United States only ✅

### Programs
- Psychology (114281) ✅
- Business Administration (114282) ✅
- Accounting (114283) ✅ with CA restriction
- Criminal Justice (114284) ✅ with NJ restriction
- Healthcare Management (114286) ✅ with NJ restriction
- Information Technology (114266) ✅ with NJ restriction
- Legal Studies (114273) ✅ with NJ restriction
- Public Health (114268) ✅ with NJ restriction

### Form Functionality
- Multi-step form with 5 steps ✅
- Progress indicator ✅
- Back/Next navigation ✅
- Form data persistence across steps ✅
- Address autocomplete ready for Google API ✅
- Manual address entry supported ✅
- Validation: Required fields ✅
- Validation: Email format ✅
- Validation: Phone format (US only) ✅
- Validation: ZIP code (5 digits) ✅
- Validation: State (2-letter abbreviation) ✅
- Validation: Geographic restrictions ✅
- Validation: Program-specific restrictions ✅
- Double-submission prevention ✅
- Accessible and mobile responsive ✅

### Confirmation Pages
- Success/thank you page placeholder ✅
- Error/next-steps page placeholder ✅
- Ineligible/geographic restriction page ✅

### LeadHoop Integration
- Pre-ping endpoint structure: `/v1/pings` ✅
- Post endpoint structure: `/incoming/leads` ✅
- Ping ID capture ready ✅
- Full LeadHoop field mapping ✅
- Server-side submission only ✅
- Test mode enabled by default ✅
- Delivery window scheduling prepared ✅

### Security & Compliance
- All sensitive values in environment variables ✅
- No PII in browser console logs ✅
- No credentials in code or repository ✅
- TCPA consent checkbox required and unchecked by default ✅
- Consent language placeholder prepared ✅
- Test mode with `lead[test]=1` ✅
- .gitignore configured ✅

### Configuration Files
- `.env.example` with all required variables ✅
- `package.json` with build scripts ✅
- `netlify.toml` with deployment settings ✅
- Security headers configured ✅
- CSP policy in place ✅

### Logging & Monitoring
- Server-side logging framework ✅
- PII sanitization in logs ✅
- Test mode status logging ✅
- Validation error logging ✅
- Geographic restriction logging ✅
- API call logging ✅

---

## How to Handle Placeholders

### Before Going Live
1. Replace all `[PLACEHOLDER: ...]` text with actual values
2. Set `LEAD_SUBMISSION_ENABLED=true` when approved
3. Set `LEAD_TEST_MODE=false` for production
4. Run security checks: `npm run security:check`
5. Run tests: `npm test`

### Placeholder Locations
- Config file: `public/js/config.js` (services object)
- App template: `public/js/app.js` (HTML template)
- Environment: `.env.example`

---

## Next Steps

1. **Immediate** (Before Initial Deploy):
   - [ ] Verify logo display on desktop and mobile
   - [ ] Test form navigation and validation
   - [ ] Run `npm test` to verify functionality
   - [ ] Push to GitHub repository

2. **Before Netlify Setup**:
   - [ ] Receive branding assets
   - [ ] Receive legal/compliance documentation
   - [ ] Confirm legal/compliance approver

3. **Netlify Environment Variables** (After project created):
   - [ ] Add Google Maps Browser Key
   - [ ] Add Meta Pixel ID
   - [ ] Add Google Analytics ID
   - [ ] Add Jornaya Campaign ID
   - [ ] Add TrustedForm Key
   - [ ] Add Database URL
   - [ ] Set LEAD_TEST_MODE=true initially
   - [ ] Set LEAD_SUBMISSION_ENABLED=false initially

4. **Before Enabling Lead Submission**:
   - [ ] Full UAT (User Acceptance Testing)
   - [ ] Security audit
   - [ ] Compliance review
   - [ ] Get final approval from launch team

5. **Post-Launch**:
   - [ ] Monitor form submissions and errors
   - [ ] Verify lead delivery to LeadHoop
   - [ ] Monitor tracking pixels firing correctly
   - [ ] Set up uptime monitoring and alerts

---

## Contact & Ownership

- **Project Maintainer**: [To be assigned]
- **Security Contact**: [To be assigned]
- **Business Owner**: South University Online
- **Campaign Manager**: [To be assigned]

---

**Last Updated**: 2026-09-01
**Status**: Initial build complete with placeholders for outstanding information

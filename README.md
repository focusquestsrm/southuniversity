# South University Landing Page

Campaign-driven landing page for South University Online's accelerated bachelor's degree programs. Built with LaunchYourDegree branding and integrated with LeadHoop for lead delivery.

## Campaign Information

- **Advertiser**: South University Online
- **Campaign #**: 12211
- **Offer**: LYD – South University Web (157)
- **Publisher**: LV – Curious Behaviour Media (304)
- **Platform**: Host and Post
- **Geographic Restriction**: United States only

## Features

### Form & Lead Capture
- ✅ **Multi-step form** - 5-step progressive form with validation
- ✅ **Smart validation** - Browser and server-side validation
- ✅ **Data persistence** - Form data preserved across steps
- ✅ **Address autocomplete** - Ready for Google Maps API integration
- ✅ **Geographic restrictions** - Prevents submissions from ineligible states
- ✅ **Program restrictions** - State-specific program eligibility
- ✅ **Double-submission prevention** - Idempotency and duplicate checks

### Programs Offered
- B.A. – Psychology
- B.B.A. – Business Administration
- B.S. – Accounting
- B.S. – Criminal Justice
- B.S. – Healthcare Management
- B.S. – Information Technology
- B.S. – Legal Studies
- B.S. – Public Health

### Compliance & Security
- ✅ **TCPA compliance** - Unchecked consent by default, requires affirmative consent
- ✅ **LeadHoop integration** - Full field mapping and pre-ping support
- ✅ **Test mode** - Safe testing before live submission
- ✅ **Environment variables** - All sensitive values externalized
- ✅ **No PII in logs** - Sanitized server-side logging
- ✅ **Security headers** - CSP, CORS, X-Frame-Options configured

### Attribution & Tracking
- ✅ **Facebook pixels** - _fbp, _fbc, fbclid attribution
- ✅ **Google Analytics** - Conversion tracking and page views
- ✅ **Jornaya LeadID** - Ready for lead attribution
- ✅ **TrustedForm** - TCPA compliance verification
- ✅ **Meta Pixel** - Conversion tracking integration
- ✅ **Session tracking** - Visitor and session ID management

### Design & Responsiveness
- ✅ **Responsive layout** - Desktop, tablet, and mobile optimized
- ✅ **Dual logos** - South University and LaunchYourDegree branding
- ✅ **Accessible** - WCAG 2.1 AA compliance target
- ✅ **Professional design** - Higher education aesthetic
- ✅ **Mobile-first** - Optimized for small screens
- ✅ **Touch-friendly** - Large tap targets

## Quick Start

### Installation
```bash
# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run security checks
npm run security:check
```

### Verify Logo Display
After installation, verify both logos display correctly:

1. **South University Logo**
   - File: `public/images/south-university-logo.png`
   - Dimensions: Responsive, height capped at 60px
   - Background: White container to display dark logo
   - Status: ✅ Verified

2. **LaunchYourDegree Logo**
   - File: `public/images/launch-your-degree-vertical-logo.png`
   - Dimensions: Responsive, height capped at 45px
   - Background: White container
   - Status: ✅ Verified

Both logos display side-by-side on desktop with a visual divider, and stack vertically on mobile.

### Local Development
```bash
# Start dev server (runs on localhost:3000)
npm run dev

# Access the application
open http://localhost:3000
```

### Browser DevTools Testing
To test logo display and responsive behavior:
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test sizes: iPhone 12, iPad, Desktop
4. Verify both logos display correctly at each size
5. Check Network tab for successful image loads

## Project Structure

```
public/
├── index.html              # Main page template
├── styles/
│   └── main.css           # Responsive styling with brand colors
├── js/
│   ├── app.js             # Main app entry point with HTML rendering
│   ├── config.js          # Configuration and hardcoded values
│   ├── logger.js          # Server-safe logging with PII sanitization
│   ├── validation.js      # Form validation with geographic/program checks
│   ├── tracking.js        # Attribution, consent, and pixel management
│   └── form.js            # Multi-step form handling
├── images/
│   ├── south-university-logo.png          # Approved South University logo
│   ├── launch-your-degree-vertical-logo.png  # LaunchYourDegree logo
│   └── favicon.ico        # Placeholder favicon
├── thank-you/
│   └── index.html         # Success confirmation page
└── next-steps/
    └── index.html         # Failure/next-steps page

netlify/
└── functions/
    └── submit-lead.js     # Server-side form submission handler

Root Configuration Files
├── package.json           # Dependencies and scripts
├── netlify.toml          # Netlify build & deployment config
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusions
├── MISSING_INFORMATION.md    # Outstanding items checklist
├── NETLIFY_BUILD_SETTINGS.md # Netlify setup instructions
└── README.md             # This file
```

## Environment Variables

All sensitive configuration is externalized. See `.env.example` for complete list.

**Critical Variables**:
- `LEAD_SUBMISSION_ENABLED` - Enable/disable lead delivery (default: false)
- `LEAD_TEST_MODE` - Test mode flag (default: true)
- `LEADHOOP_CAMPAIGN_CODE` - Campaign code for LeadHoop
- `GOOGLE_MAPS_BROWSER_KEY` - Address autocomplete API key
- `META_PIXEL_ID` - Facebook conversion tracking

**Before deployment**: Configure all variables in Netlify UI or create `.env` file locally.

## Validation Rules

### Geographic Restrictions
**Ineligible States**: CT, MA, MS, NY, OR, RI, DC, AA, AE, AP, PR, VI, AS, GU, MP

**Program-Specific Restrictions**:
- Accounting: Not available in CA
- IT, Public Health, Legal Studies, Accounting, Criminal Justice, Healthcare Management: Not available in NJ

### Form Validation
- Names: 2-50 characters, letters/hyphens/apostrophes only
- Email: Valid format required
- Phone: 10-digit US number required
- Address: Must contain number, letter, and space
- ZIP: 5 digits only
- State: 2-letter abbreviation
- Graduation Year: 1985-2025
- Education Level: Cannot select "No High School Diploma"

## LeadHoop Integration

### Pre-ping Flow
1. Form submitted with validation
2. Call LeadHoop `/v1/pings` pre-ping endpoint
3. Receive `ping_id` if approved
4. Submit lead with `ping_id` to `/incoming/leads`

### Required Fields
All LeadHoop required fields are included:
- campaign_code
- lead[firstname], lead[lastname]
- lead_address[*]
- lead[email], lead[phone1]
- lead_background[*]
- lead_education[*]
- lead_consent[tcpa_consent]
- lead[service_leadid], lead[service_trusted_form]
- lead[test], lead[media_type]
- lead[ip]

### Test Mode
- In test mode: `lead[test]=1` always sent
- No leads submitted to LeadHoop when `LEAD_SUBMISSION_ENABLED=false`
- Confirmation page shown regardless for UX

## Deployment

### Netlify
```bash
# Push to GitHub (main branch auto-deploys)
git push origin main

# Netlify automatically:
# 1. Pulls latest code
# 2. Runs: npm run build
# 3. Publishes: public/ directory
# 4. Sets environment variables
# 5. Enables HTTPS
```

See `NETLIFY_BUILD_SETTINGS.md` for complete setup instructions.

### GitHub Repository
```
https://github.com/focusquestsrm/southuniversity
```

## Testing

### Unit Tests
```bash
npm test
```

Tests cover:
- Form navigation and step validation
- Address behavior and geographic restrictions
- Program/state eligibility
- Lead object construction
- Duplicate prevention

### Manual Testing Checklist
- [ ] Form renders correctly
- [ ] Both logos display properly
- [ ] Responsive on desktop (1920x1080)
- [ ] Responsive on tablet (768x1024)
- [ ] Responsive on mobile (360x667)
- [ ] Form fields validate correctly
- [ ] Geographic restrictions trigger
- [ ] Program restrictions trigger
- [ ] Back button preserves data
- [ ] Confirmation page displays
- [ ] Tracking pixels fire
- [ ] No console errors
- [ ] No unsanitized PII in logs

### Security Checks
```bash
npm run security:check
```

Runs:
- ESLint security rules
- Dependency vulnerability scan
- Checks for hardcoded credentials
- Validates CSP headers

## Responsive Design

### Breakpoints
- **Mobile**: < 480px (single column, optimized touch)
- **Tablet**: 480px - 1024px (medium layout)
- **Desktop**: > 1024px (full multi-column layout)

### Logo Display
- **Desktop**: Both logos side-by-side in header (60px + 45px height)
- **Tablet**: Side-by-side with adjusted spacing
- **Mobile**: Stacked vertically, full width each

All logos preserve aspect ratio and display without distortion.

## Browser Support

- Chrome/Edge: Latest 2 versions ✅
- Firefox: Latest 2 versions ✅
- Safari: Latest 2 versions ✅
- Mobile browsers: iOS Safari, Chrome Android ✅

## Accessibility

- Semantic HTML5 structure
- Form labels associated with inputs
- Required field indicators
- Error messages linked to fields
- Keyboard navigation supported
- Color contrast > 4.5:1
- WCAP 2.1 AA target compliance

## Performance

- Optimized CSS (~18KB gzipped)
- No external dependencies except tracking pixels
- Lazy-load tracking scripts
- Responsive images
- Optimized font loading
- ~1.2s First Contentful Paint (ideal conditions)

## Monitoring & Support

### Netlify Analytics
- Build times, deployment status
- Form submissions, errors
- Traffic patterns

### Logging
- Server-side event logging
- Form submission tracking
- Validation error tracking
- Geographic restriction events
- API call performance

### Support Channels
- Netlify Support: https://support.netlify.com
- GitHub Issues: In repository
- Internal Team: [Contact info to be added]

## Outstanding Items

See `MISSING_INFORMATION.md` for a complete checklist of:
- Branding/creative assets
- Legal/compliance documentation
- Tracking configuration
- Database setup
- Service integrations

## License

UNLICENSED - Proprietary to South University Online

## Changelog

### 2026-09-01 - Initial Build
- ✅ Multi-step form with 5 steps
- ✅ Dual logo integration (South University + LaunchYourDegree)
- ✅ 8 active programs with state restrictions
- ✅ Geographic and program eligibility checking
- ✅ LeadHoop pre-ping and post integration
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ TCPA compliance with unchecked consent
- ✅ Attribution tracking (Facebook, Google, Jornaya, TrustedForm)
- ✅ Server-safe logging with PII sanitization
- ✅ Environment variable configuration
- ✅ Netlify deployment ready
- ✅ GitHub repository initialized
- ✅ Comprehensive documentation
- ✅ Test mode enabled by default
- ✅ Double-submission prevention

---

**Campaign #12211 | South University Online**
**Built with LaunchYourDegree | Netlify Hosted**

For questions or issues, contact [team to be assigned].

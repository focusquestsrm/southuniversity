# Netlify Build Settings for South University Landing Page

This document provides exact configuration steps for setting up the project in Netlify after the repository is pushed to GitHub.

- **Netlify project identifier**: `focusquestsrm/southuniversity-landing-page.netlify.app`
- **Permanent production URL**: `https://southuniversity-landing-page.netlify.app`

---

## Prerequisites

1. GitHub repository created and initialized:
   - Repository: `https://github.com/focusquestsrm/southuniversity`
   - Branch: `main`
   
2. Netlify account with access
   - Admin user or team with deploy permissions
   
3. All outstanding items from `MISSING_INFORMATION.md` should be gathered before proceeding

---

## Step 1: Connect GitHub Repository to Netlify

### Instructions:
1. Log in to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as the provider
4. Authorize Netlify to access your GitHub account
5. Select organization: `focusquestsrm`
6. Select repository: `southuniversity`
7. Click **"Deploy site"** to continue

---

## Step 2: Configure Build Settings

### In Netlify UI (Site Settings → Build & Deploy):

**Build Settings:**
- **Build command**: `npm run build`
- **Publish directory**: `public`
- **Functions directory**: `netlify/functions`
- **Build on push**: Enabled (default)
- **Auto publish**: Enabled (default)

These are already configured in `netlify.toml`, but verify they match.

---

## Step 3: Set Environment Variables

### Go to: Site Settings → Build & Deploy → Environment

Add the following environment variables:

#### Core Configuration
```
LEAD_SUBMISSION_ENABLED = false
LEAD_TEST_MODE = true
```

#### LeadHoop (Campaign Configuration)
```
LEADHOOP_CAMPAIGN_CODE = avK3j_5CahaVgpJ4SicSQw
LEADHOOP_CAMPUS_ID = 11776
LEADHOOP_MEDIA_TYPE = noncallcenter
LEADHOOP_POST_URL = http://back2learn-post.leadhoop.com/incoming/leads
LEADHOOP_PING_URL = http://back2learn-api.leadhoop.com/v1/pings

# Browser API restrictions
# Google Maps browser key HTTP referrer origin:
# https://southuniversity-landing-page.netlify.app
```

#### Google APIs
```
GOOGLE_MAPS_BROWSER_KEY = [VALUE FROM GOOGLE CLOUD CONSOLE]
GOOGLE_ANALYTICS_ID = [VALUE FROM GOOGLE ANALYTICS]
```

#### Meta (Facebook) Tracking
```
META_PIXEL_ID = [VALUE FROM FACEBOOK BUSINESS MANAGER]
```

#### Jornaya LeadID
```
JORNAYA_CAMPAIGN_ID = [VALUE FROM JORNAYA ACCOUNT]
```

#### TrustedForm
```
TRUSTEDFORM_KEY = [VALUE FROM TRUSTEDFORM ACCOUNT]
```

#### Redirect URLs
```
ACCEPTED_REDIRECT_URL = /thank-you
FAILED_REDIRECT_URL = /next-steps
```

#### Legal/Compliance
```
PRIVACY_POLICY_URL = [FULL URL TO PRIVACY POLICY]
TERMS_CONDITIONS_URL = [FULL URL TO TERMS & CONDITIONS]
```

#### Database/Queue Storage (When Ready)
```
DATABASE_URL = [DATABASE CONNECTION STRING]
DB_USER = [DATABASE USERNAME]
DB_PASSWORD = [DATABASE PASSWORD]
DB_NAME = south_university_leads
```

#### Optional: Email Validation
```
EMAIL_VALIDATION_SERVICE = [API ENDPOINT]
EMAIL_VALIDATION_API_KEY = [API KEY]
```

#### Optional: Webhook Configuration
```
WEBHOOK_URL = [YOUR WEBHOOK ENDPOINT]
WEBHOOK_SECRET = [GENERATED SECRET]
```

#### Development Settings
```
NODE_ENV = production
LOG_LEVEL = warn
PORT = 3000
HOST = 0.0.0.0
```

#### Security & Rate Limiting
```
CORS_ORIGINS = https://your-domain.com
RATE_LIMIT_WINDOW = 15
RATE_LIMIT_MAX_REQUESTS = 100
```

#### Duplicate Prevention
```
ENABLE_IDEMPOTENCY = true
DUPLICATE_CHECK_WINDOW = 60
```

---

## Step 4: Configure Headers and Security

The `netlify.toml` file already includes:

✅ Security headers (X-Frame-Options, CSP, etc.)
✅ Cache policies for static assets
✅ Redirect rules
✅ Function routing

**No additional configuration needed** - these are applied automatically from `netlify.toml`.

---

## Step 5: Deploy Preview & Production URLs

After successful deployment:

- **Preview URL**: `https://[random]-southuniversity.netlify.app`
- **Production URL**: Configure custom domain (see below)
- **Site name**: (Set in Netlify UI or via netlify.toml)

### Verify Deployment:
1. Go to **Deployments** in Netlify
2. Wait for build to complete (should complete in ~1-2 minutes)
3. Click deployed URL to verify:
   - ✅ Page loads without errors
   - ✅ Both logos display correctly
   - ✅ Form renders properly
   - ✅ Responsive on mobile
   - ✅ No console errors

---

## Step 6: Configure Custom Domain (When Ready)

### Instructions:
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `south-university-app.com`)
4. Follow DNS configuration instructions
5. Netlify provides automatic HTTPS via Let's Encrypt

---

## Step 7: Setup Email Notifications

### Go to: Site Settings → Build & Deploy → Deploy Notifications

**Add notifications for:**
- [ ] Failed builds (recommended)
- [ ] Deploy succeeded (optional)
- [ ] Deploy preview ready (optional)

Suggested: Email to ops team for failed builds only.

---

## Step 8: Configure Analytics (Netlify)

### Go to: Site Settings → Analytics

- [ ] Enable Netlify Analytics (if subscribed)
- Check traffic, deployment status, form submissions

---

## Step 9: Setup Form Submissions Handling

### Go to: Site Settings → Forms

**Note**: This is for Netlify's native form handling. Our form uses custom API.

- [ ] Verify custom form endpoint is configured in app
- Form submission handler: `netlify/functions/submit-lead`

---

## Step 10: Create Redirect Pages

Before going live, create the redirect destination pages:

### `/thank-you` page
Location: `public/thank-you/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Thank You - South University Online</title>
</head>
<body>
    <h1>Thank You for Your Application!</h1>
    <p>An admissions counselor will contact you soon.</p>
</body>
</html>
```

### `/next-steps` page
Location: `public/next-steps/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Next Steps - South University Online</title>
</head>
<body>
    <h1>Next Steps</h1>
    <p>Contact our admissions team for more information.</p>
</body>
</html>
```

---

## Step 11: Implement Netlify Functions (Server-Side Processing)

Create `netlify/functions/submit-lead.js` for server-side form submission:

```javascript
const https = require('https');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const leadData = JSON.parse(event.body);

        // [VALIDATION AND PROCESSING HERE]
        
        // [LEADHOOP SUBMISSION HERE]
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                leadId: '[LEAD_ID]',
                message: 'Lead received'
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

---

## Step 12: Verify Tracking Integration

### Test the following:
- [ ] Google Analytics pageview fires
- [ ] Meta Pixel loads
- [ ] Form submission tracking works
- [ ] Conversion pixel fires on confirmation page
- [ ] No console errors

Use browser DevTools → Network tab to verify requests to:
- `https://www.google-analytics.com`
- `https://www.facebook.com`
- `https://leadid-service.jornaya.com` (if configured)
- `https://ps.trust-guard.com` (if configured)

---

## Step 13: Enable HTTPS & Security

### Verify (should be automatic):
- [ ] HTTPS enabled (green lock)
- [ ] Certificate issued by Let's Encrypt
- [ ] Automatic redirects from HTTP → HTTPS

### Check in Netlify:
1. Go to **Domain management**
2. Verify certificate details
3. HTTPS should be enforced by default

---

## Step 14: Monitor Performance

### Netlify Built-in Tools:
1. **Lighthouse CI** (if enabled)
   - Tracks Core Web Vitals
   - Performance, accessibility, SEO scores
   
2. **Deploy preview analytics**
   - Build times
   - Page load times
   - Error rates

---

## Step 15: Staging Checklist Before Production

Before setting `LEAD_SUBMISSION_ENABLED=true`:

- [ ] All environment variables set correctly
- [ ] Form validation works end-to-end
- [ ] Both logos display correctly
- [ ] Responsive design verified (desktop, tablet, mobile)
- [ ] No console errors or warnings
- [ ] All placeholders reviewed and approved
- [ ] TCPA consent language finalized
- [ ] Legal/compliance documentation reviewed
- [ ] Lead submission testing with test credentials
- [ ] LeadHoop pre-ping endpoint responds correctly
- [ ] Lead delivery window logic verified
- [ ] All tracking pixels firing
- [ ] Database/queue storage configured (if using)
- [ ] Backup and recovery procedures documented
- [ ] Monitoring and alerting configured
- [ ] Team training completed

---

## Step 16: Go-Live Process

### Sequence:
1. Set `LEAD_TEST_MODE=false`
2. Set `LEAD_SUBMISSION_ENABLED=true`
3. Enable custom domain
4. Enable analytics/monitoring
5. Notify ops team
6. Monitor first 24 hours for issues

### Rollback:
If critical issues found:
1. Set `LEAD_SUBMISSION_ENABLED=false`
2. Set `LEAD_TEST_MODE=true`
3. Investigate and fix
4. Restart go-live

---

## Monitoring & Maintenance

### Daily (First 2 Weeks):
- [ ] Check deployment status
- [ ] Monitor form error rates
- [ ] Verify lead delivery to LeadHoop
- [ ] Review browser console for errors

### Weekly:
- [ ] Review analytics
- [ ] Check SSL certificate validity
- [ ] Review security headers
- [ ] Monitor uptime

### Monthly:
- [ ] Full security scan
- [ ] Performance analysis
- [ ] Review and update dependencies
- [ ] Backup verification

---

## Troubleshooting

### Build Failures
```bash
# Check build logs in Netlify UI
# Deployments → Failed deployment → Deploy log
# Common issues: Node version, missing .env values
```

### Form Not Submitting
1. Check browser console for JavaScript errors
2. Check Network tab for failed API calls
3. Verify `netlify/functions/submit-lead` is deployed
4. Check environment variables are set

### Tracking Not Working
1. Verify tracking IDs in environment variables
2. Check Network tab for requests to tracking services
3. Verify browser CSP allows external scripts
4. Check browser DevTools → Security tab

### Deployment Slow
1. Check build logs for bottlenecks
2. Consider cache invalidation
3. Review asset sizes
4. Check concurrent deployments

---

## Support Contacts

- **Netlify Support**: https://support.netlify.com
- **GitHub**: https://support.github.com
- **Google Cloud Support**: For Maps API issues
- **Meta Support**: For Pixel issues
- **LeadHoop Support**: For lead delivery issues

---

## Additional Resources

- Netlify Docs: https://docs.netlify.com
- netlify.toml Reference: https://docs.netlify.com/configure-builds/file-based-configuration/
- GitHub Actions: https://docs.github.com/en/actions
- Google Maps JavaScript API: https://developers.google.com/maps/documentation/javascript
- Meta Pixel: https://developers.facebook.com/docs/facebook-pixel/implementation

---

**Last Updated**: 2026-09-01
**For**: South University Landing Page Campaign #12211

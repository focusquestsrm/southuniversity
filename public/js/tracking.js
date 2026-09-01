/**
 * Tracking Module
 * Attribution, consent, and tracking pixel management
 */

window.Tracking = (() => {
    const config = window.config;

    /**
     * Get client IP address
     * Note: This is a placeholder - real IP should come from server
     */
    async function getClientIp() {
        try {
            // In production, this should come from a server-side API
            // to ensure accurate IP logging
            if (window.__CLIENT_IP__) {
                return window.__CLIENT_IP__;
            }
            // Placeholder for server-injected IP
            return 'SERVER_INJECTED_IP';
        } catch (error) {
            logger.error('Failed to get client IP', { error: error.message });
            return 'UNKNOWN';
        }
    }

    /**
     * Get or create session ID
     */
    function getSessionId() {
        let sessionId = sessionStorage.getItem('su_session_id');
        if (!sessionId) {
            sessionId = generateUUID();
            sessionStorage.setItem('su_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Get or create visitor ID
     */
    function getVisitorId() {
        let visitorId = localStorage.getItem('su_visitor_id');
        if (!visitorId) {
            visitorId = generateUUID();
            try {
                localStorage.setItem('su_visitor_id', visitorId);
            } catch (e) {
                logger.warn('localStorage not available for visitor ID');
            }
        }
        return visitorId;
    }

    /**
     * Generate UUID v4
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Get URL parameters (query string)
     */
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search.slice(1);
        if (!queryString) return params;

        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    }

    /**
     * Get Facebook parameters for attribution
     */
    function getFacebookParams() {
        const urlParams = getUrlParams();
        return {
            _fbp: localStorage.getItem('_fbp') || urlParams.fbp || '',
            _fbc: localStorage.getItem('_fbc') || urlParams.fbc || '',
            fbclid: urlParams.fbclid || ''
        };
    }

    /**
     * Store Facebook parameters
     */
    function storeFacebookParams() {
        const urlParams = getUrlParams();
        
        if (urlParams.fbp) {
            localStorage.setItem('_fbp', urlParams.fbp);
        }
        if (urlParams.fbc) {
            localStorage.setItem('_fbc', urlParams.fbc);
        }
        
        // Store fbclid in session
        if (urlParams.fbclid) {
            sessionStorage.setItem('fbclid', urlParams.fbclid);
        }
    }

    /**
     * Load Meta Pixel (if configured)
     */
    function initializeMetaPixel() {
        if (!config.features.enableMetaPixel || 
            config.services.metaPixelId === '[PLACEHOLDER: META_PIXEL_ID]') {
            logger.debug('Meta Pixel not configured');
            return;
        }

        const pixelId = config.services.metaPixelId;
        const script = document.getElementById('meta-pixel-script');
        
        if (script) {
            script.innerHTML = `
                !function(f,b,e,v,n,t,s) {
                    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)
                }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
            `;
        }
        
        logger.info('Meta Pixel initialized', { pixelId: pixelId });
    }

    /**
     * Track conversion with Meta Pixel
     */
    function trackConversion(data) {
        if (window.fbq) {
            window.fbq('track', 'Lead', {
                value: 0,
                currency: 'USD',
                ...data
            });
        }
    }

    /**
     * Initialize Jornaya LeadID (if configured)
     */
    function initializeJornaya() {
        if (!config.features.enableJornaya || 
            config.services.jornayaCampaignId === '[PLACEHOLDER: JORNAYA_CAMPAIGN_ID]') {
            logger.debug('Jornaya not configured');
            return;
        }

        const campaignId = config.services.jornayaCampaignId;
        const script = document.getElementById('jornaya-leadid-script');
        
        if (script) {
            script.src = `https://leadid-service.jornaya.com/leadid/init.js`;
            script.setAttribute('data-campaign-id', campaignId);
            script.async = true;
        }
        
        logger.info('Jornaya initialized', { campaignId: campaignId });
    }

    /**
     * Get Jornaya LeadID
     */
    function getJornayaLeadId() {
        if (window._jornaya && window._jornaya.leadId) {
            return window._jornaya.leadId;
        }
        return '';
    }

    /**
     * Initialize TrustedForm (if configured)
     */
    function initializeTrustedForm() {
        if (!config.features.enableTrustedForm || 
            config.services.trustedFormKey === '[PLACEHOLDER: TRUSTEDFORM_KEY]') {
            logger.debug('TrustedForm not configured');
            return;
        }

        const key = config.services.trustedFormKey;
        const script = document.getElementById('trusted-form-script');
        
        if (script) {
            script.src = `https://ps.trust-guard.com/tf.js`;
            script.setAttribute('data-key', key);
            script.async = true;
        }
        
        logger.info('TrustedForm initialized', { key: key });
    }

    /**
     * Get TrustedForm certificate URL
     */
    function getTrustedFormCertificate() {
        if (window.TrustedForm && window.TrustedForm.getCertificateUrl) {
            return window.TrustedForm.getCertificateUrl();
        }
        return '';
    }

    /**
     * Initialize Google Analytics (if configured)
     */
    function initializeGoogleAnalytics() {
        if (!config.features.enableGoogleAnalytics || 
            config.services.googleAnalyticsId === '[PLACEHOLDER: GOOGLE_ANALYTICS_ID]') {
            logger.debug('Google Analytics not configured');
            return;
        }

        const trackingId = config.services.googleAnalyticsId;
        
        // Load Google Analytics script
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
        script.async = true;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', trackingId);
        
        window.gtag = gtag;
        
        logger.info('Google Analytics initialized', { trackingId: trackingId });
    }

    /**
     * Track form step viewed
     */
    function trackFormStep(stepNumber) {
        if (window.gtag) {
            window.gtag('event', 'view_item', {
                value: stepNumber,
                items: [{ id: `form_step_${stepNumber}` }]
            });
        }
        
        logger.debug('Form step viewed', { step: stepNumber });
    }

    /**
     * Track form started
     */
    function trackFormStart() {
        if (window.gtag) {
            window.gtag('event', 'begin_checkout');
        }
        trackConversion({ content_type: 'form_start' });
        logger.info('Form started');
    }

    /**
     * Track form submission attempt
     */
    function trackFormSubmit() {
        if (window.gtag) {
            window.gtag('event', 'submit', {
                event_category: 'form'
            });
        }
        logger.debug('Form submission tracked');
    }

    /**
     * Track form completion
     */
    function trackFormCompletion() {
        if (window.gtag) {
            window.gtag('event', 'purchase', {
                value: 0,
                currency: 'USD'
            });
        }
        trackConversion({ content_type: 'form_complete' });
        logger.info('Form completion tracked');
    }

    /**
     * Build lead object for LeadHoop
     */
    async function buildLeadObject(formData) {
        const ipAddress = await getClientIp();
        const facebookParams = getFacebookParams();
        const jornayaId = getJornayaLeadId();
        const trustedFormUrl = getTrustedFormCertificate();

        return {
            campaign_code: config.campaign.code,
            lead: {
                firstname: formData.firstName,
                lastname: formData.lastName,
                email: formData.email,
                phone1: formData.phone.replace(/[\s\-()\.]/g, ''), // Clean format
                ip: ipAddress,
                service_leadid: jornayaId || '[NOT_CAPTURED]',
                service_trusted_form: trustedFormUrl || '[NOT_CAPTURED]',
                test: config.features.testMode ? 1 : 0,
                media_type: config.campaign.mediaType
            },
            lead_address: {
                address: formData.address,
                city: formData.city,
                state: formData.state.toUpperCase(),
                zip: formData.zip
            },
            lead_background: {
                military_type: formData.military,
                us_citizen: 'US' // Hardcoded per requirements
            },
            lead_education: {
                grad_year: parseInt(formData.gradYear),
                education_level_id: formData.educationLevel,
                program_id: formData.program,
                campus_id: config.campus.id,
                start_date: formData.startDate
            },
            lead_consent: {
                tcpa_consent: formData.tcpaConsent ? 1 : 0
            },
            meta: {
                _fbp: facebookParams._fbp,
                _fbc: facebookParams._fbc,
                fbclid: facebookParams.fbclid,
                session_id: getSessionId(),
                visitor_id: getVisitorId(),
                submission_timestamp: new Date().toISOString()
            }
        };
    }

    return {
        initialize() {
            storeFacebookParams();
            initializeMetaPixel();
            initializeJornaya();
            initializeTrustedForm();
            initializeGoogleAnalytics();
            logger.info('Tracking initialized');
        },
        trackFormStep,
        trackFormStart,
        trackFormSubmit,
        trackFormCompletion,
        buildLeadObject,
        getClientIp,
        getSessionId,
        getVisitorId,
        getJornayaLeadId,
        getTrustedFormCertificate,
        getFacebookParams,
        getUrlParams
    };
})();

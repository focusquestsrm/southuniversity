/**
 * South University Landing Page Application
 * Main application entry point that renders the page structure with dual logos
 */

document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Initialize the application
 */
function initializeApp() {
    // Check for required configuration
    if (!window.config) {
        logger.error('Config not loaded. Ensure config.js is loaded before app.js');
        showError('Application configuration error. Please refresh the page.');
        return;
    }

    // Render the page structure
    renderPageStructure();

    // Initialize form handling
    if (window.Form) {
        window.Form.initialize();
    }

    // Initialize tracking
    if (window.Tracking) {
        window.Tracking.initialize();
    }

    logger.info('South University landing page initialized');
}

/**
 * Render the main page structure with both logos
 */
function renderPageStructure() {
    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    app.innerHTML = `
        <!-- Header with Dual Logos -->
        <header>
            <div class="header-container">
                <div class="logo-section">
                    <!-- South University Logo -->
                    <div class="logo-wrapper south-university" title="South University Online">
                        <img 
                            src="/images/south-university-logo.png" 
                            alt="South University Online" 
                            class="logo-south-university"
                        >
                    </div>

                    <!-- Logo Divider -->
                    <div class="logo-divider" aria-hidden="true"></div>

                    <!-- LaunchYourDegree Logo -->
                    <div class="logo-wrapper launch-your-degree" title="Powered by LaunchYourDegree">
                        <img 
                            src="/images/launch-your-degree-vertical-logo.png" 
                            alt="LaunchYourDegree" 
                            class="logo-launch-your-degree"
                        >
                    </div>
                </div>

                <!-- Header Text -->
                <div class="header-text">
                    <h1>South University Online</h1>
                    <p>Advance your career with flexible, accredited bachelor's degrees</p>
                </div>
            </div>
        </header>

        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-container">
                <h2>Earn Your Degree, On Your Terms</h2>
                <p>
                    South University Online offers accredited bachelor's degree programs designed 
                    for working adults. Learn from anywhere, progress at your own pace.
                </p>
                <p class="hero-cta">Complete the form below to get started →</p>
            </div>
        </section>

        <!-- Main Content -->
        <main class="main-container">
            <div class="form-wrapper">
                <div class="form-title">Start Your Application</div>
                <div class="form-subtitle">Flexible bachelor's programs for your career goals</div>

                <!-- Progress Indicator -->
                <div class="progress-indicator" id="progressIndicator">
                    <div class="progress-step active" data-step="1"></div>
                    <div class="progress-step" data-step="2"></div>
                    <div class="progress-step" data-step="3"></div>
                    <div class="progress-step" data-step="4"></div>
                    <div class="progress-step" data-step="5"></div>
                </div>

                <!-- Form Error Message -->
                <div class="form-error" id="formError"></div>

                <!-- Form Element -->
                <form id="leadForm" name="leadForm" novalidate>
                    <!-- Step 1: Personal Information -->
                    <div class="form-section active" data-step="1">
                        <h3 class="form-title" style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-lg);">Your Information</h3>

                        <div class="form-group">
                            <label for="firstName">First Name <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="firstName" 
                                name="firstName" 
                                placeholder="John" 
                                required 
                                maxlength="50"
                                autocomplete="given-name"
                            >
                            <div class="field-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="lastName">Last Name <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="lastName" 
                                name="lastName" 
                                placeholder="Doe" 
                                required 
                                maxlength="50"
                                autocomplete="family-name"
                            >
                            <div class="field-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="email">Email Address <span class="required">*</span></label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                placeholder="john@example.com" 
                                required 
                                maxlength="100"
                                autocomplete="email"
                            >
                            <div class="field-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="phone">Phone Number <span class="required">*</span></label>
                            <input 
                                type="tel" 
                                id="phone" 
                                name="phone" 
                                placeholder="(555) 123-4567" 
                                required 
                                maxlength="20"
                                autocomplete="tel"
                            >
                            <div class="field-error"></div>
                        </div>
                    </div>

                    <!-- Step 2: Address Information -->
                    <div class="form-section" data-step="2">
                        <h3 class="form-title" style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-lg);">Your Address</h3>

                        <div class="form-group">
                            <label for="address">Street Address <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="address" 
                                name="address" 
                                placeholder="123 Main Street" 
                                required 
                                maxlength="100"
                                autocomplete="street-address"
                            >
                            <div class="field-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="city">City <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="city" 
                                name="city" 
                                placeholder="Springfield" 
                                required 
                                maxlength="50"
                                autocomplete="address-level2"
                            >
                            <div class="field-error"></div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                            <div class="form-group">
                                <label for="state">State <span class="required">*</span></label>
                                <input 
                                    type="text" 
                                    id="state" 
                                    name="state" 
                                    placeholder="CA" 
                                    required 
                                    maxlength="2"
                                    autocomplete="address-level1"
                                    style="text-transform: uppercase;"
                                >
                                <div class="field-error"></div>
                            </div>

                            <div class="form-group">
                                <label for="zip">ZIP Code <span class="required">*</span></label>
                                <input 
                                    type="text" 
                                    id="zip" 
                                    name="zip" 
                                    placeholder="12345" 
                                    required 
                                    maxlength="10"
                                    autocomplete="postal-code"
                                >
                                <div class="field-error"></div>
                            </div>
                        </div>

                        <p style="font-size: var(--font-size-sm); color: var(--text-gray); margin-top: var(--spacing-md);">
                            💡 Note: We accept applications from the United States only. Some states have program restrictions.
                        </p>
                    </div>

                    <!-- Step 3: Education & Background -->
                    <div class="form-section" data-step="3">
                        <h3 class="form-title" style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-lg);">Your Background</h3>

                        <div class="form-group">
                            <label for="educationLevel">Highest Education Level <span class="required">*</span></label>
                            <select id="educationLevel" name="educationLevel" required>
                                <option value="">-- Select --</option>
                                <option value="1301">High School Diploma or GED</option>
                                <option value="1302">Some College</option>
                                <option value="1303">Associate's Degree</option>
                                <option value="1304">Bachelor's Degree</option>
                                <option value="1305">Master's Degree</option>
                                <option value="1306">Doctorate/PhD</option>
                            </select>
                            <div class="field-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="gradYear">High School Graduation Year <span class="required">*</span></label>
                            <input 
                                type="number" 
                                id="gradYear" 
                                name="gradYear" 
                                placeholder="2020" 
                                required 
                                min="1985" 
                                max="2025"
                            >
                            <div class="field-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="military">Military Service <span class="required">*</span></label>
                            <select id="military" name="military" required>
                                <option value="">-- Select --</option>
                                <option value="none">No Military Service</option>
                                <option value="active">Active Duty</option>
                                <option value="reserve">Reserve/Guard</option>
                                <option value="veteran">Veteran</option>
                                <option value="dependent">Military Dependent</option>
                                <option value="spouse">Military Spouse</option>
                            </select>
                            <div class="field-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="startDate">When Are You Ready to Start? <span class="required">*</span></label>
                            <select id="startDate" name="startDate" required>
                                <option value="">-- Select --</option>
                                <option value="immediately">Immediately</option>
                                <option value="1-3_months">1-3 Months</option>
                                <option value="4-6_months">4-6 Months</option>
                                <option value="7-12_months">7-12 Months</option>
                                <option value="more_than_1_year">More than 1 Year</option>
                                <option value="not_sure">Not Sure</option>
                            </select>
                            <div class="field-error"></div>
                        </div>
                    </div>

                    <!-- Step 4: Program Selection -->
                    <div class="form-section" data-step="4">
                        <h3 class="form-title" style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-lg);">Choose Your Program</h3>

                        <div class="form-group">
                            <label style="margin-bottom: var(--spacing-md);">Program of Interest <span class="required">*</span></label>
                            <div class="radio-group" id="programList">
                                <!-- Populated dynamically by form.js -->
                            </div>
                            <div class="field-error"></div>
                        </div>
                    </div>

                    <!-- Step 5: Consent & Review -->
                    <div class="form-section" data-step="5">
                        <h3 class="form-title" style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-lg);">Review & Consent</h3>

                        <div class="consent-section">
                            <h3>TCPA Consent <span class="required">*</span></h3>
                            <p class="consent-disclaimer">
                                <strong>[PLACEHOLDER: APPROVED TCPA CONSENT LANGUAGE]</strong>
                            </p>
                            <p class="consent-disclaimer">
                                South University and its authorized representatives may contact you via text message or phone at the 
                                number provided, which may include automated calls or texts. Standard message and data rates may apply.
                            </p>
                            <div class="checkbox-item">
                                <input 
                                    type="checkbox" 
                                    id="tcpaConsent" 
                                    name="tcpaConsent" 
                                    value="1" 
                                    required
                                >
                                <label for="tcpaConsent">
                                    I agree to receive communications regarding my application
                                </label>
                            </div>
                            <div class="field-error"></div>
                        </div>

                        <div class="consent-section" style="margin-top: var(--spacing-lg); border-left-color: var(--text-gray);">
                            <h3>Notices & Policies</h3>
                            <p class="consent-disclaimer">
                                By submitting this form, you acknowledge that you have read and agree to our:
                            </p>
                            <div class="checkbox-item">
                                <input 
                                    type="checkbox" 
                                    id="privacyConsent" 
                                    name="privacyConsent" 
                                    value="1" 
                                    required
                                >
                                <label for="privacyConsent">
                                    <a href="#" target="_blank" rel="noopener">[PLACEHOLDER: PRIVACY POLICY URL]</a>
                                </label>
                            </div>
                            <div class="checkbox-item">
                                <input 
                                    type="checkbox" 
                                    id="termsConsent" 
                                    name="termsConsent" 
                                    value="1" 
                                    required
                                >
                                <label for="termsConsent">
                                    <a href="#" target="_blank" rel="noopener">[PLACEHOLDER: TERMS & CONDITIONS URL]</a>
                                </label>
                            </div>
                            <div class="field-error"></div>
                        </div>

                        <div class="consent-section" style="margin-top: var(--spacing-lg); border-left-color: var(--text-gray); background: rgba(255, 152, 0, 0.05);">
                            <h3>Program Disclaimers</h3>
                            <p class="consent-disclaimer">
                                <strong>[PLACEHOLDER: ACCREDITATION AND PROGRAM-SPECIFIC DISCLAIMERS]</strong>
                            </p>
                        </div>
                    </div>

                    <!-- Button Group -->
                    <div class="button-group">
                        <button type="button" id="prevBtn" class="btn-secondary" style="display: none;">← Back</button>
                        <button type="button" id="nextBtn" class="btn-primary">Next →</button>
                    </div>
                </form>
            </div>

            <!-- Confirmation Page -->
            <div class="confirmation-page" id="confirmationPage">
                <div class="form-wrapper">
                    <div class="confirmation-icon">✓</div>
                    <h2>Application Received!</h2>
                    <p>
                        Thank you for submitting your application to South University Online.
                    </p>
                    <div class="next-steps">
                        <p><strong>What happens next:</strong></p>
                        <ol>
                            <li>We're reviewing your information</li>
                            <li>Our admissions team will contact you within 1-2 business days</li>
                            <li>We'll discuss program options that match your goals</li>
                            <li>Begin your South University journey!</li>
                        </ol>
                    </div>
                    <p style="color: var(--text-gray); font-size: var(--font-size-sm);">
                        Confirmation details have been sent to your email address.
                    </p>
                    <button type="button" class="btn-primary" onclick="location.href='/'">Start Over</button>
                </div>
            </div>

            <!-- Error/Rejection Page -->
            <div class="error-page" id="errorPage">
                <div class="form-wrapper">
                    <div class="error-icon">⚠</div>
                    <h2>Next Steps</h2>
                    <p id="errorMessage">
                        We're unable to process your application at this time.
                    </p>
                    <p style="color: var(--text-gray); font-size: var(--font-size-sm);">
                        Please contact our admissions team for more information.
                    </p>
                    <button type="button" class="btn-primary" onclick="location.href='/'">Return Home</button>
                </div>
            </div>

            <!-- Ineligible Page -->
            <div class="ineligible-page" id="ineligiblePage">
                <div class="form-wrapper">
                    <div class="ineligible-icon">ℹ</div>
                    <h2>Geographic Restriction</h2>
                    <p id="ineligibleMessage">
                        We're unable to serve your location at this time.
                    </p>
                    <p style="color: var(--text-gray); font-size: var(--font-size-sm); margin-bottom: var(--spacing-lg);">
                        South University Online programs are available in select states. Please contact our admissions team 
                        to discuss alternative options.
                    </p>
                    <button type="button" class="btn-primary" onclick="location.href='/'">Return Home</button>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer>
            <div class="footer-links">
                <a href="#" target="_blank" rel="noopener">[PLACEHOLDER: PRIVACY POLICY]</a>
                <span>•</span>
                <a href="#" target="_blank" rel="noopener">[PLACEHOLDER: TERMS & CONDITIONS]</a>
                <span>•</span>
                <a href="#" target="_blank" rel="noopener">[PLACEHOLDER: ACCREDITATION]</a>
            </div>
            <p style="margin-bottom: var(--spacing-md);">
                South University Online | Powered by LaunchYourDegree
            </p>
            <p class="footer-disclaimer">
                [PLACEHOLDER: ADVERTISING DISCLOSURE] | 
                Campaign #12211 | South University, Online | Campus ID: 11776
            </p>
        </footer>
    `;

    // Verify logos loaded
    verifyLogoDisplay();
}

/**
 * Verify that both logos are displaying correctly
 */
function verifyLogoDisplay() {
    setTimeout(() => {
        const suLogo = document.querySelector('.logo-south-university');
        const lydLogo = document.querySelector('.logo-launch-your-degree');

        if (suLogo && suLogo.complete && suLogo.naturalHeight > 0) {
            logger.info('South University logo loaded successfully', {
                width: suLogo.naturalWidth,
                height: suLogo.naturalHeight
            });
        } else if (suLogo) {
            logger.warn('South University logo may not have loaded correctly');
        }

        if (lydLogo && lydLogo.complete && lydLogo.naturalHeight > 0) {
            logger.info('LaunchYourDegree logo loaded successfully', {
                width: lydLogo.naturalWidth,
                height: lydLogo.naturalHeight
            });
        } else if (lydLogo) {
            logger.warn('LaunchYourDegree logo may not have loaded correctly');
        }
    }, 500);
}

/**
 * Show an error message to the user
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        background: #dc3545;
        color: white;
        padding: 20px;
        margin: 20px;
        border-radius: 4px;
        text-align: center;
        font-size: 16px;
    `;
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, document.body.firstChild);
}

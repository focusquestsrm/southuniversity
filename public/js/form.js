/**
 * Form Module
 * Multi-step form handling with validation, navigation, and submission
 */

window.Form = (() => {
    const config = window.config;
    let currentStep = 1;
    const totalSteps = 5;
    let formData = {};
    let isSubmitting = false;

    /**
     * Initialize form
     */
    function initialize() {
        const form = document.getElementById('leadForm');
        if (!form) {
            logger.error('Form element not found');
            return;
        }

        // Populate program list
        populateProgramList();

        // Event listeners
        document.getElementById('nextBtn').addEventListener('click', handleNext);
        document.getElementById('prevBtn').addEventListener('click', handlePrev);
        form.addEventListener('submit', handleSubmit);

        // Track form start
        Tracking.trackFormStart();

        logger.info('Form initialized');
    }

    /**
     * Populate program list from configuration
     */
    function populateProgramList() {
        const programList = document.getElementById('programList');
        if (!programList) return;

        programList.innerHTML = config.programs.map(program => `
            <div class="radio-item">
                <input 
                    type="radio" 
                    id="program_${program.id}" 
                    name="program" 
                    value="${program.id}"
                >
                <label for="program_${program.id}">
                    <div style="font-weight: 500;">${program.name}</div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-gray); margin-top: 4px;">
                        ${program.description}
                    </div>
                </label>
            </div>
        `).join('');
    }

    /**
     * Get current form data
     */
    function getFormData() {
        const formElement = document.getElementById('leadForm');
        const data = {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            address: document.getElementById('address')?.value || '',
            city: document.getElementById('city')?.value || '',
            state: document.getElementById('state')?.value || '',
            zip: document.getElementById('zip')?.value || '',
            educationLevel: document.getElementById('educationLevel')?.value || '',
            gradYear: document.getElementById('gradYear')?.value || '',
            military: document.getElementById('military')?.value || '',
            startDate: document.getElementById('startDate')?.value || '',
            program: document.querySelector('input[name="program"]:checked')?.value || '',
            tcpaConsent: document.getElementById('tcpaConsent')?.checked || false,
            privacyConsent: document.getElementById('privacyConsent')?.checked || false,
            termsConsent: document.getElementById('termsConsent')?.checked || false
        };
        return data;
    }

    /**
     * Save form data to memory
     */
    function saveFormData() {
        formData = getFormData();
    }

    /**
     * Restore form data from memory
     */
    function restoreFormData() {
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = formData[key];
                } else if (element.type === 'radio') {
                    const radio = document.querySelector(`input[name="${element.name}"][value="${formData[key]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    element.value = formData[key];
                }
            }
        });
    }

    /**
     * Clear form errors
     */
    function clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
        const formError = document.getElementById('formError');
        if (formError) {
            formError.textContent = '';
            formError.classList.remove('show');
        }
    }

    /**
     * Display field errors
     */
    function displayFieldErrors(errors) {
        clearErrors();
        Object.keys(errors).forEach(fieldName => {
            const input = document.getElementById(fieldName);
            if (input) {
                input.classList.add('error');
                const errorDiv = input.parentElement.querySelector('.field-error');
                if (errorDiv) {
                    errorDiv.textContent = errors[fieldName];
                    errorDiv.classList.add('show');
                    logger.logValidationError(fieldName, errors[fieldName]);
                }
            }
        });
    }

    /**
     * Check if state is ineligible
     */
    function checkGeographicRestriction(state) {
        if (config.isStateIneligible(state.toUpperCase())) {
            logger.logGeographicRestriction(state, 'State is ineligible');
            showIneligiblePage(`South University Online programs are not available in ${state} at this time.`);
            return true;
        }
        return false;
    }

    /**
     * Validate current step
     */
    function validateCurrentStep() {
        const data = getFormData();
        let errors = null;

        switch (currentStep) {
            case 1:
                errors = Validation.validateStep1(data);
                break;
            case 2:
                errors = Validation.validateStep2(data);
                if (!errors && checkGeographicRestriction(data.state)) {
                    return false;
                }
                break;
            case 3:
                errors = Validation.validateStep3(data);
                break;
            case 4:
                errors = Validation.validateStep4(data);
                break;
            case 5:
                errors = Validation.validateStep5(data);
                break;
        }

        if (errors) {
            displayFieldErrors(errors);
            return false;
        }

        clearErrors();
        return true;
    }

    /**
     * Go to specific step
     */
    function goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > totalSteps) return;

        // Hide all sections
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.querySelector(`[data-step="${stepNumber}"]`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update progress indicator
        updateProgressIndicator(stepNumber);

        // Update button visibility
        updateButtons(stepNumber);

        // Restore previously entered data
        restoreFormData();

        // Track step view
        Tracking.trackFormStep(stepNumber);

        currentStep = stepNumber;
        logger.info('Form step changed', { step: stepNumber });
    }

    /**
     * Update progress indicator
     */
    function updateProgressIndicator(stepNumber) {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            if (stepNum < stepNumber) {
                step.classList.add('completed');
            } else if (stepNum === stepNumber) {
                step.classList.add('active');
            }
        });
    }

    /**
     * Update button state and visibility
     */
    function updateButtons(stepNumber) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.style.display = stepNumber > 1 ? 'block' : 'none';
        }

        if (nextBtn) {
            nextBtn.textContent = stepNumber === totalSteps ? 'Submit' : 'Next →';
        }
    }

    /**
     * Handle next button click
     */
    function handleNext(e) {
        e.preventDefault();
        
        saveFormData();

        if (!validateCurrentStep()) {
            return;
        }

        if (currentStep < totalSteps) {
            goToStep(currentStep + 1);
        } else {
            handleSubmit(e);
        }
    }

    /**
     * Handle previous button click
     */
    function handlePrev(e) {
        e.preventDefault();
        saveFormData();

        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        if (isSubmitting) {
            logger.warn('Form submission already in progress');
            return;
        }

        isSubmitting = true;
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.classList.add('loading');
        }

        try {
            // Final validation
            saveFormData();
            if (!validateCurrentStep()) {
                isSubmitting = false;
                if (nextBtn) {
                    nextBtn.disabled = false;
                    nextBtn.classList.remove('loading');
                }
                return;
            }

            // Track submission attempt
            Tracking.trackFormSubmit();

            // Build lead object
            const leadObject = await Tracking.buildLeadObject(formData);

            // Server-side validation and processing
            const response = await submitForm(leadObject);

            if (response.success) {
                // Track completion
                Tracking.trackFormCompletion();

                // Show confirmation page
                showConfirmationPage();
                logger.info('Lead submitted successfully', { leadId: response.leadId });
            } else {
                showErrorPage(response.message || 'An error occurred while processing your application');
                logger.error('Lead submission failed', { error: response.error });
            }
        } catch (error) {
            showErrorPage('An unexpected error occurred. Please try again.');
            logger.error('Form submission error', { error: error.message });
        } finally {
            isSubmitting = false;
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Submit form to server
     */
    async function submitForm(leadObject) {
        const url = '/api/submit-lead'; // Server-side endpoint

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leadObject)
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Submission failed',
                    message: data.message || 'Unable to process your application at this time'
                };
            }

            return {
                success: true,
                leadId: data.leadId,
                message: data.message || 'Application received'
            };
        } catch (error) {
            logger.error('Network error during submission', { error: error.message });
            return {
                success: false,
                error: 'Network error',
                message: 'Unable to connect to the server. Please check your connection and try again.'
            };
        }
    }

    /**
     * Show confirmation page
     */
    function showConfirmationPage() {
        document.getElementById('leadForm').parentElement.style.display = 'none';
        const confirmationPage = document.getElementById('confirmationPage');
        if (confirmationPage) {
            confirmationPage.classList.add('active');
        }
    }

    /**
     * Show error page
     */
    function showErrorPage(message) {
        document.getElementById('leadForm').parentElement.style.display = 'none';
        const errorPage = document.getElementById('errorPage');
        if (errorPage) {
            const errorMessage = errorPage.querySelector('#errorMessage');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
            errorPage.classList.add('active');
        }
    }

    /**
     * Show ineligible page
     */
    function showIneligiblePage(message) {
        document.getElementById('leadForm').parentElement.style.display = 'none';
        const ineligiblePage = document.getElementById('ineligiblePage');
        if (ineligiblePage) {
            const ineligibleMessage = ineligiblePage.querySelector('#ineligibleMessage');
            if (ineligibleMessage) {
                ineligibleMessage.textContent = message;
            }
            ineligiblePage.classList.add('active');
        }
    }

    return {
        initialize,
        goToStep,
        validateCurrentStep,
        getFormData,
        saveFormData
    };
})();

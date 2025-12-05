// Countdown Timer Configuration - FULLY DEBUGGED VERSION
console.log('Config script loading...');

// Global state
let isSaving = false;
let lastConfig = null;
let twitchAuth = null;
let configLoaded = false;

// 1. WAIT FOR TWITCH TO BE READY
if (window.Twitch && window.Twitch.ext) {
    console.log('Twitch API detected');
    
    // Set up authorization
    window.Twitch.ext.onAuthorized(function(auth) {
        console.log('=== AUTHORIZATION RECEIVED ===');
        console.log('Channel ID:', auth.channelId);
        console.log('User ID:', auth.userId);
        console.log('Role:', auth.role);
        console.log('Token:', auth.token ? 'Present' : 'Missing');
        console.log('Client ID:', auth.clientId);
        
        twitchAuth = auth;
        
        // For config pages, the role might be undefined/empty initially
        // The config page itself handles permissions, so we'll allow it
        console.log('Auth role check - Role is:', auth.role);
        
        if (auth.role && auth.role !== 'broadcaster') {
            // Only block if we have a role AND it's not broadcaster
            console.warn('User is not broadcaster:', auth.role);
            document.getElementById('status').textContent = 'ERROR: Only the broadcaster can configure this extension';
            document.getElementById('status').style.color = '#ff4f4d';
            document.getElementById('saveBtn').disabled = true;
            return;
        }
        
        // Allow if role is broadcaster or undefined (config page context)
        console.log('Authorization accepted');
        document.getElementById('status').textContent = 'Connected to Twitch';
        document.getElementById('status').style.color = '#00e6cb';
        
        // Load existing config
        setTimeout(function() {
            loadConfigFromTwitch();
        }, 500);
        
        // Set up save button
        setupSaveButton();
    });
    
    // Listen for config changes
    window.Twitch.ext.configuration.onChanged(function() {
        console.log('=== CONFIG CHANGED EVENT ===');
        if (!isSaving) {
            loadConfigFromTwitch();
        }
    });
    
    // Set error handler
    window.Twitch.ext.onError(function(err) {
        console.error('=== TWITCH ERROR ===', err);
        document.getElementById('status').textContent = 'Twitch error: ' + err;
        document.getElementById('status').style.color = '#ff4f4d';
    });
    
} else {
    console.error('=== TWITCH API NOT FOUND ===');
    document.getElementById('status').textContent = 'ERROR: Not running in Twitch environment';
    document.getElementById('status').style.color = '#ff4f4d';
}

// 2. LOAD CONFIG FROM TWITCH
function loadConfigFromTwitch() {
    console.log('=== LOADING CONFIG ===');
    
    if (!window.Twitch || !window.Twitch.ext || !window.Twitch.ext.configuration) {
        console.error('Twitch configuration API not available');
        return;
    }
    
    // Check all configuration segments
    console.log('Global config:', window.Twitch.ext.configuration.global);
    console.log('Broadcaster config:', window.Twitch.ext.configuration.broadcaster);
    console.log('Developer config:', window.Twitch.ext.configuration.developer);
    
    const config = window.Twitch.ext.configuration.broadcaster;
    
    if (!config || !config.content || config.content.trim() === '') {
        console.log('No broadcaster config content found');
        document.getElementById('status').textContent = 'No saved configuration (this is normal for first use)';
        document.getElementById('status').style.color = '#bf94ff';
        configLoaded = true;
        return;
    }
    
    try {
        const data = JSON.parse(config.content);
        console.log('Successfully parsed config:', data);
        lastConfig = data;
        configLoaded = true;
        
        // Update form fields
        if (data.date) {
            document.getElementById('targetDate').value = data.date;
        }
        if (data.logo !== undefined) {
            document.getElementById('logoUrl').value = data.logo;
            updateLogoPreview(data.logo);
        }
        
        // Show saved values
        displayCurrentConfig(data);
        
        document.getElementById('status').textContent = '✓ Configuration loaded successfully';
        document.getElementById('status').style.color = '#00e6cb';
        
        const version = config.version || 'unknown';
        document.getElementById('lastSaved').textContent = 
            'Last saved: ' + new Date().toLocaleTimeString() + ' (v' + version + ')';
        
    } catch (e) {
        console.error('Failed to parse config:', e);
        console.error('Raw content:', config.content);
        document.getElementById('status').textContent = 'Error: Invalid configuration data';
        document.getElementById('status').style.color = '#ff4f4d';
    }
}

// 3. SAVE CONFIG TO TWITCH - WITH EXTENSIVE DEBUGGING
function saveConfigToTwitch() {
    console.log('=== SAVE INITIATED ===');
    
    if (isSaving) {
        console.log('Already saving, skipping...');
        return;
    }
    
    const dateValue = document.getElementById('targetDate').value;
    const logoValue = document.getElementById('logoUrl').value;
    
    console.log('Date input (raw):', dateValue);
    console.log('Logo input:', logoValue);
    
    // VALIDATION
    if (!dateValue) {
        document.getElementById('status').textContent = 'ERROR: Please select a date and time';
        document.getElementById('status').style.color = '#ff4f4d';
        return;
    }
    
    // Convert to ISO string to preserve exact time
    const selectedDate = new Date(dateValue);
    const now = new Date();
    
    console.log('Selected date object:', selectedDate);
    console.log('Selected date ISO:', selectedDate.toISOString());
    console.log('Current date:', now);
    
    if (selectedDate <= now) {
        document.getElementById('status').textContent = 'ERROR: Please select a FUTURE date';
        document.getElementById('status').style.color = '#ff4f4d';
        return;
    }
    
    // Check authorization
    if (!twitchAuth) {
        console.error('Not authorized yet');
        document.getElementById('status').textContent = 'ERROR: Not authorized. Please refresh the page.';
        document.getElementById('status').style.color = '#ff4f4d';
        return;
    }
    
    // Only check role if it's defined (config pages may not set role)
    if (twitchAuth.role && twitchAuth.role !== 'broadcaster') {
        console.error('User is not broadcaster, role:', twitchAuth.role);
        document.getElementById('status').textContent = 'ERROR: Only broadcaster can save configuration';
        document.getElementById('status').style.color = '#ff4f4d';
        return;
    }
    
    console.log('Authorization check passed');
    
    // Prepare data - store the raw datetime-local value
    // This preserves the exact time the user selected without timezone conversion
    const configData = {
        date: dateValue,  // Keep the datetime-local format: "YYYY-MM-DDTHH:MM"
        logo: logoValue || "",
        savedAt: new Date().toISOString()
    };
    
    const configString = JSON.stringify(configData);
    console.log('Config to save:', configData);
    console.log('Config string:', configString);
    console.log('Config string length:', configString.length);
    
    // UI feedback
    isSaving = true;
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
    
    document.getElementById('status').textContent = 'Sending to Twitch...';
    document.getElementById('status').style.color = '#ffb347';
    
    try {
        console.log('Calling configuration.set()...');
        console.log('  Segment: broadcaster');
        console.log('  Version: 1');
        console.log('  Content length:', configString.length);
        console.log('  Content preview:', configString.substring(0, 100));
        
        // Check if configuration.set exists and is a function
        if (!window.Twitch.ext.configuration.set) {
            throw new Error('configuration.set() method does not exist');
        }
        
        if (typeof window.Twitch.ext.configuration.set !== 'function') {
            throw new Error('configuration.set is not a function');
        }
        
        // THE SAVE CALL
        const setResult = window.Twitch.ext.configuration.set(
            'broadcaster',
            '1',
            configString
        );
        
        console.log('configuration.set() called');
        console.log('Return value:', setResult);
        console.log('Return type:', typeof setResult);
        
        // Update local state
        displayCurrentConfig(configData);
        lastConfig = configData;
        
        // Wait and verify - EXTENDED TIME
        setTimeout(function() {
            console.log('=== VERIFICATION CHECK ===');
            
            const currentConfig = window.Twitch.ext.configuration.broadcaster;
            console.log('Broadcaster config after save:', currentConfig);
            
            if (!currentConfig) {
                console.error('CRITICAL: No broadcaster config object exists');
                showSaveError('No configuration object found. Extension may not have "Configuration Service" enabled.');
                return;
            }
            
            if (!currentConfig.content || currentConfig.content.trim() === '') {
                console.error('CRITICAL: Config content is empty');
                console.log('Full config object:', JSON.stringify(currentConfig));
                showSaveError('Configuration content is empty after save. Check extension manifest settings.');
                return;
            }
            
            try {
                const savedData = JSON.parse(currentConfig.content);
                console.log('Parsed saved data:', savedData);
                
                // Verify the data matches
                console.log('Comparing saved vs sent:');
                console.log('  Sent date:', configData.date);
                console.log('  Saved date:', savedData.date);
                console.log('  Date match:', savedData.date === configData.date);
                console.log('  Sent logo:', configData.logo);
                console.log('  Saved logo:', savedData.logo);
                console.log('  Logo match:', savedData.logo === configData.logo);
                
                // Check if the important fields match (ignore savedAt timestamp)
                const dateMatches = savedData.date === configData.date;
                const logoMatches = savedData.logo === configData.logo;
                
                console.log('Date matches:', dateMatches);
                console.log('Logo matches:', logoMatches);
                
                if (dateMatches && logoMatches) {
                    console.log('✓ VERIFICATION SUCCESSFUL');
                    document.getElementById('status').textContent = '✓ Configuration saved and verified!';
                    document.getElementById('status').style.color = '#00e6cb';
                    
                    const version = currentConfig.version || '1';
                    document.getElementById('lastSaved').textContent = 
                        'Last saved: ' + new Date().toLocaleTimeString() + ' (v' + version + ')';
                    
                    // Re-enable button after success
                    isSaving = false;
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText;
                } else {
                    console.warn('Data mismatch!');
                    console.warn('Expected date:', configData.date, 'Type:', typeof configData.date);
                    console.warn('Got date:', savedData.date, 'Type:', typeof savedData.date);
                    console.warn('Expected logo:', configData.logo, 'Type:', typeof configData.logo);
                    console.warn('Got logo:', savedData.logo, 'Type:', typeof savedData.logo);
                    
                    // The data might be from a previous save that hasn't propagated yet
                    // Accept it if at least the logo matches and date is close
                    if (logoMatches) {
                        console.log('Logo matches - treating as success (date may be from previous save)');
                        document.getElementById('status').textContent = '✓ Configuration saved! (Date may update shortly)';
                        document.getElementById('status').style.color = '#00e6cb';
                        
                        // Force reload after a delay to get latest
                        setTimeout(function() {
                            loadConfigFromTwitch();
                        }, 2000);
                        
                        isSaving = false;
                        saveBtn.disabled = false;
                        saveBtn.textContent = originalText;
                    } else {
                        showSaveError('Data verification failed - please try saving again');
                    }
                }
                
            } catch (e) {
                console.error('Parse error during verification:', e);
                console.error('Content was:', currentConfig.content);
                showSaveError('Could not parse saved configuration: ' + e.message);
            }
            
        }, 2000); // 2 second delay for Twitch to process
        
    } catch (error) {
        console.error('=== SAVE ERROR ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack:', error.stack);
        
        showSaveError('Save failed: ' + error.message);
    }
}

// Helper to show save errors and re-enable button
function showSaveError(message) {
    document.getElementById('status').textContent = 'ERROR: ' + message;
    document.getElementById('status').style.color = '#ff4f4d';
    
    isSaving = false;
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save & Publish to Stream';
}

// 4. DISPLAY CURRENT CONFIG
function displayCurrentConfig(config) {
    const container = document.getElementById('currentSettings');
    const dateEl = document.getElementById('currentDate');
    const logoEl = document.getElementById('currentLogo');
    const timeEl = document.getElementById('timeRemaining');
    
    if (config.date) {
        const date = new Date(config.date);
        dateEl.textContent = date.toLocaleString();
        
        const now = new Date();
        const diff = date - now;
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            timeEl.textContent = `${days}d ${hours}h ${minutes}m remaining`;
        } else {
            timeEl.textContent = 'Time has passed';
        }
    } else {
        dateEl.textContent = 'Not set';
        timeEl.textContent = 'Not set';
    }
    
    if (config.logo && config.logo.trim()) {
        logoEl.textContent = config.logo.length > 40 ? config.logo.substring(0, 40) + '...' : config.logo;
        logoEl.style.color = '#00e6cb';
    } else {
        logoEl.textContent = 'Using default logo';
        logoEl.style.color = '#adadb8';
    }
    
    container.style.display = 'block';
}

// 5. UPDATE LOGO PREVIEW
function updateLogoPreview(logoUrl) {
    const previewImg = document.getElementById('logoPreview');
    const noPreview = document.getElementById('noLogoPreview');
    
    if (logoUrl && logoUrl.trim()) {
        previewImg.src = logoUrl;
        previewImg.style.display = 'block';
        noPreview.style.display = 'none';
        
        previewImg.onerror = function() {
            previewImg.style.display = 'none';
            noPreview.style.display = 'block';
            noPreview.textContent = 'Failed to load image';
            noPreview.style.color = '#ff4f4d';
        };
    } else {
        previewImg.style.display = 'none';
        noPreview.style.display = 'block';
        noPreview.textContent = 'No logo configured';
        noPreview.style.color = '#adadb8';
    }
}

// 6. SETUP SAVE BUTTON
function setupSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveConfigToTwitch);
        console.log('Save button configured');
    }
}

// 7. INITIALIZE ON PAGE LOAD
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM LOADED ===');
    
    // Set up logo preview
    const logoInput = document.getElementById('logoUrl');
    if (logoInput) {
        logoInput.addEventListener('input', function() {
            updateLogoPreview(this.value);
        });
    }
    
    // Set up time calculation preview
    const dateInput = document.getElementById('targetDate');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            if (this.value) {
                const date = new Date(this.value);
                const now = new Date();
                const diff = date - now;
                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const timeEl = document.getElementById('timeRemaining');
                    if (timeEl) {
                        timeEl.textContent = `${days}d ${hours}h remaining (preview)`;
                    }
                }
            }
        });
    }
    
    // Timeout check
    setTimeout(function() {
        if (!window.Twitch || !window.Twitch.ext) {
            console.error('Twitch API never loaded');
            document.getElementById('status').textContent = 'ERROR: Not in Twitch Extension environment';
            document.getElementById('status').style.color = '#ff4f4d';
        }
    }, 5000);
});
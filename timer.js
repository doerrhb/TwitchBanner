// Countdown Timer - FIXED VERSION
console.log('Timer script loading...');

// Default to Jan 1, 2027
let targetDate = new Date("2027-01-01T00:00:00").getTime();
let timerInterval = null;

// 1. UPDATE TIMER DISPLAY
function updateTimerDisplay() {
    const now = new Date().getTime();
    const diff = targetDate - now;
    
    if (diff < 0) {
        // Timer expired
        document.querySelector(".countdown-timer").innerHTML = 
            '<div style="color:#ff0000; font-weight:bold; font-size:18px; font-family:\'Courier New\', monospace; text-shadow:0 0 10px #ff0000;">TIME\'S UP!</div>';
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        return;
    }
    
    // Calculate time units
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update display
    const dayEl = document.getElementById("days");
    const hourEl = document.getElementById("hours");
    const minEl = document.getElementById("minutes");
    const secEl = document.getElementById("seconds");
    
    if (dayEl) dayEl.textContent = days.toString().padStart(3, '0');
    if (hourEl) hourEl.textContent = hours.toString().padStart(2, '0');
    if (minEl) minEl.textContent = minutes.toString().padStart(2, '0');
    if (secEl) secEl.textContent = seconds.toString().padStart(2, '0');
}

// 2. UPDATE LOGO
function updateLogo(logoUrl) {
    const logoEl = document.getElementById('stream-logo');
    if (!logoEl) {
        console.error('Logo element not found');
        return;
    }
    
    if (logoUrl && logoUrl.trim()) {
        console.log('Setting logo to:', logoUrl);
        logoEl.src = logoUrl;
        
        logoEl.onerror = function() {
            console.error('Failed to load logo, using default');
            logoEl.src = "logo.jpg";
        };
    } else {
        console.log('Using default logo');
        logoEl.src = "logo.jpg";
    }
}

// 3. LOAD CONFIG FROM TWITCH
function loadConfig() {
    console.log('Loading config for timer...');
    
    if (!window.Twitch || !window.Twitch.ext || !window.Twitch.ext.configuration) {
        console.log('Twitch API not available in timer');
        return;
    }
    
    const config = window.Twitch.ext.configuration.broadcaster;
    
    if (config && config.content) {
        try {
            const data = JSON.parse(config.content);
            console.log('Timer loaded config:', data);
            
            if (data.date) {
                const newDate = new Date(data.date).getTime();
                if (!isNaN(newDate) && newDate > 0) {
                    targetDate = newDate;
                    console.log('Timer date updated to:', data.date);
                    updateTimerDisplay(); // Update immediately
                }
            }
            
            if (data.logo !== undefined) {
                updateLogo(data.logo);
            }
            
        } catch (e) {
            console.error('Timer failed to parse config:', e);
        }
    } else {
        console.log('No config found for timer');
    }
}

// 4. INITIALIZE TIMER
function initializeTimer() {
    console.log('Initializing timer...');
    
    // Start the timer
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
    
    // Set up Twitch listeners if available
    if (window.Twitch && window.Twitch.ext) {
        console.log('Setting up Twitch listeners for timer');
        
        // Load config when authorized
        window.Twitch.ext.onAuthorized(function() {
            console.log('Timer authorized');
            loadConfig();
        });
        
        // Listen for config changes
        window.Twitch.ext.configuration.onChanged(function() {
            console.log('Timer: Config changed');
            loadConfig();
        });
        
        // Try to load config immediately if already authorized
        setTimeout(loadConfig, 1000);
        
    } else {
        console.log('No Twitch API, using defaults');
    }
}

// 5. START EVERYTHING
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTimer);
} else {
    initializeTimer();
}
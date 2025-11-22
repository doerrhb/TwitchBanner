// DEFAULT DATE: Jan 1, 2027 (Fallback if no config is set)
let countDownDate = new Date("2027-01-01T00:00:00").getTime();

// --- TWITCH CONFIGURATION LISTENER ---
if (window.Twitch && window.Twitch.ext) {
    // This runs automatically when the extension loads and finds saved data
    window.Twitch.ext.configuration.onChanged(function() {
        const configRef = window.Twitch.ext.configuration.broadcaster;
        
        if (configRef && configRef.content) {
            try {
                // Parse the saved JSON data
                const config = JSON.parse(configRef.content);
                
                if (config.date) {
                    console.log("New date received from config:", config.date);
                    countDownDate = new Date(config.date).getTime();
                    // Force an immediate update so the user doesn't see the old time for 1 second
                    updateTimer(); 
                }
            } catch (e) {
                console.error("Invalid configuration JSON");
            }
        }
    });
}

// --- STANDARD TIMER LOGIC ---
function updateTimer() {
    const now = new Date().getTime();
    const distance = countDownDate - now;
    
    // Calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Update DOM
    const dayEl = document.getElementById("days");
    const hourEl = document.getElementById("hours");
    const minEl = document.getElementById("minutes");
    const secEl = document.getElementById("seconds");

    if (dayEl) dayEl.innerHTML = days.toString().padStart(3, '0');
    if (hourEl) hourEl.innerHTML = hours.toString().padStart(2, '0');
    if (minEl) minEl.innerHTML = minutes.toString().padStart(2, '0');
    if (secEl) secEl.innerHTML = seconds.toString().padStart(2, '0');
    
    // Check if finished
    if (distance < 0) {
        const timerBox = document.querySelector(".countdown-timer");
        if (timerBox) {
            timerBox.innerHTML = "<div style='color:red; font-weight:bold; font-family: sans-serif;'>TIME'S UP</div>";
        }
        return false; // Stop loop
    }
    return true; // Continue loop
}

// Run immediately
updateTimer();

// Run every second
const timerInterval = setInterval(function() {
    const shouldContinue = updateTimer();
    if (!shouldContinue) {
        clearInterval(timerInterval);
    }
}, 1000);

// Twitch Authorization boilerplate
if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.onAuthorized(function(auth) {
        console.log('Twitch Extension Authorized');
    });
}
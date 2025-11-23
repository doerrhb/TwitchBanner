// DEFAULT DATE: Jan 1, 2027
let countDownDate = new Date("2027-01-01T00:00:00").getTime();

// --- TWITCH CONFIGURATION LISTENER ---
if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.configuration.onChanged(function() {
        const configRef = window.Twitch.ext.configuration.broadcaster;
        
        if (configRef && configRef.content) {
            try {
                const config = JSON.parse(configRef.content);
                
                // 1. Update Date
                if (config.date) {
                    countDownDate = new Date(config.date).getTime();
                    updateTimer(); 
                }

                // 2. Update Logo
                const logoEl = document.getElementById('stream-logo');
                if (logoEl) {
                    if (config.logo && config.logo.trim() !== "") {
                        logoEl.src = config.logo;
                    } else {
                        // Revert to default if user cleared the field
                        logoEl.src = "logo.jpg";
                    }
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
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    const dayEl = document.getElementById("days");
    const hourEl = document.getElementById("hours");
    const minEl = document.getElementById("minutes");
    const secEl = document.getElementById("seconds");

    if (dayEl) dayEl.innerHTML = days.toString().padStart(3, '0');
    if (hourEl) hourEl.innerHTML = hours.toString().padStart(2, '0');
    if (minEl) minEl.innerHTML = minutes.toString().padStart(2, '0');
    if (secEl) secEl.innerHTML = seconds.toString().padStart(2, '0');
    
    if (distance < 0) {
        const timerBox = document.querySelector(".countdown-timer");
        if (timerBox) {
            timerBox.innerHTML = "<div style='color:red; font-weight:bold; font-family: sans-serif;'>TIME'S UP</div>";
        }
        return false; 
    }
    return true; 
}

updateTimer();

const timerInterval = setInterval(function() {
    const shouldContinue = updateTimer();
    if (!shouldContinue) {
        clearInterval(timerInterval);
    }
}, 1000);

if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.onAuthorized(function(auth) {
        console.log('Twitch Extension Authorized');
    });
}
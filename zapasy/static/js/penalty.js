const penaltyTimers = {};
const handbaPenaltyCount = {};
let globalMatchStatus = 'unknown';


function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function addPlayerPenalty(playerId, playerNumber, minutes, teamType = null, startNow = true) {
 
    if (penaltyTimers[playerId]) {
        clearInterval(penaltyTimers[playerId].interval);
        if (penaltyTimers[playerId].element && penaltyTimers[playerId].element.parentNode) {
            penaltyTimers[playerId].element.parentNode.removeChild(penaltyTimers[playerId].element);
        }
    }
    
 
    const alertElement = document.createElement('div');
    alertElement.id = `penalty-alert-${playerId}`;
    alertElement.className = 'alert alert-danger mt-2 d-flex justify-content-between align-items-center';
    alertElement.role = 'alert';
    
  
    if (!teamType) {
        const playerCard = document.querySelector(`[data-bs-target="#playerModal${playerId}"]`)?.closest('.card');
        if (playerCard) {
            const section = playerCard.closest('div[class*="row"]').previousElementSibling;
            teamType = section.textContent.toLowerCase().includes('domá') ? 'Domácí' : 'Hosté';
        } else {
            teamType = 'Player';
        }
    }
    
   
    const seconds = Math.round(minutes * 60);

    const isMatchRunning = globalMatchStatus === 'probihajici';
    const endTime = (isMatchRunning && startNow) ? 
                      Date.now() + (seconds * 1000) : 
                      null;
    
    // Create penalty alert content
    const alertContent = document.createElement('div');
    alertContent.innerHTML = `
        <strong>${teamType} #${playerNumber}</strong> - 
        <span id="penalty-time-${playerId}">${formatTime(seconds)}</span>
        ${!isMatchRunning ? '<span class="badge bg-warning ms-2">PAUSED</span>' : ''}
    `;
    
    // Add dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.type = 'button';
    dismissButton.className = 'btn-close';
    dismissButton.setAttribute('aria-label', 'Close');
    dismissButton.onclick = function() {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
        if (penaltyTimers[playerId]) {
            clearInterval(penaltyTimers[playerId].interval);
            delete penaltyTimers[playerId];
        }
    };
    
    // Add content and button to alert
    alertElement.appendChild(alertContent);
    alertElement.appendChild(dismissButton);
    
    // Insert alert after the timer display
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) {
        timerDisplay.after(alertElement);
    } else {
        // Fallback - append to container
        document.querySelector('.container').appendChild(alertElement);
    }
    
    // Store the timer information (even if not started yet)
    penaltyTimers[playerId] = {
        interval: null,
        element: alertElement,
        endTime: endTime,
        remainingSeconds: seconds,
        started: isMatchRunning && startNow
    };
    
    // Only start the timer if match is running
    if (isMatchRunning && startNow) {
        startPenaltyTimer(playerId);
    }
}

// Start or resume a penalty timer
function startPenaltyTimer(playerId) {
    const penaltyTimer = penaltyTimers[playerId];
    if (!penaltyTimer) return;
    
    // Clear any existing interval
    if (penaltyTimer.interval) {
        clearInterval(penaltyTimer.interval);
    }
    
    // If the timer hasn't been started yet, set the end time
    if (!penaltyTimer.started) {
        penaltyTimer.endTime = Date.now() + (penaltyTimer.remainingSeconds * 1000);
        penaltyTimer.started = true;
    }
    
    // Update display to remove PAUSED badge
    const timeDisplay = document.getElementById(`penalty-time-${playerId}`);
    if (timeDisplay) {
        const pauseBadge = timeDisplay.nextElementSibling;
        if (pauseBadge && pauseBadge.classList.contains('badge')) {
            pauseBadge.remove();
        }
    }
    
    // Start the countdown interval
    penaltyTimer.interval = setInterval(() => {
        const remainingMs = penaltyTimer.endTime - Date.now();
        const timeDisplay = document.getElementById(`penalty-time-${playerId}`);
        
        if (remainingMs <= 0 || !timeDisplay) {
            // Time's up - remove alert
            clearInterval(penaltyTimer.interval);
            if (penaltyTimer.element.parentNode) {
                penaltyTimer.element.parentNode.removeChild(penaltyTimer.element);
            }
            
            // Reset player's penalty minutes in the database
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: `action=reset_penalty&hrac=${playerId}`
            })
            .then(response => response.json())
            .then(data => {
                // Reset penalty input in the modal form
                const penaltyInput = document.getElementById(`penalty-${playerId}`);
                if (penaltyInput) {
                    penaltyInput.value = 0;
                }
                
                // Update player card display to remove penalty minutes
                const statsElem = document.getElementById(`player-${playerId}-stats`);
                if (statsElem) {
                    const penaltyText = statsElem.innerHTML.match(/Penalty Minutes: \d+<br>/);
                    if (penaltyText) {
                        statsElem.innerHTML = statsElem.innerHTML.replace(penaltyText[0], '');
                    }
                }
            })
            .catch(error => console.error('Error resetting penalty:', error));
            
            // Remove from active timers
            delete penaltyTimers[playerId];
        } else {
            // Update the remaining time display
            timeDisplay.textContent = formatTime(Math.ceil(remainingMs / 1000));
            
            // Also update the remaining seconds (for use when pausing)
            penaltyTimer.remainingSeconds = Math.ceil(remainingMs / 1000);
        }
    }, 1000);
}

// Pause all penalty timers
function pauseAllPenaltyTimers() {
    Object.keys(penaltyTimers).forEach(playerId => {
        const penaltyTimer = penaltyTimers[playerId];
        
        // Clear the interval
        if (penaltyTimer.interval) {
            clearInterval(penaltyTimer.interval);
            penaltyTimer.interval = null;
        }
        
        // If timer was running, calculate remaining time
        if (penaltyTimer.started && penaltyTimer.endTime) {
            const remainingMs = penaltyTimer.endTime - Date.now();
            penaltyTimer.remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        }
        
        // Add PAUSED badge
        const timeDisplay = document.getElementById(`penalty-time-${playerId}`);
        if (timeDisplay && !timeDisplay.nextElementSibling?.classList.contains('badge')) {
            const pauseBadge = document.createElement('span');
            pauseBadge.className = 'badge bg-warning ms-2';
            pauseBadge.textContent = 'PAUSED';
            timeDisplay.after(pauseBadge);
        }
    });
}

// Resume all penalty timers
function resumeAllPenaltyTimers() {
    Object.keys(penaltyTimers).forEach(playerId => {
        startPenaltyTimer(playerId);
    });
}

// React to match state changes
function handleMatchStateChange(newState) {
    globalMatchStatus = newState;
    
    if (newState === 'probihajici') {
        // Match is running, start/resume all penalty timers
        resumeAllPenaltyTimers();
    } else {
        // Match is not running, pause all penalty timers
        pauseAllPenaltyTimers();
    }
}

// Track handball penalty count
function trackHandballPenalty(playerId) {
    const sportName = document.querySelector('[data-sport]')?.getAttribute('data-sport') || '';
    if (sportName !== 'hazena') return;
    
    if (!handbaPenaltyCount[playerId]) {
        handbaPenaltyCount[playerId] = 0;
    }
    
    handbaPenaltyCount[playerId]++;
    
    if (handbaPenaltyCount[playerId] >= 3) {
        const disqualifiedCheckbox = document.getElementById(`disqualified-${playerId}`);
        if (disqualifiedCheckbox) {
            disqualifiedCheckbox.checked = true;
            
            // Create disqualification alert
            const alertElement = document.createElement('div');
            alertElement.className = 'alert alert-danger mt-2';
            
            // Get player info
            const playerCard = document.querySelector(`[data-bs-target="#playerModal${playerId}"]`)?.closest('.card');
            const playerName = playerCard ? playerCard.querySelector('.card-title').textContent.trim() : 'Player';
            const playerNumber = playerCard?.getAttribute('data-player-number') || '?';
            
            alertElement.innerHTML = `
                <strong>Disqualification:</strong> Player #${playerNumber} (${playerName}) - Received 3 penalties
                <button type="button" class="btn-close float-end" aria-label="Close"></button>
            `;
            
            // Add dismiss functionality
            alertElement.querySelector('.btn-close').addEventListener('click', function() {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            });
            
            // Insert alert after the timer display
            const timerDisplay = document.getElementById('timer');
            if (timerDisplay) {
                timerDisplay.after(alertElement);
            } else {
                document.querySelector('.container').appendChild(alertElement);
            }
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 10000);
            
            // Send AJAX request to save disqualification status
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: `action=update_stats&hrac=${playerId}&disqualified=on`
            })
            .then(response => response.json())
            .then(data => {
                console.log('Disqualification saved:', data);
                
                // Update player stats display if available
                if (data.player_stats && data.player_stats[playerId]) {
                    const statsElem = document.getElementById(`player-${playerId}-stats`);
                    if (statsElem) {
                        // Add disqualified status to displayed stats
                        if (!statsElem.innerHTML.includes('Disqualified')) {
                            statsElem.innerHTML += `<span class="text-danger">Disqualified</span>`;
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error saving disqualification:', error);
            });
        }
    }
}

// Initialize penalty system
document.addEventListener('DOMContentLoaded', function() {
    // Make sure core.js is loaded first
    if (!window.matchCore) {
        console.error('core.js must be loaded before penalty.js');
        return;
    }
    
    // Initialize match status from core
    globalMatchStatus = window.matchCore.getMatchStatus();
    
    // Listen for match status changes
    document.addEventListener('matchStatusChanged', function(e) {
        handleMatchStateChange(e.detail.status);
    });
    
    // Listen for penalty updates from form submissions
    document.addEventListener('penaltyUpdated', function(e) {
        if (e.detail.penaltyMinutes > 0) {
            setTimeout(() => {
                // Get player info
                const playerCard = document.querySelector(`[data-bs-target="#playerModal${e.detail.playerId}"]`)?.closest('.card');
                if (!playerCard) return;
                
                const playerNumber = playerCard.getAttribute('data-player-number') || '?';
                const section = playerCard.closest('div[class*="row"]').previousElementSibling;
                const teamType = section.textContent.toLowerCase().includes('domá') ? 'Domácí' : 'Hosté';
                
                // Create penalty timer with actual saved value
                addPlayerPenalty(e.detail.playerId, playerNumber, e.detail.penaltyMinutes, teamType);
                
                // For handball, track penalty count
                trackHandballPenalty(e.detail.playerId);
            }, 200);
        }
    });
    
    // Load any existing penalties from server data
    try {
        if (typeof initialPenalties !== 'undefined' && initialPenalties && initialPenalties.length > 0) {
            initialPenalties.forEach(penalty => {
                addPlayerPenalty(
                    penalty.player_id,
                    penalty.player_number, 
                    penalty.remaining_minutes,
                    penalty.team_type,
                    globalMatchStatus === 'probihajici' // Only start if match is running
                );
            });
        }
    } catch (error) {
        console.error('Error loading initial penalties:', error);
    }
});
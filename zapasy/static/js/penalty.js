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
    
    const alertContent = document.createElement('div');
    alertContent.innerHTML = `
        <strong>${teamType} #${playerNumber}</strong> - 
        <span id="penalty-time-${playerId}">${formatTime(seconds)}</span>
        ${!isMatchRunning ? '<span class="badge bg-warning ms-2">PAUSED</span>' : ''}
    `;
    
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
    
    alertElement.appendChild(alertContent);
    alertElement.appendChild(dismissButton);
    
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) {
        timerDisplay.after(alertElement);
    } else {
        document.querySelector('.container').appendChild(alertElement);
    }
    
    penaltyTimers[playerId] = {
        interval: null,
        element: alertElement,
        endTime: endTime,
        remainingSeconds: seconds,
        started: isMatchRunning && startNow
    };
    
    if (isMatchRunning && startNow) {
        startPenaltyTimer(playerId);
    }
}

function startPenaltyTimer(playerId) {
    const penaltyTimer = penaltyTimers[playerId];
    if (!penaltyTimer) return;
    
    if (penaltyTimer.interval) {
        clearInterval(penaltyTimer.interval);
    }
    
    if (!penaltyTimer.started) {
        penaltyTimer.endTime = Date.now() + (penaltyTimer.remainingSeconds * 1000);
        penaltyTimer.started = true;
    }
    
    const timeDisplay = document.getElementById(`penalty-time-${playerId}`);
    if (timeDisplay) {
        const pauseBadge = timeDisplay.nextElementSibling;
        if (pauseBadge && pauseBadge.classList.contains('badge')) {
            pauseBadge.remove();
        }
    }
    
    penaltyTimer.interval = setInterval(() => {
        const remainingMs = penaltyTimer.endTime - Date.now();
        const timeDisplay = document.getElementById(`penalty-time-${playerId}`);
        
        if (remainingMs <= 0 || !timeDisplay) {
            clearInterval(penaltyTimer.interval);
            if (penaltyTimer.element.parentNode) {
                penaltyTimer.element.parentNode.removeChild(penaltyTimer.element);
            }
            
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
                const penaltyInput = document.getElementById(`penalty-${playerId}`);
                if (penaltyInput) {
                    penaltyInput.value = 0;
                }
                
                const statsElem = document.getElementById(`player-${playerId}-stats`);
                if (statsElem) {
                    const penaltyText = statsElem.innerHTML.match(/Penalty Minutes: \d+<br>/);
                    if (penaltyText) {
                        statsElem.innerHTML = statsElem.innerHTML.replace(penaltyText[0], '');
                    }
                }
            })
            .catch(error => console.error('Error resetting penalty:', error));
            
            delete penaltyTimers[playerId];
        } else {
            timeDisplay.textContent = formatTime(Math.ceil(remainingMs / 1000));
            
            penaltyTimer.remainingSeconds = Math.ceil(remainingMs / 1000);
        }
    }, 1000);
}

function pauseAllPenaltyTimers() {
    Object.keys(penaltyTimers).forEach(playerId => {
        const penaltyTimer = penaltyTimers[playerId];
        
        if (penaltyTimer.interval) {
            clearInterval(penaltyTimer.interval);
            penaltyTimer.interval = null;
        }
        
        if (penaltyTimer.started && penaltyTimer.endTime) {
            const remainingMs = penaltyTimer.endTime - Date.now();
            penaltyTimer.remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        }
        
        const timeDisplay = document.getElementById(`penalty-time-${playerId}`);
        if (timeDisplay && !timeDisplay.nextElementSibling?.classList.contains('badge')) {
            const pauseBadge = document.createElement('span');
            pauseBadge.className = 'badge bg-warning ms-2';
            pauseBadge.textContent = 'PAUSED';
            timeDisplay.after(pauseBadge);
        }
    });
}

function resumeAllPenaltyTimers() {
    Object.keys(penaltyTimers).forEach(playerId => {
        startPenaltyTimer(playerId);
    });
}

function handleMatchStateChange(newState) {
    globalMatchStatus = newState;
    
    if (newState === 'probihajici') {
        resumeAllPenaltyTimers();
    } else {
        pauseAllPenaltyTimers();
    }
}

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
            
            const alertElement = document.createElement('div');
            alertElement.className = 'alert alert-danger mt-2';
            
            const playerCard = document.querySelector(`[data-bs-target="#playerModal${playerId}"]`)?.closest('.card');
            const playerName = playerCard ? playerCard.querySelector('.card-title').textContent.trim() : 'Player';
            const playerNumber = playerCard?.getAttribute('data-player-number') || '?';
            
            alertElement.innerHTML = `
                <strong>Disqualification:</strong> Player #${playerNumber} (${playerName}) - Received 3 penalties
                <button type="button" class="btn-close float-end" aria-label="Close"></button>
            `;
            
            alertElement.querySelector('.btn-close').addEventListener('click', function() {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            });
            
            const timerDisplay = document.getElementById('timer');
            if (timerDisplay) {
                timerDisplay.after(alertElement);
            } else {
                document.querySelector('.container').appendChild(alertElement);
            }
            
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 10000);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.matchCore) {
        console.error('core.js must be loaded before penalty.js');
        return;
    }
    
    globalMatchStatus = window.matchCore.getMatchStatus();
    
    document.addEventListener('matchStatusChanged', function(e) {
        handleMatchStateChange(e.detail.status);
    });
    
    document.addEventListener('penaltyUpdated', function(e) {
        if (e.detail.penaltyMinutes > 0) {
            setTimeout(() => {
                const playerCard = document.querySelector(`[data-bs-target="#playerModal${e.detail.playerId}"]`)?.closest('.card');
                if (!playerCard) return;
                
                const playerNumber = playerCard.getAttribute('data-player-number') || '?';
                const section = playerCard.closest('div[class*="row"]').previousElementSibling;
                const teamType = section.textContent.toLowerCase().includes('domá') ? 'Domácí' : 'Hosté';
                
            
                addPlayerPenalty(e.detail.playerId, playerNumber, e.detail.penaltyMinutes, teamType);
                
        
                trackHandballPenalty(e.detail.playerId);
            }, 200);
        }
    });
    
    try {
        if (typeof initialPenalties !== 'undefined' && initialPenalties && initialPenalties.length > 0) {
            initialPenalties.forEach(penalty => {
                addPlayerPenalty(
                    penalty.player_id,
                    penalty.player_number, 
                    penalty.remaining_minutes,
                    penalty.team_type,
                    globalMatchStatus === 'probihajici' 
                );
            });
        }
    } catch (error) {
        console.error('Error loading initial penalties:', error);
    }
});
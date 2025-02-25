const penaltyTimers = {};
let globalMatchStatus = 'unknown';
let isAutoRefreshing = false;
let refreshInterval = null;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function displayPenalty(playerId, playerNumber, playerName, teamName, minutes, teamColor) {
    const penaltyContainer = document.getElementById('penalty-container');
    const noPenaltiesMessage = document.getElementById('no-penalties-message');
    
    if (noPenaltiesMessage) {
        noPenaltiesMessage.style.display = 'none';
    }
    
    if (penaltyTimers[playerId]) {
        clearInterval(penaltyTimers[playerId].interval);
        if (penaltyTimers[playerId].element && penaltyTimers[playerId].element.parentNode) {
            penaltyTimers[playerId].element.parentNode.removeChild(penaltyTimers[playerId].element);
        }
    }
    
    const penaltyElement = document.createElement('div');
    penaltyElement.id = `penalty-display-${playerId}`;
    penaltyElement.className = 'alert alert-light border d-flex justify-content-between align-items-center mb-2';
    penaltyElement.setAttribute('role', 'alert');
    
    const seconds = Math.round(minutes * 60);
    const endTime = Date.now() + (seconds * 1000);
    
    const badgeColor = teamColor === 'primary' ? 'primary' : 'danger';
    
    penaltyElement.innerHTML = `
        <div>
            <span class="badge bg-${badgeColor} me-2">${teamName}</span>
            <strong>#${playerNumber}</strong> 
            <span class="ms-1">${playerName}</span>
        </div>
        <div>
            <span class="badge bg-dark" id="penalty-time-${playerId}">${formatTime(seconds)}</span>
            ${globalMatchStatus !== 'probihajici' ? '<span class="badge bg-warning ms-2">PAUSED</span>' : ''}
        </div>
    `;
    
    penaltyContainer.appendChild(penaltyElement);
    
    const isMatchRunning = globalMatchStatus === 'probihajici';
    
    penaltyTimers[playerId] = {
        interval: null,
        element: penaltyElement,
        endTime: endTime,
        remainingSeconds: seconds,
        started: isMatchRunning
    };
    
    if (isMatchRunning) {
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
            
            delete penaltyTimers[playerId];
            
            if (Object.keys(penaltyTimers).length === 0) {
                const noPenaltiesMessage = document.getElementById('no-penalties-message');
                if (noPenaltiesMessage) {
                    noPenaltiesMessage.style.display = 'block';
                }
            }
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
    
    setAutoRefresh(newState === 'probihajici');
}

function setAutoRefresh(enable) {
    if (enable && !isAutoRefreshing) {
        isAutoRefreshing = true;
        refreshInterval = setInterval(refreshMatchData, 15000); 
    } else if (!enable && isAutoRefreshing) {
        isAutoRefreshing = false;
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }
}

function refreshMatchData() {
    fetch(window.location.href, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (response.headers.get('content-type').includes('application/json')) {
            return response.json();
        } else {
            window.location.reload();
            return null;
        }
    })
    .then(data => {
        if (data) {
            updateMatchDisplay(data);
        }
    })
    .catch(error => {
        console.error('Error refreshing match data:', error);
    });
}

function updateMatchDisplay(data) {
    console.log('Received fresh match data');
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.matchCore) {
        console.error('core.js must be loaded before view-detail.js');
        return;
    }
    
    const statusElement = document.getElementById('match-status');
    if (statusElement) {
        const statusText = statusElement.textContent.toLowerCase();
        globalMatchStatus = statusText.includes('probíhající') ? 'probihajici' : 
                          statusText.includes('pozastaven') ? 'paused' : 
                          statusText.includes('ukončen') ? 'ukoncene' : 'nadchazejici';
    }
    
    setAutoRefresh(globalMatchStatus === 'probihajici');
    
    document.addEventListener('matchStatusChanged', function(e) {
        handleMatchStateChange(e.detail.status);
    });
    
    try {
        if (typeof initialPenalties !== 'undefined' && initialPenalties && initialPenalties.length > 0) {
            initialPenalties.forEach(penalty => {
                const playerElement = document.querySelector(`[data-player-id="${penalty.player_id}"]`);
                const playerRow = playerElement ? playerElement.closest('tr') : null;
                let playerName = 'Player';
                let playerNumber = penalty.player_number || '?';
                let teamName = 'Team';
                let teamColor = 'primary';
                
                if (playerRow) {
                    playerName = playerRow.querySelector('td:nth-child(2)').textContent.trim();
                    playerNumber = playerRow.querySelector('td:nth-child(1)').textContent.trim();
                    
                    const table = playerRow.closest('table');
                    const card = table.closest('.card');
                    const header = card.querySelector('.card-header');
                    
                    if (header) {
                        teamName = header.textContent.trim();
                        teamColor = header.classList.contains('bg-primary') ? 'primary' : 'danger';
                    }
                }
                
                displayPenalty(
                    penalty.player_id,
                    playerNumber,
                    playerName,
                    teamName,
                    penalty.remaining_minutes,
                    teamColor
                );
            });
        }
    } catch (error) {
        console.error('Error loading initial penalties:', error);
    }
});
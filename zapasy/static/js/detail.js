let displayedPenalties = {};
let globalMatchStatus = 'unknown';
let isAutoRefreshing = false;
let refreshInterval = null;


function clearAllPenalties() {
  
    const penaltyContainer = document.getElementById('penalty-container');
    if (!penaltyContainer) return;
    
   
    Object.keys(displayedPenalties).forEach(playerId => {
        const element = displayedPenalties[playerId].element;
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
    
   
    displayedPenalties = {};
    
   
    const noPenaltiesMessage = document.getElementById('no-penalties-message');
    if (noPenaltiesMessage) {
        noPenaltiesMessage.style.display = 'block';
    }
}


function displayPenalty(playerId, playerNumber, playerName, teamName, minutes, teamColor) {
    const penaltyContainer = document.getElementById('penalty-container');
    const noPenaltiesMessage = document.getElementById('no-penalties-message');
    
    if (!penaltyContainer) return;
    
    
    if (noPenaltiesMessage) {
        noPenaltiesMessage.style.display = 'none';
    }
    
    
    if (displayedPenalties[playerId] && displayedPenalties[playerId].element) {
        const existingElement = displayedPenalties[playerId].element;
        if (existingElement.parentNode) {
            existingElement.parentNode.removeChild(existingElement);
        }
    }
    
  
    const penaltyElement = document.createElement('div');
    penaltyElement.id = `penalty-display-${playerId}`;
    penaltyElement.className = 'alert alert-light border d-flex justify-content-between align-items-center mb-2';
    penaltyElement.setAttribute('role', 'alert');
    
    
    const badgeColor = teamColor === 'primary' ? 'primary' : 'danger';
    
    penaltyElement.innerHTML = `
        <div>
            <span class="badge bg-${badgeColor} me-2">${teamName}</span>
            <strong>#${playerNumber}</strong> 
            <span class="ms-1">${playerName}</span>
        </div>
        <div>
            <span class="badge bg-dark">${minutes} min</span>
            ${globalMatchStatus !== 'probihajici' ? '<span class="badge bg-warning ms-2">PAUSED</span>' : ''}
        </div>
    `;
    
    
    penaltyContainer.appendChild(penaltyElement);
    
   
    displayedPenalties[playerId] = {
        element: penaltyElement,
        minutes: minutes,
        teamName: teamName,
        playerName: playerName,
        playerNumber: playerNumber
    };
}


function handleMatchStateChange(newState) {
    globalMatchStatus = newState;
    
   
    Object.keys(displayedPenalties).forEach(playerId => {
        const penaltyElement = displayedPenalties[playerId].element;
        const badgeContainer = penaltyElement.querySelector('div:last-child');
        
        const existingBadge = badgeContainer.querySelector('.badge.bg-warning');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (newState !== 'probihajici') {
            const pauseBadge = document.createElement('span');
            pauseBadge.className = 'badge bg-warning ms-2';
            pauseBadge.textContent = 'PAUSED';
            badgeContainer.appendChild(pauseBadge);
        }
    });
    
    setAutoRefresh(true);
}

function setAutoRefresh(enable) {
    if (enable && !isAutoRefreshing) {
        isAutoRefreshing = true;
        refreshInterval = setInterval(refreshMatchData, 1000);
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
    if (data.active_penalties) {
        const currentPlayerIds = data.active_penalties.map(p => p.player_id.toString());
        
        Object.keys(displayedPenalties).forEach(playerId => {
            if (!currentPlayerIds.includes(playerId)) {
                if (displayedPenalties[playerId].element && displayedPenalties[playerId].element.parentNode) {
                    displayedPenalties[playerId].element.parentNode.removeChild(displayedPenalties[playerId].element);
                }
                delete displayedPenalties[playerId];
            }
        });
        
        const uniquePenalties = {};
        data.active_penalties.forEach(penalty => {
            uniquePenalties[penalty.player_id] = penalty;
        });
        
        Object.values(uniquePenalties).forEach(penalty => {
            if (!displayedPenalties[penalty.player_id]) {
                displayPenalty(
                    penalty.player_id,
                    penalty.player_number,
                    penalty.player_name,
                    penalty.team_type,
                    penalty.remaining_minutes,
                    penalty.team_color || (penalty.team_type === 'Domácí' ? 'primary' : 'danger')
                );
            }
        });
        
        if (Object.keys(displayedPenalties).length === 0) {
            const noPenaltiesMessage = document.getElementById('no-penalties-message');
            if (noPenaltiesMessage) {
                noPenaltiesMessage.style.display = 'block';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const sportElement = document.querySelector('[data-sport]');
    const sport = sportElement ? sportElement.getAttribute('data-sport') : '';
    
    if (sport === 'fotbal') {
        return;
    }
    
    if (!window.matchCore) {
        console.error('core.js must be loaded before detail.js');
        return;
    }
    
    const statusElement = document.getElementById('match-status');
    if (statusElement) {
        const statusText = statusElement.textContent.toLowerCase();
        globalMatchStatus = statusText.includes('probíhající') ? 'probihajici' : 
                          statusText.includes('pozastaven') ? 'paused' : 
                          statusText.includes('ukončen') ? 'ukoncene' : 'nadchazejici';
    }
    
    setAutoRefresh(true);
    
    document.addEventListener('matchStatusChanged', function(e) {
        handleMatchStateChange(e.detail.status);
    });
    
    try {
        if (typeof initialPenalties !== 'undefined' && initialPenalties && initialPenalties.length > 0) {
            clearAllPenalties();
            
            const uniquePenalties = {};
            
            initialPenalties.forEach(penalty => {
                uniquePenalties[penalty.player_id] = penalty;
            });
            
            Object.values(uniquePenalties).forEach(penalty => {
                displayPenalty(
                    penalty.player_id,
                    penalty.player_number,
                    penalty.player_name,
                    penalty.team_type,
                    penalty.remaining_minutes,
                    penalty.team_color || (penalty.team_type === 'Domácí' ? 'primary' : 'danger')
                );
            });
        }
    } catch (error) {
        console.error('Error loading initial penalties:', error);
    }
});
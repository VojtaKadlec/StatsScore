function updateCounter(elementId, change) {
    const input = document.getElementById(elementId);
    if (!input) {
        console.error('Element not found:', elementId);
        return;
    }
   
    let value = parseInt(input.value) || 0;
    value += change;
   
    if (value < 0) value = 0;
   
    input.value = value;
   
    if (elementId.startsWith('yellow-cards-') && value >= 2) {
        const playerId = elementId.split('-')[2];
        const disqualifiedCheckbox = document.getElementById(`disqualified-${playerId}`);
        if (disqualifiedCheckbox) {
            disqualifiedCheckbox.checked = true;
        }
    }
}

function addRedCard(playerId) {
    const disqualifiedCheckbox = document.getElementById(`disqualified-${playerId}`);
    if (disqualifiedCheckbox) {
        disqualifiedCheckbox.checked = true;
    }
}

function addRedCardHandball(playerId) {
    updateCounter(`penalty-${playerId}`, 2);
   
    const disqualifiedCheckbox = document.getElementById(`disqualified-${playerId}`);
    if (disqualifiedCheckbox) {
        disqualifiedCheckbox.checked = true;
    }
}

function updatePlayerStatsDisplay(playerId, stats) {
    const statsElem = document.getElementById(`player-${playerId}-stats`);
    const sportName = document.querySelector('[data-sport]')?.getAttribute('data-sport') || '';
   
    if (statsElem) {
        let statsHTML = `Goals: ${stats.goly}<br>`;
       
        if ('zlute_karty' in stats && stats.zlute_karty > 0) {
            statsHTML += `Yellow Cards: ${stats.zlute_karty}<br>`;
        }
       
        if (sportName !== 'fotbal' && 'trestne_minuty' in stats && stats.trestne_minuty > 0) {
            statsHTML += `Penalty Minutes: ${stats.trestne_minuty}<br>`;
        }
       
        if (sportName === 'hazena' && stats.penalty_total_count > 0) {
            statsHTML += `Total Penalties: ${stats.penalty_total_count}<br>`;
        }
       
        if ('disqualified' in stats && stats.disqualified) {
            statsHTML += `<span class="text-danger">Disqualified</span>`;
        }
       
        statsElem.innerHTML = statsHTML;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.matchCore) {
        console.error('core.js must be loaded before control.js');
        return;
    }
   
    const statsForms = document.querySelectorAll('form[id^="stats-form-"]');
    statsForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const formDataObj = {};
           
            for (let [key, value] of formData.entries()) {
                formDataObj[key] = value;
            }
           
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams(formDataObj).toString()
            })
            .then(response => response.json())
            .then(data => {
                const modal = bootstrap.Modal.getInstance(document.getElementById(`playerModal${formDataObj.hrac}`));
                if (modal) {
                    modal.hide();
                }
               
                if (data.player_stats && data.player_stats[formDataObj.hrac]) {
                    updatePlayerStatsDisplay(formDataObj.hrac, data.player_stats[formDataObj.hrac]);
                   
                    if (data.player_stats[formDataObj.hrac].trestne_minuty > 0) {
                        const penaltyEvent = new CustomEvent('penaltyUpdated', {
                            detail: {
                                playerId: formDataObj.hrac,
                                penaltyMinutes: data.player_stats[formDataObj.hrac].trestne_minuty
                            }
                        });
                        document.dispatchEvent(penaltyEvent);
                    }
                }
            })
            .catch(error => {
                console.error('Error updating player stats:', error);
            });
        });
    });
   
    window.updateCounter = updateCounter;
    window.addRedCard = addRedCard;
    window.addRedCardHandball = addRedCardHandball;
    window.performAction = window.matchCore.performAction;
});
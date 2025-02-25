let elapsedTime = 0;
let timerElement = null;
let timerInterval = null;
let matchStatus = 'unknown';

function updateTimerDisplay() {
    if (!timerElement) {
        timerElement = document.getElementById('elapsed-time');
        if (!timerElement) return;
    }
    
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimer() {
    elapsedTime += 1;
    updateTimerDisplay();
}

function startTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000);
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateButtonStates(status) {
    const startBtn = document.querySelector('button[onclick="performAction(\'start\')"]');
    const pauseBtn = document.querySelector('button[onclick="performAction(\'pause\')"]');
    const endBtn = document.querySelector('button[onclick="performAction(\'end\')"]');
    
    if (!startBtn || !pauseBtn || !endBtn) return;
    
    if (status === 'probihajici') {
        startBtn.classList.add('disabled');
        pauseBtn.classList.remove('disabled');
        endBtn.classList.remove('disabled');
    } else if (status === 'paused') {
        startBtn.classList.remove('disabled');
        pauseBtn.classList.add('disabled');
        endBtn.classList.remove('disabled');
    } else if (status === 'ukoncene') {
        startBtn.classList.add('disabled');
        pauseBtn.classList.add('disabled');
        endBtn.classList.add('disabled');
    } else if (status === 'nadchazejici') {
        startBtn.classList.remove('disabled');
        pauseBtn.classList.add('disabled');
        endBtn.classList.add('disabled');
    }
}

function performAction(action) {
    fetch(window.location.href, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: `action=${action}`
    }).then(response => response.json())
      .then(data => {
          if (data.status) {
              matchStatus = data.status;
              const statusElement = document.getElementById('match-status');
              if (statusElement) {
                  statusElement.textContent = data.status_display;
              }
              
              const event = new CustomEvent('matchStatusChanged', { 
                  detail: { 
                      status: data.status,
                      statusDisplay: data.status_display
                  } 
              });
              document.dispatchEvent(event);
          }
          
          if (data.timer_running === true) {
              startTimer();
          } else if (data.timer_running === false) {
              stopTimer();
          }
          
          if (data.elapsed_time !== undefined) {
              elapsedTime = data.elapsed_time;
              updateTimerDisplay();
          }
          
          updateButtonStates(data.status);
      })
      .catch(error => {
          console.error('Error performing action:', error);
      });
}

function getMatchStatusFromDisplay() {
    const statusElement = document.getElementById('match-status');
    if (statusElement) {
        const statusText = statusElement.textContent.toLowerCase();
        return statusText.includes('probíhající') ? 'probihajici' : 
               statusText.includes('pozastaven') ? 'paused' : 
               statusText.includes('ukončen') ? 'ukoncene' : 'nadchazejici';
    }
    return 'unknown';
}

function getMatchStatus() {
    return matchStatus;
}

document.addEventListener('DOMContentLoaded', function() {
    timerElement = document.getElementById('elapsed-time');
    const timerRunning = document.body.getAttribute('data-timer-running') === 'True';
    const initialTime = parseInt(document.body.getAttribute('data-elapsed-time') || '0', 10);
    
    if (initialTime) {
        elapsedTime = initialTime;
    }
    
    matchStatus = getMatchStatusFromDisplay();
    
    if (timerRunning) {
        startTimer();
    } else {
        updateTimerDisplay();
    }
    
    updateButtonStates(matchStatus);
    
    const statusElement = document.getElementById('match-status');
    if (statusElement) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    const newStatus = getMatchStatusFromDisplay();
                    if (newStatus !== matchStatus) {
                        matchStatus = newStatus;
                        
                        const event = new CustomEvent('matchStatusChanged', { 
                            detail: { 
                                status: matchStatus,
                                statusDisplay: statusElement.textContent
                            } 
                        });
                        document.dispatchEvent(event);
                    }
                }
            });
        });
        
        observer.observe(statusElement, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }
});


window.matchCore = {
    updateTimerDisplay,
    startTimer,
    stopTimer,
    updateButtonStates,
    performAction,
    getMatchStatus
};
function updateTimer() {
    elapsedTime += 1;
    updateTimerDisplay();
    
   
    if (matchDuration > 0 && elapsedTime >= matchDuration) {
        stopTimer();
        
      
        const statusElement = document.getElementById('match-status');
        if (statusElement) {
            statusElement.classList.remove('bg-danger');
            statusElement.classList.add('bg-warning');
            statusElement.textContent = 'Time Limit Reached';
        }
        
       
        if (matchStatus === 'probihajici') {
            console.log('Match duration reached, stopping match...');
            performAction('end');
            
            
            alert('Match duration reached! The timer has been paused.');
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    function updateTimerFromData(data) {
        const elapsedTime = data.elapsed_time;
        
       
        const timerElement = document.getElementById('elapsed-time');
        if (timerElement) {
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        const container = document.querySelector('[data-sport]');
        if (container) {
            const sport = container.getAttribute('data-sport');
            
            
            if (sport === 'fotbal') {
                matchDuration = 90 * 60; 
            } else if (sport === 'hokej') {
                matchDuration = 60 * 60; 
            } else if (sport === 'hazena') {
                matchDuration = 60 * 60; 
            }
            
            console.log(`Sport: ${sport}, Match duration set to: ${matchDuration} seconds`);
        }
        
        if (window.matchCore) {
            if (window.matchCore.setElapsedTime) {
                window.matchCore.setElapsedTime(elapsedTime);
            }
            
            if (window.matchCore.updateTimerDisplay) {
                window.matchCore.updateTimerDisplay();
            }
            
            if (data.timer_running !== undefined) {
                if (data.timer_running && window.matchCore.startTimer) {
                    window.matchCore.startTimer();
                } else if (!data.timer_running && window.matchCore.stopTimer) {
                    window.matchCore.stopTimer();
                }
            }
        }
    }
});
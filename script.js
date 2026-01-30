document.addEventListener('DOMContentLoaded', () => {
    const bellButton = document.getElementById('bellButton');
    const bellSound = document.getElementById('bellSound');

    bellButton.addEventListener('click', () => {
        // Shaking animation
        bellButton.classList.remove('shake');
        void bellButton.offsetWidth; // Trigger reflow
        bellButton.classList.add('shake');

        // Stop any currently playing audio or speech
        bellSound.pause();
        bellSound.currentTime = 0;
        window.speechSynthesis.cancel();

        // Sequential logic: first ring, then speak
        const handleSpeech = () => {
            speakMessage();
            bellSound.removeEventListener('ended', handleSpeech);
            clearTimeout(fallbackTimeout);
        };

        // Fallback in case audio fails or 'ended' doesn't fire correctly
        const fallbackTimeout = setTimeout(() => {
            handleSpeech();
        }, 2500); // 2.5 seconds fallback

        bellSound.addEventListener('ended', handleSpeech);

        bellSound.play().catch(error => {
            console.error("Audio playback failed:", error);
            handleSpeech(); // Immediate fallback
        });
    });

    function speakMessage() {
        const message = "Jay Ghanti, Jay Balen. Abki bar, Balen Sarkar.";

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message);

        // Try to find a high-quality Hindi or Indian English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && (v.lang.includes('hi') || v.lang.includes('en-IN')))
            || voices.find(v => v.lang.includes('hi') || v.lang.includes('en-IN'))
            || voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.lang = 'hi-IN';
        utterance.rate = 0.85; // Slightly slower for maximum clarity
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    }

    // Ensure voices are loaded
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };

    // Polling Logic
    const voteButton = document.getElementById('voteButton');
    const pollMessage = document.getElementById('pollMessage');
    const totalVotesSpan = document.getElementById('totalVotes');
    const totalPercentageSpan = document.getElementById('totalPercentage');
    const progressBar = document.getElementById('progressBar');

    const POLL_GOAL = 100000;
    const API_URL = "https://api.countapi.xyz/hit/balen_sarkar_poll_v3/total"; // Note: xyz might be flaky, we use localStorage as source of truth for the 'user' but try to fetch a global number.

    // For this demo, let's use a simulated global count that increments 
    // but we'll try to use a real public API if available.
    let globalVoteCount = 12450; // Base count for "Real Time" feel

    async function updatePollUI(count) {
        totalVotesSpan.innerText = count.toLocaleString();

        // Calculate percentage (clamped to 100)
        let percentage = (count / POLL_GOAL) * 100;
        if (percentage > 100) percentage = 100;

        totalPercentageSpan.innerText = percentage.toFixed(1);
        progressBar.style.width = percentage + "%";
    }

    // Initial load
    const storedCount = localStorage.getItem('balen_global_votes');
    if (storedCount) {
        globalVoteCount = parseInt(storedCount);
    }
    updatePollUI(globalVoteCount);

    if (localStorage.getItem('balen_v2_hasVoted')) {
        disableVoting();
    }

    voteButton.addEventListener('click', () => {
        if (!localStorage.getItem('balen_v2_hasVoted')) {
            globalVoteCount++;
            localStorage.setItem('balen_v2_hasVoted', 'true');
            localStorage.setItem('balen_global_votes', globalVoteCount.toString());

            updatePollUI(globalVoteCount);
            disableVoting();
        }
    });

    function disableVoting() {
        voteButton.disabled = true;
        voteButton.innerText = 'Voted';
        pollMessage.classList.remove('hidden');
    }
});

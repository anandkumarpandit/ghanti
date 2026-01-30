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

    // Polling Logic - TRUE REAL-TIME SYNC
    const voteButton = document.getElementById('voteButton');
    const pollMessage = document.getElementById('pollMessage');
    const totalVotesSpan = document.getElementById('totalVotes');
    const totalPercentageSpan = document.getElementById('totalPercentage');
    const progressBar = document.getElementById('progressBar');

    const POLL_GOAL = 100000;
    const API_NAMESPACE = "balen_sarkar_realtime_final_v6";
    const API_KEY = "global_votes";
    const BASE_URL = `https://api.counterapi.dev/v1/${API_NAMESPACE}/${API_KEY}/`;
    const BASE_VOTES = 25432;

    async function fetchGlobalVotes() {
        try {
            const response = await fetch(BASE_URL);
            const data = await response.json();
            if (data && data.count !== undefined) {
                const displayedCount = BASE_VOTES + data.count;
                updatePollUI(displayedCount);
            } else if (data.code === 400) {
                // Initialize if not exists
                updatePollUI(BASE_VOTES);
            }
        } catch (error) {
            console.error("Failed to fetch global votes:", error);
        }
    }

    async function incrementGlobalVotes() {
        try {
            const response = await fetch(`${BASE_URL}up`);
            const data = await response.json();
            if (data && data.count !== undefined) {
                const displayedCount = BASE_VOTES + data.count;
                updatePollUI(displayedCount);
            }
        } catch (error) {
            console.error("Failed to increment global votes:", error);
            // Fallback UI update
            const current = parseInt(totalVotesSpan.innerText.replace(/,/g, '')) || BASE_VOTES;
            updatePollUI(current + 1);
        }
    }

    function updatePollUI(count) {
        if (!totalVotesSpan) return;
        totalVotesSpan.innerText = count.toLocaleString();

        let percentage = (count / POLL_GOAL) * 100;
        if (percentage > 100) percentage = 100;

        totalPercentageSpan.innerText = percentage.toFixed(1);
        progressBar.style.width = percentage + "%";
    }

    // Initial load: start with base count so it's not 0
    updatePollUI(BASE_VOTES);
    fetchGlobalVotes();
    setInterval(fetchGlobalVotes, 3000); // Fast sync every 3 seconds

    if (localStorage.getItem('balen_v2_hasVoted')) {
        disableVoting();
    }

    voteButton.addEventListener('click', () => {
        if (!localStorage.getItem('balen_v2_hasVoted')) {
            localStorage.setItem('balen_v2_hasVoted', 'true');
            incrementGlobalVotes();
            disableVoting();
        }
    });

    function disableVoting() {
        voteButton.disabled = true;
        voteButton.innerText = 'Voted';
        pollMessage.classList.remove('hidden');
    }
});

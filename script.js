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

    // Polling Logic - ROBUST REAL-TIME SYNC
    const voteButton = document.getElementById('voteButton');
    const pollMessage = document.getElementById('pollMessage');
    const totalVotesSpan = document.getElementById('totalVotes');
    const totalPercentageSpan = document.getElementById('totalPercentage');
    const progressBar = document.getElementById('progressBar');

    const POLL_GOAL = 100000;
    const API_NAMESPACE = "balen_final_secure_v7";
    const API_KEY = "global_votes";
    const BASE_URL = `https://api.counterapi.dev/v1/${API_NAMESPACE}/${API_KEY}/`;
    const BASE_VOTES = 25432;

    function getLocalGlobalCount() {
        const saved = localStorage.getItem('balen_last_known_count');
        return saved ? parseInt(saved) : BASE_VOTES;
    }

    async function fetchGlobalVotes() {
        try {
            const response = await fetch(BASE_URL);
            const data = await response.json();
            if (data && data.count !== undefined) {
                const total = BASE_VOTES + data.count;
                updatePollUI(total);
                localStorage.setItem('balen_last_known_count', total.toString());
            } else if (data.code === 400) {
                updatePollUI(BASE_VOTES);
            }
        } catch (error) {
            console.error("Sync error:", error);
            updatePollUI(getLocalGlobalCount());
        }
    }

    async function incrementGlobalVotes() {
        try {
            const response = await fetch(`${BASE_URL}up`);
            const data = await response.json();
            if (data && data.count !== undefined) {
                const total = BASE_VOTES + data.count;
                updatePollUI(total);
                localStorage.setItem('balen_last_known_count', total.toString());
            }
        } catch (error) {
            console.error("Increment error:", error);
            const fallback = getLocalGlobalCount() + 1;
            updatePollUI(fallback);
            localStorage.setItem('balen_last_known_count', fallback.toString());
        }
    }

    function updatePollUI(count) {
        if (!totalVotesSpan || !totalPercentageSpan || !progressBar) return;

        // Ensure count is at least BASE_VOTES and is a valid number
        const safeCount = Math.max(BASE_VOTES, isNaN(count) ? BASE_VOTES : count);

        totalVotesSpan.innerText = safeCount.toLocaleString();

        let percentage = (safeCount / POLL_GOAL) * 100;
        if (percentage > 100) percentage = 100;

        totalPercentageSpan.innerText = percentage.toFixed(1);
        progressBar.style.width = percentage + "%";
    }

    // Initial sequence: Restore last known or base count immediately
    const initialCount = getLocalGlobalCount();
    updatePollUI(initialCount);

    // Then fetch fresh data from API
    fetchGlobalVotes();

    // Poll every 3 seconds for true "real-time"
    setInterval(fetchGlobalVotes, 3000);

    // Use a fresh key for "hasVoted" to reset for the new system
    if (localStorage.getItem('balen_v3_hasVoted')) {
        disableVoting();
    }

    voteButton.addEventListener('click', () => {
        if (!localStorage.getItem('balen_v3_hasVoted')) {
            localStorage.setItem('balen_v3_hasVoted', 'true');
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

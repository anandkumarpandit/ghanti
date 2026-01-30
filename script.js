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
    const voteCountContainer = document.getElementById('voteCountContainer');
    const totalVotesSpan = document.getElementById('totalVotes');

    // Initial state check - Using v2 keys to force a reset from the previous test data
    const hasVoted = localStorage.getItem('balen_v2_hasVoted');
    // Start with 0 votes as requested for real-time appearance
    if (!localStorage.getItem('balen_v2_voteCount')) {
        localStorage.setItem('balen_v2_voteCount', '0');
    }

    let voteCount = parseInt(localStorage.getItem('balen_v2_voteCount'));

    if (hasVoted) {
        disableVoting();
    }

    voteButton.addEventListener('click', () => {
        if (!localStorage.getItem('balen_v2_hasVoted')) {
            voteCount++;
            localStorage.setItem('balen_v2_hasVoted', 'true');
            localStorage.setItem('balen_v2_voteCount', voteCount.toString());

            // Immediate UI feedback
            totalVotesSpan.innerText = voteCount;
            disableVoting();
        }
    });

    function disableVoting() {
        voteButton.disabled = true;
        voteButton.innerText = 'Voted';
        pollMessage.classList.remove('hidden');
    }

    // Always display current count
    totalVotesSpan.innerText = localStorage.getItem('balen_v2_voteCount') || '0';
});

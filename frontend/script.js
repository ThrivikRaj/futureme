/* --- Intersection Observer for Scroll Reveals --- */
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* --- State Management --- */
let currentUserProfile = null;
let chatHistory = [];

/* --- Toast Notification Helper --- */
function showToast(message) {
    const toast = document.getElementById('share-toast');
    const toastText = document.getElementById('toast-text');
    if (toast && toastText) {
        toastText.innerText = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

/* --- Calibrate & Generate FutureMe Profile --- */
async function generateFutureMe(event) {
    event.preventDefault();

    // DOM Selectors
    const nameInput = document.getElementById('username');
    const ageInput = document.getElementById('age');
    const goalInput = document.getElementById('goal');
    const struggleInput = document.getElementById('struggle');
    const oneYearInput = document.getElementById('one-year');
    const toneInput = document.getElementById('tone');

    const name = nameInput.value.trim();
    const age = ageInput.value.trim();
    const goal = goalInput.value.trim();
    const struggle = struggleInput.value.trim();
    const oneYear = oneYearInput.value.trim();
    const tone = toneInput.value;

    const errorBanner = document.getElementById('error-banner');
    const formEl = document.getElementById('futureme-form');
    const loadingEl = document.getElementById('loading-view');
    const resultEl = document.getElementById('result-view');
    const generateBtn = document.getElementById('generate-btn');

    // Validation Engine
    if (!name || !age || !goal || !struggle || !oneYear) {
        errorBanner.style.display = 'block';
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    errorBanner.style.display = 'none';
    generateBtn.disabled = true;
    formEl.style.display = 'none';
    loadingEl.style.display = 'block';

    try {
        const response = await fetch('/api/generate-futureme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                age,
                goal,
                struggle,
                oneYearVision: oneYear,
                tone
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'FutureMe calibration error.');
        }

        const data = result.data;

        // Render dynamically generated context structures to the DOM
        document.getElementById('dynamic-message').innerText = data.message;
        document.getElementById('dynamic-identity').innerText = data.futureIdentity;
        
        const movesList = document.getElementById('dynamic-moves');
        movesList.innerHTML = ""; // Clear old structures
        if (Array.isArray(data.nextMoves)) {
            data.nextMoves.forEach(move => {
                const li = document.createElement('li');
                li.innerText = move;
                movesList.appendChild(li);
            });
        }

        document.getElementById('dynamic-habit').innerText = data.habit;
        document.getElementById('dynamic-warning').innerText = data.warning || 'No warnings issued.';
        document.getElementById('dynamic-mantra').innerText = data.mantra || 'No mantra issued.';

        // Store user profile state for the chat engine
        currentUserProfile = {
            name,
            age,
            goal,
            struggle,
            oneYearVision: oneYear,
            tone
        };

        // Initialize Chat Interface
        initializeChat(data.message);

        // Open Presentation Layers
        loadingEl.style.display = 'none';
        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('Error generating FutureMe:', error);
        
        // Show error states
        loadingEl.style.display = 'none';
        formEl.style.display = 'block';
        generateBtn.disabled = false;
        
        showToast('FutureMe could not respond right now. Try again.');
    }
}

/* --- Initialize Chat Area --- */
function initializeChat(initialMessage) {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');

    // Reset history array & append the initial futureme message
    chatHistory = [{
        role: 'futureme',
        message: initialMessage
    }];

    // Configure Input Box
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    chatInput.placeholder = "Ask your FutureMe anything...";

    // Render initial message
    chatMessages.innerHTML = `
        <div class="chat-bubble future">
            “Welcome, ${currentUserProfile.name}. I am the version of you who achieved our vision of ${currentUserProfile.oneYearVision}. Let's discuss your execution plans or active struggles.”
        </div>
    `;
}

/* --- Send Dialogue Question --- */
async function sendChatMessage(event) {
    event.preventDefault();

    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const question = chatInput.value.trim();

    if (!question || !currentUserProfile) return;

    // Append user message bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = question;
    chatMessages.appendChild(userBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Clear and disable input
    chatInput.value = '';
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    // Append Typing Indicator
    const typingBubble = document.createElement('div');
    typingBubble.id = 'chat-typing';
    typingBubble.className = 'chat-bubble future typing-indicator';
    typingBubble.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/api/chat-futureme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userProfile: currentUserProfile,
                chatHistory: chatHistory,
                question: question
            })
        });

        const result = await response.json();

        // Remove typing indicator
        const typingEl = document.getElementById('chat-typing');
        if (typingEl) typingEl.remove();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Chat processing error.');
        }

        // Add user question to history state
        chatHistory.push({
            role: 'user',
            message: question
        });

        // Add response to history state
        chatHistory.push({
            role: 'futureme',
            message: result.reply
        });

        // Append reply bubble
        const replyBubble = document.createElement('div');
        replyBubble.className = 'chat-bubble future';
        replyBubble.innerText = result.reply;
        chatMessages.appendChild(replyBubble);

    } catch (error) {
        console.error('Chat error:', error);
        
        // Remove typing indicator if still exists
        const typingEl = document.getElementById('chat-typing');
        if (typingEl) typingEl.remove();

        const errBubble = document.createElement('div');
        errBubble.className = 'chat-bubble future';
        errBubble.style.color = '#ff453a';
        errBubble.innerText = 'FutureMe could not respond right now. Try again.';
        chatMessages.appendChild(errBubble);
    } finally {
        // Re-enable Inputs
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.focus();
    }
}

/* --- Focus & Navigate to Chat Area --- */
function focusChat(event) {
    event.preventDefault();
    const chatSection = document.getElementById('chat');
    const chatInput = document.getElementById('chat-input');
    if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            if (chatInput) chatInput.focus();
        }, 800);
    }
}

/* --- Copy Results to Clipboard --- */
function copyResult() {
    if (!currentUserProfile) return;

    const message = document.getElementById('dynamic-message').innerText;
    const identity = document.getElementById('dynamic-identity').innerText;
    const movesList = document.getElementById('dynamic-moves');
    const habit = document.getElementById('dynamic-habit').innerText;
    const warning = document.getElementById('dynamic-warning').innerText;
    const mantra = document.getElementById('dynamic-mantra').innerText;

    let moves = [];
    movesList.querySelectorAll('li').forEach(li => moves.push(li.innerText));

    const textToCopy = `FutureMe Reflection Result — Nitish's Founder Labs
--------------------------------------------------------
Message from Future Self:
"${message}"

Future Identity:
${identity}

Next 3 Moves:
1. ${moves[0] || ''}
2. ${moves[1] || ''}
3. ${moves[2] || ''}

One Habit to Start Today:
${habit}

Future Warning:
${warning}

Daily Mantra:
"${mantra}"`;

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast('FutureMe results copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy results.');
        });
}

/* --- Reset Form & Regenerate --- */
function regenerateFutureMe() {
    const formEl = document.getElementById('futureme-form');
    const resultEl = document.getElementById('result-view');
    const generateBtn = document.getElementById('generate-btn');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');

    // Reset profile variables
    currentUserProfile = null;
    chatHistory = [];

    // Reset Form Fields
    formEl.reset();
    resultEl.style.display = 'none';
    formEl.style.display = 'block';
    generateBtn.disabled = false;

    // Reset Chat State
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    chatInput.placeholder = "Calibrate identity first...";
    chatMessages.innerHTML = `
        <div class="chat-bubble future">
            "Feed the reflection engine above first to calibrate your timeline and open communication with your future self."
        </div>
    `;

    // Scroll to form
    document.getElementById('create').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* --- Share Button Action --- */
function triggerShare() {
    showToast('Your FutureMe moment is ready to share.');
}

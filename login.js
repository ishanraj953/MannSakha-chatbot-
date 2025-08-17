// Initialize users array in localStorage if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}

// Sign-Up Functionality
function handleSignup(event) {
    event.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('signupErrorMessage');

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users'));

    // Check if email already exists
    const userExists = users.some(user => user.email === email);
    if (userExists) {
        errorMessage.textContent = 'Email already exists. Please use a different email.';
        errorMessage.style.display = 'block';
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match. Please try again.';
        errorMessage.style.display = 'block';
        return;
    }

    // Add new user to localStorage
    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Store email in localStorage for pre-filling in login page
    localStorage.setItem('signupEmail', email);

    alert('Sign-up successful! Redirecting to login page...');
    window.location.href = 'login.html'; // Redirect to login page
}

// Login Functionality
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users'));

    // Check if user exists and credentials match
    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        // Clear signupEmail from localStorage after successful login
        localStorage.removeItem('signupEmail');
        alert('Login successful! Redirecting to homepage...');
        fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    alert(data.message);
                }
            });

        window.location.href = '/index.html'; // Redirect to homepage
    } else {
        errorMessage.textContent = 'Invalid email or password. Please try again.';
        errorMessage.style.display = 'block';
    }
}

// Pre-fill email in login page if coming from sign-up
window.onload = function () {
    const emailField = document.getElementById('email');
    if (emailField) {
        const signupEmail = localStorage.getItem('signupEmail');
        if (signupEmail) {
            emailField.value = signupEmail;
        }
    }
};

// Redirect to Chatbot Section
document.getElementById('chatRedirect')?.addEventListener('click', function () {
    document.getElementById('chatbot')?.scrollIntoView({ behavior: 'smooth' });
});

// AI Chatbot
function sendMessage() {
    const userInput = document.getElementById('userInput')?.value.trim();
    if (!userInput) return;

    const chatArea = document.getElementById('chatArea');
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-bubble user-message';
    userMessage.textContent = userInput;
    chatArea.appendChild(userMessage);

    document.getElementById('userInput').value = '';

    setTimeout(() => {
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-bubble ai-message';
        let response = 'I’m here to help! How can I assist you?';
        if (userInput.toLowerCase().includes('anxious')) {
            response = 'I’m sorry you’re feeling anxious. Let’s try a calming exercise together.';
        } else if (userInput.toLowerCase().includes('sad')) {
            response = 'I’m here for you. Here’s a quote: "You are enough just as you are."';
        }
        aiMessage.textContent = response;
        chatArea.appendChild(aiMessage);
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 500);
}

document.getElementById('userInput')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Mood Tracking
let moods = [];
function logMood() {
    const mood = document.getElementById('moodSelect')?.value;
    moods.push({ mood, date: new Date() });
    updateMoodTrend();
    alert('Mood logged: ' + mood);
}

function updateMoodTrend() {
    const trendDiv = document.getElementById('moodTrend');
    if (!trendDiv) return;
    if (moods.length === 0) {
        trendDiv.textContent = 'No mood data yet.';
        return;
    }
    const happyCount = moods.filter(m => m.mood === 'happy').length;
    const sadCount = moods.filter(m => m.mood === 'sad').length;
    trendDiv.textContent = `Mood Trend: ${happyCount} Happy, ${sadCount} Sad days.`;
}

// Journaling
function saveJournal() {
    const entry = document.getElementById('journalEntry')?.value;
    if (entry) {
        alert('Journal entry saved!');
        document.getElementById('journalEntry').value = '';
        if (entry.toLowerCase().includes('happy')) {
            document.getElementById('insightText').textContent = 'You seem to be feeling happy today! Keep it up.';
        } else if (entry.toLowerCase().includes('stressed')) {
            document.getElementById('insightText').textContent = 'You mentioned feeling stressed. Try a breathing exercise.';
        }
    }
}

// Personalized Insights
function showSuggestion() {
    const insightText = document.getElementById('insightText')?.textContent;
    if (insightText.includes('stressed')) {
        alert('Try this: Inhale for 4 seconds, hold for 4, exhale for 4. Repeat 5 times.');
    } else {
        alert('Keep up the good vibes! Maybe try a mindfulness exercise today.');
    }
}

// Guided Meditation
function playMeditation(type) {
    alert(`Starting ${type} meditation session... (This is a placeholder for audio playback)`);
}

// Gamification
let points = 0;
let streak = 0;
function completeActivity() {
    points += 10;
    streak += 1;
    document.getElementById('points').textContent = points;
    document.getElementById('streak').textContent = `${streak} days`;
    if (points >= 30) {
        const badges = document.getElementById('badges');
        badges.innerHTML += '<span class="badge">🌟 Achiever</span>';
    }
}
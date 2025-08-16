// Dark Mode Functionality
let currentTheme = localStorage.getItem('theme') || 'auto';

// Function to get system theme preference
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Function to set theme
function setTheme(theme) {
    let actualTheme = theme;
    
    // Handle auto theme
    if (theme === 'auto') {
        actualTheme = getSystemTheme();
    }
    
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', actualTheme);
    localStorage.setItem('theme', theme);
    
    // Update toggle button
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        const text = toggleBtn.querySelector('span');
        
        if (actualTheme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = theme === 'auto' ? 'Auto' : 'Light';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = theme === 'auto' ? 'Auto' : 'Dark';
        }
    }
}

// Function to toggle theme
function toggleTheme() {
    let newTheme;
    if (currentTheme === 'light') {
        newTheme = 'dark';
    } else if (currentTheme === 'dark') {
        newTheme = 'auto';
    } else {
        newTheme = 'light';
    }
    setTheme(newTheme);
}

// Initialize theme on page load
function initializeTheme() {
    setTheme(currentTheme);
    
    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (currentTheme === 'auto') {
                setTheme('auto');
            }
        });
    }
    
    // Log theme status for debugging
    console.log(`Theme initialized: ${currentTheme} (actual: ${document.documentElement.getAttribute('data-theme')})`);
}

// Initialize users array in localStorage if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}
console.log("script.js loaded 1234");

// Sign-Up Functionality with Auto-Login
function handleSignup(event) {
    event.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('signupErrorMessage');

    const users = JSON.parse(localStorage.getItem('users'));

    const userExists = users.some(user => user.email === email);
    if (userExists) {
        errorMessage.textContent = 'Email already exists. Please use a different email.';
        errorMessage.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match. Please try again.';
        errorMessage.style.display = 'block';
        return;
    }

    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));

    localStorage.setItem('loggedInUser', JSON.stringify({ email }));

    alert('Sign-up successful! Logging you in...');
    window.location.href = 'index.html';
}

// Login Functionality
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    const users = JSON.parse(localStorage.getItem('users'));

    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify({ email }));
        alert('Login successful! Redirecting to homepage...');
        window.location.href = 'index.html';
    } else {
        errorMessage.textContent = 'Invalid email or password. Please try again.';
        errorMessage.style.display = 'block';
    }
}

// Logout Functionality
function logout() {
    localStorage.removeItem('loggedInUser');
    alert('Logged out successfully! Redirecting to login page...');
    window.location.href = 'login.html';
}

// Display logged-in user email in header and handle redirects
window.onload = function () {
    // Initialize theme first
    initializeTheme();
    
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'login.html' || currentPage === 'signup.html') {
            window.location.href = 'index.html';
        }
    } else {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html') {
            window.location.href = 'login.html';
        }
    }
};

// Mobile Menu Toggle Function
function toggleMobileMenu() {
    const navMenu = document.querySelector('nav ul');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const navMenu = document.querySelector('nav ul');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu && navMenu.classList.contains('active') && 
        !navMenu.contains(event.target) && 
        !mobileToggle.contains(event.target)) {
        navMenu.classList.remove('active');
    }
});

// Close mobile menu when clicking on a link
document.addEventListener('click', function(event) {
    if (event.target.tagName === 'A' && event.target.href) {
        const navMenu = document.querySelector('nav ul');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    }
});

// Redirect to Chatbot Section
document.getElementById('chatRedirect')?.addEventListener('click', function () {
    document.getElementById('chatbot')?.scrollIntoView({ behavior: 'smooth' });
});

// AI Chatbot with API Call (Backend Integration)
async function sendMessage() {
    const userInput = document.getElementById('userInput')?.value.trim();
    if (!userInput) return;

    const chatArea = document.getElementById('chatArea');
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-bubble user-message';
    userMessage.textContent = userInput;
    chatArea.appendChild(userMessage);

    document.getElementById('userInput').value = '';

    try {
        const response = await fetch('http://localhost:3050/api/gemini', { // Backend endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-bubble ai-message';
            aiMessage.textContent = `API Error: ${response.status} ${response.statusText}`;
            chatArea.appendChild(aiMessage);
            chatArea.scrollTop = chatArea.scrollHeight;
            return;
        }

        const data = await response.json();
        const aiResponse = data.reply || "I didn’t understand that.";

        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-bubble ai-message';
        aiMessage.textContent = aiResponse;
        chatArea.appendChild(aiMessage);
        chatArea.scrollTop = chatArea.scrollHeight;
    } catch (error) {
        console.error('API Request Failed:', error);
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-bubble ai-message';
        aiMessage.textContent = "API failed";
        chatArea.appendChild(aiMessage);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

document.getElementById('userInput')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Mood Tracking
let selectedMood = null;

function selectMood(element) {
    // Remove selected class from all options
    document.querySelectorAll('.mood-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    element.classList.add('selected');
    selectedMood = element.getAttribute('data-mood');
}

function logMood() {
    if (!selectedMood) {
        alert('Please select a mood first');
        return;
    }
    
    const intensity = document.getElementById('moodIntensity').value;
    const date = new Date().toLocaleDateString();
    
    // In a real app, you would save this to a database
    console.log(`Logged mood: ${selectedMood}, Intensity: ${intensity}, Date: ${date}`);
    
    // Show confirmation
    alert(`Your ${selectedMood} mood (intensity: ${intensity}) has been logged!`);
    
    // Update mood chart
    updateMoodChart();
}

// Journaling
const journalPrompts = [
    "What made you happy today?",
    "What challenge did you overcome today?",
    "What are you grateful for today?",
    "What did you learn about yourself today?",
    "How are you feeling right now and why?"
];

function newPrompt() {
    const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    document.getElementById('journalPrompt').textContent = randomPrompt;
    document.getElementById('journalEntry').value = '';
    document.getElementById('journalEntry').focus();
}

function saveJournal() {
    const entry = document.getElementById('journalEntry').value.trim();
    if (!entry) {
        alert('Please write something in your journal before saving');
        return;
    }
    
    const prompt = document.getElementById('journalPrompt').textContent;
    const date = new Date().toLocaleString();
    
    // In a real app, you would save this to a database
    console.log(`Saved journal entry:\nPrompt: ${prompt}\nEntry: ${entry}\nDate: ${date}`);
    
    // Show confirmation
    alert('Your journal entry has been saved!');
    
    // Clear the textarea
    document.getElementById('journalEntry').value = '';
    
    // Update word count
    updateWordCount();
}

// Word count for journal
document.getElementById('journalEntry').addEventListener('input', updateWordCount);

function updateWordCount() {
    const text = document.getElementById('journalEntry').value;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.querySelector('.word-count').textContent = `${wordCount}/500 words`;
}

// Mood Chart
let moodChart;

function updateMoodChart() {
    const ctx = document.getElementById('moodChart').getContext('2d');
    
    // Sample data - in a real app, this would come from your database
    const moodData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Mood Level',
            data: [6, 7, 5, 8, 7, 9, 8],
            backgroundColor: 'rgba(255, 145, 77, 0.2)',
            borderColor: 'rgba(255, 145, 77, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    };
    
    if (moodChart) {
        moodChart.destroy();
    }
    
    moodChart = new Chart(ctx, {
        type: 'line',
        data: moodData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Mood level: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

// Time range selector
document.getElementById('timeRange').addEventListener('change', function() {
    // In a real app, this would fetch different data based on the time range
    console.log(`Time range changed to: ${this.value}`);
    updateMoodChart();
});

// Insights
function showSuggestion() {
    const suggestions = [
        "Try a 5-minute breathing exercise to reduce stress",
        "Consider journaling about your current feelings",
        "A short walk outside might help clear your mind",
        "Listen to calming music for 10 minutes",
        "Practice gratitude by listing 3 things you're thankful for"
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    document.getElementById('insightText').textContent = randomSuggestion;
}

function shareInsight() {
    const insight = document.getElementById('insightText').textContent;
    alert(`Sharing insight: "${insight}"\nIn a real app, this would open your device's share dialog.`);
}

// Meditation
function playMeditation(type) {
    alert(`Starting ${type} meditation\nIn a real app, this would play the audio.`);
}

// Gamification
function completeActivity() {
    // In a real app, this would update your points in the database
    const pointsElement = document.getElementById('points');
    const currentPoints = parseInt(pointsElement.textContent);
    const newPoints = currentPoints + 10;
    pointsElement.textContent = newPoints;
    
    // Update streak
    const streakElement = document.getElementById('streak');
    const currentStreak = parseInt(streakElement.textContent);
    streakElement.textContent = currentStreak + 1;
    
    // Update activities
    const activitiesElement = document.getElementById('activities');
    const currentActivities = parseInt(activitiesElement.textContent);
    activitiesElement.textContent = currentActivities + 1;
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    const currentWidth = parseInt(progressFill.style.width);
    progressFill.style.width = `${Math.min(currentWidth + 10, 100)}%`;
    
    // Show confirmation
    alert('Activity completed! +10 points');
    
    // Check for new badges
    checkBadges(newPoints);
}

function checkBadges(points) {
    // In a real app, you would have more complex badge logic
    if (points >= 100 && !document.querySelector('.badge.meditator')) {
        // Add new badge
        alert('Congratulations! You earned the Meditator badge!');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set initial journal prompt
    newPrompt();
    
    // Initialize mood chart
    updateMoodChart();
    
    // Set up mood intensity slider
    document.getElementById('moodIntensity').addEventListener('input', function() {
        document.getElementById('intensityValue').textContent = this.value;
    });
    
    // Add animation to sections when they come into view
    const sections = document.querySelectorAll('.feature-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(section);
    });
});


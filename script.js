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
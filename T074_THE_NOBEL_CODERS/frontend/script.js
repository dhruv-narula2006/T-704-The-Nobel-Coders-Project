// --- Activity Tracker ---
// Stores all tracked activities
const activities = [];
const activityForm = document.getElementById('activity-form');
const activityList = document.getElementById('activity-list');

// Dynamically add environmental activities checkboxes if not present
const checkboxGroup = document.querySelector('.checkbox-group');
if (checkboxGroup && checkboxGroup.children.length === 0) {
    const envActivities = [
        { label: 'Planting Trees', value: 'planting' },
        { label: 'Watering Plants', value: 'watering' },
        { label: 'Carpooling', value: 'carpooling' },
        { label: 'Recycling', value: 'recycling' }
    ];
    envActivities.forEach(act => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `<input type="checkbox" value="${act.value}" id="chk-${act.value}">
                         <label for="chk-${act.value}" style="margin-left:6px;">${act.label}</label>`;
        checkboxGroup.appendChild(div);
    });
}

// Handle activity form submission
activityForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // Get values from form fields
    const meal = document.getElementById('meal-type').value;
    const vehicle = document.getElementById('vehicle-type').value;
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const outsideFood = document.getElementById('outside-food').value;
    const duration = parseInt(document.getElementById('activity-duration').value) || 0;
    const activitiesChecked = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => cb.value);

    // Add new activity to the array
    activities.push({
        meal, vehicle, distance, outsideFood, activitiesChecked, duration, timestamp: new Date()
    });
    renderActivities();
    updateEmissionCalculator();

    // Reset form fields after submission
    activityForm.reset();
    // Uncheck all checkboxes manually (reset doesn't always work for checkboxes)
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => cb.checked = false);
});

// Render recent activities in the tracker section
function renderActivities() {
    activityList.innerHTML = '';
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="empty-message">No activities tracked yet.</p>';
        return;
    }
    activities.slice(-5).reverse().forEach(act => {
        const el = document.createElement('div');
        el.className = 'activity-item';
        el.innerHTML = `
            <strong>${act.meal}</strong> | ${act.vehicle} | ${act.distance}km
            <br>
            <small>${act.activitiesChecked.join(', ') || 'No env. activities'} | ${act.duration} min</small>
            <br>
            <span style="font-size:0.9em;color:#aaa;">${act.timestamp.toLocaleString()}</span>
        `;
        activityList.appendChild(el);
    });
}

// --- Emission Calculator ---
// Calculate carbon scores based on activities
function calculateScores() {
    let negative = 0, positive = 0;
    activities.forEach(act => {
        // Negative impact calculation
        if (act.meal === 'beef') negative += 5;
        else if (act.meal === 'chicken') negative += 2;
        else if (act.meal === 'fish') negative += 1.5;
        else if (act.meal === 'vegetarian') negative += 1;
        else if (act.meal === 'vegan') negative += 0.5;

        if (act.vehicle === 'car') negative += act.distance * 0.21;
        else if (act.vehicle === 'electric-car') negative += act.distance * 0.07;
        else if (act.vehicle === 'bus') negative += act.distance * 0.09;
        else if (act.vehicle === 'train') negative += act.distance * 0.05;

        if (act.outsideFood === 'yes-not-disposed') negative += 2;
        else if (act.outsideFood === 'yes-disposed') negative += 0.5;

        // Positive impact calculation
        if (act.activitiesChecked.includes('planting')) positive += 2;
        if (act.activitiesChecked.includes('watering')) positive += 0.5;
        if (act.activitiesChecked.includes('carpooling')) positive += 1;
        if (act.activitiesChecked.includes('recycling')) positive += 1.5;

        positive += act.duration * 0.02;
    });
    const score = Math.max(0, 100 - negative + positive);
    return { score: Math.round(score), negative: Math.round(negative), positive: Math.round(positive) };
}

// Update emission calculator display and chart
function updateEmissionCalculator() {
    const { score, negative, positive } = calculateScores();

    // If no activities, show "No Data" in the emission calculator section
    if (activities.length === 0) {
        document.getElementById('carbon-score').textContent = 'No Data';
        document.getElementById('negative-score').textContent = 'No Data';
        document.getElementById('positive-score').textContent = 'No Data';
    } else {
        document.getElementById('carbon-score').textContent = score;
        document.getElementById('negative-score').textContent = negative;
        document.getElementById('positive-score').textContent = positive;
    }

    renderSuggestions(score, negative, positive);
    renderEmissionChart(negative, positive);
}

// --- Suggestions ---
// Generate and display personalized suggestions
function renderSuggestions(score, negative, positive) {
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';
    if (activities.length === 0) {
        suggestionsList.innerHTML = '<p class="empty-message">Track your activities to receive personalized suggestions.</p>';
        return;
    }

    const suggestions = [];

    // Personalized suggestions based on user's data
    if (negative > positive) suggestions.push({
        text: 'Try more plant-based meals and reduce meat consumption.',
        icon: '🥗',
        link: 'https://www.eatright.org/food/nutrition/vegetarian-and-special-diets/plant-based-diets'
    });
    if (negative > 20) suggestions.push({
        text: 'Consider using public transport, cycling, or walking more often.',
        icon: '🚲',
        link: 'https://www.epa.gov/greenvehicles/why-go-green-transportation'
    });
    if (score < 80) suggestions.push({
        text: 'Increase your positive environmental activities like recycling or gardening.',
        icon: '🌱',
        link: 'https://www.wwf.org.uk/updates/ten-tips-reduce-your-plastic-footprint'
    });
    if (positive > negative) suggestions.push({
        text: 'Great job! Keep up your eco-friendly habits.',
        icon: '🏆',
        link: 'https://www.un.org/en/actnow'
    });

    // Extra: Show a tip if user has not done any environmental activities
    const lastActivity = activities[activities.length - 1];
    if (lastActivity && lastActivity.activitiesChecked.length === 0) {
        suggestions.push({
            text: 'Try adding an environmental activity to your daily routine!',
            icon: '🌳',
            link: 'https://www.treepeople.org/tree-planting/'
        });
    }

    // Extra: Show a random eco tip
    const ecoTips = [
        { text: 'Switch off lights when not in use.', icon: '💡', link: 'https://www.energy.gov/energysaver/articles/tips-saving-energy-home' },
        { text: 'Carry a reusable water bottle.', icon: '🧃', link: 'https://www.nrdc.org/stories/rethink-your-drink' },
        { text: 'Compost your kitchen waste.', icon: '🍂', link: 'https://www.epa.gov/recycle/composting-home' },
        { text: 'Shop local to reduce transport emissions.', icon: '🛒', link: 'https://www.greenmatters.com/p/benefits-of-shopping-local' }
    ];
    const randomTip = ecoTips[Math.floor(Math.random() * ecoTips.length)];
    suggestions.push(randomTip);

    // Render suggestions with icons and links
    suggestions.forEach(s => {
        const el = document.createElement('div');
        el.className = 'suggestion-item';
        el.innerHTML = `<span class="suggestion-icon">${s.icon}</span>
                        <span class="suggestion-text">${s.text}</span>
                        <a href="${s.link}" target="_blank" class="suggestion-link">Learn more</a>`;
        suggestionsList.appendChild(el);
    });
}

// --- Emission Breakdown Chart (Pure JS) ---
// Draws the emission breakdown pie chart
function renderEmissionChart(negative, positive) {
    const canvas = document.getElementById('emission-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Show empty pie chart if no activities (no user data)
    if (activities.length === 0) {
        ctx.beginPath();
        ctx.moveTo(100, 75);
        ctx.arc(100, 75, 60, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.fillStyle = '#e0e0e0';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(100, 75, 35, 0, 2 * Math.PI);
        ctx.fillStyle = '#f5f5f5';
        ctx.fill();

        ctx.font = '16px Poppins';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('No Data', 100, 80);
        return;
    }

    // Draw doughnut chart manually
    const total = negative + positive || 1;
    const negAngle = (negative / total) * 2 * Math.PI;
    const posAngle = (positive / total) * 2 * Math.PI;

    // Negative Impact
    ctx.beginPath();
    ctx.moveTo(100, 75);
    ctx.arc(100, 75, 60, 0, negAngle, false);
    ctx.closePath();
    ctx.fillStyle = '#FF5252';
    ctx.fill();

    // Positive Impact
    ctx.beginPath();
    ctx.moveTo(100, 75);
    ctx.arc(100, 75, 60, negAngle, negAngle + posAngle, false);
    ctx.closePath();
    ctx.fillStyle = '#00E676';
    ctx.fill();

    // Inner circle for doughnut
    ctx.beginPath();
    ctx.arc(100, 75, 35, 0, 2 * Math.PI);
    ctx.fillStyle = '#132F4C';
    ctx.fill();

    // Labels
    ctx.font = '14px Poppins';
    ctx.fillStyle = '#fff';
    ctx.fillText('Neg', 40, 80);
    ctx.fillText('Pos', 140, 80);
}

// --- Forum Form ---
// Handles forum form logic and adds extra questions if not present
const dietForm = document.getElementById('diet-form');
if (dietForm) {
    // Add sample questions if not present
    if (dietForm.children[0].children.length === 0) {
        const questions = [
            { label: 'How many meat-based meals do you eat per week?', name: 'meat-meals', type: 'number' },
            { label: 'Do you prefer organic or local produce?', name: 'organic-local', type: 'text' },
            { label: 'Any dietary restrictions?', name: 'diet-restrict', type: 'text' }
        ];
        questions.forEach(q => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `<label>${q.label}</label><input type="${q.type}" name="${q.name}" />`;
            dietForm.children[0].appendChild(div);
        });
        // Transportation questions
        const transQuestions = [
            { label: 'How often do you use public transport?', name: 'public-transport', type: 'text' },
            { label: 'Do you own an electric vehicle?', name: 'electric-vehicle', type: 'text' },
            { label: 'Average daily travel distance (km)?', name: 'daily-distance', type: 'number' }
        ];
        transQuestions.forEach(q => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `<label>${q.label}</label><input type="${q.type}" name="${q.name}" />`;
            dietForm.children[3].appendChild(div);
        });
    }
    dietForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for sharing your habits!');
    });
}

// --- Rankings (Mock Data) ---
// Returns leaderboard data for weekly, monthly, and all-time tabs
function getLeaderboardData(type) {
    const score = calculateScores().score;
    if (type === 'weekly') {
        return [
            { user: 'Alice', score: 98 },
            { user: 'Bob', score: 92 },
            { user: 'You', score },
            { user: 'Charlie', score: 88 },
            { user: 'Dana', score: 85 }
        ];
    }
    if (type === 'monthly') {
        return [
            { user: 'Alice', score: 390 },
            { user: 'You', score: score * 4 },
            { user: 'Bob', score: 370 },
            { user: 'Charlie', score: 355 }
        ];
    }
    return [
        { user: 'Alice', score: 1200 },
        { user: 'Bob', score: 1150 },
        { user: 'You', score: score * 12 },
        { user: 'Charlie', score: 1100 }
    ];
}

// Renders leaderboard for the selected tab
function renderLeaderboard(tab, data) {
    const container = document.getElementById(tab + '-leaderboard');
    if (!container) return;
    container.innerHTML = '';
    data.forEach((entry, i) => {
        const el = document.createElement('div');
        el.className = 'leaderboard-row';
        // Highlight "You" in the leaderboard
        if (entry.user === 'You') {
            el.classList.add('highlight-user');
        }
        el.innerHTML = `<span class="rank">${i + 1}</span>
                        <span class="user">${entry.user}</span>
                        <span class="score">${entry.score}</span>`;
        container.appendChild(el);
    });
}

// Shows only the selected leaderboard tab and hides others
function showLeaderboard(tab) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
    // Show selected tab content
    const tabContent = document.getElementById(tab + '-tab');
    if (tabContent) tabContent.style.display = 'block';

    // Render leaderboard for selected tab
    renderLeaderboard(tab, getLeaderboardData(tab));
}

// Rankings Tabs click event: switch leaderboard tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        showLeaderboard(this.dataset.tab);
    });
});

// Initial: show only weekly leaderboard
showLeaderboard('weekly');

// --- Newsletter ---
// Handles newsletter subscription form
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm && newsletterForm.children.length === 0) {
    newsletterForm.innerHTML = `
        <input type="email" placeholder="Your email" required>
        <button type="submit"><i class="fas fa-paper-plane"></i></button>
    `;
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Subscribed! Thank you.');
    });
}

// --- Initial Render ---
// Render activities and emission calculator on page load
renderActivities();
updateEmissionCalculator();

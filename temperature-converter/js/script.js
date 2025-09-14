// DOM Elements
const temperatureInput = document.getElementById('temperature-input');
const unitSelect = document.getElementById('unit-select');
const resultContainer = document.getElementById('result-container');
const conversionResults = document.getElementById('conversion-results');
const historyContainer = document.getElementById('history-container');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const copyButton = document.getElementById('copy-results');
const clearHistoryButton = document.getElementById('clear-history');

// State
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];
const MAX_HISTORY_ITEMS = 5;

// Initialize the app
function init() {
    loadThemePreference();
    renderHistory();
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Real-time conversion on input change
    temperatureInput.addEventListener('input', debounce(handleConversion, 300));
    
    // Conversion on unit change
    unitSelect.addEventListener('change', handleConversion);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Copy results to clipboard
    copyButton.addEventListener('click', copyResultsToClipboard);
    
    // Close formula tooltip when clicking outside
    document.addEventListener('click', (e) => {
        const tooltip = document.querySelector('.formula-tooltip');
        if (!tooltip.contains(e.target)) {
            const content = tooltip.querySelector('.formula-content');
            content.style.display = 'none';
            content.style.opacity = '0';
        }
    });
    
    // Toggle formula tooltip
    const formulaButton = document.querySelector('.formula-button');
    const formulaContent = document.querySelector('.formula-content');
    
    formulaButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = formulaContent.style.display === 'block';
        formulaContent.style.display = isVisible ? 'none' : 'block';
        formulaContent.style.opacity = isVisible ? '0' : '1';
    });
    
    // Clear history button
    clearHistoryButton.addEventListener('click', clearHistory);
}

// Handle temperature conversion
function handleConversion() {
    const inputValue = parseFloat(temperatureInput.value);
    const fromUnit = unitSelect.value;
    
    // Clear previous results and error
    conversionResults.innerHTML = '';
    
    // Validate input
    if (isNaN(inputValue)) {
        showPlaceholder();
        return;
    }
    
    // Convert temperature
    let results = [];
    const timestamp = new Date().toLocaleString();
    
    switch (fromUnit) {
        case 'celsius':
            results = [
                { unit: 'Fahrenheit', value: celsiusToFahrenheit(inputValue).toFixed(2) },
                { unit: 'Kelvin', value: celsiusToKelvin(inputValue).toFixed(2) }
            ];
            break;
            
        case 'fahrenheit':
            results = [
                { unit: 'Celsius', value: fahrenheitToCelsius(inputValue).toFixed(2) },
                { unit: 'Kelvin', value: fahrenheitToKelvin(inputValue).toFixed(2) }
            ];
            break;
            
        case 'kelvin':
            if (inputValue < 0) {
                showError('Temperature cannot be below absolute zero (0K)');
                return;
            }
            results = [
                { unit: 'Celsius', value: kelvinToCelsius(inputValue).toFixed(2) },
                { unit: 'Fahrenheit', value: kelvinToFahrenheit(inputValue).toFixed(2) }
            ];
            break;
    }
    
    // Display results
    displayResults(results, inputValue, fromUnit, timestamp);
    
    // Add to history
    addToHistory(inputValue, fromUnit, results, timestamp);
}

// Temperature conversion functions
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function celsiusToKelvin(celsius) {
    return celsius + 273.15;
}

function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

function fahrenheitToKelvin(fahrenheit) {
    return (fahrenheit - 32) * 5/9 + 273.15;
}

function kelvinToCelsius(kelvin) {
    return kelvin - 273.15;
}

function kelvinToFahrenheit(kelvin) {
    return (kelvin - 273.15) * 9/5 + 32;
}

// Display conversion results
function displayResults(results, inputValue, fromUnit, timestamp) {
    // Hide placeholder
    const placeholder = document.querySelector('.result-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    
    // Show results container and copy button
    conversionResults.style.display = 'block';
    copyButton.style.display = 'flex';
    
    // Clear previous results
    conversionResults.innerHTML = '';
    
    // Add original input
    const originalItem = document.createElement('div');
    originalItem.className = 'result-item';
    originalItem.innerHTML = `
        <span><i class="fas fa-temperature-high" style="margin-right: 8px; color: var(--accent-color);"></i>${formatUnitName(fromUnit)}</span>
        <span class="result-value">${parseFloat(inputValue).toFixed(2)} ${getUnitSymbol(fromUnit)}</span>
    `;
    conversionResults.appendChild(originalItem);
    
    // Add converted results
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.style.animationDelay = `${0.1 * (index + 1)}s`;
        resultItem.style.opacity = '0';
        resultItem.style.animation = 'fadeIn 0.3s forwards';
        
        const icon = result.unit === 'Fahrenheit' ? 'fa-temperature-low' : 'fa-thermometer-half';
        
        resultItem.innerHTML = `
            <span><i class="fas ${icon}" style="margin-right: 8px; color: var(--accent-color);"></i>${result.unit}</span>
            <span class="result-value">${result.value} ${getUnitSymbol(result.unit.toLowerCase())}</span>
        `;
        conversionResults.appendChild(resultItem);
    });
    
    // Add timestamp
    const timeElement = document.createElement('div');
    timeElement.className = 'result-time';
    timeElement.innerHTML = `<i class="far fa-clock" style="margin-right: 6px;"></i>${formatTimeAgo(new Date(timestamp))}`;
    conversionResults.appendChild(timeElement);
    
    // Scroll to results if on mobile
    if (window.innerWidth <= 768) {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Add conversion to history
function addToHistory(inputValue, fromUnit, results, timestamp) {
    const historyItem = {
        inputValue,
        fromUnit,
        results,
        timestamp
    };
    
    // Add to beginning of array
    conversionHistory.unshift(historyItem);
    
    // Limit history size
    if (conversionHistory.length > MAX_HISTORY_ITEMS) {
        conversionHistory.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
    
    // Update UI
    renderHistory();
}

// Render history
function renderHistory() {
    historyContainer.innerHTML = '';
    
    if (conversionHistory.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No conversion history yet.';
        emptyMessage.style.opacity = '0.7';
        emptyMessage.style.textAlign = 'center';
        historyContainer.appendChild(emptyMessage);
        return;
    }
    
    conversionHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const fromValue = parseFloat(item.inputValue).toFixed(2);
        const fromUnit = formatUnitName(item.fromUnit);
        const toUnits = item.results.map(r => `${r.value} ${getUnitSymbol(r.unit.toLowerCase())}`).join(', ');
        
        historyItem.innerHTML = `
            <div>
                <strong>${fromValue} ${getUnitSymbol(item.fromUnit)} ${fromUnit}</strong>
                <span> → ${toUnits}</span>
            </div>
            <div class="history-time">${formatTimeAgo(new Date(item.timestamp))}</div>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

// Theme management
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Copy results to clipboard
async function copyResultsToClipboard() {
    const items = Array.from(document.querySelectorAll('.result-item'));
    const timeElement = document.querySelector('.result-time');
    
    let textToCopy = 'Temperature Conversion Results\n\n';
    
    items.forEach(item => {
        const unit = item.querySelector('span:first-child').textContent.replace(/\s+/g, ' ').trim();
        const value = item.querySelector('.result-value').textContent;
        textToCopy += `${unit}: ${value}\n`;
    });
    
    if (timeElement) {
        textToCopy += `\n${timeElement.textContent.trim()}`;
    }
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        
        // Show copied feedback
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyButton.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.style.backgroundColor = '';
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy text: ', err);
        copyButton.innerHTML = '<i class="fas fa-times"></i> Failed to copy';
        copyButton.style.backgroundColor = '#ef4444';
        
        setTimeout(() => {
            copyButton.innerHTML = '<i class="far fa-copy"></i> Copy Results';
            copyButton.style.backgroundColor = '';
        }, 2000);
    }
}

function showPlaceholder() {
    const placeholder = document.querySelector('.result-placeholder');
    if (placeholder) {
        placeholder.style.display = 'block';
        conversionResults.style.display = 'none';
    }
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Remove any existing error
    const existingError = resultContainer.querySelector('.error-message');
    if (existingError) {
        resultContainer.removeChild(existingError);
    }
    
    resultContainer.appendChild(errorElement);
    
    // Auto-remove error after 3 seconds
    setTimeout(() => {
        if (resultContainer.contains(errorElement)) {
            resultContainer.removeChild(errorElement);
        }
    }, 3000);
}

function formatUnitName(unit) {
    return unit.charAt(0).toUpperCase() + unit.slice(1);
}

function getUnitSymbol(unit) {
    const symbols = {
        'celsius': '°C',
        'fahrenheit': '°F',
        'kelvin': 'K'
    };
    return symbols[unit.toLowerCase()] || '';
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // If the date is in the future, handle it gracefully
    if (diffInSeconds < 0) return 'just now';
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }
    
    return 'just now';
}

// Clear all history
function clearHistory() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to clear all conversion history? This action cannot be undone.')) {
        conversionHistory = [];
        localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
        renderHistory();
        
        // Show feedback
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = 'History cleared';
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 2000);
        }, 100);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

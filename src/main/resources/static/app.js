const API_BASE_URL = '/api/books';

// Global state cache
let booksCache = [];

// DOM Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    catalog: document.getElementById('view-catalog'),
    add: document.getElementById('view-add')
};

const navButtons = {
    dashboard: document.getElementById('btn-dashboard'),
    catalog: document.getElementById('btn-catalog'),
    add: document.getElementById('btn-add')
};

const stats = {
    total: document.getElementById('stat-total'),
    borrowed: document.getElementById('stat-borrowed'),
    available: document.getElementById('stat-available')
};

const tables = {
    featured: document.getElementById('featured-books-table'),
    all: document.getElementById('all-books-table')
};

// Search & Form inputs
const searchInput = document.getElementById('search-input');
const addBookForm = document.getElementById('add-book-form');

// Modal Elements
const borrowModal = document.getElementById('borrow-modal');
const borrowForm = document.getElementById('borrow-form');
const modalBookTitle = document.getElementById('modal-book-title');
const modalBookId = document.getElementById('modal-book-id');
const borrowerNameInput = document.getElementById('borrower-name');
const closeModalBtn = document.getElementById('close-modal');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupEventListeners();
    fetchBooks();
});

// Setup SPA Navigation
function setupNavigation() {
    Object.keys(navButtons).forEach(viewKey => {
        navButtons[viewKey].addEventListener('click', () => {
            // Update active menu buttons
            Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
            navButtons[viewKey].classList.add('active');

            // Switch active views
            Object.values(views).forEach(view => view.classList.remove('active'));
            views[viewKey].classList.add('active');

            // Special reload handlers
            if (viewKey !== 'add') {
                fetchBooks();
            }
        });
    });
}

// Setup general Event Listeners
function setupEventListeners() {
    // Search listener (with simple bounce/input debounce)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchBooks(e.target.value);
        }, 300);
    });

    // Add Book Form Handler
    addBookForm.addEventListener('submit', handleAddBook);

    // Borrow Form Handler
    borrowForm.addEventListener('submit', handleBorrowSubmit);

    // Close Modal Event
    closeModalBtn.addEventListener('click', closeBorrowModal);
    window.addEventListener('click', (e) => {
        if (e.target === borrowModal) {
            closeBorrowModal();
        }
    });

    // Generate ISBN Button Listener
    const generateIsbnBtn = document.getElementById('btn-generate-isbn');
    const isbnInput = document.getElementById('book-isbn');
    generateIsbnBtn.addEventListener('click', () => {
        const randomIsbn = generateRandomISBN();
        isbnInput.value = randomIsbn;
        showToast('Generated a mathematically valid ISBN-13!', 'info');
    });
}

// Helper: Show animated notification toasts
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-xmark';
    if (type === 'info') iconClass = 'fa-solid fa-circle-info';

    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove toast after animation completes
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// REST: Fetch books from Spring Boot API
async function fetchBooks(searchQuery = '') {
    try {
        let url = API_BASE_URL;
        if (searchQuery.trim() !== '') {
            url += `?search=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load books catalog: ${response.statusText}`);
        }
        
        const books = await response.json();
        booksCache = books;
        
        updateStats();
        renderTables();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// Calculate and update stats counters
function updateStats() {
    const totalCount = booksCache.length;
    const borrowedCount = booksCache.filter(b => b.borrowed).length;
    const availableCount = totalCount - borrowedCount;

    // Fast counters animation
    animateCounter(stats.total, totalCount);
    animateCounter(stats.borrowed, borrowedCount);
    animateCounter(stats.available, availableCount);
}

// Helper: Animate counter numbers smoothly
function animateCounter(element, target) {
    const current = parseInt(element.innerText) || 0;
    if (current === target) return;
    
    let start = current;
    const duration = 400;
    const stepTime = Math.abs(Math.floor(duration / (target - start || 1)));
    const timer = setInterval(() => {
        if (start < target) {
            start++;
        } else {
            start--;
        }
        element.innerText = start;
        if (start === target) {
            clearInterval(timer);
        }
    }, Math.max(stepTime, 20));
}

// Render dynamic rows in both Dashboard & Catalog tables
function renderTables() {
    // 1. Render Dashboard Table (Limit to first 3 books for featured panel)
    tables.featured.innerHTML = '';
    const featuredBooks = booksCache.slice(0, 3);
    
    if (featuredBooks.length === 0) {
        tables.featured.innerHTML = `<tr><td colspan="4" class="text-center" style="text-align: center; color: var(--text-muted);">No books available in the catalog.</td></tr>`;
    } else {
        featuredBooks.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="book-title-cell">${escapeHtml(book.title)}</span>
                    <span class="book-author-cell">by ${escapeHtml(book.author)}</span>
                </td>
                <td><code>${escapeHtml(book.isbn)}</code></td>
                <td>
                    <span class="status-pill ${book.borrowed ? 'borrowed' : 'available'}">
                        <i class="fa-solid ${book.borrowed ? 'fa-hand-holding-hand' : 'fa-circle-check'}"></i>
                        ${book.borrowed ? 'Borrowed' : 'Available'}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        ${book.borrowed 
                            ? `<button class="btn btn-secondary btn-icon" title="Return Book" onclick="returnBook(${book.id})"><i class="fa-solid fa-rotate-left"></i></button>`
                            : `<button class="btn btn-primary btn-icon" title="Borrow Book" onclick="openBorrowModal(${book.id}, '${escapeQuote(book.title)}')"><i class="fa-solid fa-hand-holding-hand"></i></button>`
                        }
                    </div>
                </td>
            `;
            tables.featured.appendChild(tr);
        });
    }

    // 2. Render Catalog Table (All books)
    tables.all.innerHTML = '';
    if (booksCache.length === 0) {
        tables.all.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No books match your query.</td></tr>`;
    } else {
        booksCache.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>#${book.id}</code></td>
                <td>
                    <span class="book-title-cell">${escapeHtml(book.title)}</span>
                    <span class="book-author-cell">by ${escapeHtml(book.author)}</span>
                </td>
                <td><code>${escapeHtml(book.isbn)}</code></td>
                <td>${book.borrowedBy ? escapeHtml(book.borrowedBy) : '<span style="color: var(--text-muted); font-size: 0.85rem;">—</span>'}</td>
                <td>${book.dueDate ? formatDate(book.dueDate) : '<span style="color: var(--text-muted); font-size: 0.85rem;">—</span>'}</td>
                <td>
                    <span class="status-pill ${book.borrowed ? 'borrowed' : 'available'}">
                        <i class="fa-solid ${book.borrowed ? 'fa-hand-holding-hand' : 'fa-circle-check'}"></i>
                        ${book.borrowed ? 'Borrowed' : 'Available'}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        ${book.borrowed 
                            ? `<button class="btn btn-secondary" onclick="returnBook(${book.id})"><i class="fa-solid fa-rotate-left"></i> Return</button>`
                            : `<button class="btn btn-primary" onclick="openBorrowModal(${book.id}, '${escapeQuote(book.title)}')"><i class="fa-solid fa-hand-holding-hand"></i> Borrow</button>`
                        }
                        <button class="btn btn-danger btn-icon" title="Remove Book" onclick="deleteBook(${book.id})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;
            tables.all.appendChild(tr);
        });
    }
}

// REST: Add Book Request
async function handleAddBook(e) {
    e.preventDefault();
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const isbn = document.getElementById('book-isbn').value.trim();

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, isbn })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Validation failed. Check your inputs.');
        }

        const newBook = await response.json();
        showToast(`Successfully added: "${newBook.title}"`, 'success');
        
        // Reset and redirect
        addBookForm.reset();
        navButtons.catalog.click(); // Switch view to catalog
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Modal Controllers
function openBorrowModal(id, title) {
    modalBookId.value = id;
    modalBookTitle.innerText = title;
    borrowerNameInput.value = '';
    borrowModal.classList.add('active');
    borrowerNameInput.focus();
}

function closeBorrowModal() {
    borrowModal.classList.remove('active');
}

// REST: Borrow Request Submit
async function handleBorrowSubmit(e) {
    e.preventDefault();
    const id = modalBookId.value;
    const borrowedBy = borrowerNameInput.value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/${id}/borrow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ borrowedBy })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to borrow book.');
        }

        const updatedBook = await response.json();
        showToast(`"${updatedBook.title}" borrowed successfully by ${updatedBook.borrowedBy}`, 'success');
        
        closeBorrowModal();
        fetchBooks(searchInput.value); // reload current query
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// REST: Return Book Request
async function returnBook(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/return`, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to return book.');
        }

        const updatedBook = await response.json();
        showToast(`"${updatedBook.title}" returned successfully!`, 'success');
        
        fetchBooks(searchInput.value);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// REST: Delete Book Request
async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book from the catalog permanently?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete book.');
        }

        showToast('Book deleted from catalog successfully.', 'info');
        fetchBooks(searchInput.value);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Utility: XSS prevention html escape
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// Utility: Quote escape for inline Javascript string arguments
function escapeQuote(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
}

// Utility: Date formatter
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Mathematically valid ISBN-13 Generator (EAN, Group, Publisher, Title, Checksum)
function generateRandomISBN() {
    const prefix = '978';
    
    // Generate 9 random digits for the main code
    let digits = '';
    for (let i = 0; i < 9; i++) {
        digits += Math.floor(Math.random() * 10);
    }
    
    // Calculate standard ISBN-13 checksum (weighted mod-10)
    const fullDigits = prefix + digits;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(fullDigits[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    
    // Format elegantly as standard ISBN-13 structure: 978-X-XX-XXXXXX-X
    const group = digits[0];
    const publisher = digits.substring(1, 3);
    const title = digits.substring(3, 9);
    
    return `${prefix}-${group}-${publisher}-${title}-${checksum}`;
}

// Expose action callbacks globally for dynamic table row buttons
window.openBorrowModal = openBorrowModal;
window.returnBook = returnBook;
window.deleteBook = deleteBook;
window.generateRandomISBN = generateRandomISBN;

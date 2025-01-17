// DOM elements
const categoriesList = document.getElementById('categories');
const notesContainer = document.getElementById('notes-container');
const addNoteBtn = document.getElementById('add-note');
const editView = document.getElementById('edit-view');
const editTitle = document.getElementById('edit-title');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const noteCategorySelect = document.getElementById('note-category');
const noteColorInput = document.getElementById('note-color');
const saveNoteBtn = document.getElementById('save-note');
const closeEditBtn = document.getElementById('close-edit');
const addCategoryBtn = document.getElementById('add-category');

const syncButton = document.getElementById('sync-button');
const dbConfigModal = document.getElementById('db-config-modal');
const dbUrlInput = document.getElementById('db-url');
const dbKeyInput = document.getElementById('db-key');
const saveDbConfigButton = document.getElementById('save-db-config');
const closeModalButton = document.getElementById('close-modal');

let originalTitle = '';
let originalContent = '';

const searchInput = document.getElementById('search-input');
const quill = new Quill('#editor', {
  modules: {
    toolbar: [
      
      ['bold', 'italic', 'underline'],
      ['code-block'],
    ],
  },
  placeholder: 'Compose an epic...',
  theme: 'snow', // or 'bubble'
});


let dbUrl = localStorage.getItem('dbUrl') || '';
let dbKey = localStorage.getItem('dbKey') || '';

// State
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [];
let currentCategory = 'All categories';
let editingNoteId = null;

// Functions
function saveToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('categories', JSON.stringify(categories));
}

function renderCategories() {
    const isMobile = window.innerWidth <= 768;
    categoriesList.innerHTML = `<li class="${currentCategory === 'All categories' ? 'active' : ''}" data-category="All categories">All categories</li>`;
    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category;
        li.dataset.category = category;
        if (category === currentCategory) li.classList.add('active');
        categoriesList.appendChild(li);
    });

    // Add click event listener to the categories list
    categoriesList.onclick = (e) => {
        if (e.target.tagName === 'LI') {
            currentCategory = e.target.dataset.category;
            renderCategories();
            renderNotes();
        }
    };

    // Conditionally render the dropdown for mobile screens
    if (isMobile) {
        noteCategorySelect.style.display = 'block';
        updateCategoryDropdown(currentCategory);
    } else {
        noteCategorySelect.style.display = 'none';
    }
}

function handleResize() {
    renderCategories();
}
window.addEventListener('resize', handleResize);

// Initial render
renderCategories();
renderNotes();
function searchNotes(keyword) {
    const lowercasedKeyword = keyword.toLowerCase();
    return notes.filter(note => 
        note.title.toLowerCase().includes(lowercasedKeyword) || 
        note.content.toLowerCase().includes(lowercasedKeyword)
    );
}

function renderFilteredNotes(filteredNotes) {
    notesContainer.innerHTML = '';
    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.style.borderLeft = `5px solid ${note.color || '#ffffff'}`;

        // Convert newlines back to <br> for display
        const noteContent = note.content.replace(/\n/g, '<br>');

        noteCard.innerHTML = `
            <h3>${note.title}</h3>
            <p>${noteContent.substring(0, 100)}${noteContent.length > 100 ? '...' : ''}</p>
        `;
        noteCard.onclick = () => openEditView(note);
        notesContainer.appendChild(noteCard);
    });
}



searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.trim();
    if (keyword) {
        const filteredNotes = searchNotes(keyword);
        renderFilteredNotes(filteredNotes);

        // Highlight the first result
        const firstResult = document.querySelector('.note-card');
        if (firstResult) {
            firstResult.classList.add('highlighted');
        }
    } else {
        renderNotes(); // Render all notes when search is empty
    }
});

categoriesList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI' && editView.classList.contains('open')) {
        currentCategory = e.target.dataset.category;
        renderCategories();
    }
});

// Modify your existing renderNotes function to use the new renderFilteredNotes function
function renderNotes() {
    const filteredNotes = currentCategory === 'All categories'
        ? notes
        : notes.filter(note => note.category === currentCategory);
    renderFilteredNotes(filteredNotes);

}

function openEditView(note = null) {
    noteTitleInput.value = note ? note.title : 'New Note';
    quill.setContents(note ? quill.clipboard.convert(note.content.replace(/\n/g, '<br>')) : '');
    noteColorInput.value = note ? note.color : '#ffffff';
    editingNoteId = note ? note.id : null;
    editView.classList.add('open');

    // Highlight the selected category in the side panel
    currentCategory = note ? note.category : 'All categories';
    renderCategories();

    // Store original values
    originalTitle = noteTitleInput.value;
    originalContent = quill.root.innerHTML;

    // Remove glow effect when opening the edit view
    saveNoteBtn.classList.remove('glow');

    // Focus on the title input
    quill.focus();
}


// Add these functions to check for changes and update the glow effect
function checkForChanges() {
    if (noteTitleInput.value !== originalTitle || quill.root.innerHTML !== originalContent) {
        saveNoteBtn.classList.add('glow');
    } else {
        saveNoteBtn.classList.remove('glow');
    }
}


function updateCategoryDropdown(selectedCategory = null) {
    noteCategorySelect.innerHTML = categories.map(category => 
        `<option value="${category}" ${selectedCategory === category ? 'selected' : ''}>${category}</option>`
    ).join('');
    noteCategorySelect.innerHTML += '<option value="new">+ New Category</option>';
}

noteCategorySelect.addEventListener('change', function() {
    if (this.value === 'new') {
        const newCategory = prompt('Enter new category name:');
        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            saveToLocalStorage();
            updateCategoryDropdown(newCategory);
        } else {
            this.value = selectedCategory || categories[0];
        }
    }
});

function closeEditView() {
    editView.classList.remove('open');
}
function sanitizeContent(content) {
    return content.replace(/&nbsp;/g, ' ')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
        .replace(/<p>/g, '\n')
        .replace(/<\/p>/g, '')
        .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
        .trim();
}

function saveNote() {
    const title = noteTitleInput.value.trim();
    let content = quill.root.innerHTML.trim(); // Get content from Quill editor and trim it

    // Sanitize content
    content = sanitizeContent(content);

    const category = currentCategory; // Use the selected category from the side panel
    const color = noteColorInput.value;
    const lastModified = Date.now();

    if (!title || !content) return;

    if (editingNoteId) {
        const noteIndex = notes.findIndex(note => note.id === editingNoteId);
        notes[noteIndex] = { ...notes[noteIndex], title, content, category, color, lastModified };
    } else {
        const newNote = { id: Date.now().toString(), title, content, category, color, lastModified };
        notes.push(newNote);
    }

    // Sanitize content before saving to local storage
    notes = notes.map(note => ({
        ...note,
        content: sanitizeContent(note.content)
    }));

    saveToLocalStorage();
    renderNotes();
    closeEditView();

    // Remove glow effect after saving
    saveNoteBtn.classList.remove('glow');
}


function addCategory() {
    const category = prompt('Enter new category name:');
    if (category && !categories.includes(category)) {
        categories.push(category);
        saveToLocalStorage();
        renderCategories();
        renderNotes();
    }
}


function openDbConfigModal() {
  dbUrlInput.value = dbUrl;
  dbKeyInput.value = dbKey;
  dbConfigModal.style.display = 'block';
}

function closeDbConfigModal() {
  dbConfigModal.style.display = 'none';
}

function saveDbConfig() {
  dbUrl = dbUrlInput.value.trim();
  dbKey = dbKeyInput.value.trim();
  localStorage.setItem('dbUrl', dbUrl);
  localStorage.setItem('dbKey', dbKey);
  closeDbConfigModal();
}

function startSyncAnimation() {
  syncButton.classList.add('syncing');
}

function stopSyncAnimation() {
  syncButton.classList.remove('syncing');
}

// Modify the syncWithDatabase function
async function syncWithDatabase() {
  if (!dbUrl || !dbKey) {
    openDbConfigModal();
    return;
  }

  startSyncAnimation();

  try {
        const response = await fetch(dbUrl, {
            method: 'GET',
            headers: {
                'x-apikey': dbKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const dbNotes = await response.json();
		
		    // Extract unique categories from database notes
    const dbCategories = [...new Set(dbNotes.map(note => note.category))];

    // Update local categories
    dbCategories.forEach(category => {
      if (!categories.includes(category)) {
        categories.push(category);
      }
    });
	
        // Merge database notes with local notes, prioritizing local changes
        dbNotes.forEach(dbNote => {
            const localNote = notes.find(note => note.id === dbNote.id);
            if (localNote) {
                // If local note is more recent, keep local version
                if (!localNote.lastModified || dbNote.lastModified > localNote.lastModified) {
                    Object.assign(localNote, {
                        title: dbNote.title,
                        content: dbNote.note,
                        category: dbNote.category,
                        color: dbNote.color,
                        lastModified: dbNote.lastModified
                    });
                }
            } else {
                // Add new note from database
                notes.push({
                    id: dbNote.id,
                    title: dbNote.title,
                    content: dbNote.note,
                    category: dbNote.category,
                    color: dbNote.color,
                    lastModified: dbNote.lastModified
                });
            }
        });

        // Update or create notes in the database
        for (const note of notes) {
            const dbNote = dbNotes.find(dbNote => dbNote.id === note.id);
            if (dbNote) {
                // Update existing note if local version is more recent
                if (!dbNote.lastModified || note.lastModified > dbNote.lastModified) {
                    await fetch(`${dbUrl}/${dbNote._id}`, {
                        method: 'PATCH',
                        headers: {
                            'x-apikey': dbKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: note.title,
                            note: note.content,
                            category: note.category,
                            color: note.color,
                            lastModified: note.lastModified
                        })
                    });
                }
            } else {
                // Create new note
                await fetch(dbUrl, {
                    method: 'POST',
                    headers: {
                        'x-apikey': dbKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: note.id,
                        title: note.title,
                        note: note.content,
                        category: note.category,
                        color: note.color,
                        lastModified: note.lastModified
                    })
                });
            }
        }

        saveToLocalStorage();
		renderCategories(); // Add this line to update the categories in the sidebar
        renderNotes();
        stopSyncAnimation();
    alert('Sync completed successfully!');
  } catch (error) {
    console.error('Sync error:', error);
    stopSyncAnimation();
    alert('Failed to sync with database. Please check your configuration and try again.');
  }
}
function renderCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDate = today.getDate();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    let calendarHTML = `
    <table>
      <caption>${monthNames[month]} ${year}</caption>
      <tr>
        <th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th>
      </tr>
      <tr>
  `;

    let day = 1;
    for (let i = 0; i < 42; i++) {
        if (i < startingDay || day > daysInMonth) {
            calendarHTML += "<td></td>";
        } else {
            const highlightClass = (day === currentDate) ? 'highlight' : '';
            calendarHTML += `<td class="${highlightClass}">${day}</td>`;
            day++;
        }
        if ((i + 1) % 7 === 0) {
            calendarHTML += "</tr><tr>";
        }
    }

    calendarHTML += "</tr></table>";

    document.getElementById('calendar').innerHTML = calendarHTML;
}
/* dkspkasdkosa */
document.getElementById('settings-button').addEventListener('click', function() {
    document.getElementById('settings-modal').style.display = 'block';
});

document.getElementById('close-settings-modal').addEventListener('click', function() {
    document.getElementById('settings-modal').style.display = 'none';
});

document.getElementById('save-settings').addEventListener('click', function() {
    const fileInput = document.getElementById('background-image');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            localStorage.setItem('backgroundImage', imageUrl);
            document.body.style.backgroundImage = `url(${imageUrl})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
        };
        reader.readAsDataURL(file);
    }
    document.getElementById('settings-modal').style.display = 'none';
});
document.addEventListener('DOMContentLoaded', function() {
    const savedImage = localStorage.getItem('backgroundImage');
    if (savedImage) {
        document.body.style.backgroundImage = `url(${savedImage})`;
        document.body.style.backgroundSize = 'cover'; // or 'contain'
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.getElementById('glass-overlay').style.zIndex = '-1';
    }
});
// Call renderCalendar when the page loads

// Call renderCalendar when the page loads
document.addEventListener('DOMContentLoaded', renderCalendar);


// Event listeners
// Global key event listener
document.addEventListener('keydown', function(e) {
    // Check if Ctrl+S is pressed
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault(); // Prevent the default save action
        
        // Check if we're not in the edit view
        if (!editView.classList.contains('open')) {
            syncWithDatabase();
        } else {
            // If in edit view, perform the save action (you already have this part)
            saveNote();
            closeEditView();
        }
    }
});
document.addEventListener('keydown', function(e) {
    // Check if Ctrl + F is pressed
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault(); // Prevent the default browser search
        searchInput.focus(); // Focus on the search input
        
        // Optionally, scroll the search input into view if it's not visible
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
document.addEventListener('keydown', function(e) {
    // Check if Ctrl + N is pressed
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault(); // Prevent the default browser search
		if (!editView.classList.contains('open')) {
            openEditView();
		}
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const highlightedElement = document.querySelector('.note-card.highlighted');
        console.log(highlightedElement);
        if (highlightedElement) {
            openEditView(highlightedElement);
        }
    }
});
noteTitleInput.addEventListener('input', checkForChanges);
quill.on('text-change', checkForChanges);

addNoteBtn.onclick = () => openEditView();
closeEditBtn.onclick = closeEditView;
saveNoteBtn.onclick = saveNote;
addCategoryBtn.onclick = addCategory;

syncButton.addEventListener('click', syncWithDatabase);
saveDbConfigButton.addEventListener('click', saveDbConfig);
closeModalButton.addEventListener('click', closeDbConfigModal);

// Initial render
renderCategories();
renderNotes();
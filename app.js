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

// State
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Vaccation', 'Uni stuff', 'Home'];
let currentCategory = 'All categories';
let editingNoteId = null;

// Functions
function saveToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('categories', JSON.stringify(categories));
}

function renderCategories() {
    categoriesList.innerHTML = `<li class="${currentCategory === 'All categories' ? 'active' : ''}" data-category="All categories">All categories</li>`;
    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category;
        li.dataset.category = category;
        if (category === currentCategory) li.classList.add('active');
        li.onclick = () => {
            currentCategory = category;
            renderCategories();
            renderNotes();
        };
        categoriesList.appendChild(li);
    });
}

function renderNotes() {
    notesContainer.innerHTML = '';
    const filteredNotes = currentCategory === 'All categories' 
        ? notes 
        : notes.filter(note => note.category === currentCategory);
    
    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.style.borderLeft = `5px solid ${note.color || '#ffffff'}`;
        noteCard.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
        `;
        noteCard.onclick = () => openEditView(note);
        notesContainer.appendChild(noteCard);
    });
}

function openEditView(note = null) {
    editTitle.value = note ? note.title : '';
    noteContentInput.value = note ? note.content : '';
    updateCategoryDropdown(note ? note.category : null);
    editingNoteId = note ? note.id : null;
    editView.style.display = 'flex';
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
    editView.style.display = 'none';
    editingNoteId = null;
}

function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const category = noteCategorySelect.value;
    const color = noteColorInput.value;

    if (!title || !content) return;

    if (editingNoteId) {
        const noteIndex = notes.findIndex(note => note.id === editingNoteId);
        notes[noteIndex] = { ...notes[noteIndex], title, content, category, color };
    } else {
        const newNote = { id: Date.now(), title, content, category, color };
        notes.push(newNote);
    }

    saveToLocalStorage();
    renderNotes();
    closeEditView();
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

// Event listeners
addNoteBtn.onclick = () => openEditView();
closeEditBtn.onclick = closeEditView;
saveNoteBtn.onclick = saveNote;
addCategoryBtn.onclick = addCategory;

// Initial render
renderCategories();
renderNotes();
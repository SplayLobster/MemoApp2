<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="home">
    <!-- Header Section -->
    <div class="header">
      <!-- Title with dynamic classes based on theme -->
      <img src="../assets/logo.png" alt="Logo" class="logo" />
      <h1 :class="{ 'title-dark': isDarkTheme, 'title-light': !isDarkTheme }">
        Memo
      </h1>
      <!-- Search bar with search functionality -->
      <div class="search-container">
        <i class="fas fa-search search-icon" @click="startSearch"></i>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          class="search-input"
          id="searchInput"
        />
        <i
          v-if="searchQuery"
          class="fas fa-times-circle clear-icon"
          @click="clearSearch"
        ></i>
      </div>
      <!-- Toggle theme button -->
      <button class="theme-toggle" @click="toggleTheme">
        <i
          :class="[
            'fas',
            isDarkTheme ? 'fa-sun' : 'fa-moon',
            isDarkTheme ? 'text-yellow-400' : 'text-gray-800',
          ]"
        ></i>
      </button>
      <!-- Toggle notes per line button -->
      <button class="toggle-button" @click="toggleNotesPerLine">
        <img
          v-if="notesPerLine === 1 && isDarkTheme"
          src="../assets/list-dark.png"
          alt="List View"
          class="toggle-icon"
        />
        <img
          v-else-if="notesPerLine === 5 && isDarkTheme"
          src="../assets/grid-dark.png"
          alt="Grid View"
          class="toggle-icon"
        />
        <img
          v-else-if="notesPerLine === 1 && !isDarkTheme"
          src="../assets/list-light.png"
          alt="Grid View"
          class="toggle-icon"
        />
        <img
          v-else-if="notesPerLine === 5 && !isDarkTheme"
          src="../assets/grid-light.png"
          alt="Grid View"
          class="toggle-icon"
        />
      </button>
    </div>
    <!-- Divider Section -->
    <div
      class="divider"
      :class="{ 'divider-dark': isDarkTheme, 'divider-light': !isDarkTheme }"
    ></div>

    <!-- Controls Section -->
    <div class="controls">
      <div class="notes-control"></div>
      <!-- Sort dropdown component -->
      <SortDropdown class="sort-dropdown" @select-sort-criteria="sortNotes" />
    </div>

    <!-- Note Grid Section -->
    <div class="note-grid">
      <!-- Draggable component for notes -->
      <draggable
        :value="filteredNotesWithAddButton"
        class="notes-grid"
        group="notes"
        :item-key="(note) => note.id"
        :style="{ gridTemplateColumns: `repeat(${notesPerLine}, 1fr)` }"
        @end="handleDragEnd"
        v-bind="$attrs"
        v-on="$listeners"
        ghost-class="dragging-ghost"
        chosen-class="dragging-chosen"
        handle=".note-container"
        @start="handleDragStart"
      >
        <!-- Loop through notes and render them -->
        <div
          v-for="(note, index) in filteredNotesWithAddButton"
          :key="note.id"
          :class="[
            'note-container',
            note.isAddButton ? 'add-note-container' : '',
          ]"
          :draggable="!note.isAddButton"
        >
          <template v-if="note && !note.isAddButton">
            <!-- Render existing notes -->
            <Note
              v-if="note.type === 'classic'"
              :title="note.title"
              :content="note.content"
              :timestamp="note.timestamp"
              :utente="note.utente"
              :notesPerLine="notesPerLine"
              :note-id="note.id"
              :index="index"
              @update-note="updateNote(index, $event.action, $event.data)"
            />
            <ListNote
              v-else-if="note.type === 'list'"
              :title="note.title"
              :items="note.items"
              :timestamp="note.timestamp"
              :utente="note.utente"
              :notesPerLine="notesPerLine"
              :note-id="note.id"
              @update-note="updateNote(index, $event.action, $event.data)"
            />
          </template>
          <template v-else-if="note && note.isAddButton">
            <!-- Render add button -->
            <div class="note add-note">
              <div @click="addNote('Classic')" class="add-button-classic">
                <!-- Add Classic Note -->
                <i class="fas fa-plus"></i>
                <span>Add Classic Note</span>
              </div>

              <!-- Divider between Add Buttons -->
              <div class="add-divider"></div>

              <!-- Second Add Button -->
              <div @click="addNote('List')" class="add-button-list">
                <!-- Add List Note -->
                <i class="fas fa-plus"></i>
                <span>Add List Note</span>
              </div>
            </div>
          </template>
        </div>
      </draggable>
    </div>
  </div>
</template>

<script>
import Note from "../components/Note.vue";
import ListNote from "../components/ListNote.vue";
import SortDropdown from "../components/SortDropdown.vue";
import draggable from "vuedraggable";
import { loadNotes, saveNotes, updateNotes } from "@/api/apiService";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Home",
  components: {
    Note,
    ListNote,
    SortDropdown,
    draggable,
  },
  data() {
    return {
      notes: [],
      nextId: 1,
      searchQuery: "",
      utente: "",
      notesPerLine: parseInt(localStorage.getItem("PerLine")) || 5, // Default to 5 notes if no criteria is set
      isDarkTheme: localStorage.getItem("theme") === "dark", // Default to dark if no criteria is set
    };
  },
  computed: {
    // Filtered notes based on search query
    filteredNotes() {
      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.notes;

      return this.notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const utenteMatch = note.utente.toLowerCase().includes(query);
        return titleMatch || utenteMatch;
      });
    },
    // Add button included in filtered notes
    filteredNotesWithAddButton() {
      const notesWithAddButton = [...this.filteredNotes];
      notesWithAddButton.push({ isAddButton: true }); // Add button as a separate note
      return notesWithAddButton;
    },
  },

  async mounted() {
    // Check local storage for theme preference
    console.log(this.notesPerLine);
    const savedTheme = localStorage.getItem("theme");
    this.isDarkTheme = savedTheme === "dark";
    this.applyTheme();
    // Retrieve user information from session storage
    let operatorName = sessionStorage.getItem("operatorName");
    let operatorSurname = sessionStorage.getItem("operatorSurname");
    this.utente = `${operatorName} ${operatorSurname}`;
    // Load notes from server
    try {
      const response = await loadNotes(); // Assuming fetchNotes returns an array with notes and occupancy status
      this.notes = response.notes;
      if (this.notes.length > 0) {
        const lastId = Math.max(...this.notes.map((note) => note.id));
        this.nextId = lastId + 1;
      } else {
        this.nextId = 1; // Start from 1 if no notes exist
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  },
  methods: {
    // Refresh page function
    refreshPage() {
      window.location.reload();
    },
    // Load notes from server function
    async loadNotesFromServer() {
      try {
        const response = await loadNotes();
        this.notes = response.notes;
      } catch (error) {
        console.error("Error loading notes:", error);
      }
    },
    // Save all notes function
    async saveAllNotes() {
      try {
        await saveNotes(this.notes);
      } catch (error) {
        console.error("Error saving notes:", error);
      }
    },
    // Toggle theme between 5 and 1 note per line
    toggleNotesPerLine() {
      this.notesPerLine = this.notesPerLine === 5 ? 1 : 5;
      localStorage.setItem("PerLine", this.notesPerLine);
    },
    // Toggle theme between light and dark
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      this.applyTheme();
      localStorage.setItem("theme", this.isDarkTheme ? "dark" : "light");
    },
    // Apply selected theme
    applyTheme() {
      const themeClass = this.isDarkTheme ? "dark-theme" : "light-theme";
      document.body.classList.toggle("dark-theme", this.isDarkTheme);
      document.documentElement.setAttribute("data-theme", themeClass);
    },
    // Start search function
    startSearch() {
      if (this.searchQuery.trim() !== "") {
        this.search();
      }
      this.refreshPage();
    },
    // Perform search based on query
    search() {
      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.notes;

      return this.notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const utenteMatch = note.utente.toLowerCase().includes(query);
        return titleMatch || utenteMatch;
      });
    },
    // Clear search query
    clearSearch() {
      this.searchQuery = "";
      this.refreshPage();
    },
    // Sort notes function
    sortNotes(criteria) {
      switch (criteria) {
        case "Most":
          this.notes.sort((a, b) => {
            if (a.type === "classic" && b.type === "classic") {
              return b.content.length - a.content.length;
            } else if (a.type === "list" && b.type === "list") {
              return b.items.length - a.items.length;
            } else {
              return 0; // Fallback if types don't match
            }
          });
          break;
        case "Least":
          this.notes.sort((a, b) => {
            if (a.type === "classic" && b.type === "classic") {
              return a.content.length - b.content.length;
            } else if (a.type === "list" && b.type === "list") {
              return a.items.length - b.items.length;
            } else {
              return 0; // Fallback if types don't match
            }
          });
          break;
        case "Recent":
          this.notes.sort((a, b) => b.timestamp - a.timestamp);
          break;
        case "Oldest":
          this.notes.sort((a, b) => a.timestamp - b.timestamp);
          break;
        default:
          break;
      }
      this.saveAllNotes(); // Save after sorting
    },

    handleNoteReorder(event) {
      const movedNote = this.notes.splice(event.oldIndex, 1)[0];
      this.notes.splice(event.newIndex, 0, movedNote);
    },
    // Drag start function
    handleDragStart(event) {
      // Ignore drag if the item is an add button
      if (
        event.item &&
        event.item.firstChild &&
        event.item.firstChild.classList.contains("add-note")
      ) {
        event.preventDefault();
        return;
      }
      event.item.style.opacity = "0";
      document.body.style.cursor = "grabbing";
      event.item.style.cursor = "grabbing";
    },
    // Drag end function
    handleDragEnd(event) {
      // Ignore drag if the item is an add button
      if (
        event.item &&
        event.item.firstChild &&
        event.item.firstChild.classList.contains("add-note")
      ) {
        event.preventDefault();
        return;
      }
      event.item.style.opacity = "1";
      document.body.style.cursor = "default";
      event.item.style.cursor = "grab";
      this.handleNoteReorder(event);
      this.saveAllNotes();
    },
    // Add new note function
    async addNote(type) {
      let addingNoteType = type;
      let newNote;

      // Differenting the type of notes
      if (addingNoteType === "Classic") {
        newNote = {
          title: "",
          content: "",
          id: this.nextId,
          timestamp: Date.now(),
          utente: this.utente,
          type: "classic", // Marking it as a classic note
        };
      } else if (addingNoteType === "List") {
        newNote = {
          title: "",
          items: [],
          id: this.nextId,
          timestamp: Date.now(),
          utente: this.utente,
          type: "list", // Marking it as a list note
        };
      }

      this.nextId++; // Increment the next ID
      this.notes.push(newNote); // Add the note to the list

      try {
        // Save the new note using updateNotes function
        await updateNotes(newNote.id, newNote);

        // Refresh the page after saving
        this.refreshPage();
      } catch (error) {
        console.error("Error saving the new note:", error);
      }
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";
.app {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Ensure full viewport height */
  background-color: var(--background-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.home {
  flex-grow: 1; /* Allow to grow and take remaining space */
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 15px; /* Control distance between logo, title, and search bar */
  margin-bottom: 1.5%;
  height: 20px;
  position: relative;
}

.divider {
  background-color: var(--text-color);
}

.logo {
  height: 40px; /* Adjust size as needed */
  width: auto; /* Maintain aspect ratio */
}

.search-container {
  display: flex;
  align-items: center;
  position: relative;
  margin-left: 10%; /* Distance from logo/title */
}

.search-icon {
  cursor: pointer;
  position: absolute;
  left: 10px;
  font-size: 14px;
  color: #565656;
}

.search-input {
  font-size: 16px;
  width: 450px;
  padding: 10px 18px 10px 40px; /* Added left padding for the icon */
  background-color: var(--search-bar-background-color);
  border: 2px solid;
  border-color: var(--note-background-color);
  border-radius: 10px;
  color: var(--text-color);
  transition: background-color 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease;
  outline: none; /* Remove default focus outline */
}

.search-input:focus {
  background-color: var(
    --background-color
  ); /* Change background color on focus */
  border-color: #2a577e; /* Change border color on focus */
  box-shadow: 0 0 5px rgba(136, 141, 148, 0.566); /* Add box shadow for highlighting */
}
.clear-icon {
  position: absolute;
  right: 1rem;
  cursor: pointer;
  color: #565656;
  background-color: transparent;
}
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  margin-right: 0.5%;
}
.notes-control {
  display: flex;
  align-items: left;
}
.sort-dropdown {
  margin-left: auto;
}
.toggle-button {
  position: relative; /* Absolutely position within the .header */
  left: 0; /* Align to the right edge */
  top: 140%; /* Center vertically */
  transform: translateY(-50%); /* Adjust vertical alignment */
  background-color: transparent;
  color: inherit;
  border: none;
  border-radius: 50%;
  padding: 10px; /* Adjust padding */
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.toggle-icon {
  width: 30px;
  height: 30px;
}

.theme-toggle {
  position: absolute; /* Absolutely position within the .header */
  right: 0; /* Align to the right edge */
  top: 50%; /* Center vertically */
  transform: translateY(-50%); /* Adjust vertical alignment */
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.notes-grid {
  display: grid;
  gap: 20px;
  flex-grow: 1; /* Allow the grid to grow and take remaining space */
  overflow-y: auto; /* Allow vertical scrolling if the grid overflows */
}

.note-container {
  cursor: grab; /* Default cursor for draggable notes */
  display: flex;
  justify-content: center;
  background-color: var(--background-color);
  color: var(--note-text-color);
}

.add-note {
  /* Styles for the add note container */
  max-width: 700px;
  width: 100%;
  height: 120px;
  background-color: #f0f0f0;
  border: 2px dashed #ccc;
  color: #aaa;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 10px;
  flex-direction: row-reverse;
}

.add-button-classic,
.add-button-list {
  height: 100%;
  flex-grow: 1; /* Take all available space */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 10px; /* Adjust padding for inner content */
  margin: 0 5px; /* Margin for spacing between buttons */
}

.add-button-classic:hover,
.add-button-list:hover {
  background-color: #565656; /* Background color on hover */
}

.add-note > div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-divider {
  border-left: 1px solid #ccc;
  height: 120%; /* Adjusted height for divider */
  margin: 0 5px; /* Margin for spacing */
}

.dragging-ghost {
  opacity: 0.6;
  transform: scale(1.05);
}

.dragging-chosen {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.564);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, 
.fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
@media (max-width: 600px) {
  .notes-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}

@media (min-width: 600px) {
  .notes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .notes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1200px) {
  .notes-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    position: relative; /* Ensure absolute positioning is still relative to header */
  }

  .theme-toggle {
    position: absolute; /* Keep it absolute */
    right: 10px; /* A small margin from the edge */
    top: 10px; /* Adjust vertical position on small screens */
    transform: none; /* Reset transform */
  }
}
</style>

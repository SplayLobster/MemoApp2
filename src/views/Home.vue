<template>
  <div class="home">
    <!-- Header Section -->
    <div class="header">
      <!-- Title -->
      <h1 style="cursor: pointer" :class="'title-dark'" @click="refreshPage">
        Memo
      </h1>
      <!-- Search bar with search functionality -->
      <div class="search-container">
        <i class="fas fa-search search-icon" @click="startSearch"></i>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Cerca titolo, utente..."
          class="search-input"
          id="searchInput"
          @input="handleSearchInput"
        />
        <i
          v-if="searchQuery"
          class="fas fa-times-circle clear-icon"
          @click="clearSearch"
        ></i>
      </div>
    </div>
    <!-- Divider Section -->
    <div class="divider" :class="'divider-dark'"></div>

    <!-- Controls Section -->
    <div class="controls">
      <div class="notes-control"></div>
      <!-- Sort dropdown component -->
      <SortDropdown class="sort-dropdown" @select-sort-criteria="sortNotes" />
    </div>

    <!-- Note Grid Section -->
    <div>
      <!-- Draggable component for notes -->
      <draggable
        :value="filteredNotesWithAddButton"
        :class="'notes-grid'"
        group="notes"
        :item-key="(note) => note.id"
        @end="handleDragEnd"
        v-bind="$attrs"
        v-on="$listeners"
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
            { dragging: noteDragging === note.id },
          ]"
          :draggable="!note.isAddButton ? 'true' : 'false'"
          @dragstart="noteDragging = note.id"
          @dragend="noteDragging = null"
        >
          <template v-if="note && !note.isAddButton">
            <!-- Render existing notes -->
            <Note
              v-if="note.type === 'classic'"
              :title="note.title"
              :content="note.content"
              :timestamp="note.timestamp"
              :utente="note.utente"
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
                <span>Nota</span>
              </div>

              <!-- Divider between Add Buttons -->
              <div class="add-divider"></div>

              <!-- Second Add Button -->
              <div @click="addNote('List')" class="add-button-list">
                <!-- Add List Note -->
                <i class="fas fa-plus"></i>
                <span>Lista</span>
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
      noteDragging: null,
      searchQuery: "",
      utente: "",
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
    // Save all notes function
    async saveAllNotes() {
      try {
        await saveNotes(this.notes);
      } catch (error) {
        console.error("Error saving notes:", error);
      }
    },
    // Start search function
    startSearch() {
      if (this.searchQuery.trim() !== "") {
        this.search();
      }
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
    },
    // Handle input in the search bar
    handleSearchInput() {
      // Adjust the search input width based on content
      const inputElement = document.getElementById("searchInput");
      if (inputElement) {
        inputElement.style.width = `${Math.max(
          100,
          this.searchQuery.length * 10
        )}px`;
      }
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
      event.clone.style.opacity = "1000";
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

      // Differentiating the type of notes
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
        //this.refreshPage();
      } catch (error) {
        console.error("Error saving the new note:", error);
      }
    },
  },
};
</script>

<style scoped>
/* Import main styles */
@import "../assets/main.css";

/* App container */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Home container */
.home {
  flex-grow: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 1.5%;
  height: 40px; /* Ensure height allows alignment */
  position: relative;
  width: 100%;
}

/* Title */
.header h1 {
  cursor: pointer;
  margin: 0; /* Remove margin for better alignment */
  flex-shrink: 0; /* Prevent shrinking */
}

/* Search container */
.search-container {
  display: flex;
  align-items: center;
  flex-grow: 1; /* Take up remaining space */
  position: relative;
  min-width: none;
  margin-left: 15px; /* Spacing from the title */
  height: 25px;
}

/* Search icon */
.search-icon {
  cursor: pointer;
  position: absolute;
  left: 10px; /* Adjust for padding */
  font-size: 14px;
  color: #ffff;
}

/* Search text */
.search-text {
  position: absolute;
  top: -8px; /* Place on top border */
  left: 15px; /* Align with search input */
  background-color: var(--background-color); /* Match background */
  padding: 0 5px; /* Add padding around text */
  color: var(--text-color); /* Match text color */
  font-size: 12px;
  pointer-events: none; /* Ensure it's not interactive */
  z-index: 1; /* Ensure it is above the input */
}

/* Search input */
.search-input {
  height: 55px;
  flex-grow: 1;
  font-size: 18px;
  padding: 10px 40px 10px 40px; /* Space for search icon and clear icon */
  background-color: var(--search-bar-background-color);
  border: 2px solid;
  border-color: var(--note-background-color);
  border-radius: 10px;
  color: var(--text-color);
  transition: background-color 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease, width 0.3s ease; /* Add width transition */
  outline: none;
  caret-color: #4a7daa;
}

/* Focus state */
.search-input:focus {
  border-color: #2a577e;
  box-shadow: 0 0 5px transparent;
}

/* Show clear icon when there is input */
.search-input:not(:placeholder-shown) + .clear-icon {
  opacity: 1;
  right: 10px; /* Adjust to position the clear icon */
}

/* Clear icon */
.clear-icon {
  font-size: 25px;
  position: absolute;
  right: 45px; /* Adjust as needed */
  top: 50%; /* Center vertically */
  transform: translateY(-50%);
  cursor: pointer;
  color: #ffff;
  background-color: transparent;
  transition: opacity 0.3s ease, right 0.3s ease; /* Add transition for opacity and position */
  opacity: 0; /* Initially hidden */
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  margin-right: 0.5%;
}

/* Notes control */
.notes-control {
  display: flex;
  align-items: left;
}

/* Sort dropdown */
.sort-dropdown {
  margin-left: auto;
}

/* Notes grid */
.notes-grid {
  display: grid;
  gap: 20px;
  flex-grow: 1;
  overflow-y: auto;
  grid-template-columns: repeat(5, 1fr); /* 5 notes per row */
}

/* Note container */
.note-container {
  min-height: 120px;
  width: 100%;
  max-width: 300px; /* Adjusted width for 5 notes per row */
  margin-bottom: 20px;
  cursor: grab;
  display: block;
  justify-content: center;
  background-color: transparent;
  color: var(--note-text-color);
  overflow: hidden;
  transition: opacity 0.8s ease; /* Add opacity transition */
}

/* Add note button */
.add-note {
  width: 100%;
  max-width: 300px; /* Adjusted width for 5 notes per row */
  height: 120px;
  background-color: #f0f0f0;
  border: #ccc;
  color: #aaa;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  cursor: pointer;
  padding: 10px;
  flex-direction: row-reverse;
  transition: background-color 0.8s ease, opacity 0.8s ease; /* Add opacity transition */
}

/* Add button hover effect */
.add-button-classic,
.add-button-list {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.8s ease;
  padding: 10px;
  margin: 0 5px;
}

.add-button-classic:hover,
.add-button-list:hover {
  background-color: #e0e0e0;
}

/* Divider between add buttons */
.add-divider {
  border-left: 1px solid var(--add-divider-color);
  height: 120%;
  margin: 0 5px;
}
/* Ensure dragged item is fully visible */
.note-container.dragging,
.add-note.dragging {
  opacity: 100%; /* Adjust opacity as needed */
}

/* Ensure dragged item is fully visible */
.dragging {
  opacity: 100%; /* Adjust opacity as needed */
}

/* Responsive styles */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  .notes-grid {
    grid-template-columns: repeat(3, 1fr); /* Adjusted for smaller screens */
  }
  .search-container {
    margin-left: 0; /* Adjust for smaller screens */
  }

  .search-input {
    margin-left: 0; /* Adjust to ensure proper spacing */
  }
}
</style>

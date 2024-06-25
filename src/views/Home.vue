<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="home">
    <!-- Header Section -->
    <header class="header">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <h1 :class="{ 'title-dark': isDarkTheme, 'title-light': !isDarkTheme }">
        Memo
      </h1>
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search"
          class="search-input"
          id="searchInput"
        />
      </div>
      <button class="theme-toggle" @click="toggleTheme">
        <i
          :class="[
            'fas',
            isDarkTheme ? 'fa-sun' : 'fa-moon',
            isDarkTheme ? 'text-yellow-400' : 'text-gray-800',
          ]"
        ></i>
      </button>
      <button class="toggle-button" @click="toggleNotesPerLine">
        <img
          v-if="notesPerLine === 1 && isDarkTheme"
          src="@/assets/list-dark.png"
          alt="List View"
          class="toggle-icon"
        />
        <img
          v-else-if="notesPerLine === 5 && isDarkTheme"
          src="@/assets/grid-dark.png"
          alt="Grid View"
          class="toggle-icon"
        />
        <img
          v-else-if="notesPerLine === 1 && !isDarkTheme"
          src="@/assets/list-light.png"
          alt="List View"
          class="toggle-icon"
        />
        <img
          v-else-if="notesPerLine === 5 && !isDarkTheme"
          src="@/assets/grid-light.png"
          alt="Grid View"
          class="toggle-icon"
        />
      </button>
    </header>

    <div
      class="divider"
      :class="{ 'divider-dark': isDarkTheme, 'divider-light': !isDarkTheme }"
    ></div>

    <!-- Controls Section -->
    <div class="controls">
      <div class="notes-control"></div>
      <SortDropdown class="sort-dropdown" @select-sort-criteria="sortNotes" />
    </div>

    <!-- Note Grid Section -->
    <div
      class="notes-grid"
      :style="{ gridTemplateColumns: `repeat(${notesPerLine}, 1fr)` }"
    >
      <div
        v-for="(note, index) in filteredNotesWithAddButton"
        :key="note.id"
        class="note-container"
        :class="{
          'dragging-placeholder': isDragging && index === draggedNoteIndex,
          'dragging-preview': isDragging && index === chosenNoteIndex,
          'chosen-note': !isDragging && index === chosenNoteIndex,
        }"
        :style="{
          transform:
            isDragging && index === draggedNoteIndex
              ? `translate(${draggedPosition.x}px, ${draggedPosition.y}px)`
              : '',
        }"
        :draggable="!note.isAddButton && !note.isEditing"
        @dragstart="handleDragStart(index, $event)"
        @dragover.prevent
        @drop="handleDrop(index)"
        @dragend="handleDragEnd"
      >
        <transition name="fade">
          <template v-if="!note.isAddButton">
            <!-- Render existing notes -->
            <Note
              :title="note.title"
              :content="note.content"
              :timestamp="note.timestamp"
              :isEditing="note.isEditing"
              :notesPerLine="notesPerLine"
              @update-title="updateTitle(index, $event)"
              @update-content="updateContent(index, $event)"
              @update-time="updateTime(index, $event)"
              @delete-note="deleteNote(index)"
              @update-is-editing="updateIsEditing(index, $event)"
            />
          </template>
        </transition>
        <template v-if="note.isAddButton">
          <!-- Render add button -->
          <div class="note add-note" @click="addNote">
            <i class="fas fa-plus"></i>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import SortDropdown from "../components/SortDropdown.vue";
import Note from "../components/Note.vue";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Home",
  components: {
    Note,
    SortDropdown,
  },
  data() {
    return {
      notes: [],
      nextId: 1,
      notesPerLine: 5,
      searchQuery: "",
      isDarkTheme: localStorage.getItem("theme") === "dark",
      draggedNoteIndex: null,
      chosenNoteIndex: null,
      draggedPosition: { x: 0, y: 0 },
    };
  },
  computed: {
    isAnyNoteEditing() {
      return this.notes.some((note) => note.isEditing);
    },
    isDragging() {
      return this.draggedNoteIndex !== null;
    },
    filteredNotes() {
      const query = this.searchQuery.toLowerCase();
      return this.notes.filter((note) =>
        note.title.toLowerCase().includes(query)
      );
    },
    filteredNotesWithAddButton() {
      return [...this.filteredNotes, { isAddButton: true }];
    },
  },
  mounted() {
    const savedTheme = localStorage.getItem("theme");
    this.isDarkTheme = savedTheme === "dark";
    this.applyTheme();
  },
  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      this.applyTheme();
      localStorage.setItem("theme", this.isDarkTheme ? "dark" : "light");
    },
    applyTheme() {
      const themeClass = this.isDarkTheme ? "dark-theme" : "light-theme";
      document.body.classList.toggle("dark-theme", this.isDarkTheme);
      document.documentElement.setAttribute("data-theme", themeClass);
    },
    updateTitle(index, newTitle) {
      this.notes[index].title = newTitle;
    },
    updateContent(index, newContent) {
      this.notes[index].content = newContent;
    },
    updateTime(index, newTime) {
      this.notes[index].timestamp = newTime;
    },
    toggleNotesPerLine() {
      this.notesPerLine = this.notesPerLine === 1 ? 5 : 1;
    },
    updateIsEditing(index, isEditing) {
      this.notes = this.notes.map((note, idx) => ({
        ...note,
        isEditing: idx === index ? isEditing : false,
      }));
    },
    handleNoteReorder(event) {
      const movedNote = this.notes.splice(event.oldIndex, 1)[0];
      this.notes.splice(event.newIndex, 0, movedNote);
    },
    handleDragStart(index, event) {
      // Check if the note is currently editing
      if (this.notes[index].isEditing) {
        event.preventDefault();
        return;
      }

      this.draggedNoteIndex = index;
    },
    handleDrop(index) {
      if (index !== this.draggedNoteIndex) {
        const draggedNote = this.notes[this.draggedNoteIndex];
        this.notes.splice(this.draggedNoteIndex, 1);
        this.notes.splice(index, 0, draggedNote);
      }
      this.draggedNoteIndex = null;
    },
    handleDragEnd() {
      this.draggedNoteIndex = null;
    },
    reassignIds() {
      this.notes.forEach((note, index) => {
        note.id = index + 1;
      });
      this.nextId = this.notes.length + 1;
    },
    sortNotes(criteria) {
      switch (criteria) {
        case "Most":
          this.notes.sort((a, b) => b.content.length - a.content.length);
          break;
        case "Least":
          this.notes.sort((a, b) => a.content.length - b.content.length);
          break;
        case "Recent":
          this.notes.sort((a, b) => b.timestamp - a.timestamp);
          break;
        case "Oldest":
          this.notes.sort((a, b) => a.timestamp - b.timestamp);
          break;
      }
    },
    addNote() {
      const newNote = {
        title: "",
        content: "",
        timestamp: Date.now(),
        id: this.nextId++,
        isEditing: false,
      };
      this.notes.push(newNote);
    },
    deleteNote(index) {
      this.notes.splice(index, 1);
      this.reassignIds();
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
  margin-bottom: 1%;
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
  position: absolute;
  left: 10px;
  font-size: 14px;
  color: #565656;
}

.search-input {
  font-size: 16px;
  width: 450px;
  padding: 10px 18px 10px 40px; /* Added left padding for the icon */
  background-color: var(--note-background-color);
  border: 2px solid;
  border-color: var(--text-color);
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
  border-color: var(--text-color); /* Change border color on focus */
  box-shadow: 0 0 5px rgba(136, 141, 148, 0.566); /* Add box shadow for highlighting */
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.notes-control {
  display: flex;
  align-items: center;
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
  color: yellow;
  transition: background-color 0.3s ease;
}

.sort-dropdown {
  margin-left: auto;
}

.notes-grid {
  display: grid;
  gap: 20px;
  flex-grow: 1; /* Allow the grid to grow and take remaining space */
  overflow-y: auto; /* Allow vertical scrolling if the grid overflows */
}

.note-container {
  display: flex;
  justify-content: center;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  transition: transform 0.2s ease, opacity 0.2s ease;
  position: relative; /* Ensure positioning context for absolute children */
}

.add-note {
  max-width: 1000px;
  width: 100%;
  height: 120px;
  background-color: #f0f0f0;
  border: 2px dashed #ccc;
  color: #aaa;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 20px;
}

.add-note:hover {
  background-color: #e0e0e0;
}

.dragging-placeholder {
  opacity: 0; /* Make the dragged note disappear */
  height: 0; /* Optional: Collapse the height to remove the empty space */
  margin: 0; /* Optional: Remove any margin */
}

.dragging-preview {
  opacity: 0.3; /* Opacity for the preview of the new position */
}

.chosen-note {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* Shadow for the chosen note */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
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

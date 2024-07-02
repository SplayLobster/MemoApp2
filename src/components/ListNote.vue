<template>
  <div
    v-if="!isEditing"
    class="note"
    @click.stop="startEdit"
    @mouseover="showEditIcon = true"
    @mouseleave="showEditIcon = false"
  >
    <!-- Note Content -->
    <div class="note-content">
      <h3 v-if="title">{{ title }}</h3>
      <h3 v-else class="placeholder">Title</h3>
      <ul>
        <li
          v-for="(item, idx) in items"
          :key="idx"
          @click="toggleItemCompleted(idx)"
        >
          <input
            :id="generateUniqueId('checkbox', idx)"
            type="checkbox"
            @click.stop
            v-model="item.completed"
            class="item-checkbox"
          />
          <div style="font-size: 12px" :class="{ completed: item.completed }">
            {{ truncatedText(item.text) }}
          </div>
        </li>
      </ul>
      <div class="utente">{{ utente }}</div>
      <div class="timestamp">{{ formattedTimestamp }}</div>
    </div>
    <!-- Delete Button -->
    <button
      v-if="showEditIcon && !isEditing"
      class="delete-btn"
      @click.stop="deleteNote"
    >
      <i class="fa-solid fa-trash-can"></i>
    </button>
  </div>
  <div v-else class="modal" @click.stop="handleClickOutside">
    <div class="modal-content">
      <input
        v-model="newTitle"
        placeholder="Title"
        class="edit-title"
        :id="generateUniqueId('title-input')"
        :maxlength="maxTitleLength"
      />
      <ul>
        <li v-for="(item, idx) in newItems" :key="idx">
          <div
            @mouseover="showIcons = true"
            @mouseleave="showIcons = false"
            class="item-container"
          >
            <input
              :id="generateUniqueId('checkbox-modal', idx)"
              type="checkbox"
              v-model="newItems[idx].completed"
              class="item-checkbox"
            />
            <input
              v-model="newItems[idx].text"
              class="edit-textarea"
              :class="{ completed: item.completed }"
              :id="generateUniqueId('item-input', idx)"
              placeholder="Enter item here"
            />
            <button
              v-if="showIcons"
              @click.stop="removeItem(idx)"
              class="remove-btn"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </li>
      </ul>
      <button @click="addItem" class="add-btn">
        <i class="fa-solid fa-plus"></i>
      </button>
      <div class="edit-actions">
        <button class="delete-btn-modal" @click.stop="deleteNote">
          <i class="fa-solid fa-trash-can"></i>
        </button>
        <button @click.stop="cancelEdit" class="cancel-btn">Cancel</button>
        <button @click.stop="saveEdit" class="save-btn">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
import { loadNotes, saveNotes, updateNotes } from "../api/apiService.js";

export default {
  name: "ListNote",
  props: {
    noteId: {
      type: [String, Number],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    utente: {
      type: String,
      required: true,
    },
    timestamp: {
      type: [String, Number],
      required: true,
    },
    isOccupied: {
      type: Boolean,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
    notesPerLine: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      newTitle: this.title,
      newItems: this.items.map((item) => ({ ...item })),
      showEditIcon: false,
      showIcons: false,
      maxTitleLength: 25,
      maxCharsPerLine: 28, // Default char limit per line
    };
  },
  computed: {
    formattedTimestamp() {
      return this.formatTimestamp(this.timestamp);
    },
  },
  watch: {
    title(newVal) {
      this.newTitle = newVal;
    },
    items(newVal) {
      this.newItems = newVal.map((item) => ({ ...item }));
    },
  },
  mounted() {
    this.$emit("update-is-occupied", false); // Close editing mode
    this.$emit("update-is-editing", false); // Close editing mode
  },
  beforeDestroy() {
    this.$emit("update-is-editing", false); // Close editing mode
    this.$emit("update-is-occupied", false); // Close editing mode
  },
  methods: {
    refreshPage() {
      window.location.reload();
    },
    async saveEdit() {
      const editedNote = {
        id: this.noteId,
        title: this.newTitle,
        items: this.newItems,
        timestamp: Date.now(),
        utente: this.utente,
      };

      try {
        await updateNotes(this.noteId, editedNote); // Update the specific note

        this.$emit("update-title", this.newTitle);
        this.$emit("update-items", this.newItems);
        this.$emit("update-time", Date.now());
        this.$emit("update-is-editing", false);
        this.$emit("update-is-occupied", false);
        this.showEditIcon = false;
      } catch (error) {
        console.error("Failed to save note:", error);
      }
      this.refreshPage();
    },
    async deleteNote() {
      try {
        const { notes } = await loadNotes();
        const updatedNotes = notes.filter((note) => note.id !== this.noteId);
        await saveNotes(updatedNotes, false);
        this.$emit("delete-note");
        this.$emit("update-is-editing", false);
        this.$emit("update-is-occupied", false);
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
      this.refreshPage();
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const day = date
        .toLocaleDateString("en-US", { day: "numeric" })
        .padStart(2, "0");
      const month = date
        .toLocaleDateString("en-US", { month: "numeric" })
        .padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    },
    truncatedText(text) {
      if (text.length <= this.maxCharsPerLine) {
        return text;
      } else {
        return text.substring(0, this.maxCharsPerLine) + "...";
      }
    },
    generateUniqueId(prefix, index = "") {
      return `${prefix}-${this._uid}-${index}`;
    },
    cancelEdit() {
      this.newTitle = this.title;
      this.newItems = this.items.map((item) => ({ ...item }));
      this.$emit("update-is-editing", false);
      this.$emit("update-is-occupied", false);
      this.showEditIcon = false;
      this.refreshPage();
    },
    startEdit() {
      if (!this.isOccupied) {
        this.$emit("update-is-editing", true);
        this.newTitle = this.title;
        this.newItems = this.items.map((item) => ({ ...item }));
      }
    },
    handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        this.saveEdit();
        this.$emit("update-is-editing", false);
        this.$emit("update-is-occupied", false);
      }
    },
    toggleItemCompleted(index) {
      if (this.newItems[index]) {
        this.newItems[index].completed = !this.newItems[index].completed;
      }
    },
    addItem() {
      this.newItems.push({ text: "", completed: false });
    },
    removeItem(index) {
      this.newItems.splice(index, 1);
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";

/* Placeholder styling */
::placeholder {
  color: #ccc;
  font-style: italic;
  font-weight: 300;
  font-size: 14px;
  opacity: 1;
}
.placeholder {
  color: #aaa; /* Placeholder color */
  font-style: italic;
}
/* Modal overlay */
.modal {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999; /* Ensures the modal is above everything else */
}

/* Modal content */
.modal-content {
  background-color: var(
    --note-background-color
  ); /* Use your custom note background color */
  color: var(--note-text-color); /* Use your custom note text color */
  border: 1px solid #d1d1d1;
  border-radius: 15px;
  padding: 20px;
  width: 80%;
  max-width: 600px;
  position: relative;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-20px);
}
ul {
  list-style-type: none;
  padding-left: 0; /* Remove default padding */
}

/* Style for list items */
li {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensure items are spaced evenly */
  margin-bottom: 10px; /* Adjust as needed */
}

/* Checkbox styling */
input[type="checkbox"] {
  margin-right: 10px; /* Spacing between checkbox and text */
}
.item-container {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between; /* Ensures the "X" button is at the right end */
}

.item-checkbox {
  -webkit-appearance: none; /* Remove default appearance */
  -moz-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid #878a8e;
  border-radius: 3px;
  margin-right: 10px;
  background-color: var(--note-background-color); /* Match note background */
  cursor: pointer;
}

.item-checkbox:checked {
  background-color: #40eb4696; /* Change background color when checked */
  border-color: #878a8e;
  border-width: 1.3px;
}

/* Text styling */
.item-text {
  flex: 1; /* To make item text take remaining space */
}

.completed {
  opacity: 0.5; /* Reduce opacity for completed items */
  text-decoration: line-through; /* Strikethrough for completed items */
}

.completed .item-checkbox {
  background-color: #40eb4696; /* Change background color when checked */
  border-color: #ffffff;
  border-width: 1.3px;
}

.completed .item-text {
  opacity: 0.5; /* Reduce opacity of text for completed items */
}
.note {
  background-color: var(--note-background-color);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  transition: box-shadow 0.3s ease;
  width: 100%;
  max-width: 700px;
  user-select: none;
}

.note:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.note-content {
  white-space: pre-wrap;
  max-width: 100%;
}

.edit-title {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  padding: 10px;
  margin-bottom: 10px;
  border: none;
  outline: none;
}

.edit-textarea {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  padding: 10px;
  resize: none;
  border: none;
  outline: none;
}

.add-btn {
  color: #4caf50;
  background-color: transparent;
  border-color: transparenT;
  cursor: pointer;
}

.remove-btn {
  color: red;
  background-color: transparent;
  border-color: transparent;
  cursor: pointer;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.edit-actions button {
  margin-left: 10px;
}

.delete-btn,
.delete-btn-modal {
  position: absolute;
  cursor: pointer;
  font-size: 70%;
  top: 10px;
  right: 10px;
  color: red;
  background-color: transparent;
  border-color: transparent;
}
.delete-btn-modal {
  font-size: 94%;
}
.save-btn {
  font-size: 16px;
  border-radius: 5px;
  padding-left: 15px;
  padding-right: 15px;
  padding-top: 5px;
  padding-bottom: 5px;
  cursor: pointer;
  color: var(--note-text-color);
  border-color: #b9b9b900;
  background-color: #b9b9b900;
}
.save-btn:hover {
  border-color: #b9b9b92f;
  background-color: #b9b9b92f;
}
.cancel-btn {
  font-size: 16px;
  border-radius: 5px;
  padding-left: 15px;
  padding-right: 15px;
  padding-top: 5px;
  padding-bottom: 5px;
  cursor: pointer;
  color: var(--note-text-color);
  border-color: #b9b9b900;
  background-color: #b9b9b900;
}
.cancel-btn:hover {
  border-color: #b9b9b92f;
  background-color: #b9b9b92f;
}
.utente {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 5px;
  left: 5px;
  font-size: 8px; /* Adjust the font size as needed */
}
.timestamp {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 8px;
}

@media (max-width: 600px) {
  .note {
    padding: 10px;
  }

  .edit-title,
  .edit-textarea {
    font-size: 14px;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .note {
    padding: 15px;
  }
}

@media (min-width: 901px) {
  .note {
    padding: 20px;
  }
}
</style>

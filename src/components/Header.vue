<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="header">
    <img src="../assets/logo.png" alt="Logo" class="logo" />
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
        alt="List View"
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
</template>

<script>
export default {
  props: {
    isDarkTheme: Boolean,
    notesPerLine: Number,
    searchQuery: String,
  },
  methods: {
    toggleTheme() {
      this.$emit("toggle-theme");
    },
    toggleNotesPerLine() {
      this.$emit("toggle-notes-per-line");
    },
  },
};
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background-color: var(--header-background);
}

.logo {
  width: 40px;
  height: 40px;
}

.title-dark,
.title-light {
  font-size: 1.5rem;
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  border: none;
  padding: 5px;
  margin-left: 5px;
}

.search-icon {
  color: var(--icon-color);
}

.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
}

.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
}

.toggle-icon {
  width: 24px;
  height: 24px;
}
</style>

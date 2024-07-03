<template>
  <div class="dropdown" ref="dropdown">
    <button
      class="btn btn-primary dropdown-toggle"
      type="button"
      id="sortDropdown"
      @click="toggleDropdown"
      :disabled="isOccupied"
    >
      {{ printCriteria(selectedCriteria) }}
    </button>
    <ul
      class="dropdown-menu"
      :class="{ show: dropdownVisible }"
      aria-labelledby="sortDropdown"
    >
      <li>
        <a class="dropdown-item" @click.stop="toggleSortCriteriaTime()">Time</a>
      </li>
      <li>
        <a class="dropdown-item" @click.stop="toggleSortCriteriaLength()"
          >Length</a
        >
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    isOccupied: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dropdownVisible: false,
      selectedCriteria: localStorage.getItem("sortCriteria") || "Oldest", // Default to Recent if no criteria is set'
    };
  },

  methods: {
    printCriteria(selectedCriteria) {
      if (selectedCriteria == "Oldest") {
        return "Old>Rec";
      } else if (selectedCriteria == "Recent") {
        return "Rec>Old";
      } else if (selectedCriteria == "Most") {
        return "Più>Meno";
      } else if (selectedCriteria == "Least") {
        return "Meno>Più";
      } else {
        return "Old>Rec";
      }
    },
    toggleDropdown() {
      this.dropdownVisible = !this.dropdownVisible;
    },
    handleClickOutside(event) {
      const dropdownElement = this.$refs.dropdown;
      // Check if the click is outside the dropdown
      if (dropdownElement && !dropdownElement.contains(event.target)) {
        this.dropdownVisible = false; // Close dropdown
      }
    },
    toggleSortCriteriaTime() {
      this.selectedCriteria =
        this.selectedCriteria === "Recent" ? "Oldest" : "Recent";
      this.dropdownVisible = false;
      localStorage.setItem("sortCriteria", this.selectedCriteria); // Store selected criteria in localStorage
      this.$emit("select-sort-criteria", this.selectedCriteria);
    },
    toggleSortCriteriaLength() {
      this.selectedCriteria =
        this.selectedCriteria === "Most" ? "Least" : "Most";
      this.dropdownVisible = false;
      localStorage.setItem("sortCriteria", this.selectedCriteria); // Store selected criteria in localStorage
      this.$emit("select-sort-criteria", this.selectedCriteria);
    },
  },
  mounted() {
    // Add event listener to the document to handle clicks
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    // Clean up: Remove event listener when component is destroyed
    document.removeEventListener("click", this.handleClickOutside);
  },
};
</script>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
}

.btn {
  padding: 8px 16px;
  font-size: 14px;
  background-color: #7c7c7c00;
  color: #9c9c9c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #ebebeb1a;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  display: none;
  background-color: #fff;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  border-radius: 4px;
  list-style: none;
  text-align: center;
  padding: 8px 0;
  margin: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1000; /* Ensure dropdown is above other elements */
}

.dropdown-menu.show {
  display: block;
  opacity: 1;
  pointer-events: auto;
}
.dropdown-item {
  text-align: center;
  display: block;
  padding: 10px 20px;
  clear: both;
  font-weight: 400;
  color: #333;
  white-space: nowrap;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}
</style>

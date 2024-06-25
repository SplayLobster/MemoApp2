<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <div id="app"><router-view></router-view></div>
</template>

<script>
export default {
  mounted() {
    document.title = "MemoApp";
  },
};
</script>

<style>
/* Your styles here */
</style>

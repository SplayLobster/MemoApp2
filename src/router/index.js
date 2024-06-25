// src/router/index.js
import Vue from "vue";
import Router from "vue-router";
import Home from "../views/Home.vue";

Vue.use(Router);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
];

const router = new Router({
  mode: "history", // Use history mode for cleaner URLs (requires server config)
  routes,
});

export default router;

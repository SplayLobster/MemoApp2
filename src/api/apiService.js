// src/api/apiService.js
import axios from "axios";

const apiClient = axios.create({
  baseURL:
    "https://cat-fact.herokuapp.com/facts/random?animal_type=cat&amount=5",
  headers: {
    "Content-Type": "application/json",
    "Grpc-Metadata-Content-Type": "application/grpc",
    Vary: "Origin",
  },
});

export function getNotes() {
  return axios
    .get("https://cat-fact.herokuapp.com/facts/random?animal_type=cat&amount=5")
    .then((response) => (this.info = response.data.bpid));
}

export function setNote(note) {
  return apiClient.post("", note);
}

export default { getNotes, setNote };

import axios from "axios";

const appCode = "note_test"; // Codice dell'applicazione ONO
const appDataName = "test"; // Nome unico per l'appData che conterrà tutte le note
sessionStorage.setItem("operatorName", "Mamma");
sessionStorage.setItem("operatorSurname", "Mia");

const apiClient = axios.create({
  baseURL: "http://139.59.150.152:7576/grpc/",
  headers: {
    "Content-Type": "application/json",
    "Grpc-Metadata-Content-Type": "application/grpc",
    Vary: "Origin",
    // Authorization: `Bearer ${yourJWTToken}`, // Include your actual JWT token here if required
  },
});

// Load notes from the server
export async function loadNotes() {
  try {
    const notesResponse = await getAllNotes(); // Fetch notes from API

    const responseArray = JSON.parse(notesResponse.data);
    if (
      responseArray &&
      Array.isArray(responseArray) &&
      responseArray.length === 2
    ) {
      const notes = responseArray[0]; // Array of notes
      const occupancyStatus = responseArray[1][0]?.isOccupied || false; // Extract isOccupied value, default to false if not present
      return {
        notes,
        occupancyStatus,
      };
    } else {
      console.error("Invalid server response format");
      return null;
    }
  } catch (error) {
    console.error("Error loading notes:", error);
    return null;
  }
}
// Save notes to the server
export async function saveNotes(notes, isOccupiedFromServer) {
  try {
    // Prepara i dati delle note
    const allNotes = notes.map((note) => {
      if (note.type === "classic") {
        return {
          id: note.id,
          title: note.title,
          content: note.content, // Contenuto della nota classica
          timestamp: note.timestamp,
          utente: note.utente,
          isEditing: note.isEditing,
          type: note.type,
        };
      } else if (note.type === "list") {
        return {
          id: note.id,
          title: note.title,
          items: note.items, // Array di elementi della lista
          timestamp: note.timestamp,
          utente: note.utente,
          isEditing: note.isEditing,
          type: note.type,
        };
      }
      return null; // Gestione caso in cui il tipo di nota non è riconosciuto
    });
    // Prepara i dati da salvare
    const dataToSave = {
      appCode: appCode,
      dataName: appDataName,
      dataValue: JSON.stringify([
        allNotes,
        [{ isOccupied: isOccupiedFromServer }],
      ]), // Converti le note in stringa JSON
    };
    // Effettua la richiesta al server
    await makeONORequest("SetONOAppData", dataToSave);
  } catch (error) {
    console.error("Errore durante il salvataggio delle note:", error);
    throw error;
  }
}
export async function updateNotes(noteId, updatedNote) {
  try {
    const { notes, occupancyStatus } = await loadNotes(); // Load current notes
    if (!notes) {
      throw new Error("Failed to load notes");
    }
    // Check if the system is occupied
    if (occupancyStatus) {
      console.warn("System is occupied, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Sleep 500 milliseconds
      return updateNotes(noteId, updatedNote); // Retry the operation
    }
    // Update occupancy status to true before modifying
    await saveNotes(notes, true);
    // Find index of the note to update

    const noteIndex = notes.findIndex((note) => note.id === noteId);
    if (noteIndex === -1) {
      notes.push(updatedNote);
    }

    // Update the note
    notes[noteIndex] = { ...notes[noteIndex], ...updatedNote };

    // Save updated notes back to server with occupancy status set to false

    await saveNotes(notes, false);
  } catch (error) {
    console.error("Error updating notes:", error);
    throw error;
  }
}
// Get all notes from the server
async function getAllNotes() {
  const response = await makeONORequest("GetONOAppDataFromCode", {
    appCode: appCode,
    dataName: appDataName,
  });
  return response.data;
}

// Make a request to the ONO server
async function makeONORequest(endpoint, requestData) {
  try {
    const response = await apiClient.post(endpoint, requestData);
    return response.data;
  } catch (error) {
    console.error(`Errore durante la richiesta ${endpoint}:`, error);
    throw error;
  }
}

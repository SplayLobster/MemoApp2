import axios from "axios";

const appCode = "note_test"; // Codice dell'applicazione ONO
const appDataName = "test"; // Nome unico per l'appData che conterrà tutte le note

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
async function loadNotes() {
  try {
    const notesResponse = await getAllNotes(); // Fetch notes from API
    const responseArray = JSON.parse(notesResponse.data);
    console.log(notesResponse);
    console.log(responseArray);
    if (
      responseArray &&
      Array.isArray(responseArray) &&
      responseArray.length === 2
    ) {
      const notes = responseArray[0]; // Array of notes
      const occupancyStatus = responseArray[1][0]?.isOccupied || false; // Extract isOccupied value, default to false if not present

      console.log("Notes:", notes);
      console.log("Occupancy Status:", occupancyStatus);

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
async function saveNotes(notes, isOccupiedFromServer) {
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
    console.log(allNotes);
    // Prepara i dati da salvare
    const dataToSave = {
      appCode: appCode,
      dataName: appDataName,
      dataValue: JSON.stringify([
        allNotes,
        [{ isOccupied: isOccupiedFromServer }],
      ]), // Converti le note in stringa JSON
    };
    console.log(dataToSave);
    // Effettua la richiesta al server
    await makeONORequest("SetONOAppData", dataToSave);
  } catch (error) {
    console.error("Errore durante il salvataggio delle note:", error);
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

export { loadNotes, saveNotes };

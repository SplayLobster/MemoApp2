import axios from "axios";

const appCode = "app1"; // Codice dell'applicazione ONO
const appDataName = "all_notes"; // Nome unico per l'appData che conterrà tutte le note

const apiClient = axios.create({
  baseURL: "http://139.59.150.152:7576/grpc/", // Ensure this URL is correct for your API
  headers: {
    "Content-Type": "application/json",
    "Grpc-Metadata-Content-Type": "application/grpc",
    Vary: "Origin",
  },
});

// Load notes from the server
async function loadNotes() {
  try {
    const notesResponse = await getAllNotes();

    // Check if notesResponse is an array and parse its contents if necessary
    if (Array.isArray(notesResponse)) {
      return notesResponse
        .map((item) => {
          try {
            return JSON.parse(item.data);
          } catch (error) {
            console.error("Errore nel parsing della nota:", error);
            return null; // Optionally handle parsing errors
          }
        })
        .filter((note) => note !== null); // Remove notes that failed to parse
    } else {
      throw new Error("La risposta del server non è un array.");
    }
  } catch (error) {
    console.error("Errore durante il caricamento delle note:", error);
    throw error;
  }
}

// Save notes to the server
async function saveNotes(notes) {
  try {
    const allNotes = notes.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      isListNote: note.isListNote,
    }));

    const appData = { notes: allNotes };
    const dataToSave = {
      appCode: appCode,
      dataName: appDataName,
      dataValue: JSON.stringify(appData),
    };

    await makeONORequest("SetONOAppData", dataToSave);
  } catch (error) {
    console.error("Errore durante il salvataggio delle note:", error);
    throw error;
  }
}

// Get all notes from the server
async function getAllNotes() {
  const getAllDataReq = { id: 3 };
  const response = await makeONORequest("GetONOAppFromID", getAllDataReq);
  console.log("Server response:", response); // Log the full server response
  return response;
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

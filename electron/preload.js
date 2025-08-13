const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs protégées au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // Ajouter ici des fonctions sécurisées pour la communication entre le processus principal et le rendu
  platform: process.platform,
  versions: process.versions,
});

// Empêcher l'accès direct à Node.js depuis le processus de rendu
window.addEventListener('DOMContentLoaded', () => {
  // Le DOM est chargé, on peut maintenant interagir avec l'interface
});
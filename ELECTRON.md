# École Manager - Application Electron

Cette application React a été convertie en application Electron pour fonctionner comme une application de bureau native.

## Installation et Configuration

1. **Installer les dépendances** (déjà fait)
   ```bash
   npm install
   ```

2. **Démarrer en mode développement**
   ```bash
   npm run electron:dev
   ```
   Cette commande démarre le serveur de développement Vite et lance Electron automatiquement.

3. **Construire l'application pour la production**
   ```bash
   npm run electron:build
   ```

## Scripts Disponibles

- `npm run electron` - Lance Electron (nécessite que l'application soit déjà construite)
- `npm run electron:dev` - Mode développement avec rechargement automatique
- `npm run electron:build` - Construction pour toutes les plateformes
- `npm run electron:build:win` - Construction pour Windows uniquement
- `npm run electron:build:mac` - Construction pour macOS uniquement  
- `npm run electron:build:linux` - Construction pour Linux uniquement

## Structure des Fichiers

```
electron/
├── main.js       # Processus principal Electron
└── preload.js    # Script de préchargement sécurisé

scripts/
└── electron-dev.js # Script de développement

electron-builder.json # Configuration de construction
package.electron.json # Configuration Electron
```

## Fonctionnalités

- ✅ Interface utilisateur React complète
- ✅ Menu d'application natif
- ✅ Gestion sécurisée des processus
- ✅ Support du rechargement automatique en développement
- ✅ Construction automatisée pour Windows, macOS et Linux
- ✅ Icône d'application
- ✅ Gestion des raccourcis clavier

## Sécurité

L'application utilise les meilleures pratiques de sécurité Electron :
- Context isolation activé
- Node integration désactivé
- Preload script sécurisé
- Navigation externe bloquée

## Distribution

Une fois construite, l'application peut être distribuée :
- **Windows** : Installateur NSIS (.exe)
- **macOS** : Image disque (.dmg)
- **Linux** : AppImage portable

Les fichiers de distribution se trouvent dans le dossier `dist-electron/`.
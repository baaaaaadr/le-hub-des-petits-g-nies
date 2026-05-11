# Rapport Technique "As-Built" - Architecture Locale & Données

## Date : 1er Mai 2026
## Module : Gestion des profils et Persistence

### Architecture Réelle
L'application a été migrée d'une architecture Cloud (Firebase) vers une architecture **100% Client-Side**. Toute la logique métier et la persistence des données résident désormais dans le navigateur de l'utilisateur.

### Composants React & Hooks
- **App.tsx** : Point d'entrée unique gérant l'état global du profil (`profile`) et la logique de synchronisation avec le `localStorage`.
- **Custom Hook (interne à App.tsx)** : Utilisation d'un `useEffect` pour charger le profil au démarrage et un système d'autosave via la fonction `updateProfile`.
- **Prop onScoreUpdate** : Pattern de remontée d'état (Lifting State Up) utilisé par tous les jeux pour mettre à jour les points et les statistiques sans accès direct à la persistence.

### Persistence (LocalStorage)
- **Clé** : `zeina_profile`
- **Structure du JSON** :
  ```json
  {
    "uid": "zeina-local-id",
    "name": "Zeina",
    "age": 6,
    "gradeLevel": "CP",
    "emojiAvatar": "👸",
    "totalScore": 1250,
    "gamesPlayed": {
      "detective": 12,
      "market": 5,
      ...
    },
    "timePlayedMinutes": 45
  }
  ```

### Sécurité & Gestion Offline
- **Sécurité** : Les données sont isolées par navigateur et utilisateur système local. Aucune donnée ne transite sur le réseau (hors appels API Gemini).
- **Mode Offline** : L'application est entièrement fonctionnelle hors-ligne (PWA Ready), à l'exception des fonctionnalités génératives par IA (Gemini).
- **Règles métier** : Les scores sont validés côté client lors de l'appel à `onScoreUpdate`.

### Changements Majeurs (Refactoring)
- Suppression totale des SDK Firebase (Auth, Firestore).
- Suppression du fichier `src/firebase.ts`.
- Suppression des composants `AuthScreen` et `ProfileSetup`.
- Le "Tableau d'Honneur" est devenu un tableau de "Records Personnels".

### Déploiement
L'application est configurée pour être déployée sur des plateformes comme Netlify ou Vercel :
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Note** : Un fichier `public/_redirects` a été ajouté pour gérer le routage SPA sur Netlify.

---
*Ce document reflète la réalité exacte du code à l'instant T.*

# MiamMiam

Application installable sur iPhone pour préparer ses repas et générer automatiquement une liste de courses.

## Ce qui est inclus

- Page **Repas** : liste des repas, favoris par étoile, ouverture d'un repas.
- Page **Modifier les repas** : ajout ou suppression de repas.
- Page **Ajouter un repas** : nom, ingrédients, image, recette.
- Page **Supprimer des repas** : suppression par cases à cocher.
- Page **Détail d'un repas** : ingrédients, image, recette, compteurs pour les courses.
- Page **Modifier le repas** : modification complète du repas.
- Page **Bibliothèque** : ingrédients, autres éléments, notes « En plus ».
- Pages **Modifier / Ajouter / Supprimer ingrédients**.
- Pages **Modifier / Ajouter / Supprimer autres**.
- Page **Liste courses** : uniquement les éléments dont la quantité est supérieure à zéro, avec réinitialisation.

Le document de départ annonce 15 pages, mais décrit 14 écrans fonctionnels distincts. Les 14 écrans décrits ont été réalisés, avec la barre de menu sur toutes les pages.

## Fonctionnement

- Aucune connexion internet n'est nécessaire après la première installation.
- Les données sont sauvegardées localement dans le navigateur du téléphone.
- Les quantités ne peuvent jamais devenir négatives.
- Les images des repas sont compressées avant sauvegarde pour limiter l'espace utilisé.
- Le geste de retour est disponible par balayage horizontal, en plus du bouton Retour.

## Tester sur ordinateur

Depuis le dossier de l'application :

```bash
python -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000
```

Sur ordinateur, ce test permet de vérifier l'interface. Pour une vraie installation iPhone avec fonctionnement hors ligne, il faut héberger le dossier en HTTPS.

## Installation sur iPhone avec GitHub Pages

1. Créer un compte GitHub si nécessaire.
2. Créer un nouveau dépôt, par exemple `miammiam`.
3. Envoyer tous les fichiers de ce dossier dans le dépôt : `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `assets/`.
4. Dans le dépôt GitHub : **Settings** → **Pages**.
5. Choisir la branche principale et le dossier racine.
6. Activer **Enforce HTTPS** lorsque l'option est disponible.
7. Ouvrir l'adresse HTTPS générée par GitHub Pages dans Safari sur l'iPhone.
8. Appuyer sur le bouton de partage, choisir **Ajouter à l'écran d'accueil**, activer **Ouvrir comme app web** si l'option est affichée, puis valider.
9. Lancer MiamMiam depuis l'icône ajoutée sur l'écran d'accueil.
10. Ouvrir une première fois l'application avec internet, attendre quelques secondes, puis elle pourra fonctionner hors connexion.

## Remarque importante

Si l'application est supprimée de l'écran d'accueil, ou si les données Safari du site sont effacées, les repas enregistrés peuvent disparaître. Pour une version professionnelle ou App Store, il faudra ajouter un mécanisme de sauvegarde/export ou une synchronisation iCloud.

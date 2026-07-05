# Guide rapide - rendre MiamMiam utilisable sur iPhone

## Méthode conseillée : installation comme app web iPhone

MiamMiam est une PWA : une application web installable. Elle se comporte comme une app depuis l'écran d'accueil de l'iPhone et fonctionne hors connexion après la première ouverture.

### Étapes

1. Décompresser le fichier ZIP.
2. Héberger le dossier sur un site HTTPS, par exemple GitHub Pages.
3. Sur l'iPhone, ouvrir l'adresse du site avec Safari.
4. Appuyer sur le bouton de partage.
5. Choisir **Ajouter à l'écran d'accueil**.
6. Activer **Ouvrir comme app web** si Safari le propose.
7. Appuyer sur **Ajouter**.
8. Ouvrir l'icône **MiamMiam** sur l'écran d'accueil.
9. Après une première ouverture en ligne, l'application reste utilisable sans internet.

### Pourquoi HTTPS est nécessaire ?

Le mode hors ligne utilise un service worker. Les navigateurs ne l'autorisent normalement que sur des sites sécurisés en HTTPS.

### Développement local

Pour tester vite sur ordinateur :

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000` dans le navigateur.

Ce mode local est utile pour tester, mais il ne remplace pas l'hébergement HTTPS nécessaire à l'installation iPhone.

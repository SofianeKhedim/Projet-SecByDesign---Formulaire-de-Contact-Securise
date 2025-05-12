# Formulaire de Contact Sécurisé avec Authentification

Ce projet implémente un formulaire de contact sécurisé avec un système d'authentification en appliquant les principes de Security by Design. Il est conçu pour démontrer les bonnes pratiques de sécurité dans le développement d'applications web.

## Fonctionnalités de sécurité

- Authentification sécurisée des utilisateurs
- Chiffrement des données avec AES-256-GCM
- Hachage des mots de passe avec bcrypt
- Protection HTTPS avec SSL/TLS
- Protection contre les attaques CSRF
- Protection contre les attaques XSS
- Vérification reCAPTCHA pour prévenir les attaques automatisées
- Cookies sécurisés avec les flags HttpOnly et Secure
- En-têtes de sécurité HTTP avec Helmet
- Journalisation sécurisée des événements
- Validation rigoureuse des entrées utilisateur
- Protection contre la pollution de paramètres HTTP
- Limitation de débit (rate limiting)
- Configuration CSP (Content Security Policy)

## Système d'authentification

L'application implémente un système d'authentification complet :

1. **Page de connexion** : Les utilisateurs doivent se connecter avant d'accéder au formulaire de contact.
2. **Protection contre les attaques par force brute** : Limitation du nombre de tentatives de connexion.
3. **Gestion sécurisée des sessions** : Sessions avec des identifiants uniques et régénération des sessions après connexion.
4. **Contrôle d'accès** : Middlewares pour protéger les routes sensibles.

## Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- OpenSSL pour générer les certificats SSL

## Installation

1. Clonez ce dépôt ou décompressez l'archive :
```bash
git clone https://github.com/votre-username/formulaire-securise.git
cd formulaire-securise
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
```bash
cp .env.example .env
```
Puis modifiez le fichier `.env` avec vos propres clés.

4. Générez les certificats SSL pour HTTPS :
```bash
chmod +x generate-cert.sh
./generate-cert.sh
```

## Démarrage du serveur

Utilisez le script de démarrage fourni :
```bash
chmod +x start.sh
./start.sh
```

Alternativement, vous pouvez utiliser npm :
```bash
npm start
```

Le serveur sera accessible à l'adresse `https://localhost:3000`.

## Utilisation

1. Accédez à `https://localhost:3000` dans votre navigateur
2. Vous serez redirigé vers la page de connexion
3. Connectez-vous avec les identifiants par défaut :
   - Email : `admin@example.com`
   - Mot de passe : `Admin@123456789`
4. Une fois connecté, vous aurez accès au formulaire de contact
5. Remplissez le formulaire et soumettez-le pour envoyer votre message

## Structure du projet

```
formulaire_securise/
├── src/                    # Code source du serveur
│   ├── server.js           # Point d'entrée du serveur
│   ├── controllers/        # Contrôleurs des routes
│   │   ├── authController.js  # Contrôleur d'authentification
│   │   └── contactController.js # Contrôleur du formulaire
│   ├── middlewares/        # Middlewares personnalisés
│   │   ├── authMiddleware.js # Middleware d'authentification
│   │   ├── logger.js       # Middleware de journalisation
│   │   └── validator.js    # Middleware de validation
│   └── utils/              # Utilitaires (chiffrement, etc.)
├── public/                 # Fichiers statiques
│   ├── index.html          # Formulaire de contact
│   ├── login.html          # Page de connexion
│   ├── css/                # Styles CSS
│   └── js/                 # Scripts client
├── config/                 # Configuration
│   ├── security.js         # Paramètres de sécurité
│   └── ssl/                # Certificats SSL
├── logs/                   # Journaux d'accès, d'erreurs et données
│   ├── access.log          # Logs d'accès
│   ├── users.json          # Utilisateurs enregistrés (chiffré)
│   └── contacts.json       # Messages soumis (chiffré)
├── .env                    # Variables d'environnement
├── generate-cert.sh        # Script de génération de certificats
├── start.sh                # Script de démarrage
└── README.md               # Documentation
```

## Tests de sécurité

Des tests de sécurité peuvent être effectués à l'aide des outils suivants :

- OWASP ZAP pour l'analyse des vulnérabilités
- Postman pour tester les API
- DevTools du navigateur pour inspecter les cookies et en-têtes HTTP
- SSL Labs pour vérifier la configuration HTTPS

## Mesures de sécurité implémentées

### 1. Authentification
- Hachage sécurisé des mots de passe avec bcrypt (12 rounds)
- Protection contre la fixation de session
- Limitations des tentatives de connexion
- Validation stricte des identifiants

### 2. Protection des données
- Chiffrement AES-256-GCM pour les données sensibles
- Stockage sécurisé des sessions
- Masquage des données sensibles dans les logs

### 3. Sécurité de la communication
- HTTPS obligatoire avec certificats SSL/TLS
- En-têtes de sécurité HTTP avec Helmet
- Content Security Policy stricte

### 4. Protection contre les attaques
- Validation côté client et serveur
- Protection CSRF avec tokens
- Échappement des données pour prévenir les attaques XSS
- reCAPTCHA pour bloquer les bots
- Rate limiting pour prévenir les attaques par force brute

### 5. Gestion des cookies
- Attributs HttpOnly et Secure sur tous les cookies
- SameSite=Strict pour prévenir CSRF
- Durée de vie limitée des sessions

## Licence

MIT

## Avertissement

Ce projet est fourni à des fins éducatives uniquement. En production, des mesures de sécurité supplémentaires seraient nécessaires, notamment l'utilisation d'une base de données sécurisée plutôt que des fichiers JSON.
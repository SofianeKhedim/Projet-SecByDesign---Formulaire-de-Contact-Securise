# Guide d'Installation et de Test - Formulaire de Contact Sécurisé

Ce guide vous aidera à installer, configurer et tester le formulaire de contact sécurisé avec authentification.

## Prérequis

- Node.js (version 14 ou supérieure)
- npm (version 6 ou supérieure)
- OpenSSL pour la génération des certificats SSL

## Étapes d'installation

### 1. Extraction des fichiers

Décompressez l'archive du projet et naviguez vers le dossier :

```bash
unzip formulaire_securise.zip
cd formulaire_securise
```

### 2. Installation des dépendances

Installez toutes les dépendances nécessaires via npm :

```bash
npm install
```

### 3. Configuration

Copiez le fichier d'exemple d'environnement et modifiez-le selon vos besoins :

```bash
cp .env.example .env
```

Le fichier `.env` contient déjà des valeurs configurées pour le développement local.

### 4. Génération des certificats SSL

Générez les certificats SSL nécessaires pour HTTPS :

```bash
chmod +x generate-cert.sh
./generate-cert.sh
```

Ce script créera les fichiers `cert.pem` et `key.pem` dans le dossier `config/ssl/`.

### 5. Démarrage du serveur

Lancez le serveur avec le script de démarrage :

```bash
chmod +x start.sh
./start.sh
```

Le serveur sera accessible à l'adresse `https://localhost:3000`.

**Note** : Comme le certificat est auto-signé, votre navigateur affichera probablement un avertissement de sécurité. C'est normal en environnement de développement. Vous pouvez procéder en cliquant sur "Avancé" puis "Continuer vers le site".

## Accès à l'application

1. Ouvrez votre navigateur et accédez à : `https://localhost:3000`
2. Vous serez redirigé vers la page de connexion (`login.html`)
3. Connectez-vous avec les identifiants par défaut :
   - Email : `admin@example.com`
   - Mot de passe : `Admin@123456789`
4. Après connexion, vous serez redirigé vers le formulaire de contact
5. Remplissez le formulaire et soumettez-le

## Guide de test des fonctionnalités de sécurité

### 1. Tests d'authentification

- **Test de connexion** : Essayez de vous connecter avec les identifiants corrects et incorrects
- **Protection contre force brute** : Essayez de vous connecter plusieurs fois avec un mot de passe incorrect. Après 10 tentatives en une heure, vous devriez être bloqué temporairement.
- **Test d'accès non autorisé** : Sans être connecté, essayez d'accéder directement à `https://localhost:3000/index.html`. Vous devriez être redirigé vers la page de connexion.

### 2. Tests de validation du formulaire

- **Validation côté client** : Essayez de soumettre le formulaire avec des données invalides (nom trop court, email invalide, message trop court).
- **Validation reCAPTCHA** : Essayez de soumettre le formulaire sans valider le CAPTCHA.

### 3. Tests de sécurité HTTPS et en-têtes

3. **Vérification des en-têtes HTTP** : Utilisez les outils de développement du navigateur (F12 > Onglet Réseau) pour examiner les en-têtes de réponse. Vous devriez voir des en-têtes de sécurité comme:
   - `Content-Security-Policy`
   - `X-XSS-Protection`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Strict-Transport-Security`

### 4. Tests CSRF

- **Protection CSRF** : Inspectez le code source de la page pour vérifier qu'il y a un champ caché `_csrf` dans le formulaire.
- **Test de modification du token** : Modifiez manuellement la valeur du token CSRF et essayez de soumettre le formulaire. La soumission devrait échouer.

### 5. Tests XSS

- **Test d'injection XSS** : Essayez d'entrer du code JavaScript dans les champs du formulaire, comme `<script>alert('XSS')</script>`. Après soumission, vérifiez que le code ne s'exécute pas.

### 6. Tests des cookies

- **Vérification des cookies** : Utilisez les outils de développement du navigateur (F12 > Onglet Application > Cookies) pour examiner les cookies. Le cookie de session devrait avoir les attributs suivants:
  - `HttpOnly` (pas visible via JavaScript)
  - `Secure` (transmis uniquement via HTTPS)
  - `SameSite=Strict` (protection CSRF)

### 7. Tests de déconnexion

- **Déconnexion** : Cliquez sur le bouton "Déconnexion" et vérifiez que vous êtes redirigé vers la page de connexion.
- **Vérification post-déconnexion** : Après la déconnexion, essayez d'accéder directement à `https://localhost:3000/index.html`. Vous devriez être redirigé vers la page de connexion.

## Structure des fichiers logs

Le système génère plusieurs fichiers de logs dans le dossier `logs/` :

- `access.log` : Enregistre toutes les requêtes HTTP (méthode, URL, code de statut, IP)
- `combined.log` : Logs généraux de l'application
- `error.log` : Erreurs et exceptions
- `users.json` : Stocke les informations des utilisateurs (avec mots de passe hachés)
- `contacts.json` : Stocke les messages soumis (chiffrés)

Vous pouvez examiner ces fichiers pour vérifier que :
1. Les données sensibles sont correctement chiffrées
2. Les mots de passe sont correctement hachés
3. Les événements de sécurité (tentatives de connexion, etc.) sont bien journalisés

## Dépannage

### Problème avec les certificats SSL

Si vous rencontrez des erreurs liées aux certificats SSL, vérifiez que:

1. Les fichiers `cert.pem` et `key.pem` existent dans le dossier `config/ssl/`
2. Régénérez les certificats avec:
```bash
./generate-cert.sh
```

### Problème avec rotating-file-stream

Si vous rencontrez une erreur du type:
```
TypeError: Cannot read properties of undefined (reading 'createStream')
```

Essayez de mettre à jour le package:
```bash
npm install rotating-file-stream@latest
```

### Problème d'accès refusé aux fichiers

Si vous rencontrez des erreurs d'accès aux fichiers de logs, vérifiez les permissions:

```bash
mkdir -p logs
chmod 755 logs
touch logs/access.log logs/combined.log logs/error.log
chmod 644 logs/*.log
```

## Vérification de la sécurité avec OWASP ZAP

Pour une analyse plus approfondie des vulnérabilités de sécurité, vous pouvez utiliser OWASP ZAP:

1. Téléchargez et installez [OWASP ZAP](https://www.zaproxy.org/download/)
2. Lancez OWASP ZAP et utilisez la fonction "Automated Scan" avec l'URL `https://localhost:3000`
3. Examinez les alertes et vulnérabilités détectées

## Conclusion

Ce guide vous a permis d'installer, configurer et tester les fonctionnalités de sécurité du formulaire de contact. L'application est conçue pour démontrer les meilleures pratiques de sécurité, notamment l'authentification sécurisée, la protection des données et la défense contre les attaques web courantes.

Pour toute question ou problème rencontré, référez-vous à la documentation complète dans le README et le rapport de sécurité. HTTPS** : Assurez-vous que toutes les communications se font via HTTPS.
- **Vérification
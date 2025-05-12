#!/bin/bash

# Script d'installation et de configuration du formulaire de contact sécurisé

echo "======================================================="
echo "  Installation du Formulaire de Contact Sécurisé       "
echo "======================================================="

# Vérification de l'installation de Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js avant de continuer."
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js est installé (version: $NODE_VERSION)"
fi

# Vérification de l'installation de npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer npm avant de continuer."
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm est installé (version: $NPM_VERSION)"
fi

# Vérification de l'installation d'OpenSSL
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL n'est pas installé. Les certificats SSL ne pourront pas être générés."
    echo "  Veuillez installer OpenSSL avant de continuer."
    exit 1
else
    OPENSSL_VERSION=$(openssl version)
    echo "✅ OpenSSL est installé (version: $OPENSSL_VERSION)"
fi

echo ""
echo "1. Installation des dépendances..."
npm install

# Vérification si .env existe déjà
if [ ! -f .env ]; then
    echo ""
    echo "2. Création du fichier .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé avec succès."
else
    echo ""
    echo "2. Le fichier .env existe déjà. Pas de modification."
fi

echo ""
echo "3. Création des dossiers nécessaires..."
mkdir -p logs
mkdir -p config/ssl

# Vérification de l'existence des certificats SSL
if [ ! -f config/ssl/cert.pem ] || [ ! -f config/ssl/key.pem ]; then
    echo ""
    echo "4. Génération des certificats SSL..."
    chmod +x generate-cert.sh
    ./generate-cert.sh
else
    echo ""
    echo "4. Les certificats SSL existent déjà. Pas de régénération."
    echo "   Pour forcer la régénération, supprimez les fichiers dans config/ssl/ et relancez ce script."
fi

echo ""
echo "5. Ajout des permissions d'exécution au script de démarrage..."
chmod +x start.sh

echo ""
echo "======================================================="
echo "  Installation terminée avec succès !                  "
echo "======================================================="
echo ""
echo "Pour démarrer le serveur, exécutez: ./start.sh"
echo ""
echo "Informations de connexion par défaut:"
echo "- Email: admin@example.com"
echo "- Mot de passe: Admin@123456789"
echo ""
echo "Le serveur sera accessible à l'adresse: https://localhost:3000"
echo "Note: Vous devrez peut-être accepter le certificat auto-signé dans votre navigateur."
echo ""

# Demander à l'utilisateur s'il souhaite démarrer le serveur maintenant
read -p "Voulez-vous démarrer le serveur maintenant? (o/n): " choice
if [ "$choice" = "o" ] || [ "$choice" = "O" ] || [ "$choice" = "oui" ] || [ "$choice" = "Oui" ]; then
    echo ""
    echo "Démarrage du serveur..."
    ./start.sh
fi
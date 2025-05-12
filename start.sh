#!/bin/bash

# Script de démarrage du serveur de formulaire sécurisé

# Vérification de l'installation de Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Veuillez installer Node.js avant de continuer."
    exit 1
fi

# Vérification de la présence des certificats SSL
if [ ! -f "config/ssl/cert.pem" ] || [ ! -f "config/ssl/key.pem" ]; then
    echo "Certificats SSL non trouvés. Génération en cours..."
    chmod +x generate-cert.sh
    ./generate-cert.sh
fi

# Installation des dépendances
echo "Installation des dépendances..."
npm install

# Vérification du dossier logs
if [ ! -d "logs" ]; then
    echo "Création du dossier logs..."
    mkdir -p logs
fi

# Démarrage du serveur
echo "Démarrage du serveur sécurisé..."
node src/server.js

# Capture des signaux pour arrêter proprement le serveur
trap "echo 'Arrêt du serveur...'; exit 0" SIGINT SIGTERM

# Boucle d'attente (pour garder le script en cours d'exécution)
while true; do
    sleep 1
done
#!/bin/bash

# Script pour générer un certificat SSL auto-signé pour le développement local

# Création du dossier ssl s'il n'existe pas
mkdir -p config/ssl

# Génération d'une clé privée et d'un certificat auto-signé
openssl req -x509 -newkey rsa:4096 -keyout config/ssl/key.pem -out config/ssl/cert.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"

# Vérification du certificat
openssl x509 -text -noout -in config/ssl/cert.pem | grep -A 2 "Subject Alternative Name"

echo "Certificat SSL généré avec succès !"
echo "La clé privée se trouve dans config/ssl/key.pem"
echo "Le certificat se trouve dans config/ssl/cert.pem"
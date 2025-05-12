// Contrôleur pour la gestion des soumissions de formulaire de contact
const fs = require('fs');
const path = require('path');
const { logger, logSecurityEvent } = require('../middlewares/logger');
const { encrypt } = require('../utils/encryption');

/**
 * Traite une soumission de formulaire de contact
 * @param {object} req - Objet de requête Express
 * @param {object} res - Objet de réponse Express
 */
const submitContact = async (req, res) => {
    try {
        // Les données ont déjà été validées par le middleware
        const { name, email, message } = req.body;
        
        // Vérifier que l'utilisateur est authentifié
        if (!req.session.authenticated || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Vous devez être connecté pour envoyer un message.'
            });
        }
        
        // Traçage des soumissions
        logger.info('Nouvelle soumission de formulaire', {
            email: email.toLowerCase(),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            authenticatedUser: req.session.user.email
        });
        
        // Chiffrement des données sensibles avant stockage
        const encryptedName = encrypt(name);
        const encryptedEmail = encrypt(email);
        const encryptedMessage = encrypt(message);
        
        // Données à sauvegarder
        const contactData = {
            id: Date.now().toString(), // ID simple basé sur le timestamp
            name: encryptedName,
            email: encryptedEmail,
            message: encryptedMessage,
            timestamp: new Date().toISOString(),
            ipAddress: encrypt(req.ip), // Chiffrement de l'adresse IP
            submittedBy: req.session.user.email // Utilisateur authentifié
        };
        
        // En production, ces données seraient stockées dans une base de données sécurisée
        // Pour cet exercice, nous les stockons dans un fichier JSON
        saveContactToFile(contactData);
        
        // Enregistrement du succès dans les logs
        logger.info('Formulaire soumis avec succès', {
            contactId: contactData.id,
            timestamp: contactData.timestamp,
            submittedBy: req.session.user.email
        });
        
        // Réponse au client
        return res.status(200).json({
            success: true,
            message: 'Votre message a été envoyé avec succès.'
        });
        
    } catch (error) {
        // Log de l'erreur
        logger.error('Erreur lors de la soumission du formulaire', {
            error: error.message,
            stack: error.stack
        });
        
        // Enregistrement comme événement de sécurité si nécessaire
        if (error.message.includes('chiffrement') || error.message.includes('hashage')) {
            logSecurityEvent('ENCRYPTION_FAILURE', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
        
        // Réponse d'erreur
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer ultérieurement.'
        });
    }
};

/**
 * Sauvegarde les données de contact dans un fichier
 * (Dans une application réelle, utiliser une base de données sécurisée)
 * @param {object} contactData - Données à sauvegarder
 */
const saveContactToFile = (contactData) => {
    try {
        // Chemin du fichier de stockage
        const filePath = path.join(__dirname, '../../logs/contacts.json');
        
        // Lecture du fichier existant ou création d'un nouveau tableau
        let contacts = [];
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            contacts = JSON.parse(fileContent);
        }
        
        // Ajout des nouvelles données
        contacts.push(contactData);
        
        // Écriture dans le fichier
        fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2), 'utf8');
        
    } catch (error) {
        logger.error('Erreur lors de la sauvegarde des données de contact', {
            error: error.message,
            stack: error.stack
        });
        throw new Error('Échec de la sauvegarde des données');
    }
};

module.exports = {
    submitContact
};
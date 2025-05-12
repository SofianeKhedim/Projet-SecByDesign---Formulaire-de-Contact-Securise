// Utilitaires de chiffrement pour la protection des données
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { encryptionConfig, passwordHashConfig } = require('../../config/security');

/**
 * Chiffre une donnée avec AES-256-GCM
 * @param {string} data - Donnée à chiffrer
 * @returns {string} - Données chiffrées au format: iv:tag:chiffré
 */
const encrypt = (data) => {
    try {
        // Validation des entrées
        if (!data) {
            throw new Error('Donnée à chiffrer non fournie');
        }

        // Génération d'un vecteur d'initialisation (IV) aléatoire
        const iv = crypto.randomBytes(encryptionConfig.ivLength);
        
        // Création du chiffreur
        const cipher = crypto.createCipheriv(
            encryptionConfig.algorithm,
            Buffer.from(encryptionConfig.key, 'utf8'),
            iv
        );
        
        // Chiffrement des données
        let encrypted = cipher.update(data, 'utf8', encryptionConfig.encoding);
        encrypted += cipher.final(encryptionConfig.encoding);
        
        // Récupération du tag d'authentification (pour GCM)
        const authTag = cipher.getAuthTag().toString(encryptionConfig.encoding);
        
        // Retour des données chiffrées avec IV et tag d'authentification
        return `${iv.toString(encryptionConfig.encoding)}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('Erreur lors du chiffrement:', error.message);
        throw new Error('Échec du chiffrement des données');
    }
};

/**
 * Déchiffre une donnée chiffrée avec AES-256-GCM
 * @param {string} encryptedData - Donnée chiffrée au format: iv:tag:chiffré
 * @returns {string} - Donnée déchiffrée
 */
const decrypt = (encryptedData) => {
    try {
        // Validation des entrées
        if (!encryptedData) {
            throw new Error('Donnée chiffrée non fournie');
        }
        
        // Séparation des composants
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Format de données chiffrées invalide');
        }
        
        const iv = Buffer.from(parts[0], encryptionConfig.encoding);
        const authTag = Buffer.from(parts[1], encryptionConfig.encoding);
        const encryptedText = parts[2];
        
        // Création du déchiffreur
        const decipher = crypto.createDecipheriv(
            encryptionConfig.algorithm,
            Buffer.from(encryptionConfig.key, 'utf8'),
            iv
        );
        
        // Définition du tag d'authentification (pour GCM)
        decipher.setAuthTag(authTag);
        
        // Déchiffrement des données
        let decrypted = decipher.update(encryptedText, encryptionConfig.encoding, 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Erreur lors du déchiffrement:', error.message);
        throw new Error('Échec du déchiffrement des données');
    }
};

/**
 * Hache un mot de passe de manière sécurisée avec bcrypt
 * @param {string} password - Mot de passe à hacher
 * @returns {Promise<string>} - Hash du mot de passe
 */
const hashPassword = async (password) => {
    try {
        // Validation des entrées
        if (!password) {
            throw new Error('Mot de passe non fourni');
        }
        
        // Génération du sel et hashage
        return await bcrypt.hash(password, passwordHashConfig.saltRounds);
    } catch (error) {
        console.error('Erreur lors du hashage du mot de passe:', error.message);
        throw new Error('Échec du hashage du mot de passe');
    }
};

/**
 * Vérifie un mot de passe par rapport à son hash
 * @param {string} password - Mot de passe à vérifier
 * @param {string} hash - Hash stocké
 * @returns {Promise<boolean>} - True si le mot de passe correspond
 */
const verifyPassword = async (password, hash) => {
    try {
        // Validation des entrées
        if (!password || !hash) {
            throw new Error('Mot de passe ou hash non fourni');
        }
        
        // Vérification du mot de passe
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error('Erreur lors de la vérification du mot de passe:', error.message);
        throw new Error('Échec de la vérification du mot de passe');
    }
};

/**
 * Génère un jeton aléatoire sécurisé
 * @param {number} length - Longueur du jeton (par défaut 32)
 * @returns {string} - Jeton aléatoire
 */
const generateSecureToken = (length = 32) => {
    try {
        return crypto.randomBytes(length).toString('hex');
    } catch (error) {
        console.error('Erreur lors de la génération du jeton:', error.message);
        throw new Error('Échec de la génération du jeton');
    }
};

module.exports = {
    encrypt,
    decrypt,
    hashPassword,
    verifyPassword,
    generateSecureToken
};
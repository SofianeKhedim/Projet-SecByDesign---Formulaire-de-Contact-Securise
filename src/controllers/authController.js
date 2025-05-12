// Contrôleur pour la gestion de l'authentification
const fs = require('fs');
const path = require('path');
const { logger, logSecurityEvent } = require('../middlewares/logger');
const { encrypt, hashPassword, verifyPassword } = require('../utils/encryption');

// Chemin du fichier de stockage des utilisateurs
const usersFilePath = path.join(__dirname, '../../logs/users.json');

/**
 * Initialise le fichier des utilisateurs s'il n'existe pas
 * Crée un utilisateur par défaut
 */
const initializeUsers = async () => {
    try {
        if (!fs.existsSync(usersFilePath)) {
            // Créer un utilisateur par défaut sécurisé
            const defaultUser = {
                email: 'admin@example.com',
                password: await hashPassword('Admin@123456789'),
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            
            fs.writeFileSync(usersFilePath, JSON.stringify([defaultUser], null, 2), 'utf8');
            
            logger.info('Fichier d\'utilisateurs initialisé avec l\'utilisateur par défaut');
            console.log('Utilisateur par défaut créé:');
            console.log('Email: admin@example.com');
            console.log('Mot de passe: Admin@123456789');
        }
    } catch (error) {
        logger.error('Erreur lors de l\'initialisation des utilisateurs', {
            error: error.message,
            stack: error.stack
        });
    }
};

// Initialiser les utilisateurs au démarrage
initializeUsers();

/**
 * Récupère la liste des utilisateurs
 * @returns {Array} Liste des utilisateurs
 */
const getUsers = () => {
    try {
        if (fs.existsSync(usersFilePath)) {
            const fileContent = fs.readFileSync(usersFilePath, 'utf8');
            return JSON.parse(fileContent);
        }
        return [];
    } catch (error) {
        logger.error('Erreur lors de la récupération des utilisateurs', {
            error: error.message,
            stack: error.stack
        });
        return [];
    }
};

/**
 * Vérifie les identifiants de connexion
 * @param {string} email - Adresse email de l'utilisateur
 * @param {string} password - Mot de passe de l'utilisateur
 * @returns {Promise<Object|null>} Utilisateur si authentifié, null sinon
 */
const verifyCredentials = async (email, password) => {
    try {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return null;
        }
        
        const isPasswordValid = await verifyPassword(password, user.password);
        
        if (!isPasswordValid) {
            return null;
        }
        
        // Retourner l'utilisateur sans le mot de passe
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
        
    } catch (error) {
        logger.error('Erreur lors de la vérification des identifiants', {
            error: error.message,
            stack: error.stack
        });
        return null;
    }
};

/**
 * Gère la connexion d'un utilisateur
 * @param {object} req - Objet de requête Express
 * @param {object} res - Objet de réponse Express
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Traçage des tentatives de connexion
        logger.info('Tentative de connexion', {
            email: email.toLowerCase(),
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        // Vérification des identifiants
        const user = await verifyCredentials(email, password);
        
        if (!user) {
            // Log de la tentative échouée
            logSecurityEvent('FAILED_LOGIN', {
                email: email.toLowerCase(),
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                reason: 'Identifiants invalides'
            });
            
            console.log(`Échec de connexion pour ${email.toLowerCase()} : identifiants invalides`);
            
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides. Veuillez vérifier votre email et mot de passe.'
            });
        }
        
        // Régénération de l'ID de session pour prévenir la fixation de session
        req.session.regenerate((err) => {
            if (err) {
                logger.error('Erreur lors de la régénération de la session', {
                    error: err.message,
                    stack: err.stack
                });
                
                return res.status(500).json({
                    success: false,
                    message: 'Erreur de connexion. Veuillez réessayer.'
                });
            }
            
            // Stockage des informations utilisateur dans la session
            req.session.user = user;
            req.session.authenticated = true;
            
            // Log de connexion réussie
            logger.info('Connexion réussie', {
                email: user.email,
                ip: req.ip
            });
            
            // Réponse au client
            return res.status(200).json({
                success: true,
                message: 'Connexion réussie.'
            });
        });
        
    } catch (error) {
        // Log de l'erreur
        logger.error('Erreur lors de la connexion', {
            error: error.message,
            stack: error.stack
        });
        
        // Réponse d'erreur
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer ultérieurement.'
        });
    }
};

/**
 * Gère la déconnexion d'un utilisateur
 * @param {object} req - Objet de requête Express
 * @param {object} res - Objet de réponse Express
 */
const logout = (req, res) => {
    // Enregistrement de la déconnexion
    if (req.session.user) {
        logger.info('Déconnexion utilisateur', {
            email: req.session.user.email,
            ip: req.ip
        });
    }
    
    // Destruction de la session
    req.session.destroy((err) => {
        if (err) {
            logger.error('Erreur lors de la destruction de la session', {
                error: err.message,
                stack: err.stack
            });
            
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la déconnexion. Veuillez réessayer.'
            });
        }
        
        // Suppression du cookie de session
        res.clearCookie('sessionId');
        
        // Réponse au client
        return res.status(200).json({
            success: true,
            message: 'Déconnexion réussie.'
        });
    });
};

/**
 * Vérifie le statut d'authentification
 * @param {object} req - Objet de requête Express
 * @param {object} res - Objet de réponse Express
 */
const checkAuthStatus = (req, res) => {
    if (req.session.authenticated && req.session.user) {
        return res.status(200).json({
            authenticated: true,
            email: req.session.user.email
        });
    } else {
        return res.status(200).json({
            authenticated: false
        });
    }
};

module.exports = {
    login,
    logout,
    checkAuthStatus
};
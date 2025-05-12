// Middleware d'authentification pour protéger les routes
const { logSecurityEvent } = require('./logger');

/**
 * Vérifie si l'utilisateur est authentifié
 * @param {object} req - Objet de requête Express
 * @param {object} res - Objet de réponse Express
 * @param {function} next - Fonction next d'Express
 */
const isAuthenticated = (req, res, next) => {
    // Vérification de l'authentification
    if (req.session.authenticated && req.session.user) {
        // L'utilisateur est authentifié, on continue
        return next();
    }
    
    // Log de la tentative d'accès non autorisée
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    
    // Réponse JSON pour les requêtes API
    if (req.path.startsWith('/api/') || req.xhr) {
        return res.status(401).json({
            success: false,
            message: 'Veuillez vous connecter pour accéder à cette ressource.'
        });
    }
    
    // Redirection vers la page de connexion pour les requêtes normales
    return res.redirect('/login.html');
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param {string|string[]} roles - Rôle(s) requis
 * @returns {function} Middleware Express
 */
const hasRole = (roles) => {
    return (req, res, next) => {
        // Vérification de l'authentification
        if (!req.session.authenticated || !req.session.user) {
            // Log de la tentative d'accès non autorisée
            logSecurityEvent('UNAUTHORIZED_ACCESS', {
                path: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            
            // Réponse JSON pour les requêtes API
            if (req.path.startsWith('/api/') || req.xhr) {
                return res.status(401).json({
                    success: false,
                    message: 'Veuillez vous connecter pour accéder à cette ressource.'
                });
            }
            
            // Redirection vers la page de connexion pour les requêtes normales
            return res.redirect('/login.html');
        }
        
        // Conversion en tableau si un seul rôle est fourni
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        
        // Vérification du rôle
        if (requiredRoles.includes(req.session.user.role)) {
            // L'utilisateur a le rôle requis, on continue
            return next();
        }
        
        // Log de la tentative d'accès non autorisée
        logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userRole: req.session.user.role,
            requiredRoles
        });
        
        // Réponse JSON pour les requêtes API
        if (req.path.startsWith('/api/') || req.xhr) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.'
            });
        }
        
        // Page d'erreur pour les requêtes normales
        return res.status(403).send('Accès refusé : permissions insuffisantes.');
    };
};

module.exports = {
    isAuthenticated,
    hasRole
};
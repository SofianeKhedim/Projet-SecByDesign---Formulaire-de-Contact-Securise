// Middleware de journalisation sécurisée
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const securityConfig = require('../../config/security');

// Création du dossier de logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Fonction pour masquer les informations sensibles
const maskSensitiveData = (obj, sensitiveFields) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const maskedObj = { ...obj };
    
    for (const field of sensitiveFields) {
        if (maskedObj[field]) {
            maskedObj[field] = '********';
        }
    }
    
    // Traitement récursif pour les objets imbriqués
    for (const key in maskedObj) {
        if (typeof maskedObj[key] === 'object' && maskedObj[key] !== null) {
            maskedObj[key] = maskSensitiveData(maskedObj[key], sensitiveFields);
        }
    }
    
    return maskedObj;
};

// Configuration du logger winston
const logger = winston.createLogger({
    level: securityConfig.securityLogConfig.level,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'form-service' },
    transports: [
        // Logs d'erreur dans un fichier séparé
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxFiles: securityConfig.securityLogConfig.maxFiles,
            maxsize: 10485760 // 10MB
        }),
        // Logs combinés
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxFiles: securityConfig.securityLogConfig.maxFiles,
            maxsize: 10485760 // 10MB
        })
    ]
});

// Si nous ne sommes pas en production, logger également dans la console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Middleware de logging pour Express
const loggerMiddleware = (req, res, next) => {
    // Générer un ID unique pour chaque requête pour faciliter le suivi
    const requestId = req.headers['x-request-id'] || req.id;
    
    // Informations à logger
    const logInfo = {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        // Masquer les données sensibles avant de les logger
        body: maskSensitiveData(req.body, securityConfig.securityLogConfig.sensitiveFields),
        query: maskSensitiveData(req.query, securityConfig.securityLogConfig.sensitiveFields)
    };
    
    // Logger les informations de la requête
    logger.info('Requête reçue', logInfo);
    
    // Intercepter la méthode res.end() pour logger la réponse
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        // Rétablir la méthode originale
        res.end = originalEnd;
        
        // Appeler la méthode originale
        res.end(chunk, encoding);
        
        // Logger les informations de la réponse
        const responseLogInfo = {
            requestId,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            responseTime: Date.now() - req._startTime, // Temps de réponse en ms
            contentLength: res.getHeader('content-length')
        };
        
        // Logger les informations en fonction du statut de la réponse
        if (res.statusCode >= 400) {
            logger.warn('Réponse avec erreur', responseLogInfo);
        } else {
            logger.info('Réponse envoyée', responseLogInfo);
        }
    };
    
    // Enregistrer l'heure de début de la requête
    req._startTime = Date.now();
    
    next();
};

// Fonction pour logger les erreurs de sécurité
const logSecurityEvent = (event, details) => {
    logger.warn('Événement de sécurité détecté', {
        event,
        details: maskSensitiveData(details, securityConfig.securityLogConfig.sensitiveFields)
    });
};

module.exports = loggerMiddleware;
module.exports.logger = logger;
module.exports.logSecurityEvent = logSecurityEvent;
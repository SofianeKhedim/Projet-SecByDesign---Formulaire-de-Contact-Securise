// Configuration des paramètres de sécurité
const { v4: uuidv4 } = require('uuid');

// Générer des secrets aléatoires à chaque démarrage du serveur
// En production, ces secrets devraient être stockés dans des variables d'environnement
const cookieSecret = process.env.COOKIE_SECRET || uuidv4();
const sessionSecret = process.env.SESSION_SECRET || uuidv4();
const jwtSecret = process.env.JWT_SECRET || uuidv4();

// Configuration de la politique de sécurité du contenu (CSP)
const contentSecurityPolicy = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/", "'unsafe-inline'"],
    frameSrc: ["https://www.google.com/recaptcha/"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://www.gstatic.com/"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'", "https://www.google.com/"],
    objectSrc: ["'none'"],
    mediaSrc: ["'none'"],
    childSrc: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'none'"],
    frameAncestors: ["'none'"] // Protection contre le clickjacking
};

// Paramètres de hachage pour bcrypt
const passwordHashConfig = {
    saltRounds: 12 // Nombre de tours pour bcrypt (équilibre sécurité/performance)
};

// Durée de vie des tokens
const tokenExpiration = {
    csrf: 60 * 60 * 1000, // 1 heure
    access: 15 * 60 * 1000, // 15 minutes
    refresh: 7 * 24 * 60 * 60 * 1000 // 7 jours
};

// Configuration de la validation du reCAPTCHA
const recaptchaConfig = {
    secret: process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
    verifyUrl: 'https://www.google.com/recaptcha/api/siteverify'
};

// Configuration du chiffrement des données
// Utilisez un algorithme moderne comme AES-256-GCM
const encryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16, // 128 bits pour AES
    encoding: 'hex',
    // La clé de chiffrement devrait être stockée en sécurité, idéalement dans un gestionnaire de secrets
    key: process.env.ENCRYPTION_KEY || Buffer.from(uuidv4() + uuidv4()).toString('hex').slice(0, 32)
};

// Configuration des logs sécurité
const securityLogConfig = {
    level: 'info', // Niveau de journalisation
    maxFiles: 30, // Conservation des logs pendant 30 jours
    sensitiveFields: [
        'password',
        'creditCard',
        'token',
        'ssn',
        'secret'
    ] // Champs à masquer dans les logs
};

module.exports = {
    cookieSecret,
    sessionSecret,
    jwtSecret,
    contentSecurityPolicy,
    passwordHashConfig,
    tokenExpiration,
    recaptchaConfig,
    encryptionConfig,
    securityLogConfig
};
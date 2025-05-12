// Importation des modules
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const cors = require('cors');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const multer = require('multer');
require('dotenv').config();

// Importation des modules locaux
const securityConfig = require('../config/security');
const loggerMiddleware = require('./middlewares/logger');
const contactController = require('./controllers/contactController');
const authController = require('./controllers/authController');
const validatorMiddleware = require('./middlewares/validator');
const authMiddleware = require('./middlewares/authMiddleware');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration SSL pour HTTPS
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '../config/ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../config/ssl/cert.pem')),
    // Force les clients à utiliser TLS 1.2 ou supérieur
    secureProtocol: 'TLSv1_2_method'
};

// Configuration des logs d'accès
const logsDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory);
}

// Stream pour Morgan (logs d'accès)
const accessLogPath = path.join(logsDirectory, 'access.log');
const accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });

// Middlewares de sécurité
app.use(helmet()); // Sécurité des en-têtes HTTP
app.use(helmet.contentSecurityPolicy({
    directives: securityConfig.contentSecurityPolicy
}));
app.use(compression()); // Compression des réponses
app.use(express.json({ limit: '10kb' })); // Limite la taille des requêtes JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Limite la taille des données de formulaire
app.use(cookieParser(securityConfig.cookieSecret)); // Analyse des cookies
app.use(hpp()); // Protection contre la pollution des paramètres HTTP

// Configuration des sessions sécurisées
app.use(session({
    secret: securityConfig.sessionSecret,
    name: 'sessionId', // Renomme le cookie de session (par défaut : connect.sid)
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Cookies uniquement sur HTTPS
        httpOnly: true, // Inaccessible via JavaScript
        sameSite: 'strict', // Protection CSRF
        maxAge: 1000 * 60 * 30 // 30 minutes
    }
}));

// Protection CSRF
const csrfProtection = csrf({ cookie: { secure: true, sameSite: 'strict' } });
app.use(csrfProtection);

// Limitation du taux de requêtes (rate limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par IP
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Limitation spécifique pour les routes d'authentification (protection contre bruteforce)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 tentatives par IP
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
});
app.use('/api/login', authLimiter);

// Configuration CORS sécurisée
app.use(cors({
    origin: 'localhost', // Autoriser uniquement localhost en développement
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 204
}));

// Logs des requêtes
app.use(morgan('combined', { stream: accessLogStream }));
app.use(loggerMiddleware);

// Configuration pour stocker les fichiers temporairement (si nécessaire)
const upload = multer({
    storage: multer.memoryStorage(), // Utilisation de la mémoire plutôt que du disque
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 1 // Un seul fichier à la fois
    },
    fileFilter: function (req, file, cb) {
        // Validation des types de fichiers
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Type de fichier non autorisé'));
        }
        cb(null, true);
    }
});

// Middleware de redirection vers login.html pour la page d'accueil
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public'), {
    etag: true, // Utilisation d'ETag pour la mise en cache
    lastModified: true,
    setHeaders: (res, path) => {
        // Ajouter des en-têtes de sécurité pour les fichiers statiques
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // Mettre en cache les ressources statiques pendant 1 jour
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// Middleware pour les variables d'environnement côté client
app.get('/env-config.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.send(`window.ENV = {
        RECAPTCHA_SITE_KEY: "${process.env.RECAPTCHA_SITE_KEY}"
    };`);
});

// Routes d'authentification
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

app.post('/api/login', validatorMiddleware.validateLogin, authController.login);
app.post('/api/logout', authController.logout);
app.get('/api/auth-status', authController.checkAuthStatus);

// Routes protégées (formulaire de contact)
app.post('/api/contact', authMiddleware.isAuthenticated, validatorMiddleware.validateContact, contactController.submitContact);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    // Log l'erreur
    console.error(err.stack);
    
    // En fonction du type d'erreur, renvoyer la réponse appropriée
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ message: 'Formulaire expiré ou invalide. Veuillez rafraîchir la page.' });
    }
    
    // Erreur par défaut
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'Une erreur s\'est produite' 
            : err.message
    });
});

// Démarrage du serveur HTTPS
const httpsServer = https.createServer(sslOptions, app);
httpsServer.listen(PORT, () => {
    console.log(`Serveur HTTPS démarré sur le port ${PORT}`);
    console.log(`- Page de connexion: https://localhost:${PORT}/login.html`);
    console.log(`- Page du formulaire: https://localhost:${PORT}/index.html (accès après connexion)`);
});

// Redirection de HTTP vers HTTPS (facultatif en production)
if (process.env.NODE_ENV === 'production') {
    const httpApp = express();
    httpApp.all('*', (req, res) => {
        res.redirect(`https://${req.hostname}${req.url}`);
    });
    httpApp.listen(80, () => {
        console.log('Redirection HTTP vers HTTPS activée');
    });
}

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
    console.log('Signal SIGTERM reçu, arrêt gracieux du serveur');
    httpsServer.close(() => {
        console.log('Serveur arrêté');
        process.exit(0);
    });
});

module.exports = app;
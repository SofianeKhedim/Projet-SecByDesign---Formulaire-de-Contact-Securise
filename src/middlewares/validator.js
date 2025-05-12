// Middleware de validation des entrées utilisateur
const { body, validationResult } = require('express-validator');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const securityConfig = require('../../config/security');

// Validation du formulaire de contact
const validateContact = [
    // Validation du nom (lettres, espaces et tirets uniquement)
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s-]+$/).withMessage('Le nom ne doit contenir que des lettres, espaces ou tirets')
        .escape(), // Protection contre XSS
    
    // Validation de l'email
    body('email')
        .trim()
        .isEmail().withMessage('Adresse email invalide')
        .normalizeEmail() // Normalisation pour la cohérence 
        .escape(),
    
    // Validation du message
    body('message')
        .trim()
        .isLength({ min: 10, max: 1000 }).withMessage('Le message doit contenir entre 10 et 1000 caractères')
        .escape(),
    
    // Validation du captcha - Désactivée temporairement pour le développement
    body('g-recaptcha-response')
        .optional() // Rend le champ optionnel pour le développement
        .custom(async (value) => {
            // En développement, on accepte toujours le captcha
            // console.log("Mode développement: Validation du captcha contournée");
            // return true;
            
            // Code pour la validation réelle en production (actuellement désactivé)
            
            try {
                // Construction de la requête pour vérifier le captcha
                const params = new URLSearchParams();
                params.append('secret', securityConfig.recaptchaConfig.secret);
                params.append('response', value);
                
                // Vérification du captcha auprès de Google
                const response = await fetch(securityConfig.recaptchaConfig.verifyUrl, {
                    method: 'POST',
                    body: params,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    console.log('reCAPTCHA verification failed:', data);
                    throw new Error('Validation du captcha échouée');
                }
                
                return true;
            } catch (error) {
                console.error('reCAPTCHA error:', error);
                throw new Error('Erreur lors de la validation du captcha');
            }
            
        }),
    
    // Middleware pour vérifier les résultats de validation
    (req, res, next) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            // Formatage des erreurs avec plus de détails
            const formattedErrors = errors.array().map(err => {
                return {
                    param: err.param,
                    value: err.value || '',
                    msg: err.msg || 'Erreur de validation'
                };
            });
            
            console.log("Erreurs de validation détectées:", formattedErrors);
            
            return res.status(400).json({ 
                message: 'Erreur de validation',
                errors: formattedErrors
            });
        }
        
        next();
    }
];

// Validation des informations de connexion
const validateLogin = [
    // Validation de l'email
    body('email')
        .trim()
        .isEmail().withMessage('Adresse email invalide')
        .normalizeEmail()
        .escape(),
    
    // Validation du mot de passe
    body('password')
        .isLength({ min: 10 }).withMessage('Le mot de passe doit contenir au moins 10 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
    
    // Validation du captcha
    body('g-recaptcha-response')
        .notEmpty().withMessage('Veuillez valider le captcha')
        .custom(async (value) => {
            try {
                // Construction de la requête pour vérifier le captcha
                const params = new URLSearchParams();
                params.append('secret', securityConfig.recaptchaConfig.secret);
                params.append('response', value);
                
                // Vérification du captcha auprès de Google
                const response = await fetch(securityConfig.recaptchaConfig.verifyUrl, {
                    method: 'POST',
                    body: params,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    console.log('reCAPTCHA verification failed:', data);
                    throw new Error('Validation du captcha échouée');
                }
                
                return true;
            } catch (error) {
                console.error('reCAPTCHA error:', error);
                throw new Error('Erreur lors de la validation du captcha');
            }
        }),
    
    // Middleware pour vérifier les résultats de validation
    (req, res, next) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Erreur de validation',
                errors: errors.array().map(err => ({ param: err.param, msg: err.msg }))
            });
        }
        
        next();
    }
];

module.exports = {
    validateContact,
    validateLogin
};
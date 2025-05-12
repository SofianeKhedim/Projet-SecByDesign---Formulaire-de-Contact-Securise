document.addEventListener('DOMContentLoaded', function() {
    // Vérification si l'utilisateur est déjà connecté
    checkAuthStatus();
    
    // Récupération des éléments du DOM
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageContainer = document.getElementById('message-container');
    const csrfToken = document.getElementById('csrf-token');
    
    // Fonction pour échapper le HTML (protection XSS)
    function escapeHtml(unsafe) {
        return unsafe.replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
    }
    
    // Fonction pour afficher un message d'erreur ou de succès
    function showMessage(message, type) {
        // Si le message contient du HTML (comme <br>), on l'utilise directement
        if (message.includes('<br>') || message.includes('<')) {
            messageContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        } else {
            // Sinon, on échappe le HTML pour éviter les injections XSS
            messageContainer.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
        }
        messageContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Vérification du statut d'authentification
    function checkAuthStatus() {
        fetch('/api/auth-status', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                // Rediriger vers le formulaire de contact si déjà connecté
                window.location.href = '/index.html';
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du statut d\'authentification:', error);
        });
    }
    
    // Récupération du token CSRF du serveur
    fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        csrfToken.value = data.csrfToken;
    })
    .catch(error => {
        console.error('Erreur lors de la récupération du token CSRF:', error);
    });
    
    // Validation de l'email
    emailInput.addEventListener('blur', function() {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.value)) {
            this.classList.add('error');
            
            // Suppression d'anciennes erreurs
            const oldError = this.parentNode.querySelector('.error-message');
            if (oldError) oldError.remove();
            
            // Ajout du message d'erreur
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Veuillez entrer une adresse email valide.';
            this.parentNode.appendChild(errorMsg);
        } else {
            this.classList.remove('error');
            this.classList.add('success');
            
            // Suppression des messages d'erreur
            const oldError = this.parentNode.querySelector('.error-message');
            if (oldError) oldError.remove();
        }
    });
    
    // Validation du mot de passe
    passwordInput.addEventListener('blur', function() {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
        if (!passwordRegex.test(this.value)) {
            this.classList.add('error');
            
            // Suppression d'anciennes erreurs
            const oldError = this.parentNode.querySelector('.error-message');
            if (oldError) oldError.remove();
            
            // Ajout du message d'erreur
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Le mot de passe doit contenir au moins 10 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.';
            this.parentNode.appendChild(errorMsg);
        } else {
            this.classList.remove('error');
            this.classList.add('success');
            
            // Suppression des messages d'erreur
            const oldError = this.parentNode.querySelector('.error-message');
            if (oldError) oldError.remove();
        }
    });
    
    // Soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Vérification du reCAPTCHA - Désactivée temporairement pour le développement
        const recaptchaResponse = grecaptcha.getResponse();
        console.log("reCAPTCHA response:", recaptchaResponse);
        // En développement, on continue même si le captcha n'est pas validé
        // if (!recaptchaResponse) {
        //     showMessage('Veuillez valider le captcha.', 'error');
        //     return;
        // }
        
        // Vérification des champs
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
        
        if (!emailRegex.test(emailInput.value)) {
            showMessage('Format d\'email invalide.', 'error');
            return;
        }
        
        if (!passwordRegex.test(passwordInput.value)) {
            showMessage('Format de mot de passe invalide.', 'error');
            return;
        }
        
        // Préparation des données du formulaire
        const formData = new FormData();
        formData.append('email', emailInput.value);
        formData.append('password', passwordInput.value);
        formData.append('g-recaptcha-response', recaptchaResponse);
        
        // Envoi des données au serveur
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken.value
            },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value,
                'g-recaptcha-response': recaptchaResponse
            }),
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    console.log("Erreur reçue du serveur:", data);
                    // Affichage détaillé des erreurs
                    if (data.errors && data.errors.length > 0) {
                        // Création d'un message d'erreur détaillé
                        const errorMessages = data.errors.map(err => {
                            // Vérifier que err.msg existe
                            return `• ${err.msg || "Erreur indéfinie"}`;
                        }).join('<br>');
                        showMessage(`Erreur de validation:<br>${errorMessages}`, 'error');
                    } else {
                        // Message d'erreur générique
                        showMessage(data.message || 'Une erreur est survenue', 'error');
                    }
                    // On retourne une promesse rejetée pour arrêter la chaîne
                    return Promise.reject(new Error('Validation failed'));
                });
            }
            return response.json();
        })
        .then(data => {
            // Message de succès
            showMessage(data.message || 'Connexion réussie', 'success');
            
            // Redirection vers le formulaire de contact après connexion
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        })
        .catch(error => {
            console.error("Erreur de traitement:", error);
            // On n'affiche pas de message ici pour éviter les doublons
            // puisque l'erreur a déjà été traitée ci-dessus
            
            // Réinitialisation du captcha
            if (typeof grecaptcha !== 'undefined') {
                grecaptcha.reset();
            }
        });
    });
});
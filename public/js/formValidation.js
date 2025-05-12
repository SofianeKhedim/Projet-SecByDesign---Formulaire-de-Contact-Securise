document.addEventListener('DOMContentLoaded', function() {
    // Vérification de l'authentification
    checkAuthStatus();
    
    // Récupération des éléments du DOM
    const form = document.getElementById('contact-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const messageContainer = document.getElementById('message-container');
    const csrfToken = document.getElementById('csrf-token');
    const userEmail = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');
    
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
            if (!data.authenticated) {
                // Rediriger vers la page de connexion si non connecté
                window.location.href = '/login.html';
            } else {
                // Afficher l'email de l'utilisateur connecté
                userEmail.textContent = data.email;
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du statut d\'authentification:', error);
            // Rediriger vers la page de connexion en cas d'erreur
            window.location.href = '/login.html';
        });
    }
    
    // Gestion de la déconnexion
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            fetch('/api/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-Token': csrfToken.value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirection vers la page de connexion
                    window.location.href = '/login.html';
                }
            })
            .catch(error => {
                console.error('Erreur lors de la déconnexion:', error);
            });
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
    
    // Validation du nom
    nameInput.addEventListener('blur', function() {
        const nameRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
        if (!nameRegex.test(this.value)) {
            this.classList.add('error');
            
            // Suppression d'anciennes erreurs
            const oldError = this.parentNode.querySelector('.error-message');
            if (oldError) oldError.remove();
            
            // Ajout du message d'erreur
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Le nom doit contenir entre 2 et 50 caractères (lettres, espaces ou tirets uniquement).';
            this.parentNode.appendChild(errorMsg);
        } else {
            this.classList.remove('error');
            this.classList.add('success');
            
            // Suppression des messages d'erreur
            const oldError = this.parentNode.querySelector('.error-message');
            if (oldError) oldError.remove();
        }
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
    
    // Validation du message
    messageInput.addEventListener('blur', function() {
        if (this.value.length < 10 || this.value.length > 1000) {
            this.classList.add('error');
            
            // Suppression d'anciennes erreurs
            const oldError = this.parentNode.querySelector('.error-message');
            if (oldError) oldError.remove();
            
            // Ajout du message d'erreur
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Le message doit contenir entre 10 et 1000 caractères.';
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
    if (form) {
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
            const nameRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            
            if (!nameRegex.test(nameInput.value)) {
                showMessage('Format de nom invalide.', 'error');
                return;
            }
            
            if (!emailRegex.test(emailInput.value)) {
                showMessage('Format d\'email invalide.', 'error');
                return;
            }
            
            if (messageInput.value.length < 10 || messageInput.value.length > 1000) {
                showMessage('Le message doit contenir entre 10 et 1000 caractères.', 'error');
                return;
            }
            
            // Préparation des données du formulaire
            const formData = new FormData(this);
            formData.append('g-recaptcha-response', recaptchaResponse);
            
            // Envoi des données au serveur
            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken.value
                },
                body: JSON.stringify({
                    name: nameInput.value,
                    email: emailInput.value,
                    message: messageInput.value,
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
                showMessage(data.message || 'Message envoyé avec succès', 'success');
                
                // Réinitialisation du formulaire
                form.reset();
                if (typeof grecaptcha !== 'undefined') {
                    grecaptcha.reset();
                }
                
                // Réinitialisation des classes de validation
                const successInputs = form.querySelectorAll('.success');
                successInputs.forEach(input => input.classList.remove('success'));
            })
            .catch(error => {
                console.error("Erreur de traitement:", error);
                // On n'affiche pas de message ici pour éviter les doublons
                // puisque l'erreur a déjà été traitée ci-dessus
            });
        });
    }
});
class NotificationManager {
    constructor() {
        this.addCSS();
    }

    addCSS() {
        if (document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .cricket-notification {
                position: fixed;
                top: 15px;
                right: 15px;
                z-index: 2000;
                animation: slideInRight 0.3s ease-out;
                max-width: 220px;
                max-height: 60px;
                pointer-events: none;
            }

            .notification-content {
                padding: 8px 12px;
                border-radius: 6px;
                color: white;
                font-weight: 600;
                font-size: 12px;
                box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                min-width: 120px;
                max-width: 200px;
                max-height: 50px;
                text-align: center;
                word-wrap: break-word;
                line-height: 1.2;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: auto;
            }

            @keyframes slideInRight {
                from { 
                    opacity: 0; 
                    transform: translateX(100%);
                }
                to { 
                    opacity: 1; 
                    transform: translateX(0);
                }
            }

            .fade-out {
                animation: slideOutRight 0.3s ease-in forwards;
            }

            @keyframes slideOutRight {
                to { 
                    opacity: 0; 
                    transform: translateX(100%);
                }
            }

            .notification-success {
                background: linear-gradient(135deg, #4CAF50, #45a049);
            }

            .notification-error {
                background: linear-gradient(135deg, #f44336, #da190b);
            }

            .notification-warning {
                background: linear-gradient(135deg, #ff9800, #e68900);
            }

            .notification-info {
                background: linear-gradient(135deg, #2196F3, #1976D2);
            }

            .notification-cricket {
                background: linear-gradient(135deg, #FF6B35, #F7931E);
            }

            @media (max-width: 480px) {
                .cricket-notification {
                    top: 10px;
                    right: 10px;
                    max-width: 180px;
                    max-height: 45px;
                }
                
                .notification-content {
                    font-size: 11px;
                    padding: 6px 10px;
                    max-height: 40px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    showNotification(message, type = "success", duration = 2500) {
        const existingNotifs = document.querySelectorAll('.cricket-notification');
        existingNotifs.forEach(notif => notif.remove());
        
        const notification = document.createElement("div");
        notification.className = "cricket-notification";
        
        let bgClass = "notification-success";
        let icon = "✅";
        
        switch(type) {
            case "error":
                bgClass = "notification-error";
                icon = "❌";
                break;
            case "warning":
                bgClass = "notification-warning";
                icon = "⚠️";
                break;
            case "info":
                bgClass = "notification-info";
                icon = "ℹ️";
                break;
            case "cricket":
                bgClass = "notification-cricket";
                icon = "🏏";
                break;
        }
        
        const compactMessage = message.length > 40 ? message.substring(0, 37) + "..." : message;
        
        notification.innerHTML = `
            <div class="notification-content ${bgClass}">
                ${icon} ${compactMessage}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add("fade-out");
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    replaceAlerts() {
        const originalAlert = window.alert;
        window.alert = (message) => {
            this.showNotification(message, "info", 3000);
        };
        
        window.originalAlert = originalAlert;
    }
}

window.NotificationManager = new NotificationManager();

window.showNotification = (message, type, duration) => {
    window.NotificationManager.showNotification(message, type, duration);
};

window.NotificationManager.replaceAlerts();

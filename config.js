// config.js - Конфигурация Absgram

const ABSGRAM_CONFIG = {
    // Supabase конфигурация
    supabase: {
        url: "https://zdmtwnvaksdbvutrpcnr.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbXR3bnZha3NkYnZ1dHJwY25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Mjg4NjcsImV4cCI6MjA4MzEwNDg2N30.QztruYbzPeF8CrZmT_FhMw6VHc1-289qqJ8Qs4Z7nVc"
    },
    
    // Настройки приложения
    app: {
        name: "Absgram",
        version: "1.0.0",
        siteUrl: "https://absgram.onrender.com", // ЗАМЕНИТЕ на ваш URL
        colors: {
            primary: "#FF9800",
            primaryDark: "#F57C00",
            neon: "#FFAB00",
            white: "#FFFFFF",
            black: "#000000",
            darkBg: "#0A0A0A",
            gray: "#2A2A2A",
            success: "#4CAF50",
            error: "#F44336",
            warning: "#FFC107"
        },
        limits: {
            messageLength: 2000,
            usernameLength: 20,
            searchResults: 15
        }
    },
    
    // Фичи
    features: {
        magicLink: true,
        realtime: true,
        groups: true,
        editing: true,
        onlineStatus: true
    }
};

// Экспорт для использования
window.ABSGRAM_CONFIG = ABSGRAM_CONFIG;
console.log('✅ Конфигурация Absgram загружена:', ABSGRAM_CONFIG.app.name);

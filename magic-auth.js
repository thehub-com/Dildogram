// magic-auth.js - Авторизация Absgram через Magic Link

console.log('🔐 Magic Auth инициализация...');

// Глобальные переменные
let supabase = null;
let currentUser = null;

// DOM элементы
const elements = {
    screens: {
        splash: document.getElementById('splash'),
        auth: document.getElementById('auth'),
        app: document.getElementById('app')
    },
    auth: {
        emailInput: document.getElementById('email-input'),
        sendMagicLinkBtn: document.getElementById('send-magic-link-btn'),
        emailForm: document.getElementById('email-form'),
        waitingScreen: document.getElementById('waiting-screen'),
        waitingEmail: document.getElementById('waiting-email')
    }
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Magic Auth загружен');
    
    try {
        // Инициализация Supabase
        supabase = window.supabase.createClient(
            CONFIG.supabase.url, 
            CONFIG.supabase.anonKey
        );
        console.log('✅ Supabase подключен');
        
        // Проверка текущей сессии
        await checkCurrentSession();
        
        // Настройка обработчиков
        setupAuthHandlers();
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
});

// ===== ПРОВЕРКА СЕССИИ =====
async function checkCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Ошибка проверки сессии:', error);
            showAuthScreen();
            return;
        }
        
        if (session) {
            console.log('✅ Активная сессия найдена:', session.user.email);
            currentUser = session.user;
            await initializeUser();
            showScreen('app');
        } else {
            console.log('⚠️ Активная сессия не найдена');
            showAuthScreen();
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки сессии:', error);
        showAuthScreen();
    }
}

// ===== MAGIC LINK АВТОРИЗАЦИЯ =====
async function sendMagicLink() {
    const email = elements.auth.emailInput.value.trim();
    
    if (!email || !isValidEmail(email)) {
        showError('Введите корректный email');
        return;
    }
    
    try {
        console.log('📧 Отправка Magic Link на:', email);
        
        // Блокируем кнопку
        elements.auth.sendMagicLinkBtn.disabled = true;
        elements.auth.sendMagicLinkBtn.textContent = 'Отправка...';
        
        // Определяем redirect URL (важно!)
        const siteUrl = window.location.origin;
        console.log('📍 Redirect URL:', siteUrl);
        
        // Отправляем Magic Link
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: siteUrl
            }
        });
        
        if (error) {
            console.error('❌ Ошибка отправки Magic Link:', error);
            throw error;
        }
        
        console.log('✅ Magic Link отправлен успешно');
        
        // Показываем экран ожидания
        showWaitingScreen(email);
        
        // Начинаем проверку авторизации
        startAuthCheck();
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showError('Ошибка отправки: ' + error.message);
    } finally {
        // Восстанавливаем кнопку
        elements.auth.sendMagicLinkBtn.disabled = false;
        elements.auth.sendMagicLinkBtn.textContent = 'Получить ссылку';
    }
}

// ===== ЭКРАН ОЖИДАНИЯ =====
function showWaitingScreen(email) {
    // Скрываем форму email
    elements.auth.emailForm.classList.add('hidden');
    
    // Показываем email в экране ожидания
    elements.auth.waitingEmail.textContent = email;
    
    // Показываем экран ожидания
    elements.auth.waitingScreen.classList.remove('hidden');
    
    // Анимируем часы
    const clock = elements.auth.waitingScreen.querySelector('.big-clock');
    if (clock) {
        clock.style.animation = 'clockRotate 2s linear infinite';
    }
}

function hideWaitingScreen() {
    elements.auth.emailForm.classList.remove('hidden');
    elements.auth.waitingScreen.classList.add('hidden');
}

// ===== ПРОВЕРКА АВТОРИЗАЦИИ =====
function startAuthCheck() {
    console.log('⏳ Начинаем проверку авторизации...');
    
    // Слушаем изменения состояния аутентификации
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
            console.log('✅ Пользователь вошёл через Magic Link:', session.user.email);
            
            currentUser = session.user;
            await initializeUser();
            
            // Показываем главное приложение
            showScreen('app');
            
            // Уведомление
            showSuccess('✅ Вход выполнен! Добро пожаловать в Absgram.');
        }
    });
    
    // Также проверяем каждые 5 секунд
    const checkInterval = setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
            console.log('✅ Обнаружена сессия через интервал:', session.user.email);
            clearInterval(checkInterval);
            
            currentUser = session.user;
            await initializeUser();
            showScreen('app');
        }
    }, 5000);
    
    // Останавливаем проверку через 5 минут
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('🕒 Проверка авторизации завершена (таймаут)');
    }, 5 * 60 * 1000);
}

// ===== ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ =====
async function initializeUser() {
    if (!currentUser) return;
    
    console.log('👤 Инициализация пользователя:', currentUser.email);
    
    try {
        // Создаем или обновляем профиль
        await createOrUpdateProfile();
        
        console.log('✅ Пользователь инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации пользователя:', error);
    }
}

async function createOrUpdateProfile() {
    try {
        // Проверяем существующий профиль
        const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', currentUser.id)
            .single();
        
        // Если профиля нет - создаем
        if (fetchError || !existingProfile) {
            const username = generateUsername(currentUser.email);
            
            const { error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    username: username,
                    status: 'В сети',
                    is_online: true,
                    last_seen: new Date().toISOString(),
                    created_at: new Date().toISOString()
                });
            
            if (createError) {
                console.error('❌ Ошибка создания профиля:', createError);
            } else {
                console.log('✅ Профиль создан:', username);
            }
        } else {
            // Обновляем статус онлайн
            await supabase
                .from('profiles')
                .update({ 
                    is_online: true,
                    last_seen: new Date().toISOString()
                })
                .eq('id', currentUser.id);
                
            console.log('✅ Статус онлайн обновлён');
        }
    } catch (error) {
        console.error('❌ Ошибка профиля:', error);
    }
}

// ===== ВЫХОД =====
async function signOut() {
    try {
        console.log('👋 Выход пользователя:', currentUser?.email);
        
        // Обновляем статус офлайн
        if (currentUser) {
            await supabase
                .from('profiles')
                .update({ is_online: false })
                .eq('id', currentUser.id);
        }
        
        // Выход из Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Сброс состояния
        currentUser = null;
        
        // Переход на экран авторизации
        showAuthScreen();
        
        console.log('✅ Выход выполнен');
        
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
    }
}

// ===== УТИЛИТЫ =====
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function generateUsername(email) {
    if (!email) return 'user_' + Math.random().toString(36).substr(2, 8);
    return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substr(0, 20);
}

function showError(message) {
    console.error('❌', message);
    alert(message);
}

function showSuccess(message) {
    console.log('✅', message);
    alert(message);
}

// ===== МАРШРУТИЗАЦИЯ =====
function showScreen(screenName) {
    if (window.showScreen) {
        window.showScreen(screenName);
    } else {
        console.error('❌ Функция showScreen не найдена');
        // Fallback: прямая переключение
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        const screen = document.getElementById(screenName);
        if (screen) {
            screen.style.display = 'flex';
            setTimeout(() => screen.classList.add('active'), 10);
        }
    }
}

function showAuthScreen() {
    showScreen('auth');
    hideWaitingScreen();
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupAuthHandlers() {
    console.log('🔧 Настройка обработчиков авторизации');
    
    // Кнопка "Получить ссылку"
    if (elements.auth.sendMagicLinkBtn) {
        elements.auth.sendMagicLinkBtn.addEventListener('click', sendMagicLink);
        console.log('✅ Обработчик для "Получить ссылку" установлен');
    } else {
        console.error('❌ Кнопка "send-magic-link-btn" не найдена');
    }
    
    // Enter в поле email
    if (elements.auth.emailInput) {
        elements.auth.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMagicLink();
            }
        });
    }
    
    // Создаем тестовую кнопку для отладки
    createDebugButton();
}

function createDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = '🐛 Debug';
    debugBtn.style.position = 'fixed';
    debugBtn.style.top = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    debugBtn.style.padding = '8px 12px';
    debugBtn.style.background = '#4CAF50';
    debugBtn.style.color = 'white';
    debugBtn.style.border = 'none';
    debugBtn.style.borderRadius = '5px';
    debugBtn.style.fontSize = '12px';
    debugBtn.style.cursor = 'pointer';
    
    debugBtn.addEventListener('click', () => {
        console.log('=== DEBUG INFO ===');
        console.log('Supabase:', supabase ? '✅ Загружен' : '❌ Не загружен');
        console.log('Текущий URL:', window.location.href);
        console.log('Email input:', elements.auth.emailInput?.value);
        console.log('Current user:', currentUser?.email || 'Нет');
        console.log('Redirect URL:', window.location.origin);
        
        // Тест функции sendMagicLink
        if (elements.auth.emailInput?.value) {
            console.log('🔧 Тест: отправка Magic Link...');
            sendMagicLink();
        } else {
            alert('Введите email для теста');
        }
    });
    
    document.body.appendChild(debugBtn);
}

// ===== ГЛОБАЛЬНЫЙ ЭКСПОРТ =====
window.supabaseClient = supabase;
window.currentUser = currentUser;
window.sendMagicLink = sendMagicLink;
window.signOut = signOut;
window.showAuthScreen = showAuthScreen;

console.log('✅ Magic Auth готов к работе');

/**
 * Travel Pay - Smart Travel Wallet Application
 * Professional PhonePe-like Web App
 * Main JavaScript File - Fixed: Profile photo persistence bug
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==================== STATE MANAGEMENT ====================
    const state = {
        currentUser: null,
        group: null,
        pendingInvites: [],
        members: [],
        transactions: [],
        expenses: [],
        pendingApprovals: [],
        notifications: [],
        settings: {
            darkMode: false,
            currency: 'INR',
            notifications: true
        },
        sidebarVisible: window.innerWidth > 1024 // Show sidebar on desktop by default
    };

    // ==================== UTILITY FUNCTIONS ====================
    function generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function formatCurrency(amount) {
        return '₹' + parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatDate(date) {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    function showToast(message, type = 'success', duration = 3000) {
        const toast = document.getElementById('notificationToast');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');
        
        // Set icon based on type
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toastIcon.className = `toast-icon fas ${icons[type]}`;
        toastMessage.textContent = message;
        toast.className = `notification-toast ${type}`;
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
        
        // Close button
        toast.querySelector('.toast-close').onclick = () => {
            toast.classList.remove('show');
        };
    }

    // ==================== SIDEBAR TOGGLE FUNCTIONALITY ====================
    function toggleSidebar() {
        const drawer = document.getElementById('drawer');
        const appHeader = document.getElementById('appHeader');
        const content = document.getElementById('mainContent');
        
        state.sidebarVisible = !state.sidebarVisible;
        
        if (window.innerWidth <= 1024) {
            // On mobile: toggle the show class
            drawer.classList.toggle('show');
        } else {
            // On desktop: toggle the hidden class
            if (state.sidebarVisible) {
                drawer.classList.remove('hidden');
                appHeader.classList.remove('sidebar-hidden');
                content.classList.remove('sidebar-hidden');
            } else {
                drawer.classList.add('hidden');
                appHeader.classList.add('sidebar-hidden');
                content.classList.add('sidebar-hidden');
            }
        }
        
        // Update accessibility
        drawer.setAttribute('aria-hidden', !state.sidebarVisible);
        
        // Save state
        saveState();
    }

    function updateSidebarForScreenSize() {
        const drawer = document.getElementById('drawer');
        const appHeader = document.getElementById('appHeader');
        const content = document.getElementById('mainContent');
        
        if (window.innerWidth <= 1024) {
            // Mobile: hide sidebar by default, show only when toggled
            drawer.classList.remove('hidden');
            drawer.classList.remove('show');
            appHeader.classList.remove('sidebar-hidden');
            content.classList.remove('sidebar-hidden');
            state.sidebarVisible = false;
        } else {
            // Desktop: show sidebar if it was visible before
            if (state.sidebarVisible) {
                drawer.classList.remove('hidden');
                appHeader.classList.remove('sidebar-hidden');
                content.classList.remove('sidebar-hidden');
            } else {
                drawer.classList.add('hidden');
                appHeader.classList.add('sidebar-hidden');
                content.classList.add('sidebar-hidden');
            }
        }
    }

    // ==================== PERSISTENCE ====================
    function saveState() {
        try {
            localStorage.setItem('travelPayState', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem('travelPayState'));
            if (saved) {
                // Merge saved state with current state
                Object.keys(saved).forEach(key => {
                    if (state[key] !== undefined) {
                        state[key] = saved[key];
                    }
                });
                
                // Restore user from users database - FIXED: Reset profile image when loading
                if (state.currentUser && state.currentUser.id) {
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    const user = users.find(u => u.id === state.currentUser.id);
                    if (user) {
                        state.currentUser = user;
                    }
                }
                
                // Apply dark mode if enabled
                if (state.settings.darkMode) {
                    document.body.classList.add('dark-mode');
                    updateThemeText();
                }
                
                // Update UI
                updateUI();
                if (state.currentUser) {
                    showApp();
                    updateProfileImages();
                }
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    // ==================== DOM ELEMENTS ====================
    const elements = {
        // Pages
        pages: document.querySelectorAll('.page'),
        
        // Header
        appHeader: document.getElementById('appHeader'),
        menuToggle: document.getElementById('menuToggle'),
        pageTitle: document.getElementById('pageTitle'),
        
        // Drawer
        drawer: document.getElementById('drawer'),
        drawerHostName: document.getElementById('drawerHostName'),
        drawerProfileImage: document.getElementById('drawerProfileImage'),
        themeToggle: document.getElementById('themeToggle'),
        themeText: document.getElementById('themeText'),
        
        // Login/Create Account
        inputLoginPhone: document.getElementById('inputLoginPhone'),
        btnLogin: document.getElementById('btnLogin'),
        inputAccountName: document.getElementById('inputAccountName'),
        inputAccountPhone: document.getElementById('inputAccountPhone'),
        btnCreateAccount: document.getElementById('btnCreateAccount'),
        profileImageUpload: document.getElementById('profileImageUpload'),
        triggerImageUpload: document.getElementById('triggerImageUpload'),
        accountProfileImage: document.getElementById('accountProfileImage'),
        
        // Home Page
        currentBalance: document.getElementById('currentBalance'),
        groupNameDisplay: document.getElementById('groupNameDisplay'),
        walletStatus: document.getElementById('walletStatus'),
        walletStatusText: document.getElementById('walletStatusText'),
        membersCount: document.getElementById('membersCount'),
        transactionsCount: document.getElementById('transactionsCount'),
        transactionsList: document.getElementById('transactions-list'),
        pendingApprovalsCard: document.getElementById('pendingApprovalsCard'),
        pendingApprovalsList: document.getElementById('pendingApprovalsList'),
        btnEndTrip: document.getElementById('btnEndTrip'),
        refreshTransactions: document.getElementById('refreshTransactions'),
        
        // Create Group
        inputGroupName: document.getElementById('inputGroupName'),
        inputMemberCount: document.getElementById('inputMemberCount'),
        dynamicMembersArea: document.getElementById('dynamicMembersArea'),
        btnCreateGroup: document.getElementById('btnCreateGroup'),
        
        // Add Members
        pendingInvitesList: document.getElementById('pendingInvitesList'),
        membersList: document.getElementById('membersList'),
        inviteName: document.getElementById('inviteName'),
        invitePhone: document.getElementById('invitePhone'),
        btnSendInvite: document.getElementById('btnSendInvite'),
        contribName: document.getElementById('contribName'),
        contribAmount: document.getElementById('contribAmount'),
        btnAddContribution: document.getElementById('btnAddContribution'),
        
        // Pay Page
        inputExpenseTitle: document.getElementById('inputExpenseTitle'),
        inputExpenseAmount: document.getElementById('inputExpenseAmount'),
        selectPayer: document.getElementById('selectPayer'),
        expenseCategory: document.getElementById('expenseCategory'),
        btnPay: document.getElementById('btnPay'),
        recentExpensesList: document.getElementById('recentExpensesList'),
        
        // Reports Page
        totalContributions: document.getElementById('totalContributions'),
        totalExpenses: document.getElementById('totalExpenses'),
        reportBody: document.getElementById('reportBody'),
        btnExportReport: document.getElementById('btnExportReport'),
        
        // Profile Page
        profilePageImage: document.getElementById('profilePageImage'),
        profilePageImageUpload: document.getElementById('profilePageImageUpload'),
        triggerProfileImageUpload: document.getElementById('triggerProfileImageUpload'),
        profileNameInput: document.getElementById('profileNameInput'),
        profilePhoneInput: document.getElementById('profilePhoneInput'),
        profileEmail: document.getElementById('profileEmail'),
        groupsCreated: document.getElementById('groupsCreated'),
        totalSpent: document.getElementById('totalSpent'),
        btnUpdateProfile: document.getElementById('btnUpdateProfile'),
        btnLogout: document.getElementById('btnLogout'),
        
        // Bottom Nav
        bottomNav: document.getElementById('bottomNav'),
        
        // Modals
        consensusModal: document.getElementById('consensusModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalDesc: document.getElementById('modalDesc'),
        approversList: document.getElementById('approversList'),
        btnFinalize: document.getElementById('btnFinalize'),
        btnCancelModal: document.getElementById('btnCancelModal'),
        closeConsensusModal: document.getElementById('closeConsensusModal'),
        
        settleModal: document.getElementById('settleModal'),
        settlementBody: document.getElementById('settlementBody'),
        btnCloseSettle: document.getElementById('btnCloseSettle'),
        closeSettleModal: document.getElementById('closeSettleModal'),
        btnPrintSettlement: document.getElementById('btnPrintSettlement'),
        
        // Charts
        expenseChartCanvas: document.getElementById('expenseChart'),
        contributionChartCanvas: document.getElementById('contributionChart'),
        
        // Other
        helpBtn: document.getElementById('helpBtn')
    };

    let expenseChart = null;
    let contributionChart = null;
    let currentExpenseForApproval = null;

    // ==================== PROFILE PHOTO RESET FIX ====================
    function resetProfileImages() {
        const defaultImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTAgMTcuMDJjLTMuMzMyIDAtNi4yOC0xLjcxLTgtNi4wMiAyLjA1LTMuMTYgNS4yOC00IDgtNHM1Ljk1Ljg0IDggNGMtMS43MiA0LjMxLTQuNjcgNi4wMi04IDYuMDJ6Ii8+PC9zdmc+";
        
        // Reset all profile images to default
        const images = [
            elements.drawerProfileImage,
            elements.accountProfileImage,
            elements.profilePageImage
        ];
        
        images.forEach(img => {
            if (img) {
                img.src = defaultImage;
            }
        });
    }

    // ==================== NAVIGATION ====================
    function showPage(pageId) {
        // Hide all pages
        elements.pages.forEach(page => page.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update active nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-target') === pageId);
        });
        
        // Update active drawer items
        document.querySelectorAll('.drawer-item[data-target]').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-target') === pageId);
        });
        
        // Update page title in header
        if (elements.pageTitle) {
            switch(pageId) {
                case 'home-page':
                    elements.pageTitle.textContent = 'Travel Wallet';
                    break;
                case 'profile-page':
                    elements.pageTitle.textContent = 'Profile';
                    break;
                case 'create-group-page':
                    elements.pageTitle.textContent = 'Create Group';
                    break;
                case 'add-members-page':
                    elements.pageTitle.textContent = 'Add Members';
                    break;
                case 'pay-page':
                    elements.pageTitle.textContent = 'Make Payment';
                    break;
                case 'reports-page':
                    elements.pageTitle.textContent = 'Reports';
                    break;
                case 'login-page':
                case 'create-account-page':
                    elements.pageTitle.textContent = 'Travel Wallet';
                    break;
                default:
                    elements.pageTitle.textContent = 'Travel Wallet';
            }
        }
        
        // Close drawer on mobile
        if (window.innerWidth <= 1024) {
            elements.drawer.classList.remove('show');
            state.sidebarVisible = false;
        }
        elements.drawer.setAttribute('aria-hidden', !state.sidebarVisible);
        
        // Page-specific initialization
        switch (pageId) {
            case 'home-page':
                renderTransactions();
                updatePendingApprovals();
                break;
            case 'add-members-page':
                renderPendingInvites();
                renderMembers();
                populateContribNameSelect();
                break;
            case 'pay-page':
                populatePayerSelect();
                renderRecentExpenses();
                break;
            case 'reports-page':
                updateReports();
                break;
            case 'profile-page':
                updateProfilePage();
                break;
            case 'login-page':
                // Reset login form
                elements.inputLoginPhone.value = '';
                // Reset profile images to default for new user
                if (!state.currentUser) {
                    resetProfileImages();
                }
                break;
            case 'create-account-page':
                // Reset form
                elements.inputAccountName.value = '';
                elements.inputAccountPhone.value = '';
                // Reset to default profile image
                resetProfileImages();
                break;
        }
        
        saveState();
    }

    function showApp() {
        elements.appHeader.classList.remove('hidden');
        elements.bottomNav.classList.remove('hidden');
        elements.drawer.classList.remove('hidden');
        updateSidebarForScreenSize();
        showPage('home-page');
    }

    function hideApp() {
        elements.appHeader.classList.add('hidden');
        elements.bottomNav.classList.add('hidden');
        elements.drawer.classList.add('hidden');
        // Reset profile images when logging out
        resetProfileImages();
        showPage('login-page');
    }

    // Navigation event listeners
    document.querySelectorAll('[data-target]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const target = element.getAttribute('data-target');
            if (target) {
                showPage(target);
            }
        });
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding tab pane
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${tab}Tab`).classList.add('active');
        });
    });

    // Drawer toggle
    elements.menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    // Close drawer when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            !elements.drawer.contains(e.target) && 
            !elements.menuToggle.contains(e.target) &&
            elements.drawer.classList.contains('show')) {
            elements.drawer.classList.remove('show');
            state.sidebarVisible = false;
            elements.drawer.setAttribute('aria-hidden', 'true');
        }
    });

    // ==================== THEME TOGGLE ====================
    function updateThemeText() {
        if (elements.themeText) {
            elements.themeText.textContent = state.settings.darkMode ? 'Light Mode' : 'Dark Mode';
            const icon = elements.themeToggle.querySelector('i');
            icon.className = state.settings.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    elements.themeToggle.addEventListener('click', () => {
        state.settings.darkMode = !state.settings.darkMode;
        document.body.classList.toggle('dark-mode', state.settings.darkMode);
        updateThemeText();
        saveState();
        showToast(`Switched to ${state.settings.darkMode ? 'dark' : 'light'} mode`, 'info');
    });

    // ==================== PROFILE IMAGE HANDLING ====================
    function handleImageUpload(event, isProfilePage = false) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.match('image.*')) {
            showToast('Please select an image file (JPEG, PNG, etc.)', 'error');
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image size should be less than 2MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageSrc = e.target.result;
            
            if (isProfilePage) {
                // Profile page image
                elements.profilePageImage.src = imageSrc;
                if (state.currentUser) {
                    state.currentUser.profileImage = imageSrc;
                    updateProfileImages();
                }
            } else {
                // Create account page image
                elements.accountProfileImage.src = imageSrc;
            }
            
            // Update in users database if user exists
            if (state.currentUser && state.currentUser.id) {
                let users = JSON.parse(localStorage.getItem('users')) || [];
                const userIndex = users.findIndex(u => u.id === state.currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex].profileImage = imageSrc;
                    localStorage.setItem('users', JSON.stringify(users));
                }
            }
            
            showToast('Profile image updated successfully!', 'success');
        };
        
        reader.onerror = function() {
            showToast('Error reading image file', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    // Image upload triggers
    elements.triggerImageUpload.addEventListener('click', () => {
        elements.profileImageUpload.click();
    });

    elements.triggerProfileImageUpload.addEventListener('click', () => {
        elements.profilePageImageUpload.click();
    });

    elements.profileImageUpload.addEventListener('change', (e) => handleImageUpload(e, false));
    elements.profilePageImageUpload.addEventListener('change', (e) => handleImageUpload(e, true));

    function updateProfileImages() {
        if (state.currentUser && state.currentUser.profileImage) {
            const images = [
                elements.drawerProfileImage,
                elements.accountProfileImage,
                elements.profilePageImage
            ];
            
            images.forEach(img => {
                if (img) {
                    img.src = state.currentUser.profileImage;
                    img.onerror = function() {
                        // Fallback to default if image fails to load
                        this.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTAgMTcuMDJjLTMuMzMzIDAtNi4yOC0xLjc5LTgtNi4wMiAyLjA1LTMuMTYgNS4yOC00IDgtNHM1Ljk1Ljg0IDggNGMtMS43MiA0LjMxLTQuNjcgNi4wMi04IDYuMDJ6Ii8+PC9zdmc+";
                    };
                }
            });
        } else {
            // If no profile image, set to default
            resetProfileImages();
        }
    }

    // ==================== AUTHENTICATION ====================
    elements.btnCreateAccount.addEventListener('click', createAccount);
    elements.btnLogin.addEventListener('click', login);

    function createAccount() {
        const name = elements.inputAccountName.value.trim();
        const phone = elements.inputAccountPhone.value.trim();
        
        if (!name || !phone) {
            showToast('Name and phone number are required', 'error');
            return;
        }
        
        // Validate phone number (Indian format)
        const phoneRegex = /^\+?91[6-9]\d{9}$|^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length === 10 ? '+91' + cleanPhone : 
                         cleanPhone.startsWith('91') ? '+' + cleanPhone : 
                         cleanPhone.startsWith('+91') ? cleanPhone : '+91' + cleanPhone;
        
        if (!phoneRegex.test(fullPhone.replace('+', ''))) {
            showToast('Please enter a valid Indian phone number', 'error');
            return;
        }
        
        // Check if user already exists
        let users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.phone === fullPhone)) {
            showToast('Account with this phone number already exists', 'error');
            return;
        }
        
        // Create new user - FIXED: Always use default image for new users
        const newUser = {
            id: generateId('user_'),
            name: name,
            phone: fullPhone,
            email: '',
            profileImage: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTAgMTcuMDJjLTMuMzMzIDAtNi4yOC0xLjc5LTgtNi4wMiAyLjA1LTMuMTYgNS4yOC00IDgtNHM1Ljk1Ljg0IDggNGMtMS43MiA0LjMxLTQuNjcgNi4wMi04IDYuMDJ6Ii8+PC9zdmc+",
            createdAt: new Date().toISOString(),
            groupsCreated: 0,
            totalSpent: 0
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto login the new user
        state.currentUser = newUser;
        
        // Clear form
        elements.inputAccountName.value = '';
        elements.inputAccountPhone.value = '';
        // Reset to default profile image
        resetProfileImages();
        
        showToast('Account created successfully!', 'success');
        updateUI();
        showApp();
        saveState();
    }

    function login() {
        const phoneInput = elements.inputLoginPhone.value.trim();
        
        if (!phoneInput) {
            showToast('Phone number is required', 'error');
            return;
        }
        
        // Clean and format phone number
        const cleanPhone = phoneInput.replace(/\D/g, '');
        const fullPhone = cleanPhone.length === 10 ? '+91' + cleanPhone : 
                         cleanPhone.startsWith('91') ? '+' + cleanPhone : 
                         cleanPhone.startsWith('+91') ? phoneInput : '+91' + cleanPhone;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.phone === fullPhone);
        
        if (!user) {
            showToast('Account not found. Please create an account first.', 'error');
            return;
        }
        
        state.currentUser = user;
        elements.inputLoginPhone.value = '';
        
        updateUI();
        updateProfileImages();
        showApp();
        showToast(`Welcome back, ${user.name}!`, 'success');
        saveState();
    }

    // ==================== PROFILE MANAGEMENT ====================
    function updateProfilePage() {
        if (!state.currentUser) return;
        
        elements.profileNameInput.value = state.currentUser.name || '';
        elements.profilePhoneInput.value = state.currentUser.phone || '';
        elements.profileEmail.value = state.currentUser.email || '';
        elements.groupsCreated.textContent = state.currentUser.groupsCreated || 0;
        elements.totalSpent.textContent = formatCurrency(state.currentUser.totalSpent || 0);
        
        // Set profile image if exists
        if (state.currentUser.profileImage) {
            elements.profilePageImage.src = state.currentUser.profileImage;
        } else {
            // Set to default if no image
            elements.profilePageImage.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTAgMTcuMDJjLTMuMzMzIDAtNi4yOC0xLjc5LTgtNi4wMiAyLjA1LTMuMTYgNS4yOC00IDgtNHM1Ljk1Ljg0IDggNGMtMS43MiA0LjMxLTQuNjcgNi4wMi04IDYuMDJ6Ii8+PC9zdmc+";
        }
    }

    // Update profile
    elements.btnUpdateProfile.addEventListener('click', () => {
        const name = elements.profileNameInput.value.trim();
        const phone = elements.profilePhoneInput.value.trim();
        const email = elements.profileEmail.value.trim();
        
        if (!name || !phone) {
            showToast('Name and phone number are required', 'error');
            return;
        }
        
        // Validate phone number
        const phoneRegex = /^\+?91[6-9]\d{9}$|^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length === 10 ? '+91' + cleanPhone : 
                         cleanPhone.startsWith('91') ? '+' + cleanPhone : 
                         cleanPhone.startsWith('+91') ? phone : '+91' + cleanPhone;
        
        if (!phoneRegex.test(fullPhone.replace('+', ''))) {
            showToast('Please enter a valid Indian phone number', 'error');
            return;
        }
        
        // Update in state
        state.currentUser.name = name;
        state.currentUser.phone = fullPhone;
        state.currentUser.email = email;
        
        // Update in users database
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === state.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = state.currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Update UI
        updateUI();
        updateProfileImages();
        showToast('Profile updated successfully!', 'success');
        saveState();
    });

    // Logout - FIXED: Properly reset profile images
    elements.btnLogout.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            // Save current user's data before logout
            if (state.currentUser && state.currentUser.id) {
                let users = JSON.parse(localStorage.getItem('users')) || [];
                const userIndex = users.findIndex(u => u.id === state.currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex] = state.currentUser;
                    localStorage.setItem('users', JSON.stringify(users));
                }
            }
            
            // Clear state
            state.currentUser = null;
            state.group = null;
            state.members = [];
            state.transactions = [];
            state.expenses = [];
            state.pendingInvites = [];
            state.pendingApprovals = [];
            state.sidebarVisible = window.innerWidth > 1024;
            
            // Reset profile images
            resetProfileImages();
            
            saveState();
            hideApp();
            showToast('You have been logged out', 'info');
        }
    });

    // ==================== GROUP MANAGEMENT ====================
    elements.inputMemberCount.addEventListener('input', renderDynamicMemberFields);
    elements.btnCreateGroup.addEventListener('click', createGroup);

    function renderDynamicMemberFields() {
        const count = parseInt(elements.inputMemberCount.value) || 0;
        const maxMembers = 20;
        
        if (count > maxMembers) {
            elements.inputMemberCount.value = maxMembers;
            showToast(`Maximum ${maxMembers} members allowed`, 'warning');
            return;
        }
        
        elements.dynamicMembersArea.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>Member ${i + 1} Details</label>
                <div class="input-with-icon">
                    <i class="fas fa-user"></i>
                    <input type="text" class="member-name" placeholder="Full Name" />
                </div>
                <div class="input-with-icon" style="margin-top: 8px;">
                    <i class="fas fa-phone"></i>
                    <input type="tel" class="member-phone" placeholder="Phone Number" />
                </div>
            `;
            elements.dynamicMembersArea.appendChild(div);
        }
    }

    function createGroup() {
        if (!state.currentUser) {
            showToast('Please login first', 'error');
            return;
        }
        
        const name = elements.inputGroupName.value.trim();
        if (!name) {
            showToast('Group name is required', 'error');
            return;
        }
        
        // Create group
        state.group = {
            id: generateId('group_'),
            name: name,
            hostId: state.currentUser.id,
            hostName: state.currentUser.name,
            wallet: 0,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        // Initialize members with host
        state.members = [{
            id: state.currentUser.id,
            name: state.currentUser.name,
            phone: state.currentUser.phone,
            contribution: 0,
            role: 'host',
            joinedAt: new Date().toISOString()
        }];
        
        // Get invited members
        state.pendingInvites = [];
        const nameInputs = elements.dynamicMembersArea.querySelectorAll('.member-name');
        const phoneInputs = elements.dynamicMembersArea.querySelectorAll('.member-phone');
        
        for (let i = 0; i < nameInputs.length; i++) {
            const name = nameInputs[i].value.trim();
            const phone = phoneInputs[i] ? phoneInputs[i].value.trim() : '';
            
            if (name) {
                state.pendingInvites.push({
                    id: generateId('invite_'),
                    name: name,
                    phone: phone,
                    invitedBy: state.currentUser.id,
                    invitedAt: new Date().toISOString(),
                    status: 'pending'
                });
            }
        }
        
        // Initialize empty arrays
        state.transactions = [];
        state.expenses = [];
        state.pendingApprovals = [];
        
        // Update user stats
        state.currentUser.groupsCreated = (state.currentUser.groupsCreated || 0) + 1;
        
        // Clear form
        elements.inputGroupName.value = '';
        elements.inputMemberCount.value = '';
        elements.dynamicMembersArea.innerHTML = '';
        
        // Update UI
        updateUI();
        renderTransactions();
        updateReports();
        showToast(`Group "${name}" created successfully!`, 'success');
        saveState();
        showPage('home-page');
    }

    // ==================== MEMBERS MANAGEMENT ====================
    function renderPendingInvites() {
        if (!elements.pendingInvitesList) return;
        
        if (!state.group || state.pendingInvites.length === 0) {
            elements.pendingInvitesList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-envelope-open-text"></i>
                    <p>No pending invitations</p>
                </li>
            `;
            return;
        }
        
        elements.pendingInvitesList.innerHTML = state.pendingInvites.map(invite => `
            <li>
                <div class="member-info">
                    <div class="member-avatar">${invite.name.charAt(0).toUpperCase()}</div>
                    <div class="member-details">
                        <h4>${invite.name}</h4>
                        <p>${invite.phone || 'Phone not provided'}</p>
                        <p><small>Invited ${formatDate(invite.invitedAt)}</small></p>
                    </div>
                </div>
                <div class="member-actions">
                    <button class="btn-small success" onclick="acceptInvite('${invite.id}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn-small danger" onclick="rejectInvite('${invite.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </li>
        `).join('');
    }

    function renderMembers() {
        if (!elements.membersList) return;
        
        if (!state.group || state.members.length === 0) {
            elements.membersList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No members yet</p>
                </li>
            `;
            return;
        }
        
        elements.membersList.innerHTML = state.members.map(member => `
            <li>
                <div class="member-info">
                    <div class="member-avatar ${member.role === 'host' ? 'host' : ''}">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="member-details">
                        <h4>${member.name} ${member.role === 'host' ? '<span class="badge">Host</span>' : ''}</h4>
                        <p>Contributed: ${formatCurrency(member.contribution || 0)}</p>
                        ${member.phone ? `<p>${member.phone}</p>` : ''}
                    </div>
                </div>
                <div class="member-actions">
                    <button class="btn-small primary" onclick="addMemberContribution('${member.id}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </li>
        `).join('');
    }

    // Send invitation
    elements.btnSendInvite.addEventListener('click', () => {
        const name = elements.inviteName.value.trim();
        const phone = elements.invitePhone.value.trim();
        
        if (!name) {
            showToast('Member name is required', 'error');
            return;
        }
        
        if (!state.group) {
            showToast('Please create a group first', 'error');
            return;
        }
        
        // Check if member already exists
        if (state.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
            showToast('Member already exists in the group', 'error');
            return;
        }
        
        if (state.pendingInvites.some(i => i.name.toLowerCase() === name.toLowerCase())) {
            showToast('Invitation already sent to this person', 'error');
            return;
        }
        
        const invite = {
            id: generateId('invite_'),
            name: name,
            phone: phone,
            invitedBy: state.currentUser.id,
            invitedAt: new Date().toISOString(),
            status: 'pending'
        };
        
        state.pendingInvites.push(invite);
        
        // Clear form
        elements.inviteName.value = '';
        elements.invitePhone.value = '';
        
        renderPendingInvites();
        showToast(`Invitation sent to ${name}`, 'success');
        saveState();
    });

    // Accept/Reject invites (global functions for inline onclick)
    window.acceptInvite = function(inviteId) {
        const invite = state.pendingInvites.find(i => i.id === inviteId);
        if (!invite) return;
        
        const amount = parseFloat(prompt(`Accept ${invite.name}. Enter initial contribution amount (₹):`, '0')) || 0;
        
        if (amount < 0) {
            showToast('Amount cannot be negative', 'error');
            return;
        }
        
        const member = {
            id: generateId('member_'),
            name: invite.name,
            phone: invite.phone,
            contribution: amount,
            role: 'member',
            joinedAt: new Date().toISOString()
        };
        
        state.members.push(member);
        state.pendingInvites = state.pendingInvites.filter(i => i.id !== inviteId);
        
        if (amount > 0) {
            state.group.wallet += amount;
            addTransaction({
                title: `${invite.name} joined & contributed`,
                amount: amount,
                type: 'contribution',
                memberId: member.id,
                memberName: invite.name
            });
        }
        
        renderPendingInvites();
        renderMembers();
        updateUI();
        showToast(`${invite.name} added to group`, 'success');
        saveState();
    };

    window.rejectInvite = function(inviteId) {
        const invite = state.pendingInvites.find(i => i.id === inviteId);
        if (!invite) return;
        
        if (confirm(`Reject invitation for ${invite.name}?`)) {
            state.pendingInvites = state.pendingInvites.filter(i => i.id !== inviteId);
            renderPendingInvites();
            showToast('Invitation rejected', 'info');
            saveState();
        }
    };

    // Add contribution from member
    window.addMemberContribution = function(memberId) {
        const member = state.members.find(m => m.id === memberId);
        if (!member) return;
        
        const amount = parseFloat(prompt(`Add contribution for ${member.name} (₹):`, '0')) || 0;
        if (amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        
        member.contribution = (member.contribution || 0) + amount;
        state.group.wallet += amount;
        
        addTransaction({
            title: `${member.name} contributed`,
            amount: amount,
            type: 'contribution',
            memberId: member.id,
            memberName: member.name
        });
        
        renderMembers();
        updateUI();
        showToast(`Added ${formatCurrency(amount)} from ${member.name}`, 'success');
        saveState();
    };

    // Add contribution via form
    function populateContribNameSelect() {
        if (!elements.contribName) return;
        
        elements.contribName.innerHTML = '<option value="">Select a member</option>';
        state.members.forEach(member => {
            if (member.role !== 'host') { // Don't show host for contributions
                elements.contribName.appendChild(new Option(member.name, member.id));
            }
        });
    }

    elements.btnAddContribution.addEventListener('click', () => {
        const memberId = elements.contribName.value;
        const amount = parseFloat(elements.contribAmount.value);
        
        if (!memberId || isNaN(amount) || amount <= 0) {
            showToast('Please select a member and enter valid amount', 'error');
            return;
        }
        
        const member = state.members.find(m => m.id === memberId);
        if (!member) {
            showToast('Member not found', 'error');
            return;
        }
        
        member.contribution = (member.contribution || 0) + amount;
        state.group.wallet += amount;
        
        addTransaction({
            title: `${member.name} contributed`,
            amount: amount,
            type: 'contribution',
            memberId: member.id,
            memberName: member.name
        });
        
        // Clear form
        elements.contribName.value = '';
        elements.contribAmount.value = '';
        
        renderMembers();
        updateUI();
        showToast(`Added ${formatCurrency(amount)} from ${member.name}`, 'success');
        saveState();
    });

    // ==================== TRANSACTIONS ====================
    function addTransaction(data) {
        const transaction = {
            id: generateId('txn_'),
            title: data.title,
            amount: data.amount,
            type: data.type, // 'contribution' or 'expense'
            payerId: data.payerId,
            payerName: data.payerName,
            category: data.category,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        state.transactions.unshift(transaction);
        
        // Update user stats if it's an expense
        if (data.type === 'expense' && state.currentUser) {
            state.currentUser.totalSpent = (state.currentUser.totalSpent || 0) + data.amount;
        }
        
        renderTransactions();
        updateUI();
    }

    function renderTransactions() {
        if (!elements.transactionsList) return;
        
        if (!state.group || state.transactions.length === 0) {
            elements.transactionsList.innerHTML = `
                <li class="transaction-empty">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions yet.</p>
                    <small>Start by creating a group or making a payment</small>
                </li>
            `;
            return;
        }
        
        const recentTransactions = state.transactions.slice(0, 10);
        
        elements.transactionsList.innerHTML = recentTransactions.map(txn => `
            <li class="transaction-item">
                <div class="transaction-icon ${txn.type}">
                    <i class="fas fa-${txn.type === 'contribution' ? 'arrow-down' : 'arrow-up'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${txn.title}</div>
                    <div class="transaction-meta">
                        <span class="transaction-category">${txn.category || txn.type}</span>
                        <span class="transaction-payer">${txn.payerName ? `by ${txn.payerName}` : ''}</span>
                        <span class="transaction-date">${formatDate(txn.timestamp)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${txn.type}">
                    ${txn.type === 'contribution' ? '+' : '-'}${formatCurrency(txn.amount)}
                </div>
            </li>
        `).join('');
        
        elements.transactionsCount.textContent = state.transactions.length;
    }

    // Refresh transactions button
    if (elements.refreshTransactions) {
        elements.refreshTransactions.addEventListener('click', () => {
            renderTransactions();
            showToast('Transactions refreshed', 'info');
        });
    }

    // ==================== PAYMENTS & EXPENSES ====================
    function populatePayerSelect() {
        if (!elements.selectPayer) return;
        
        elements.selectPayer.innerHTML = '<option value="">Select payer</option>';
        if (!state.group || state.members.length === 0) return;
        
        state.members.forEach(member => {
            elements.selectPayer.appendChild(new Option(
                `${member.name}${member.role === 'host' ? ' (Host)' : ''}`,
                member.id
            ));
        });
    }

    elements.btnPay.addEventListener('click', () => {
        if (!state.group) {
            showToast('Please create or join a group first', 'error');
            return;
        }
        
        if (state.group.hostId !== state.currentUser.id) {
            showToast('Only the host can make payments', 'error');
            return;
        }
        
        const title = elements.inputExpenseTitle.value.trim();
        const amount = parseFloat(elements.inputExpenseAmount.value);
        const payerId = elements.selectPayer.value;
        const category = elements.expenseCategory.value;
        
        if (!title || isNaN(amount) || amount <= 0 || !payerId) {
            showToast('Please fill all required fields correctly', 'error');
            return;
        }
        
        if (amount > state.group.wallet) {
            showToast('Insufficient wallet balance', 'error');
            return;
        }
        
        const payer = state.members.find(m => m.id === payerId);
        if (!payer) {
            showToast('Selected payer not found', 'error');
            return;
        }
        
        // Create expense for consensus
        currentExpenseForApproval = {
            id: generateId('expense_'),
            title: title,
            amount: amount,
            payerId: payerId,
            payerName: payer.name,
            category: category,
            createdBy: state.currentUser.id,
            createdAt: new Date().toISOString(),
            status: 'pending',
            approvals: [],
            rejections: []
        };
        
        // Show consensus modal
        elements.modalTitle.textContent = `Approve: ${title}`;
        elements.modalDesc.textContent = `Amount: ${formatCurrency(amount)} — Paid by: ${payer.name} — Category: ${category}`;
        
        // Create approvers list (all members except payer)
        const approversHtml = state.members
            .filter(member => member.id !== payerId)
            .map(member => `
                <div class="approver-item">
                    <input type="checkbox" id="approve_${member.id}" data-id="${member.id}">
                    <label for="approve_${member.id}">${member.name}${member.role === 'host' ? ' (Host)' : ''}</label>
                </div>
            `).join('');
        
        elements.approversList.innerHTML = approversHtml;
        
        elements.consensusModal.classList.remove('hidden');
        
        // Clear form
        elements.inputExpenseTitle.value = '';
        elements.inputExpenseAmount.value = '';
        elements.selectPayer.selectedIndex = 0;
    });

    // Finalize expense approval - FIXED: ALL members must approve
    elements.btnFinalize.addEventListener('click', () => {
        if (!currentExpenseForApproval) return;
        
        // Get selected approvers
        const checkboxes = elements.approversList.querySelectorAll('input[type="checkbox"]');
        const checkedCheckboxes = elements.approversList.querySelectorAll('input[type="checkbox"]:checked');
        const approvedIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.id);
        
        // Calculate total members who need to approve (all members except payer)
        const membersExcludingPayer = state.members.filter(m => m.id !== currentExpenseForApproval.payerId);
        const totalRequired = membersExcludingPayer.length;
        
        // FIX: REQUIRE ALL MEMBERS TO APPROVE (100% approval required)
        if (approvedIds.length !== totalRequired) {
            showToast(`ALL members must approve (${approvedIds.length}/${totalRequired} approved)`, 'error');
            return;
        }
        
        // Process the expense
        currentExpenseForApproval.status = 'approved';
        currentExpenseForApproval.approvals = approvedIds;
        currentExpenseForApproval.approvedAt = new Date().toISOString();
        
        // Deduct from wallet
        state.group.wallet -= currentExpenseForApproval.amount;
        
        // Add to expenses list
        state.expenses.push(currentExpenseForApproval);
        
        // Add transaction
        addTransaction({
            title: currentExpenseForApproval.title,
            amount: currentExpenseForApproval.amount,
            type: 'expense',
            payerId: currentExpenseForApproval.payerId,
            payerName: currentExpenseForApproval.payerName,
            category: currentExpenseForApproval.category
        });
        
        // Close modal
        elements.consensusModal.classList.add('hidden');
        currentExpenseForApproval = null;
        
        showToast('Expense approved by ALL members and processed successfully!', 'success');
        saveState();
        
        // Update recent expenses if on pay page
        if (document.getElementById('pay-page').classList.contains('active')) {
            renderRecentExpenses();
        }
    });

    // Cancel expense approval
    elements.btnCancelModal.addEventListener('click', () => {
        elements.consensusModal.classList.add('hidden');
        currentExpenseForApproval = null;
        showToast('Expense submission cancelled', 'info');
    });

    elements.closeConsensusModal.addEventListener('click', () => {
        elements.consensusModal.classList.add('hidden');
        currentExpenseForApproval = null;
        showToast('Expense submission cancelled', 'info');
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target === elements.consensusModal) {
            elements.consensusModal.classList.add('hidden');
            currentExpenseForApproval = null;
            showToast('Expense submission cancelled', 'info');
        }
        if (e.target === elements.settleModal) {
            elements.settleModal.classList.add('hidden');
        }
    });

    function renderRecentExpenses() {
        if (!elements.recentExpensesList) return;
        
        const recentExpenses = state.expenses.slice(0, 5);
        
        if (recentExpenses.length === 0) {
            elements.recentExpensesList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses yet</p>
                </li>
            `;
            return;
        }
        
        elements.recentExpensesList.innerHTML = recentExpenses.map(expense => `
            <li class="transaction-item">
                <div class="transaction-icon expense">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${expense.title}</div>
                    <div class="transaction-meta">
                        <span class="transaction-category">${expense.category}</span>
                        <span class="transaction-payer">by ${expense.payerName}</span>
                        <span class="transaction-date">${formatDate(expense.createdAt)}</span>
                    </div>
                </div>
                <div class="transaction-amount expense">
                    -${formatCurrency(expense.amount)}
                </div>
            </li>
        `).join('');
    }

    // ==================== PENDING APPROVALS ====================
    function updatePendingApprovals() {
        if (!state.group || state.pendingApprovals.length === 0) {
            elements.pendingApprovalsCard.style.display = 'none';
            return;
        }
        
        elements.pendingApprovalsCard.style.display = 'block';
        elements.pendingApprovalsList.innerHTML = state.pendingApprovals.map(expense => `
            <div class="approval-item">
                <div class="approval-header">
                    <h5>${expense.title}</h5>
                    <span class="approval-amount">${formatCurrency(expense.amount)}</span>
                </div>
                <div class="approval-details">
                    <p>Paid by: ${expense.payerName}</p>
                    <p>Category: ${expense.category}</p>
                    <div class="approval-actions">
                        <button class="btn-small success" onclick="approvePendingExpense('${expense.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-small danger" onclick="rejectPendingExpense('${expense.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.approvePendingExpense = function(expenseId) {
        const expense = state.pendingApprovals.find(e => e.id === expenseId);
        if (!expense) return;
        
        if (!expense.approvals) expense.approvals = [];
        expense.approvals.push(state.currentUser.id);
        
        // Check if ALL members have approved (except payer)
        const membersExcludingPayer = state.members.filter(m => m.id !== expense.payerId);
        const totalRequired = membersExcludingPayer.length;
        
        // FIX: REQUIRE ALL MEMBERS TO APPROVE
        if (expense.approvals.length >= totalRequired) {
            finalizePendingExpense(expenseId, true);
        } else {
            const remaining = totalRequired - expense.approvals.length;
            showToast(`Approval recorded. Need ${remaining} more approval${remaining > 1 ? 's' : ''}.`, 'info');
            saveState();
        }
        
        updatePendingApprovals();
    };

    window.rejectPendingExpense = function(expenseId) {
        const expense = state.pendingApprovals.find(e => e.id === expenseId);
        if (!expense) return;
        
        if (confirm('Reject this expense?')) {
            finalizePendingExpense(expenseId, false);
        }
    };

    function finalizePendingExpense(expenseId, approved) {
        const expenseIndex = state.pendingApprovals.findIndex(e => e.id === expenseId);
        if (expenseIndex === -1) return;
        
        const expense = state.pendingApprovals[expenseIndex];
        
        if (approved) {
            // Check if ALL members have approved
            const membersExcludingPayer = state.members.filter(m => m.id !== expense.payerId);
            const totalRequired = membersExcludingPayer.length;
            
            if (expense.approvals.length !== totalRequired) {
                showToast(`Still need ${totalRequired - expense.approvals.length} more approvals`, 'warning');
                return;
            }
            
            // Deduct from wallet
            state.group.wallet -= expense.amount;
            
            // Add to expenses
            expense.status = 'approved';
            expense.approvedAt = new Date().toISOString();
            state.expenses.push(expense);
            
            // Add transaction
            addTransaction({
                title: expense.title,
                amount: expense.amount,
                type: 'expense',
                payerId: expense.payerId,
                payerName: expense.payerName,
                category: expense.category
            });
            
            showToast('Expense approved by ALL members and processed!', 'success');
        } else {
            expense.status = 'rejected';
            expense.rejectedAt = new Date().toISOString();
            showToast('Expense rejected', 'warning');
        }
        
        // Remove from pending approvals
        state.pendingApprovals.splice(expenseIndex, 1);
        
        updateUI();
        updatePendingApprovals();
        saveState();
    }

    // ==================== REPORTS & ANALYTICS ====================
    function updateReports() {
        if (!state.group) {
            elements.reportBody.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>No data yet. Reports will appear after transactions.</p>
                    <small>Create a group and start adding expenses</small>
                </div>
            `;
            return;
        }
        
        // Calculate totals
        const totalContributions = state.members.reduce((sum, m) => sum + (m.contribution || 0), 0);
        const totalExpenses = state.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const balance = totalContributions - totalExpenses;
        
        // Update summary
        elements.totalContributions.textContent = formatCurrency(totalContributions);
        elements.totalExpenses.textContent = formatCurrency(totalExpenses);
        
        // Update detailed report
        elements.reportBody.innerHTML = `
            <div class="report-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Contributions</span>
                    <span class="summary-value positive">${formatCurrency(totalContributions)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Expenses</span>
                    <span class="summary-value negative">${formatCurrency(totalExpenses)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Current Balance</span>
                    <span class="summary-value ${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Group Members</span>
                    <span class="summary-value">${state.members.length}</span>
                </div>
            </div>
            
            <div class="member-breakdown">
                <h5>Member Contributions</h5>
                ${state.members.map(member => `
                    <div class="member-row">
                        <span class="member-name">${member.name} ${member.role === 'host' ? '(Host)' : ''}</span>
                        <span class="member-amount ${member.contribution > 0 ? 'positive' : ''}">${formatCurrency(member.contribution || 0)}</span>
                    </div>
                `).join('')}
            </div>
            
            ${state.expenses.length > 0 ? `
            <div class="expense-breakdown">
                <h5>Recent Expenses</h5>
                ${state.expenses.slice(0, 5).map(expense => `
                    <div class="expense-row">
                        <span class="expense-title">${expense.title}</span>
                        <span class="expense-amount negative">${formatCurrency(expense.amount)}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        `;
        
        // Update charts
        updateCharts();
    }

    function updateCharts() {
        if (!elements.expenseChartCanvas || !elements.contributionChartCanvas) return;
        
        // Destroy existing charts if they exist
        if (expenseChart) expenseChart.destroy();
        if (contributionChart) contributionChart.destroy();
        
        // Expense Chart
        const expenseCtx = elements.expenseChartCanvas.getContext('2d');
        
        // Group expenses by category
        const expenseByCategory = {};
        state.expenses.forEach(expense => {
            const category = expense.category || 'other';
            expenseByCategory[category] = (expenseByCategory[category] || 0) + expense.amount;
        });
        
        const expenseData = {
            labels: Object.keys(expenseByCategory),
            datasets: [{
                data: Object.values(expenseByCategory),
                backgroundColor: [
                    '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'
                ],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }]
        };
        
        expenseChart = new Chart(expenseCtx, {
            type: 'doughnut',
            data: expenseData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        
        // Contribution Chart
        const contributionCtx = elements.contributionChartCanvas.getContext('2d');
        
        const contributionData = {
            labels: state.members.map(m => m.name),
            datasets: [{
                label: 'Contributions',
                data: state.members.map(m => m.contribution || 0),
                backgroundColor: state.members.map((m, i) => 
                    i === 0 ? '#7c3aed' : '#06b6d4'
                ),
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }]
        };
        
        contributionChart = new Chart(contributionCtx, {
            type: 'bar',
            data: contributionData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-secondary')
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Export report
    elements.btnExportReport.addEventListener('click', () => {
        if (!state.group) {
            showToast('No data to export', 'error');
            return;
        }
        
        const reportData = {
            group: state.group,
            members: state.members,
            transactions: state.transactions,
            expenses: state.expenses,
            generatedAt: new Date().toISOString(),
            summary: {
                totalContributions: state.members.reduce((sum, m) => sum + (m.contribution || 0), 0),
                totalExpenses: state.expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                balance: state.group.wallet
            }
        };
        
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `travel-pay-report-${state.group.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Report exported successfully', 'success');
    });

    // ==================== SETTLEMENT ====================
    elements.btnEndTrip.addEventListener('click', () => {
        if (!state.group) {
            showToast('No active group', 'error');
            return;
        }
        
        if (state.group.hostId !== state.currentUser.id) {
            showToast('Only the host can end the trip', 'error');
            return;
        }
        
        if (state.pendingApprovals.length > 0) {
            showToast('Please resolve all pending approvals first', 'warning');
            return;
        }
        
        calculateSettlement();
    });

    function calculateSettlement() {
        const totalContributions = state.members.reduce((sum, m) => sum + (m.contribution || 0), 0);
        const totalExpenses = state.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const remainingBalance = totalContributions - totalExpenses;
        
        let settlementHTML = `
            <div class="settlement-summary">
                <h5>Trip Settlement Summary</h5>
                <div class="summary-row">
                    <span>Total Contributions:</span>
                    <span class="positive">${formatCurrency(totalContributions)}</span>
                </div>
                <div class="summary-row">
                    <span>Total Expenses:</span>
                    <span class="negative">${formatCurrency(totalExpenses)}</span>
                </div>
                <div class="summary-row">
                    <span>Remaining Balance:</span>
                    <span class="${remainingBalance >= 0 ? 'positive' : 'negative'}">${formatCurrency(remainingBalance)}</span>
                </div>
            </div>
        `;
        
        if (remainingBalance > 0 && totalContributions > 0) {
            settlementHTML += `
                <div class="refund-section">
                    <h5>Refund Distribution</h5>
                    ${state.members.map(member => {
                        if (member.contribution > 0) {
                            const share = (member.contribution / totalContributions) * remainingBalance;
                            return `
                                <div class="refund-row">
                                    <span>${member.name}:</span>
                                    <span class="positive">${formatCurrency(share)}</span>
                                </div>
                            `;
                        }
                        return '';
                    }).join('')}
                </div>
            `;
        } else if (remainingBalance < 0) {
            settlementHTML += `
                <div class="warning-section">
                    <p><i class="fas fa-exclamation-triangle"></i> The group has overspent by ${formatCurrency(-remainingBalance)}</p>
                    <p>Additional contributions may be needed from members.</p>
                </div>
            `;
        } else {
            settlementHTML += `
                <div class="success-section">
                    <p><i class="fas fa-check-circle"></i> Perfect settlement! All funds have been spent exactly.</p>
                    <p>No refunds needed.</p>
                </div>
            `;
        }
        
        elements.settlementBody.innerHTML = settlementHTML;
        elements.settleModal.classList.remove('hidden');
    }

    // Close settlement modal
    elements.btnCloseSettle.addEventListener('click', () => {
        elements.settleModal.classList.add('hidden');
    });

    elements.closeSettleModal.addEventListener('click', () => {
        elements.settleModal.classList.add('hidden');
    });

    // Print settlement
    elements.btnPrintSettlement.addEventListener('click', () => {
        window.print();
    });

    // ==================== UI UPDATES ====================
    function updateUI() {
        // Update user info
        if (state.currentUser) {
            if (elements.drawerHostName) {
                elements.drawerHostName.textContent = state.currentUser.name;
            }
            updateProfileImages();
        } else {
            if (elements.drawerHostName) {
                elements.drawerHostName.textContent = 'Traveler';
            }
        }
        
        // Update group info
        if (state.group) {
            if (elements.currentBalance) {
                elements.currentBalance.textContent = state.group.wallet.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
            if (elements.groupNameDisplay) {
                elements.groupNameDisplay.textContent = state.group.name;
            }
            if (elements.membersCount) {
                elements.membersCount.textContent = state.members.length;
            }
            if (elements.walletStatusText) {
                elements.walletStatusText.textContent = state.group.status === 'active' ? 'Active' : 'Ended';
                const statusIcon = elements.walletStatus.querySelector('i');
                if (statusIcon) {
                    statusIcon.style.color = state.group.status === 'active' ? '#10b981' : '#ef4444';
                }
            }
            
            // Show/hide end trip button for host
            if (elements.btnEndTrip) {
                elements.btnEndTrip.style.display = 
                    state.group.hostId === state.currentUser?.id ? 'block' : 'none';
            }
        } else {
            if (elements.currentBalance) {
                elements.currentBalance.textContent = '0.00';
            }
            if (elements.groupNameDisplay) {
                elements.groupNameDisplay.textContent = 'No active group';
            }
            if (elements.membersCount) {
                elements.membersCount.textContent = '0';
            }
            if (elements.btnEndTrip) {
                elements.btnEndTrip.style.display = 'none';
            }
        }
    }

    // ==================== HELP & SUPPORT ====================
    if (elements.helpBtn) {
        elements.helpBtn.addEventListener('click', () => {
            showToast('Help guide opened in new tab', 'info');
            const helpContent = `
                <html>
                <head><title>Travel Pay - Help Guide</title></head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1>Travel Pay - Help Guide</h1>
                    <h2>Getting Started</h2>
                    <ol>
                        <li><strong>Create Account:</strong> Sign up with your name and phone number</li>
                        <li><strong>Create Group:</strong> Start a new travel group as host</li>
                        <li><strong>Add Members:</strong> Invite friends to your group</li>
                        <li><strong>Add Contributions:</strong> Members can contribute to group wallet</li>
                        <li><strong>Make Payments:</strong> Host can make expenses that require member approval</li>
                        <li><strong>Approve Expenses:</strong> <strong>ALL MEMBERS MUST APPROVE</strong> expenses</li>
                        <li><strong>View Reports:</strong> Track expenses and contributions with charts</li>
                        <li><strong>End Trip:</strong> Host can settle and close the group</li>
                    </ol>
                    
                    <h2>Important Change</h2>
                    <p><strong>ALL MEMBERS APPROVAL REQUIRED:</strong> When making a payment, <strong>ALL group members</strong> (except the payer) must approve the expense. This ensures complete transparency and agreement on all expenses.</p>
                    
                    <h2>Features</h2>
                    <ul>
                        <li>📱 Mobile-friendly responsive design</li>
                        <li>🌙 Dark/Light mode toggle</li>
                        <li>💰 Real-time wallet balance</li>
                        <li>📊 Expense categorization</li>
                        <li>👥 Member management</li>
                        <li>✅ <strong>100% Consensus-based payments</strong></li>
                        <li>📈 Charts and analytics</li>
                        <li>💾 Local data storage</li>
                    </ul>
                    
                    <h2>Tips</h2>
                    <ul>
                        <li>Keep your phone number handy for login</li>
                        <li>Add profile picture for better identification</li>
                        <li>Use meaningful expense titles</li>
                        <li><strong>ALL members must approve every expense</strong></li>
                        <li>End trip only when all expenses are settled</li>
                        <li>Export reports for record keeping</li>
                    </ul>
                    
                    <h2>Support</h2>
                    <p>For support contact: <strong>contact@travelpay.example.com</strong></p>
                    <p>Version: 1.0.1 (Full Consensus Mode)</p>
                </body>
                </html>
            `;
            
            const win = window.open('', '_blank');
            win.document.write(helpContent);
            win.document.close();
        });
    }

    // ==================== INITIALIZATION ====================
    function init() {
        // Load saved state
        loadState();
        
        // Add demo users if none exist
        if (!localStorage.getItem('users')) {
            const demoUsers = [
                {
                    id: 'user_demo_host',
                    name: 'Manoj Kumar',
                    phone: '+919876543210',
                    email: 'manoj@example.com',
                    profileImage: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTAgMTcuMDJjLTMuMzMzIDAtNi4yOC0xLjcxLTgtNi4wMiAyLjA1LTMuMTYgNS4yOC00IDgtNHM1Ljk1Ljg0IDggNGMtMS43MiA0LjMxLTQuNjcgNi4wMi04IDYuMDJ6Ii8+PC9zdmc+",
                    createdAt: new Date().toISOString(),
                    groupsCreated: 0,
                    totalSpent: 0
                },
                {
                    id: 'user_demo_member',
                    name: 'Priya Sharma',
                    phone: '+919876543211',
                    email: 'priya@example.com',
                    profileImage: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTAgMTcuMDJjLTMuMzMzIDAtNi4yOC0xLjc5LTgtNi4wMiAyLjA1LTMuMTYgNS4yOC00IDgtNHM1Ljk1Ljg0IDggNGMtMS43MiA0LjMxLTQuNjcgNi4wMi04IDYuMDJ6Ii8+PC9zdmc+",
                    createdAt: new Date().toISOString(),
                    groupsCreated: 0,
                    totalSpent: 0
                }
            ];
            localStorage.setItem('users', JSON.stringify(demoUsers));
        }
        
        // Initialize with empty charts if no data
        if (elements.expenseChartCanvas && elements.contributionChartCanvas) {
            setTimeout(updateCharts, 100);
        }
        
        // Show appropriate page
        if (state.currentUser) {
            showApp();
        } else {
            hideApp();
        }
        
        // Add window resize listener for sidebar
        window.addEventListener('resize', updateSidebarForScreenSize);
        
        // Initialize sidebar
        updateSidebarForScreenSize();
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+H for home
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                showPage('home-page');
            }
            // Ctrl+L for logout
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                elements.btnLogout.click();
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                elements.consensusModal.classList.add('hidden');
                elements.settleModal.classList.add('hidden');
                currentExpenseForApproval = null;
            }
        });
        
        // Show welcome message if first visit
        const firstVisit = !localStorage.getItem('travelPayFirstVisit');
        if (firstVisit) {
            localStorage.setItem('travelPayFirstVisit', 'true');
            setTimeout(() => {
                showToast('Welcome to Travel Pay! <strong>ALL members must approve expenses</strong>.', 'info', 6000);
            }, 1000);
        }
    }

    // Start the application
    init();
});
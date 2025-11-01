/**
 * User management module
 */

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let searchQuery = '';
let filterGroup = '';
let groups = [];
let roles = [];

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', function() {
    loadGroups();
    loadRoles();
    loadUsers();
});

/**
 * Load groups for dropdown
 */
async function loadGroups() {
    try {
        const response = await window.apiClient.groups.list({ limit: 100, offset: 0 });
        groups = response.results || [];
        
        // Populate group filter
        const filterSelect = document.getElementById('filter-group');
        const userGroupSelect = document.getElementById('user-group');
        
        if (filterSelect) {
            // Clear existing options except the first one (placeholder)
            while (filterSelect.options.length > 1) {
                filterSelect.remove(1);
            }
            groups.forEach(group => {
                const option = new Option(group.name, group.id);
                filterSelect.add(option);
            });
        }
        
        if (userGroupSelect) {
            // Clear existing options except the first one (placeholder)
            while (userGroupSelect.options.length > 1) {
                userGroupSelect.remove(1);
            }
            groups.forEach(group => {
                const option = new Option(group.name, group.id);
                userGroupSelect.add(option);
            });
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

/**
 * Load roles for dropdown
 */
async function loadRoles() {
    try {
        const response = await window.apiClient.roles.list({ limit: 100, offset: 0 });
        roles = response.results || [];
        
        // Populate role select
        const userRoleSelect = document.getElementById('user-role-select');
        
        if (userRoleSelect) {
            // Clear existing options except the first one (placeholder)
            while (userRoleSelect.options.length > 1) {
                userRoleSelect.remove(1);
            }
            
            // Add role options
            roles.forEach(role => {
                const option = new Option(role.name, role.id);
                userRoleSelect.add(option);
            });
        }
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

/**
 * Load users from API
 */
async function loadUsers() {
    try {
        const params = {
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
        };
        
        if (searchQuery) {
            params.q = searchQuery;
        }
        
        if (filterGroup) {
            params.group_id = filterGroup;
        }
        
        const response = await window.apiClient.users.list(params);
        // Handle both response formats: ListT with count/results or items/total
        const users = response.results || response.items || response.data || [];
        const total = response.count || response.total || 0;
        
        totalPages = Math.ceil(total / pageSize);
        
        renderUsersTable(users);
        renderPagination(total);
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'danger');
        renderUsersTable([]);
    }
}

/**
 * Render users table
 */
function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    ${user.avatar ? `<img src="${user.avatar}" class="avatar avatar-sm me-2" alt="${escapeHtml(user.name)}">` : ''}
                    <span>${escapeHtml(user.name)}</span>
                </div>
            </td>
            <td>${user.email ? escapeHtml(user.email) : '-'}</td>
            <td>${user.phone ? escapeHtml(user.phone) : '-'}</td>
            <td>${user.group?.name ? escapeHtml(user.group.name) : '-'}</td>
            <td>${user.role?.name ? escapeHtml(user.role.name) : '-'}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="btn-group table-actions">
                    <button class="btn btn-sm btn-icon btn-ghost-secondary" onclick="editUser(${user.id})" title="Edit">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-ghost-danger" onclick="deleteUser(${user.id})" title="Delete">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render pagination
 */
function renderPagination(total) {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    
    document.getElementById('page-info-start').textContent = total > 0 ? start : 0;
    document.getElementById('page-info-end').textContent = end;
    document.getElementById('page-info-total').textContent = total;
    
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = '<a class="page-link" href="#" onclick="changePage(' + (currentPage - 1) + '); return false;">Previous</a>';
    pagination.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = '<a class="page-link" href="#" onclick="changePage(' + i + '); return false;">' + i + '</a>';
            pagination.appendChild(li);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(li);
        }
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = '<a class="page-link" href="#" onclick="changePage(' + (currentPage + 1) + '); return false;">Next</a>';
    pagination.appendChild(nextLi);
}

/**
 * Change page
 */
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadUsers();
}

/**
 * Handle search
 */
const handleSearch = debounce(function() {
    searchQuery = document.getElementById('search-input').value.trim();
    currentPage = 1;
    loadUsers();
}, 500);

/**
 * Open create user modal
 */
function openCreateUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add User';
    resetForm('user-form');
    document.getElementById('user-id').value = '';
    document.getElementById('user-password').required = true;
    showModal('userModal');
}

/**
 * Edit user
 */
async function editUser(userId) {
    try {
        const user = await window.apiClient.users.get(userId);
        
        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-name').value = user.name || '';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-phone').value = user.phone || '';
        document.getElementById('user-group').value = user.group_id || '';
        document.getElementById('user-role-select').value = user.role_id || '';
        document.getElementById('user-password').required = false;
        document.getElementById('user-password').value = '';
        
        showModal('userModal');
    } catch (error) {
        console.error('Error loading user:', error);
        showToast('Failed to load user details', 'danger');
    }
}

/**
 * Save user (create or update)
 */
async function saveUser() {
    console.log('=== saveUser started ===');
    const form = document.getElementById('user-form');
    
    if (!form) {
        console.error('❌ Form not found');
        alert('Error: Form not found');
        return;
    }
    console.log('✓ Form found');
    
    const userIdEl = document.getElementById('user-id');
    const userNameEl = document.getElementById('user-name');
    const groupIdEl = document.getElementById('user-group');
    const roleIdEl = document.getElementById('user-role-select');
    const passwordEl = document.getElementById('user-password');
    
    console.log('Form elements:', {
        userIdEl: !!userIdEl,
        userNameEl: !!userNameEl,
        groupIdEl: !!groupIdEl,
        roleIdEl: !!roleIdEl,
        passwordEl: !!passwordEl
    });
    
    if (!userIdEl || !userNameEl || !groupIdEl || !roleIdEl || !passwordEl) {
        console.error('❌ Some form elements not found');
        showToast('Form error: required elements not found', 'danger');
        return;
    }
    console.log('✓ All form elements found');
    
    // Debug: Check actual element values
    console.log('Raw element properties:', {
        'userNameEl.value': userNameEl.value,
        'userNameEl.getAttribute("value")': userNameEl.getAttribute('value'),
        'userNameEl.defaultValue': userNameEl.defaultValue,
        'passwordEl.value': passwordEl.value ? '***' : '(empty)'
    });
    
    // Try to get value using different methods
    const userNameFromValue = userNameEl.value;
    const userNameFromProperty = userNameEl['value'];
    const userNameFromFormData = new FormData(form).get('name');
    
    console.log('Different ways to get name:', {
        'from .value': userNameFromValue,
        'from ["value"]': userNameFromProperty,
        'from FormData': userNameFromFormData
    });
    
    // Check HTML5 validation
    console.log('Checking form validity...');
    if (!form.checkValidity()) {
        console.log('❌ Form validation failed');
        form.classList.add('was-validated');
        form.reportValidity(); // Show validation messages
        return;
    }
    console.log('✓ Form validation passed');
    
    const userId = userIdEl.value || '';
    // Use FormData as fallback since .value is undefined
    const userName = (userNameFromFormData || userNameEl.value || '').toString().trim();
    const groupId = groupIdEl.value || '';
    const roleId = roleIdEl.value || '';
    
    console.log('Extracted values:', {
        userId: userId,
        userName: userName,
        userNameLength: userName.length,
        groupId: groupId,
        roleId: roleId
    });
    
    // Additional debug
    console.log('userName after trim:', `"${userName}"`);
    console.log('userName === "":', userName === '');
    console.log('!userName:', !userName);
    
    // Validate required fields
    if (!userName) {
        console.log('❌ Name is empty');
        showToast('Name is required', 'danger');
        alert('Please fill in the Name field');
        return;
    }
    console.log('✓ Name is valid');
    
    if (!groupId) {
        console.log('❌ Group is empty');
        showToast('Group is required', 'danger');
        return;
    }
    console.log('✓ Group is valid');
    
    const emailEl = document.getElementById('user-email');
    const phoneEl = document.getElementById('user-phone');
    
    const data = {
        name: userName,
        email: (emailEl?.value || '').trim() || null,
        phone: (phoneEl?.value || '').trim() || null,
        group_id: parseInt(groupId),
        role_id: roleId ? parseInt(roleId) : null,
    };
    
    const password = passwordEl?.value || '';
    if (password) {
        data.password = password;
    }
    
    console.log('📦 Final data to send:', JSON.stringify(data, null, 2));
    
    const saveBtn = document.getElementById('save-user-btn');
    
    try {
        setButtonLoading(saveBtn, true);
        
        if (userId) {
            // Update existing user
            console.log('🔄 Updating user:', userId);
            await window.apiClient.users.update(userId, data);
            console.log('✅ User updated successfully');
            showToast('User updated successfully', 'success');
        } else {
            // Create new user
            if (!password) {
                console.log('❌ Password is empty for new user');
                showToast('Password is required for new users', 'danger');
                setButtonLoading(saveBtn, false);
                return;
            }
            console.log('➕ Creating new user...');
            const result = await window.apiClient.users.create(data);
            console.log('✅ User created successfully:', result);
            showToast('User created successfully', 'success');
        }
        
        hideModal('userModal');
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        showToast(error.message || 'Failed to save user', 'danger');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

/**
 * Delete user
 */
async function deleteUser(userId) {
    if (!confirmDialog('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        await window.apiClient.users.delete(userId);
        showToast('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast(error.message || 'Failed to delete user', 'danger');
    }
}

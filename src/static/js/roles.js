/**
 * Role management module
 */

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let searchQuery = '';

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', function() {
    loadRoles();
    
    // Auto-generate slug from name
    document.getElementById('role-name').addEventListener('input', function() {
        const slug = this.value.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        document.getElementById('role-slug').value = slug;
    });
});

/**
 * Load roles from API
 */
async function loadRoles() {
    try {
        const params = {
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
        };
        
        if (searchQuery) {
            params.q = searchQuery;
        }
        
        const response = await window.apiClient.roles.list(params);
        const roles = response.results || response.items || response.data || [];
        const total = response.count || response.total || 0;
        
        totalPages = Math.ceil(total / pageSize);
        
        renderRolesTable(roles);
        renderPagination(total);
    } catch (error) {
        console.error('Error loading roles:', error);
        showToast('Failed to load roles', 'danger');
        renderRolesTable([]);
    }
}

/**
 * Render roles table
 */
function renderRolesTable(roles) {
    const tbody = document.getElementById('roles-table-body');
    
    if (roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No roles found</td></tr>';
        return;
    }
    
    tbody.innerHTML = roles.map(role => `
        <tr>
            <td>${role.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="ti ti-shield me-2"></i>
                    <strong>${escapeHtml(role.name)}</strong>
                </div>
            </td>
            <td>
                <span class="badge badge-outline text-blue">${escapeHtml(role.slug)}</span>
            </td>
            <td>${role.description ? escapeHtml(role.description) : '-'}</td>
            <td>
                <span class="badge bg-green-lt">${role.user_count || 0} users</span>
            </td>
            <td>${formatDate(role.created_at)}</td>
            <td>
                <div class="btn-group table-actions">
                    <button class="btn btn-sm btn-icon btn-ghost-secondary" onclick="editRole(${role.id})" title="Edit">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-ghost-danger" onclick="deleteRole(${role.id})" title="Delete" ${role.slug === 'admin' ? 'disabled' : ''}>
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
    loadRoles();
}

/**
 * Handle search
 */
const handleSearch = debounce(function() {
    searchQuery = document.getElementById('search-input').value.trim();
    currentPage = 1;
    loadRoles();
}, 500);

/**
 * Open create role modal
 */
function openCreateRoleModal() {
    document.getElementById('roleModalTitle').textContent = 'Add Role';
    resetForm('role-form');
    document.getElementById('role-id').value = '';
    showModal('roleModal');
}

/**
 * Edit role
 */
async function editRole(roleId) {
    try {
        const role = await window.apiClient.roles.get(roleId);
        
        document.getElementById('roleModalTitle').textContent = 'Edit Role';
        document.getElementById('role-id').value = role.id;
        document.getElementById('role-name').value = role.name || '';
        document.getElementById('role-slug').value = role.slug || '';
        document.getElementById('role-description').value = role.description || '';
        
        showModal('roleModal');
    } catch (error) {
        console.error('Error loading role:', error);
        showToast('Failed to load role details', 'danger');
    }
}

/**
 * Save role (create or update)
 */
async function saveRole() {
    const form = document.getElementById('role-form');
    
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const roleId = document.getElementById('role-id').value;
    const slug = document.getElementById('role-slug').value;
    
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
        showToast('Slug must contain only lowercase letters, numbers, and hyphens', 'danger');
        return;
    }
    
    const data = {
        name: document.getElementById('role-name').value,
        slug: slug,
        description: document.getElementById('role-description').value || '',
    };
    
    const saveBtn = document.getElementById('save-role-btn');
    
    try {
        setButtonLoading(saveBtn, true);
        
        if (roleId) {
            // Update existing role
            await window.apiClient.roles.update(roleId, data);
            showToast('Role updated successfully', 'success');
        } else {
            // Create new role
            await window.apiClient.roles.create(data);
            showToast('Role created successfully', 'success');
        }
        
        hideModal('roleModal');
        loadRoles();
    } catch (error) {
        console.error('Error saving role:', error);
        showToast(error.message || 'Failed to save role', 'danger');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

/**
 * Delete role
 */
async function deleteRole(roleId) {
    if (!confirmDialog('Are you sure you want to delete this role? This action cannot be undone.')) {
        return;
    }
    
    try {
        await window.apiClient.roles.delete(roleId);
        showToast('Role deleted successfully', 'success');
        loadRoles();
    } catch (error) {
        console.error('Error deleting role:', error);
        showToast(error.message || 'Failed to delete role', 'danger');
    }
}

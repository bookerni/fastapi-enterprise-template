/**
 * Group management module
 */

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let searchQuery = '';
let roles = [];

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', function() {
    loadRoles();
    loadGroups();
});

/**
 * Load roles for dropdown
 */
async function loadRoles() {
    try {
        const response = await window.apiClient.roles.list({ limit: 100, offset: 0 });
        roles = response.results || response.items || response.data || [];
        
        // Populate role select
        const groupRoleSelect = document.getElementById('group-role');
        
        roles.forEach(role => {
            const option = new Option(role.name, role.id);
            groupRoleSelect.add(option);
        });
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

/**
 * Load groups from API
 */
async function loadGroups() {
    try {
        const params = {
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
        };
        
        if (searchQuery) {
            params.q = searchQuery;
        }
        
        const response = await window.apiClient.groups.list(params);
        const groups = response.results || response.items || response.data || [];
        const total = response.count || response.total || 0;
        
        totalPages = Math.ceil(total / pageSize);
        
        renderGroupsTable(groups);
        renderPagination(total);
    } catch (error) {
        console.error('Error loading groups:', error);
        showToast('Failed to load groups', 'danger');
        renderGroupsTable([]);
    }
}

/**
 * Render groups table
 */
function renderGroupsTable(groups) {
    const tbody = document.getElementById('groups-table-body');
    
    if (groups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No groups found</td></tr>';
        return;
    }
    
    tbody.innerHTML = groups.map(group => `
        <tr>
            <td>${group.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="ti ti-users me-2"></i>
                    <strong>${escapeHtml(group.name)}</strong>
                </div>
            </td>
            <td>${group.description ? escapeHtml(group.description) : '-'}</td>
            <td>${group.role?.name ? escapeHtml(group.role.name) : '-'}</td>
            <td>
                <span class="badge bg-blue-lt">${group.user_count || 0} users</span>
            </td>
            <td>${formatDate(group.created_at)}</td>
            <td>
                <div class="btn-group table-actions">
                    <button class="btn btn-sm btn-icon btn-ghost-secondary" onclick="editGroup(${group.id})" title="Edit">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-ghost-danger" onclick="deleteGroup(${group.id})" title="Delete">
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
    loadGroups();
}

/**
 * Handle search
 */
const handleSearch = debounce(function() {
    searchQuery = document.getElementById('search-input').value.trim();
    currentPage = 1;
    loadGroups();
}, 500);

/**
 * Open create group modal
 */
function openCreateGroupModal() {
    document.getElementById('groupModalTitle').textContent = 'Add Group';
    resetForm('group-form');
    document.getElementById('group-id').value = '';
    showModal('groupModal');
}

/**
 * Edit group
 */
async function editGroup(groupId) {
    try {
        const group = await window.apiClient.groups.get(groupId);
        
        document.getElementById('groupModalTitle').textContent = 'Edit Group';
        document.getElementById('group-id').value = group.id;
        document.getElementById('group-name').value = group.name || '';
        document.getElementById('group-description').value = group.description || '';
        document.getElementById('group-role').value = group.role_id || '';
        
        showModal('groupModal');
    } catch (error) {
        console.error('Error loading group:', error);
        showToast('Failed to load group details', 'danger');
    }
}

/**
 * Save group (create or update)
 */
async function saveGroup() {
    const form = document.getElementById('group-form');
    
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const groupId = document.getElementById('group-id').value;
    const data = {
        name: document.getElementById('group-name').value,
        description: document.getElementById('group-description').value || null,
        role_id: parseInt(document.getElementById('group-role').value) || null,
    };
    
    const saveBtn = document.getElementById('save-group-btn');
    
    try {
        setButtonLoading(saveBtn, true);
        
        if (groupId) {
            // Update existing group
            await window.apiClient.groups.update(groupId, data);
            showToast('Group updated successfully', 'success');
        } else {
            // Create new group
            await window.apiClient.groups.create(data);
            showToast('Group created successfully', 'success');
        }
        
        hideModal('groupModal');
        loadGroups();
    } catch (error) {
        console.error('Error saving group:', error);
        showToast(error.message || 'Failed to save group', 'danger');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

/**
 * Delete group
 */
async function deleteGroup(groupId) {
    if (!confirmDialog('Are you sure you want to delete this group? This action cannot be undone.')) {
        return;
    }
    
    try {
        await window.apiClient.groups.delete(groupId);
        showToast('Group deleted successfully', 'success');
        loadGroups();
    } catch (error) {
        console.error('Error deleting group:', error);
        showToast(error.message || 'Failed to delete group', 'danger');
    }
}

const API_BASE = 'http://localhost:3000';
let token = localStorage.getItem('token');
let currentUser = null;

// Auth
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = jwt_decode(token);
      showMain();
      showAlert('Login realizado com sucesso!', 'success');
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Registro realizado! Faça login.', 'success');
      showLogin();
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
});

document.getElementById('show-home-login').addEventListener('click', showLogin);
document.getElementById('show-home-register').addEventListener('click', showRegister);
document.getElementById('show-register').addEventListener('click', showRegister);
document.getElementById('show-login').addEventListener('click', showLogin);
document.getElementById('logout-btn').addEventListener('click', logout);

// Navigation
document.getElementById('books-btn').addEventListener('click', () => loadBooks());
document.getElementById('loans-btn').addEventListener('click', () => loadMyLoans());
document.getElementById('users-btn').addEventListener('click', () => loadUsers());
document.getElementById('all-loans-btn').addEventListener('click', () => loadAllLoans());

// Functions
function showHome() {
  document.getElementById('home-section').style.display = 'block';
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'none';
  document.getElementById('navbar-user-text').textContent = '';
}

function showLogin() {
  document.getElementById('home-section').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'none';
}

function showRegister() {
  document.getElementById('home-section').style.display = 'none';
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'block';
  document.getElementById('main-section').style.display = 'none';
}

function showMain() {
  document.getElementById('home-section').style.display = 'none';
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('navbar-user-text').textContent = currentUser?.name ? `Olá, ${currentUser.name}` : '';
  loadBooks(); // Default view
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  showHome();
  showAlert('Logout realizado!', 'info');
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.prepend(alertDiv);
  setTimeout(() => alertDiv.remove(), 5000);
}

function getErrorMessage(data) {
  return data?.message || data?.error || 'Erro desconhecido';
}

function jwt_decode(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

async function apiCall(url, options = {}) {
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

// Books
async function loadBooks(page = 1, limit = 12, filters = {}) {
  try {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.title) params.set('title', filters.title);
    if (filters.author) params.set('author', filters.author);
    if (filters.isbn) params.set('isbn', filters.isbn);
    if (filters.available !== undefined) params.set('available', filters.available);

    const res = await apiCall(`${API_BASE}/api/books?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      renderBooks(data.data, data.meta, filters);
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

function renderBooks(books, meta, currentFilters = {}) {
  const activeFiltersCount = Object.values(currentFilters).filter(value =>
    value !== undefined && value !== '' && value !== null
  ).length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-book"></i> Livros Disponíveis</h2>
      <div>
        ${activeFiltersCount > 0 ? `<span class="badge bg-info me-2">${activeFiltersCount} filtro(s) ativo(s)</span>` : ''}
        <button id="create-book-btn" class="btn btn-primary">
          <i class="bi bi-plus-circle"></i> Cadastrar Livro
        </button>
      </div>
    </div>

    <div class="filters mb-4">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="bi bi-funnel"></i> Filtros de Busca</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label for="book-keyword-filter" class="form-label">Busca Geral</label>
              <input type="text" class="form-control" id="book-keyword-filter" placeholder="Buscar em título, autor ou ISBN" value="${currentFilters.keyword || ''}">
            </div>
            <div class="col-md-2">
              <label for="book-title-filter" class="form-label">Título</label>
              <input type="text" class="form-control" id="book-title-filter" placeholder="Buscar por título" value="${currentFilters.title || ''}">
            </div>
            <div class="col-md-2">
              <label for="book-author-filter" class="form-label">Autor</label>
              <input type="text" class="form-control" id="book-author-filter" placeholder="Buscar por autor" value="${currentFilters.author || ''}">
            </div>
            <div class="col-md-2">
              <label for="book-isbn-filter" class="form-label">ISBN</label>
              <input type="text" class="form-control" id="book-isbn-filter" placeholder="Buscar por ISBN" value="${currentFilters.isbn || ''}">
            </div>
            <div class="col-md-3">
              <label for="book-available-filter" class="form-label">Disponibilidade</label>
              <select class="form-select" id="book-available-filter">
                <option value="">Todos</option>
                <option value="true" ${currentFilters.available === 'true' ? 'selected' : ''}>Disponíveis</option>
                <option value="false" ${currentFilters.available === 'false' ? 'selected' : ''}>Emprestados</option>
              </select>
            </div>
          </div>
          <div class="row g-3 mt-2">
            <div class="col-md-6">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="auto-search-toggle">
                <label class="form-check-label" for="auto-search-toggle">
                  Busca automática
                </label>
              </div>
            </div>
            <div class="col-md-6 text-end">
              <small class="text-muted">${meta.total} livro(s) encontrado(s)</small>
            </div>
          </div>
          <div class="row g-3 mt-2">
            <div class="col-md-6">
              <button id="apply-book-filters" class="btn btn-primary me-2">
                <i class="bi bi-search"></i> Buscar
              </button>
              <button id="clear-book-filters" class="btn btn-outline-secondary">
                <i class="bi bi-x-circle"></i> Limpar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <div class="row" id="books-grid">
      ${books.length > 0 ? books.map(book => `
        <div class="col-md-4 col-lg-3 mb-4">
          <div class="card book-card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${book.title}</h5>
              <h6 class="card-subtitle mb-2 text-muted">${book.author}</h6>
              <p class="card-text flex-grow-1">${book.description || 'Sem descrição'}</p>
              <div class="mt-auto">
                <span class="badge ${book.available ? 'bg-success' : 'bg-danger'} mb-2">
                  ${book.available ? 'Disponível' : 'Emprestado'}
                </span>
                <div class="btn-group w-100">
                  <button class="btn btn-outline-primary btn-sm" onclick="viewBook(${book.id})">
                    <i class="bi bi-eye"></i> Ver
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" onclick="editBook(${book.id})">
                    <i class="bi bi-pencil"></i> Editar
                  </button>
                  ${book.available ? `<button class="btn btn-outline-success btn-sm" onclick="loanBook(${book.id})">
                    <i class="bi bi-arrow-right-circle"></i> Emprestar
                  </button>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join('') : `
        <div class="col-12">
          <div class="alert alert-secondary text-center" role="alert">
            Nenhum livro encontrado. Cadastre novos livros para preencher o catálogo.
          </div>
        </div>
      `}
    </div>

    <nav aria-label="Navegação de livros">
      <ul class="pagination">
        <li class="page-item ${meta.page <= 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadBooks(${meta.page - 1})">Anterior</a>
        </li>
        <li class="page-item disabled">
          <span class="page-link">Página ${meta.page} de ${Math.ceil(meta.total / meta.limit)}</span>
        </li>
        <li class="page-item ${meta.page >= Math.ceil(meta.total / meta.limit) ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadBooks(${meta.page + 1})">Próximo</a>
        </li>
      </ul>
    </nav>
  `;

  // Busca automática
  const autoSearchToggle = document.getElementById('auto-search-toggle');
  const filterInputs = ['book-keyword-filter', 'book-title-filter', 'book-author-filter', 'book-isbn-filter', 'book-available-filter'];

  const performAutoSearch = () => {
    if (!autoSearchToggle.checked) return;

    const keyword = document.getElementById('book-keyword-filter').value.trim();
    const title = document.getElementById('book-title-filter').value.trim();
    const author = document.getElementById('book-author-filter').value.trim();
    const isbn = document.getElementById('book-isbn-filter').value.trim();
    const available = document.getElementById('book-available-filter').value;

    const filters = {};
    if (keyword) filters.keyword = keyword;
    if (title) filters.title = title;
    if (author) filters.author = author;
    if (isbn) filters.isbn = isbn;
    if (available) filters.available = available;

    loadBooks(1, 12, filters);
  };

  filterInputs.forEach(inputId => {
    const element = document.getElementById(inputId);
    element.addEventListener('input', performAutoSearch);
    element.addEventListener('change', performAutoSearch);
    element.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('apply-book-filters').click();
      }
    });
  });

  document.getElementById('apply-book-filters').addEventListener('click', () => {
    const keyword = document.getElementById('book-keyword-filter').value.trim();
    const title = document.getElementById('book-title-filter').value.trim();
    const author = document.getElementById('book-author-filter').value.trim();
    const isbn = document.getElementById('book-isbn-filter').value.trim();
    const available = document.getElementById('book-available-filter').value;

    const filters = {};
    if (keyword) filters.keyword = keyword;
    if (title) filters.title = title;
    if (author) filters.author = author;
    if (isbn) filters.isbn = isbn;
    if (available) filters.available = available;

    loadBooks(1, 12, filters);
  });

  document.getElementById('clear-book-filters').addEventListener('click', () => {
    document.getElementById('book-keyword-filter').value = '';
    document.getElementById('book-title-filter').value = '';
    document.getElementById('book-author-filter').value = '';
    document.getElementById('book-isbn-filter').value = '';
    document.getElementById('book-available-filter').value = '';
    loadBooks(1, 12, {});
  });

  document.getElementById('create-book-btn').addEventListener('click', createBookForm);
}

function createBookForm() {
  const modal = new bootstrap.Modal(document.getElementById('detailModal'));
  document.getElementById('detailModalTitle').textContent = 'Cadastrar Novo Livro';
  document.getElementById('detailModalBody').innerHTML = `
    <form id="create-book-form">
      <div class="mb-3">
        <label for="book-title" class="form-label">Título *</label>
        <input type="text" class="form-control" id="book-title" required>
      </div>
      <div class="mb-3">
        <label for="book-author" class="form-label">Autor *</label>
        <input type="text" class="form-control" id="book-author" required>
      </div>
      <div class="mb-3">
        <label for="book-isbn" class="form-label">ISBN *</label>
        <input type="text" class="form-control" id="book-isbn" required>
      </div>
      <div class="mb-3">
        <label for="book-description" class="form-label">Descrição</label>
        <textarea class="form-control" id="book-description" rows="3"></textarea>
      </div>
      <div class="mb-3">
        <label for="book-published-year" class="form-label">Ano de Publicação</label>
        <input type="number" class="form-control" id="book-published-year">
      </div>
      <div class="mb-3 form-check">
        <input type="checkbox" class="form-check-input" id="book-available" checked>
        <label class="form-check-label" for="book-available">Disponível para empréstimo</label>
      </div>
      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary">Cadastrar</button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
      </div>
    </form>
  `;
  modal.show();

  document.getElementById('create-book-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const isbn = document.getElementById('book-isbn').value;
    const description = document.getElementById('book-description').value;
    const published_year = document.getElementById('book-published-year').value;
    const available = document.getElementById('book-available').checked;

    try {
      const res = await apiCall(`${API_BASE}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, isbn, description, published_year: published_year ? Number(published_year) : undefined, available })
      });
      const data = await res.json();
      if (res.ok) {
        modal.hide();
        loadBooks();
        showAlert('Livro cadastrado com sucesso!', 'success');
      } else {
        showAlert(getErrorMessage(data), 'danger');
      }
    } catch (err) {
      showAlert('Erro: ' + err.message, 'danger');
    }
  });
}

async function viewBook(id) {
  try {
    const res = await apiCall(`${API_BASE}/api/books/${id}`);
    const book = await res.json();
    if (res.ok) {
      const modal = new bootstrap.Modal(document.getElementById('detailModal'));
      document.getElementById('detailModalTitle').textContent = book.title;
      document.getElementById('detailModalBody').innerHTML = `
        <div class="row">
          <div class="col-md-8">
            <h5>${book.author}</h5>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <p><strong>Ano:</strong> ${book.published_year || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="badge ${book.available ? 'bg-success' : 'bg-danger'}">${book.available ? 'Disponível' : 'Emprestado'}</span></p>
            <p><strong>Cadastrado por:</strong> ${book.creator_name}</p>
            <p><strong>Descrição:</strong></p>
            <p>${book.description || 'Sem descrição disponível.'}</p>
          </div>
        </div>
      `;
      modal.show();
    } else {
      showAlert(getErrorMessage(book), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

async function editBook(id) {
  try {
    const res = await apiCall(`${API_BASE}/api/books/${id}`);
    const book = await res.json();
    if (!res.ok) {
      showAlert(getErrorMessage(book), 'danger');
      return;
    }

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    document.getElementById('detailModalTitle').textContent = 'Editar Livro';
    document.getElementById('detailModalBody').innerHTML = `
      <form id="edit-book-form">
        <div class="mb-3">
          <label for="book-title" class="form-label">Título *</label>
          <input type="text" class="form-control" id="book-title" value="${book.title}" required>
        </div>
        <div class="mb-3">
          <label for="book-author" class="form-label">Autor *</label>
          <input type="text" class="form-control" id="book-author" value="${book.author}" required>
        </div>
        <div class="mb-3">
          <label for="book-isbn" class="form-label">ISBN *</label>
          <input type="text" class="form-control" id="book-isbn" value="${book.isbn}" required>
        </div>
        <div class="mb-3">
          <label for="book-description" class="form-label">Descrição</label>
          <textarea class="form-control" id="book-description" rows="3">${book.description || ''}</textarea>
        </div>
        <div class="mb-3">
          <label for="book-published-year" class="form-label">Ano de Publicação</label>
          <input type="number" class="form-control" id="book-published-year" value="${book.published_year || ''}">
        </div>
        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="book-available" ${book.available ? 'checked' : ''}>
          <label class="form-check-label" for="book-available">Disponível para empréstimo</label>
        </div>
        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-primary">Atualizar</button>
          <button type="button" class="btn btn-danger" onclick="deleteBook(${book.id})">Deletar</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        </div>
      </form>
    `;
    modal.show();

    document.getElementById('edit-book-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('book-title').value;
      const author = document.getElementById('book-author').value;
      const isbn = document.getElementById('book-isbn').value;
      const description = document.getElementById('book-description').value;
      const published_year = document.getElementById('book-published-year').value;
      const available = document.getElementById('book-available').checked;

      try {
        const res = await apiCall(`${API_BASE}/api/books/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, author, isbn, description, published_year: published_year ? Number(published_year) : undefined, available })
        });
        const data = await res.json();
        if (res.ok) {
          modal.hide();
          loadBooks();
          showAlert('Livro atualizado com sucesso!', 'success');
        } else {
          showAlert(getErrorMessage(data), 'danger');
        }
      } catch (err) {
        showAlert('Erro: ' + err.message, 'danger');
      }
    });
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

async function deleteBook(id) {
  if (!confirm('Tem certeza que deseja deletar este livro?')) return;
  try {
    const res = await apiCall(`${API_BASE}/api/books/${id}`, { method: 'DELETE' });
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
      loadBooks();
      showAlert('Livro deletado com sucesso!', 'success');
    } else {
      const data = await res.json();
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

async function loanBook(bookId) {
  const dueDate = prompt('Data de devolução (YYYY-MM-DD):', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  if (!dueDate) return;

  try {
    const res = await apiCall(`${API_BASE}/api/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId, due_date: dueDate })
    });
    const data = await res.json();
    if (res.ok) {
      loadBooks();
      showAlert('Livro emprestado com sucesso!', 'success');
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

// Loans
async function loadMyLoans(page = 1, limit = 10) {
  try {
    const res = await apiCall(`${API_BASE}/api/loans?page=${page}&limit=${limit}`);
    const data = await res.json();
    if (res.ok) {
      renderLoans(data.data, data.meta, 'Meus Empréstimos');
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

async function loadAllLoans(page = 1, limit = 10) {
  try {
    const res = await apiCall(`${API_BASE}/api/loans?page=${page}&limit=${limit}&user_id=`);
    const data = await res.json();
    if (res.ok) {
      renderLoans(data.data, data.meta, 'Todos os Empréstimos');
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

function renderLoans(loans, meta, title) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2><i class="bi bi-journal-bookmark"></i> ${title}</h2>
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Livro</th>
            <th>Autor</th>
            <th>Usuário</th>
            <th>Data Empréstimo</th>
            <th>Data Devolução</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${loans.map(loan => `
            <tr>
              <td>${loan.book_title}</td>
              <td>${loan.book_author}</td>
              <td>${loan.user_name}</td>
              <td>${new Date(loan.loan_date).toLocaleDateString()}</td>
              <td>${loan.due_date}</td>
              <td>
                <span class="loan-status ${loan.return_date ? 'returned' : 'active'}">
                  ${loan.return_date ? 'Devolvido' : 'Ativo'}
                </span>
              </td>
              <td>
                ${!loan.return_date ? `<button class="btn btn-sm btn-success" onclick="returnBook(${loan.id})">
                  <i class="bi bi-check-circle"></i> Devolver
                </button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <nav aria-label="Navegação de empréstimos">
      <ul class="pagination">
        <li class="page-item ${meta.page <= 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadMyLoans(${meta.page - 1})">Anterior</a>
        </li>
        <li class="page-item disabled">
          <span class="page-link">Página ${meta.page} de ${Math.ceil(meta.total / meta.limit)}</span>
        </li>
        <li class="page-item ${meta.page >= Math.ceil(meta.total / meta.limit) ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadMyLoans(${meta.page + 1})">Próximo</a>
        </li>
      </ul>
    </nav>
  `;
}

async function returnBook(loanId) {
  if (!confirm('Confirmar devolução do livro?')) return;
  try {
    const res = await apiCall(`${API_BASE}/api/loans/${loanId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ return_date: new Date().toISOString() })
    });
    const data = await res.json();
    if (res.ok) {
      loadMyLoans();
      showAlert('Livro devolvido com sucesso!', 'success');
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

// Users (Admin only)
async function loadUsers(page = 1, limit = 10) {
  if (currentUser.role !== 'admin') {
    showAlert('Acesso negado: apenas administradores podem gerenciar usuários', 'danger');
    return;
  }

  try {
    const res = await apiCall(`${API_BASE}/users?page=${page}&limit=${limit}`);
    const data = await res.json();
    if (res.ok) {
      renderUsers(data.data, data.meta);
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

function renderUsers(users, meta) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2><i class="bi bi-people"></i> Gerenciar Usuários</h2>
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Role</th>
            <th>Data Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td><span class="badge bg-secondary">${user.role}</span></td>
              <td>${new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewUser(${user.id})">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="editUser(${user.id})">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <nav aria-label="Navegação de usuários">
      <ul class="pagination">
        <li class="page-item ${meta.page <= 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadUsers(${meta.page - 1})">Anterior</a>
        </li>
        <li class="page-item disabled">
          <span class="page-link">Página ${meta.page} de ${Math.ceil(meta.total / meta.limit)}</span>
        </li>
        <li class="page-item ${meta.page >= Math.ceil(meta.total / meta.limit) ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadUsers(${meta.page + 1})">Próximo</a>
        </li>
      </ul>
    </nav>
  `;
}

async function viewUser(id) {
  try {
    const res = await apiCall(`${API_BASE}/users/${id}`);
    const user = await res.json();
    if (res.ok) {
      const modal = new bootstrap.Modal(document.getElementById('detailModal'));
      document.getElementById('detailModalTitle').textContent = `Usuário: ${user.name}`;
      document.getElementById('detailModalBody').innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>Data Cadastro:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
        <p><strong>Livros cadastrados:</strong> ${user.books.length}</p>
      `;
      modal.show();
    } else {
      showAlert(getErrorMessage(user), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

async function editUser(id) {
  const newName = prompt('Novo nome:');
  const newEmail = prompt('Novo email:');
  const newPassword = prompt('Nova senha (opcional):');
  if (!newName || !newEmail) return;

  try {
    const res = await apiCall(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail, password: newPassword || undefined })
    });
    const data = await res.json();
    if (res.ok) {
      loadUsers();
      showAlert('Usuário atualizado!', 'success');
    } else {
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

async function deleteUser(id) {
  if (!confirm('Deletar usuário?')) return;
  try {
    const res = await apiCall(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadUsers();
      showAlert('Usuário deletado!', 'success');
    } else {
      const data = await res.json();
      showAlert(getErrorMessage(data), 'danger');
    }
  } catch (err) {
    showAlert('Erro: ' + err.message, 'danger');
  }
}

// Init
if (token) {
  try {
    currentUser = jwt_decode(token);
    showMain();
  } catch (e) {
    localStorage.removeItem('token');
    showHome();
  }
} else {
  showHome();
}

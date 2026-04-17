const state = {
  token: localStorage.getItem('token') || '',
  bookFilters: {
    title: '',
    author: '',
    isbn: '',
    available: '',
  },
};

const sections = {
  home: document.getElementById('home-section'),
  auth: document.getElementById('auth-section'),
  register: document.getElementById('register-section'),
  main: document.getElementById('main-section'),
};

const content = document.getElementById('content');
const navbarUserText = document.getElementById('navbar-user-text');

const showSection = (name) => {
  Object.entries(sections).forEach(([key, element]) => {
    element.style.display = key === name ? '' : 'none';
  });
};

const setAlert = (message, type = 'info') => {
  content.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${message}
    </div>
  `;
};

const decodeTokenPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const updateNavbarUser = () => {
  const payload = decodeTokenPayload(state.token);
  navbarUserText.textContent = payload?.email || payload?.name || '';
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${state.token}`,
});

const extractList = (responseBody) => {
  if (Array.isArray(responseBody)) {
    return responseBody;
  }

  if (Array.isArray(responseBody?.items)) {
    return responseBody.items;
  }

  if (Array.isArray(responseBody?.data)) {
    return responseBody.data;
  }

  return [];
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(body?.message || 'Erro ao processar a requisicao.');
  }

  return body;
};

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const renderBookFilters = () => `
  <div class="filters">
    <form id="book-filters-form" class="row g-3 align-items-end">
      <div class="col-md-4">
        <label for="filter-title" class="form-label">Titulo</label>
        <input type="text" class="form-control" id="filter-title" name="title" value="${state.bookFilters.title}" placeholder="Buscar por titulo">
      </div>
      <div class="col-md-3">
        <label for="filter-author" class="form-label">Autor</label>
        <input type="text" class="form-control" id="filter-author" name="author" value="${state.bookFilters.author}" placeholder="Buscar por autor">
      </div>
      <div class="col-md-3">
        <label for="filter-isbn" class="form-label">ISBN</label>
        <input type="text" class="form-control" id="filter-isbn" name="isbn" value="${state.bookFilters.isbn}" placeholder="Buscar por ISBN">
      </div>
      <div class="col-md-2">
        <label for="filter-available" class="form-label">Status</label>
        <select class="form-select" id="filter-available" name="available">
          <option value="" ${state.bookFilters.available === '' ? 'selected' : ''}>Todos</option>
          <option value="true" ${state.bookFilters.available === 'true' ? 'selected' : ''}>Disponivel</option>
          <option value="false" ${state.bookFilters.available === 'false' ? 'selected' : ''}>Emprestado</option>
        </select>
      </div>
      <div class="col-12 d-flex gap-2">
        <button type="submit" class="btn btn-primary">Buscar</button>
        <button type="button" class="btn btn-outline-secondary" id="clear-book-filters">Limpar</button>
      </div>
    </form>
  </div>
`;

const renderBookCreateForm = () => `
  <div class="card mb-4">
    <div class="card-body">
      <h3 class="mb-3">Adicionar Livro</h3>
      <form id="create-book-form" class="row g-3">
        <div class="col-md-6">
          <label for="create-book-title" class="form-label">Titulo</label>
          <input type="text" class="form-control" id="create-book-title" name="title" placeholder="Nome do livro" required>
        </div>
        <div class="col-md-6">
          <label for="create-book-author" class="form-label">Autor</label>
          <input type="text" class="form-control" id="create-book-author" name="author" placeholder="Autor do livro" required>
        </div>
        <div class="col-md-4">
          <label for="create-book-isbn" class="form-label">ISBN</label>
          <input type="text" class="form-control" id="create-book-isbn" name="isbn" placeholder="ISBN com ao menos 10 caracteres" required>
        </div>
        <div class="col-md-4">
          <label for="create-book-year" class="form-label">Ano</label>
          <input type="number" class="form-control" id="create-book-year" name="published_year" placeholder="Ano de publicacao">
        </div>
        <div class="col-md-4">
          <label for="create-book-available" class="form-label">Status inicial</label>
          <select class="form-select" id="create-book-available" name="available">
            <option value="true" selected>Disponivel</option>
            <option value="false">Indisponivel</option>
          </select>
        </div>
        <div class="col-12">
          <label for="create-book-description" class="form-label">Descricao</label>
          <textarea class="form-control" id="create-book-description" name="description" rows="3" placeholder="Descricao do livro"></textarea>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-success">Adicionar livro</button>
        </div>
      </form>
    </div>
  </div>
`;

const bindBookFilters = () => {
  const filtersForm = document.getElementById('book-filters-form');
  const clearButton = document.getElementById('clear-book-filters');

  if (!filtersForm || !clearButton) {
    return;
  }

  filtersForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(filtersForm);
    state.bookFilters = {
      title: String(formData.get('title') || '').trim(),
      author: String(formData.get('author') || '').trim(),
      isbn: String(formData.get('isbn') || '').trim(),
      available: String(formData.get('available') || '').trim(),
    };

    renderBooks();
  });

  clearButton.addEventListener('click', () => {
    state.bookFilters = {
      title: '',
      author: '',
      isbn: '',
      available: '',
    };

    renderBooks();
  });
};

const bindCreateBookForm = () => {
  const createBookForm = document.getElementById('create-book-form');

  if (!createBookForm) {
    return;
  }

  createBookForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(createBookForm);
    const publishedYear = String(formData.get('published_year') || '').trim();

    const payload = {
      title: String(formData.get('title') || '').trim(),
      author: String(formData.get('author') || '').trim(),
      isbn: String(formData.get('isbn') || '').trim(),
      description: String(formData.get('description') || '').trim() || undefined,
      available: String(formData.get('available')) === 'true',
    };

    if (publishedYear) {
      payload.published_year = Number(publishedYear);
    }

    try {
      await requestJson('/api/books', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      createBookForm.reset();
      document.getElementById('create-book-available').value = 'true';
      await renderBooks();
    } catch (error) {
      setAlert(error.message, 'danger');
    }
  });
};

const renderBooks = async () => {
  setAlert('Carregando livros...', 'secondary');

  try {
    const queryString = buildQueryString(state.bookFilters);
    const body = await requestJson(`/api/books${queryString}`, {
      headers: authHeaders(),
    });
    const books = extractList(body);

    content.innerHTML = `
      ${renderBookCreateForm()}
      ${renderBookFilters()}
      ${
        books.length
          ? `
            <div class="row g-4">
              ${books
                .map(
                  (book) => `
                    <div class="col-md-6 col-xl-4">
                      <div class="card book-card h-100">
                        <div class="card-body d-flex flex-column">
                          <h5 class="card-title">${book.title || 'Sem titulo'}</h5>
                          <p class="card-text mb-2"><strong>Autor:</strong> ${book.author || 'Nao informado'}</p>
                          <p class="card-text mb-2"><strong>Ano:</strong> ${book.published_year || 'Nao informado'}</p>
                          <p class="card-text mb-2"><strong>ISBN:</strong> ${book.isbn || 'Nao informado'}</p>
                          <p class="card-text mb-3"><strong>Status:</strong> ${book.available ? 'Disponivel' : 'Emprestado'}</p>
                          <div class="mt-auto">
                            <button class="btn btn-primary w-100 loan-book-btn" data-book-id="${book.id}" ${book.available ? '' : 'disabled'}>
                              ${book.available ? 'Solicitar emprestimo' : 'Indisponivel'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>
          `
          : `
            <div class="alert alert-warning" role="alert">
              Nenhum livro encontrado com os filtros informados.
            </div>
          `
      }
    `;

    bindCreateBookForm();
    bindBookFilters();

    document.querySelectorAll('.loan-book-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const bookId = Number(button.dataset.bookId);

        try {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);

          await requestJson('/api/loans', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              book_id: bookId,
              due_date: dueDate.toISOString(),
            }),
          });

          await renderBooks();
        } catch (error) {
          setAlert(error.message, 'danger');
        }
      });
    });
  } catch (error) {
    setAlert(error.message, 'danger');
  }
};

const renderLoans = async () => {
  setAlert('Carregando emprestimos...', 'secondary');

  try {
    const body = await requestJson('/api/loans', {
      headers: authHeaders(),
    });
    const loans = extractList(body);

    if (!loans.length) {
      setAlert('Nenhum emprestimo encontrado.', 'warning');
      return;
    }

    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="mb-3">Meus Emprestimos</h3>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Livro</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${loans
                  .map(
                    (loan) => `
                      <tr>
                        <td>${loan.id}</td>
                        <td>${loan.bookTitle || loan.book_id || '-'}</td>
                        <td>${loan.status || 'ativo'}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    setAlert(error.message, 'danger');
  }
};

const renderUsers = async () => {
  setAlert('Carregando usuarios...', 'secondary');

  try {
    const body = await requestJson('/users', {
      headers: authHeaders(),
    });
    const users = extractList(body);

    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="mb-3">Usuarios</h3>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                ${users
                  .map(
                    (user) => `
                      <tr>
                        <td>${user.id}</td>
                        <td>${user.name || '-'}</td>
                        <td>${user.email || '-'}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    setAlert(error.message, 'danger');
  }
};

const renderAllLoans = async () => {
  setAlert('Carregando todos os emprestimos...', 'secondary');
  await renderLoans();
};

const enterApp = async () => {
  showSection('main');
  updateNavbarUser();
  await renderBooks();
};

document.getElementById('show-home-login').addEventListener('click', () => {
  showSection('auth');
});

document.getElementById('show-home-register').addEventListener('click', () => {
  showSection('register');
});

document.getElementById('show-register').addEventListener('click', () => {
  showSection('register');
});

document.getElementById('show-login').addEventListener('click', () => {
  showSection('auth');
});

document.getElementById('books-btn').addEventListener('click', () => {
  renderBooks();
});

document.getElementById('loans-btn').addEventListener('click', () => {
  renderLoans();
});

document.getElementById('users-btn').addEventListener('click', () => {
  renderUsers();
});

document.getElementById('all-loans-btn').addEventListener('click', () => {
  renderAllLoans();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  state.token = '';
  localStorage.removeItem('token');
  navbarUserText.textContent = '';
  showSection('home');
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const body = await requestJson('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    state.token = body.token;
    localStorage.setItem('token', body.token);
    await enterApp();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  try {
    const body = await requestJson('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    state.token = body.token;
    localStorage.setItem('token', body.token);
    await enterApp();
  } catch (error) {
    alert(error.message);
  }
});

if (state.token) {
  enterApp().catch(() => {
    state.token = '';
    localStorage.removeItem('token');
    showSection('home');
  });
} else {
  showSection('home');
}

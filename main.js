// Load customers and workList from localStorage or start empty
let customers = JSON.parse(localStorage.getItem('customers') || '[]');
let workList = JSON.parse(localStorage.getItem('workList') || '[]');

// Variables to store filtered lists
let filteredCustomers = [...customers];
let filteredWorkList = [...workList];

// Save data back to localStorage
function saveData() {
  localStorage.setItem('customers', JSON.stringify(customers));
  localStorage.setItem('workList', JSON.stringify(workList));
}

// Escape HTML to avoid XSS for displayed text
function escapeHTML(text) {
  return text.replace(/[&<>"']/g, function (match) {
    const escape = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escape[match];
  });
}

// Render Customers Table
function updateCustomerTable() {
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';

  filteredCustomers.forEach((c, i) => {
    const purchaseDateFormatted = c.purchaseDate
      ? new Date(c.purchaseDate).toLocaleDateString()
      : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(c.name)}</td>
      <td>${escapeHTML(c.email)}</td>
      <td>${escapeHTML(c.phone)}</td>
      <td>${purchaseDateFormatted}</td>
      <td>
        <button class="delete-btn" onclick="deleteCustomerById(${c.id})" aria-label="Delete Customer">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  updateCustomerOptions();
}

// Render Work Table
function updateWorkTable() {
  const tbody = document.querySelector('#workTable tbody');
  tbody.innerHTML = '';

  filteredWorkList.forEach((w, i) => {
    const customer = customers.find(c => c.id === w.customerId);
    const deliveryDateFormatted = w.deliveryDate
      ? new Date(w.deliveryDate).toLocaleDateString()
      : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(w.title)}</td>
      <td>${customer ? escapeHTML(customer.name) : 'Unknown'}</td>
      <td>${deliveryDateFormatted}</td>
      <td>
        <button class="delete-btn" onclick="deleteWorkByIndex(${w.id})" aria-label="Delete Work">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Populate Customer dropdown in work form
function updateCustomerOptions() {
  const select = document.getElementById('workCustomer');
  if (customers.length === 0) {
    select.innerHTML = '<option value="">No customers available</option>';
  } else {
    select.innerHTML = customers
      .map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`)
      .join('');
  }
}

// Add Customer handler
document.getElementById('customerForm').onsubmit = function (e) {
  e.preventDefault();

  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();
  const phone = e.target.phone.value.trim();
  const purchaseDate = e.target.purchaseDate.value; // yyyy-mm-dd

  if (!name || !email || !phone || !purchaseDate) {
    alert('Please fill in all customer fields.');
    return;
  }

  const newCustomer = {
    id: Date.now(),
    name,
    email,
    phone,
    purchaseDate,
  };

  customers.push(newCustomer);
  filteredCustomers = [...customers];

  saveData();
  updateCustomerTable();
  this.reset();
  updateCustomerOptions();
};

// Add Work handler
document.getElementById('workForm').onsubmit = function (e) {
  e.preventDefault();

  const title = e.target.workTitle.value.trim();
  const customerId = Number(e.target.workCustomer.value);
  const deliveryDate = e.target.deliveryDate.value; // yyyy-mm-dd

  if (!title || !customerId || !deliveryDate) {
    alert('Please fill in all work fields.');
    return;
  }

  const newWork = {
    id: Date.now(),
    title,
    customerId,
    deliveryDate,
  };

  workList.push(newWork);
  filteredWorkList = [...workList];

  saveData();
  updateWorkTable();
  this.reset();
};

// Delete Customer by ID and associated Work
window.deleteCustomerById = function (customerId) {
  if (!confirm('Are you sure you want to delete this customer? All related work will also be deleted.')) {
    return;
  }

  customers = customers.filter(c => c.id !== customerId);
  workList = workList.filter(w => w.customerId !== customerId);

  filteredCustomers = [...customers];
  filteredWorkList = [...workList];

  saveData();
  updateCustomerTable();
  updateWorkTable();
};

// Delete Work by its ID
window.deleteWorkByIndex = function (workId) {
  if (!confirm('Are you sure you want to delete this work item?')) {
    return;
  }

  workList = workList.filter(w => w.id !== workId);
  filteredWorkList = [...workList];

  saveData();
  updateWorkTable();
};

// --- SEARCH FUNCTIONALITY ---

// Customer Search Input
document.getElementById('customerSearch').addEventListener('input', function () {
  const term = this.value.trim().toLowerCase();

  if (!term) {
    filteredCustomers = [...customers];
  } else {
    filteredCustomers = customers.filter(c => {
      return (
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term)
      );
    });
  }

  updateCustomerTable();
});

// Work Search Input
document.getElementById('workSearch').addEventListener('input', function () {
  const term = this.value.trim().toLowerCase();

  if (!term) {
    filteredWorkList = [...workList];
  } else {
    filteredWorkList = workList.filter(w => {
      const customer = customers.find(c => c.id === w.customerId);
      return (
        w.title.toLowerCase().includes(term) ||
        (customer && customer.name.toLowerCase().includes(term))
      );
    });
  }

  updateWorkTable();
});

// Initial render of tables and dropdowns
filteredCustomers = [...customers];
filteredWorkList = [...workList];
updateCustomerTable();
updateWorkTable();
updateCustomerOptions();

// Load customers and workList from localStorage or start empty
let customers = JSON.parse(localStorage.getItem('customers') || '[]');
let workList = JSON.parse(localStorage.getItem('workList') || '[]');

// Save data back to localStorage
function saveData() {
  localStorage.setItem('customers', JSON.stringify(customers));
  localStorage.setItem('workList', JSON.stringify(workList));
}

// Render Customers Table
function updateCustomerTable() {
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';
  customers.forEach((c, i) => {
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
        <button class="delete-btn" onclick="deleteCustomer(${i})" aria-label="Delete Customer">Delete</button>
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
  workList.forEach((w, i) => {
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
        <button class="delete-btn" onclick="deleteWork(${i})" aria-label="Delete Work">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Populate Customer dropdown in work form
function updateCustomerOptions() {
  const select = document.getElementById('workCustomer');
  select.innerHTML = customers
    .map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`)
    .join('');
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

  customers.push({
    id: Date.now(),
    name,
    email,
    phone,
    purchaseDate,
  });

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

  workList.push({
    title,
    customerId,
    deliveryDate,
  });

  saveData();
  updateWorkTable();
  this.reset();
};

// Delete Customer and associated Work
window.deleteCustomer = function (index) {
  if (!confirm('Are you sure you want to delete this customer? All related work will also be deleted.')) {
    return;
  }

  const customerId = customers[index].id;

  // Remove related work
  workList = workList.filter(w => w.customerId !== customerId);

  // Remove customer
  customers.splice(index, 1);

  saveData();
  updateCustomerTable();
  updateWorkTable();
};

// Delete Work
window.deleteWork = function (index) {
  if (!confirm('Are you sure you want to delete this work item?')) {
    return;
  }

  workList.splice(index, 1);
  saveData();
  updateWorkTable();
};

// Initial render of tables and dropdowns
updateCustomerTable();
updateWorkTable();
updateCustomerOptions();

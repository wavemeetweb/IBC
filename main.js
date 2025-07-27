// Load data from localStorage or start with empty array
let customers = JSON.parse(localStorage.getItem('customers') || '[]');

// Filtered customers array for search functionality
let filteredCustomers = [...customers];

// Save customers to localStorage
function saveData() {
  localStorage.setItem('customers', JSON.stringify(customers));
}

// Escape HTML to prevent XSS attacks for display
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

// Update customers table display
function updateCustomerTable() {
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';

  filteredCustomers.forEach((c) => {
    const entryDateFormatted = c.entryDate ? new Date(c.entryDate).toLocaleDateString() : '';
    const returnDateFormatted = c.returnDate ? new Date(c.returnDate).toLocaleDateString() : '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(c.name)}</td>
      <td>${escapeHTML(c.email)}</td>
      <td>${escapeHTML(c.phone)}</td>
      <td>${escapeHTML(c.serviceProblem)}</td>
      <td>${entryDateFormatted}</td>
      <td>${returnDateFormatted}</td>
      <td><button class="delete-btn" onclick="deleteCustomerById(${c.id})" aria-label="Delete Entry">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Add new customer/service entry
document.getElementById('customerForm').onsubmit = function (e) {
  e.preventDefault();

  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();
  const phone = e.target.phone.value.trim();
  const serviceProblem = e.target.serviceProblem.value.trim();
  const entryDate = e.target.entryDate.value;
  const returnDate = e.target.returnDate.value;

  // Validation: ensure return date is not before entry date and not too far apart (<=30 days)
  if (new Date(returnDate) < new Date(entryDate)) {
    alert('Return Date cannot be before Entry Date.');
    return;
  }
  const msInDay = 1000 * 60 * 60 * 24;
  const diffDays = (new Date(returnDate) - new Date(entryDate)) / msInDay;
  if (diffDays > 30) {
    alert('Return Date should be within 30 days of Entry Date.');
    return;
  }

  if (!name || !email || !phone || !serviceProblem || !entryDate || !returnDate) {
    alert('Please fill in all fields.');
    return;
  }

  customers.push({
    id: Date.now(),
    name,
    email,
    phone,
    serviceProblem,
    entryDate,
    returnDate,
  });

  filteredCustomers = [...customers];
  saveData();
  updateCustomerTable();
  e.target.reset();
};

// Delete customer/service entry by ID
window.deleteCustomerById = function (id) {
  if (!confirm('Are you sure you want to delete this entry?')) {
    return;
  }
  customers = customers.filter(c => c.id !== id);
  filteredCustomers = [...customers];
  saveData();
  updateCustomerTable();
};

// Search functionality on customerSearch input
document.getElementById('customerSearch').addEventListener('input', function () {
  const term = this.value.trim().toLowerCase();

  if (!term) {
    filteredCustomers = [...customers];
  } else {
    filteredCustomers = customers.filter(c => {
      return (
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        c.serviceProblem.toLowerCase().includes(term)
      );
    });
  }

  updateCustomerTable();
});

// Print Button event
document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

// Initial render
filteredCustomers = [...customers];
updateCustomerTable();

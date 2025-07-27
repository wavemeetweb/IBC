// Customers
let customers = JSON.parse(localStorage.getItem('customers') || '[]');
// Work
let workList = JSON.parse(localStorage.getItem('workList') || '[]');

// Helpers
function saveData() {
  localStorage.setItem('customers', JSON.stringify(customers));
  localStorage.setItem('workList', JSON.stringify(workList));
}
function updateCustomerTable() {
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';
  customers.forEach((c, i) => {
    let row = `<tr>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td><button onclick="deleteCustomer(${i})">Delete</button></td>
    </tr>`;
    tbody.innerHTML += row;
  });
  updateCustomerOptions();
}
function updateWorkTable() {
  const tbody = document.querySelector('#workTable tbody');
  tbody.innerHTML = '';
  workList.forEach((w, i) => {
    const customer = customers.find(c => c.id === w.customerId);
    let row = `<tr>
      <td>${w.title}</td>
      <td>${customer ? customer.name : 'Unknown'}</td>
      <td><button onclick="deleteWork(${i})">Delete</button></td>
    </tr>`;
    tbody.innerHTML += row;
  });
}
function updateCustomerOptions() {
  const select = document.getElementById('workCustomer');
  select.innerHTML = customers.map(c =>
    `<option value="${c.id}">${c.name}</option>`
  ).join('');
}

// Add Customer
document.getElementById('customerForm').onsubmit = function(e){
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  customers.push({ id: Date.now(), name, email, phone });
  saveData();
  updateCustomerTable();
  this.reset();
  updateCustomerOptions();
};
// Add Work
document.getElementById('workForm').onsubmit = function(e){
  e.preventDefault();
  const title = document.getElementById('workTitle').value.trim();
  const customerId = Number(document.getElementById('workCustomer').value);
  workList.push({ title, customerId });
  saveData();
  updateWorkTable();
  this.reset();
};

window.deleteCustomer = function(idx) {
  const c = customers[idx];
  workList = workList.filter(w => w.customerId !== c.id);
  customers.splice(idx, 1);
  saveData();
  updateCustomerTable();
  updateWorkTable();
};
window.deleteWork = function(idx) {
  workList.splice(idx, 1);
  saveData();
  updateWorkTable();
};

// Initial render
updateCustomerTable();
updateWorkTable();

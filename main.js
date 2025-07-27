// Existing: customers array from localStorage
let customers = JSON.parse(localStorage.getItem('customers') || '[]');
let workList = JSON.parse(localStorage.getItem('workList') || '[]');

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
      <td>${c.purchaseDate || ''}</td>
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
      <td>${w.deliveryDate || ''}</td>
      <td><button onclick="deleteWork(${i})">Delete</button></td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// Add Customer - Include purchaseDate
document.getElementById('customerForm').onsubmit = function(e){
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const purchaseDate = document.getElementById('purchaseDate').value; // yyyy-mm-dd
  customers.push({ id: Date.now(), name, email, phone, purchaseDate });
  saveData();
  updateCustomerTable();
  this.reset();
  updateCustomerOptions();
};

// Add Work - Include deliveryDate
document.getElementById('workForm').onsubmit = function(e){
  e.preventDefault();
  const title = document.getElementById('workTitle').value.trim();
  const customerId = Number(document.getElementById('workCustomer').value);
  const deliveryDate = document.getElementById('deliveryDate').value; // yyyy-mm-dd
  workList.push({ title, customerId, deliveryDate });
  saveData();
  updateWorkTable();
  this.reset();
};

// Your Firebase configuration (replace with your own if needed)
const firebaseConfig = {
  apiKey: "AIzaSyCguyjHO82e0UXY78da4GLLDMpC2mvYV8Y",
  authDomain: "ibc-entries.firebaseapp.com",
  projectId: "ibc-entries",
  storageBucket: "ibc-entries.firebasestorage.app",
  messagingSenderId: "868975786760",
  appId: "1:868975786760:web:88c82632d6e563a955cabd",
  measurementId: "G-7JDE75ZLND"
};

// Initialize Firebase compat SDK
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Enable offline data persistence (optional but recommended)
firebase.firestore().enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Persistence failed due to multiple tabs open');
    } else if (err.code == 'unimplemented') {
      console.warn('Browser does not support persistence');
    }
  });

// DOM elements
const customerForm = document.getElementById('customerForm');
const customerTableBody = document.querySelector('#customerTable tbody');
const customerSearch = document.getElementById('customerSearch');
const printBtn = document.getElementById('printBtn');

let customers = [];
let filteredCustomers = [];

// Helper to escape HTML for security
function escapeHTML(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Render table rows
function updateCustomerTable() {
  customerTableBody.innerHTML = '';
  filteredCustomers.forEach(c => {
    const entryDate = c.entryDate ? new Date(c.entryDate).toLocaleDateString() : '';
    const returnDate = c.returnDate ? new Date(c.returnDate).toLocaleDateString() : '';
    const email = c.email ? escapeHTML(c.email) : '-';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(c.name)}</td>
      <td>${email}</td>
      <td>${escapeHTML(c.phone)}</td>
      <td>${escapeHTML(c.service)}</td>
      <td>${entryDate}</td>
      <td>${returnDate}</td>
      <td><button class="delete-btn" onclick="deleteCustomerById('${c.id}')">Delete</button></td>
    `;
    customerTableBody.appendChild(row);
  });
}

// Load Firestore data realtime
function loadCustomersRealtime() {
  db.collection('customers').orderBy('entryDate', 'desc')
    .onSnapshot(snapshot => {
      customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      filteredCustomers = [...customers];
      updateCustomerTable();
    }, error => {
      alert("Error loading data: " + error.message);
      console.error(error);
    });
}

// Add form submit handler
customerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();
  const phone = e.target.phone.value.trim();
  const service = e.target.service.value.trim();
  const entryDate = e.target.entryDate.value;
  const returnDate = e.target.returnDate.value;

  if (!name || !phone || !service || !entryDate) {
    alert('Please fill required fields: Name, Phone, Service, Entry Date.');
    return;
  }

  if (returnDate) {
    if (new Date(returnDate) < new Date(entryDate)) {
      alert('Return Date cannot be before Entry Date.');
      return;
    }
    const diffDays = (new Date(returnDate) - new Date(entryDate)) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      alert('Return Date should be within 30 days of Entry Date.');
      return;
    }
  }

  try {
    await db.collection('customers').add({
      name,
      email: email || '',
      phone,
      service,
      entryDate,
      returnDate: returnDate || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    e.target.reset();
  } catch (err) {
    alert("Failed to save entry: " + err.message);
  }
});

// Delete entry handler
window.deleteCustomerById = async id => {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  try {
    await db.collection('customers').doc(id).delete();
  } catch (err) {
    alert("Failed to delete entry: " + err.message);
  }
};

// Search filter input handler
customerSearch.addEventListener('input', function() {
  const term = this.value.trim().toLowerCase();
  if (!term) {
    filteredCustomers = [...customers];
  } else {
    filteredCustomers = customers.filter(c =>
      c.name.toLowerCase().includes(term)
      || (c.email && c.email.toLowerCase().includes(term))
      || c.phone.toLowerCase().includes(term)
      || c.service.toLowerCase().includes(term)
    );
  }
  updateCustomerTable();
});

// Print button handler
printBtn.addEventListener('click', () => window.print());

// Start realtime listener
loadCustomersRealtime();

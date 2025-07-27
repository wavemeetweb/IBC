// Firebase configuration with your provided API key
const firebaseConfig = {
  apiKey: "AIzaSyCguyjHO82e0UXY78da4GLLDMpC2mvYV8Y",
  authDomain: "ibc-entries.firebaseapp.com",
  projectId: "ibc-entries",
  storageBucket: "ibc-entries.firebasestorage.app",
  messagingSenderId: "868975786760",
  appId: "1:868975786760:web:88c82632d6e563a955cabd",
  measurementId: "G-7JDE75ZLND"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Enable offline persistence for better reliability
firebase.firestore().enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.log('The current browser does not support persistence.');
    }
  });

// DOM elements
const customerForm = document.getElementById('customerForm');
const customerTableBody = document.querySelector('#customerTable tbody');
const customerSearch = document.getElementById('customerSearch');
const printBtn = document.getElementById('printBtn');

let customers = [];
let filteredCustomers = [];

// Escape HTML to prevent XSS attacks
function escapeHTML(text) {
  return text.replace(/[&<>"']/g, function(match) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

// Update the customer table display
function updateCustomerTable() {
  customerTableBody.innerHTML = '';
  
  filteredCustomers.forEach(c => {
    const entryDateFormatted = c.entryDate ? new Date(c.entryDate).toLocaleDateString() : '';
    const returnDateFormatted = c.returnDate ? new Date(c.returnDate).toLocaleDateString() : '';
    const emailDisplay = c.email ? escapeHTML(c.email) : "-";
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(c.name)}</td>
      <td>${emailDisplay}</td>
      <td>${escapeHTML(c.phone)}</td>
      <td>${escapeHTML(c.service)}</td>
      <td>${entryDateFormatted}</td>
      <td>${returnDateFormatted}</td>
      <td><button class="delete-btn" onclick="deleteCustomerById('${c.id}')" aria-label="Delete Entry">Delete</button></td>
    `;
    customerTableBody.appendChild(row);
  });
}

// Load customers from Firestore in real-time
function loadCustomersRealtime() {
  db.collection('customers')
    .orderBy('entryDate', 'desc')
    .onSnapshot(snapshot => {
      customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      filteredCustomers = [...customers];
      updateCustomerTable();
      console.log(`Loaded ${customers.length} customer records`);
    }, error => {
      console.error("Error loading data:", error);
      alert("Error loading data: " + error.message);
    });
}

// Add new customer/service entry
customerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();
  const phone = e.target.phone.value.trim();
  const service = e.target.service.value.trim();
  const entryDate = e.target.entryDate.value;
  const returnDate = e.target.returnDate.value; // optional

  // Validate required fields (email and returnDate are optional)
  if (!name || !phone || !service || !entryDate) {
    alert('Please fill in all required fields (Name, Phone, Service, Entry Date).');
    return;
  }

  // Validate return date if provided
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
    console.log("Customer entry added successfully");
  } catch (err) {
    console.error("Error saving data:", err);
    alert("Error saving data: " + err.message);
  }
});

// Delete customer entry by ID
window.deleteCustomerById = async function (id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  
  try {
    await db.collection('customers').doc(id).delete();
    console.log("Customer entry deleted successfully");
  } catch (err) {
    console.error("Error deleting entry:", err);
    alert("Error deleting entry: " + err.message);
  }
};

// Search functionality
customerSearch.addEventListener('input', function () {
  const term = this.value.trim().toLowerCase();
  if (!term) {
    filteredCustomers = [...customers];
  } else {
    filteredCustomers = customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      c.phone.toLowerCase().includes(term) ||
      c.service.toLowerCase().includes(term)
    );
  }
  updateCustomerTable();
});

// Print button functionality
printBtn.addEventListener('click', () => {
  window.print();
});

// Initialize the application
console.log("Initializing IBC Service Customer Details...");
loadCustomersRealtime();

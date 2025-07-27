// Import Firebase functions (if using bundler like webpack, otherwise use CDN scripts in HTML)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";

// Your Firebase config with your provided apiKey
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Escape HTML helper
function escapeHTML(text) {
  return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

const customerTableBody = document.querySelector('#customerTable tbody');
let customers = [];
let filteredCustomers = [];

// Render customers
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

// Load customers realtime from Firestore
function loadCustomersRealtime() {
  const q = query(collection(db, "customers"), orderBy("entryDate", "desc"));
  onSnapshot(q, (snapshot) => {
    customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    filteredCustomers = [...customers];
    updateCustomerTable();
  }, (error) => {
    alert("Error loading data: " + error.message);
  });
}

// Handle form submission to add entry
document.getElementById('customerForm').onsubmit = async function (e) {
  e.preventDefault();

  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim(); // optional
  const phone = e.target.phone.value.trim();
  const service = e.target.service.value.trim();
  const entryDate = e.target.entryDate.value;
  const returnDate = e.target.returnDate.value; // optional

  if (!name || !phone || !service || !entryDate) {
    alert('Please fill in all required fields (Name, Phone, Service, Entry Date).');
    return;
  }

  if (returnDate) {
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
  }

  try {
    await addDoc(collection(db, "customers"), {
      name,
      email,
      phone,
      service,
      entryDate,
      returnDate: returnDate || ''
    });
    e.target.reset();
  } catch (err) {
    alert("Error saving data: " + err.message);
  }
};

// Delete customer entry by ID
window.deleteCustomerById = async function(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  try {
    await deleteDoc(doc(db, "customers", id));
  } catch (err) {
    alert("Error deleting entry: " + err.message);
  }
};

// Search filter
document.getElementById('customerSearch').addEventListener('input', function () {
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

// Print button handler
document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

// Initialize app
loadCustomersRealtime();

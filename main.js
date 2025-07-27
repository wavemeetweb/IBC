// Supabase Configuration
// REPLACE THESE WITH YOUR ACTUAL SUPABASE PROJECT DETAILS
const SUPABASE_URL = 'https://euvrtzphbzewxfdfdwkt.supabase.co'; // Your project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dnJ0enBoYnpld3hmZGZkd2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA5MjgsImV4cCI6MjA2OTE3NjkyOH0.nHNZV8bgzXROLvAaAFhXtIZH44-161XG6t28G342XZk'; // Replace with your anon public key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const customerForm = document.getElementById('customerForm');
const customerTableBody = document.querySelector('#customerTable tbody');
const customerSearch = document.getElementById('customerSearch');
const printBtn = document.getElementById('printBtn');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const usernameDisplay = document.getElementById('username-display');
const recordCount = document.getElementById('recordCount');

let customers = [];
let filteredCustomers = [];

// Display username
usernameDisplay.textContent = sessionStorage.getItem('username') || 'User';

// Logout functionality
logoutBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
});

// Helper function to escape HTML
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update customer table display
function updateCustomerTable() {
  customerTableBody.innerHTML = '';
  
  filteredCustomers.forEach(customer => {
    const entryDate = customer.entry_date ? new Date(customer.entry_date).toLocaleDateString() : '';
    const returnDate = customer.return_date ? new Date(customer.return_date).toLocaleDateString() : '';
    const email = customer.email ? escapeHTML(customer.email) : '-';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(customer.name)}</td>
      <td>${email}</td>
      <td>${escapeHTML(customer.phone)}</td>
      <td>${escapeHTML(customer.service)}</td>
      <td>${entryDate}</td>
      <td>${returnDate}</td>
      <td><button class="delete-btn" onclick="deleteCustomer(${customer.id})">Delete</button></td>
    `;
    customerTableBody.appendChild(row);
  });
  
  recordCount.textContent = filteredCustomers.length;
}

// Load customers from Supabase with real-time subscription
async function loadCustomersRealtime() {
  try {
    // Initial load
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) throw error;

    customers = data || [];
    filteredCustomers = [...customers];
    updateCustomerTable();

    // Set up real-time subscription
    const subscription = supabase
      .channel('customers_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' }, 
        (payload) => {
          console.log('Real-time update:', payload);
          loadCustomers(); // Reload data when changes occur
        }
      )
      .subscribe();

    console.log(`Loaded ${customers.length} customer records`);
  } catch (error) {
    console.error('Error loading customers:', error);
    alert('Error loading data: ' + error.message);
  }
}

// Load customers without subscription (for refresh)
async function loadCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) throw error;

    customers = data || [];
    filteredCustomers = [...customers];
    updateCustomerTable();
  } catch (error) {
    console.error('Error loading customers:', error);
    alert('Error loading data: ' + error.message);
  }
}

// Add new customer entry
customerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();
  const phone = e.target.phone.value.trim();
  const service = e.target.service.value.trim();
  const entryDate = e.target.entryDate.value;
  const returnDate = e.target.returnDate.value;

  // Validation
  if (!name || !phone || !service || !entryDate) {
    alert('Please fill in all required fields (Name, Phone, Service, Entry Date).');
    return;
  }

  if (returnDate && new Date(returnDate) < new Date(entryDate)) {
    alert('Return Date cannot be before Entry Date.');
    return;
  }

  if (returnDate) {
    const diffDays = (new Date(returnDate) - new Date(entryDate)) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      alert('Return Date should be within 30 days of Entry Date.');
      return;
    }
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          name,
          email: email || null,
          phone,
          service,
          entry_date: entryDate,
          return_date: returnDate || null,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    console.log('Customer added successfully');
    e.target.reset();
    
    // Reload data to show new entry
    await loadCustomers();
  } catch (error) {
    console.error('Error adding customer:', error);
    alert('Error saving data: ' + error.message);
  }
});

// Delete customer
window.deleteCustomer = async function(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('Customer deleted successfully');
    await loadCustomers();
  } catch (error) {
    console.error('Error deleting customer:', error);
    alert('Error deleting entry: ' + error.message);
  }
};

// Search functionality
customerSearch.addEventListener('input', function() {
  const term = this.value.trim().toLowerCase();
  
  if (!term) {
    filteredCustomers = [...customers];
  } else {
    filteredCustomers = customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      customer.phone.toLowerCase().includes(term) ||
      customer.service.toLowerCase().includes(term)
    );
  }
  
  updateCustomerTable();
});

// Print functionality
printBtn.addEventListener('click', () => {
  window.print();
});

// Refresh functionality
refreshBtn.addEventListener('click', async () => {
  refreshBtn.textContent = '🔄 Refreshing...';
  refreshBtn.disabled = true;
  
  await loadCustomers();
  
  refreshBtn.textContent = '🔄 Refresh Data';
  refreshBtn.disabled = false;
});

// Initialize the app
console.log('Initializing IBC Service Customer Details with Supabase...');

// Test Supabase connection and load data
(async () => {
  try {
    // Test connection
    const { data, error } = await supabase.from('customers').select('count', { count: 'exact' });
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    
    // Load customers with real-time subscription
    await loadCustomersRealtime();
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    alert('Database connection failed. Please check your Supabase configuration.');
  }
})();

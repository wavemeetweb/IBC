// Supabase Configuration - Your actual credentials
const SUPABASE_URL = 'https://tobukpkjtgwjemoxghry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYnVrcGtqdGd3amVtb3hnaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDIwOTgsImV4cCI6MjA2OTI3ODA5OH0.pA_gRllWJBBceEIFurMEE8ectLuu2fHwvElZhsst1jY';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing IBC Service Customer Details...');
  
  // Display username
  usernameDisplay.textContent = sessionStorage.getItem('username') || 'User';

  // Set up event listeners
  setupEventListeners();
  
  // Load initial data
  loadCustomersRealtime();
  
  // Test Supabase connection
  testSupabaseConnection();
});

// Set up all event listeners
function setupEventListeners() {
  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      window.location.href = 'login.html';
    }
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

  // **CRITICAL FIX: Form submission handler with proper preventDefault timing**
  customerForm.addEventListener('submit', async function(event) {
    // ⚠️ CRITICAL: preventDefault() MUST be called FIRST, before any other operations
    event.preventDefault();
    
    console.log('📝 Form submitted - preventDefault() called first');
    
    // Disable submit button to prevent double submission
    const submitButton = customerForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    
    try {
      // Get form values - accessing via form elements directly
      const formData = new FormData(event.target);
      const name = event.target.name.value.trim();
      const email = event.target.email.value.trim();
      const phone = event.target.phone.value.trim();
      const service = event.target.service.value.trim();
      const entryDate = event.target.entryDate.value;
      const returnDate = event.target.returnDate.value;

      console.log('📋 Form values:', { name, email, phone, service, entryDate, returnDate });

      // Validate required fields
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

      // Insert into Supabase
      console.log('💾 Saving to Supabase...');
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name,
          email: email || null,
          phone,
          service,
          entry_date: entryDate,
          return_date: returnDate || null,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Entry saved successfully:', data);
      
      // Reset form
      event.target.reset();
      
      // Reload data to show new entry
      await loadCustomers();
      
      // Show success message
      alert('Entry added successfully!');

    } catch (error) {
      console.error('❌ Error saving data:', error);
      alert('Error saving data: ' + error.message);
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

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
}

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
    console.log('🔄 Loading customers from Supabase...');
    
    // Initial load
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) {
      console.error('❌ Error loading customers:', error);
      throw error;
    }

    customers = data || [];
    filteredCustomers = [...customers];
    updateCustomerTable();

    console.log(`✅ Loaded ${customers.length} customer records`);

    // Set up real-time subscription
    const subscription = supabase
      .channel('customers_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' }, 
        (payload) => {
          console.log('🔔 Real-time update:', payload);
          loadCustomers(); // Reload data when changes occur
        }
      )
      .subscribe();

  } catch (error) {
    console.error('❌ Error loading customers:', error);
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

// Delete customer entry by ID
window.deleteCustomer = async function(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Customer entry deleted successfully');
    await loadCustomers();
  } catch (error) {
    console.error('❌ Error deleting entry:', error);
    alert('Error deleting entry: ' + error.message);
  }
};

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.from('customers').select('count', { count: 'exact' });
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    alert('Database connection failed. Please check your Supabase configuration.');
  }
}

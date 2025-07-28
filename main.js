
const SUPABASE_URL = 'https://tobukpkjtgwjemoxghry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYnVrcGtqdGd3amVtb3hnaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDIwOTgsImV4cCI6MjA2OTI3ODA5OH0.pA_gRllWJBBceEIFurMEE8ectLuu2fHwvElZhsst1jY';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const usernameDisplay = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const customerForm = document.getElementById('customerForm');
const submitButton = customerForm.querySelector('.submit-btn'); // Get the submit button
const btnText = submitButton.querySelector('.btn-text');
const btnLoading = submitButton.querySelector('.btn-loading');

const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const printBtn = document.getElementById('printBtn');

const customerTableBody = document.querySelector('#customerTable tbody');
const recordCount = document.getElementById('recordCount');

let customers = []; // Stores all fetched customer data
let filteredCustomers = []; // Stores customers filtered by search

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing IBC Service Dashboard...');
  
  // Display username from session storage
  usernameDisplay.textContent = sessionStorage.getItem('username') || 'User';

  // Set up event listeners for UI interactions
  setupEventListeners();
  
  // Load initial data
  loadCustomersRealtime();
  
  // Perform a quick connection test to Supabase
  testSupabaseConnection();
});

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.clear(); // Clear session data
      window.location.href = 'login.html'; // Redirect to login page
    }
  });

  // Form Submission Handler - CRITICAL for preventing page refresh
  customerForm.addEventListener('submit', async function(event) {
    // ⚠️ CRITICAL: event.preventDefault() MUST be called FIRST!
    event.preventDefault(); 
    
    console.log('📝 Form submitted - preventDefault() called first');
    
    // Show loading state for button
    submitButton.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
      // Get form values using the event.target (the form element itself)
      const name = event.target.name.value.trim();
      const email = event.target.email.value.trim();
      const phone = event.target.phone.value.trim();
      const service = event.target.service.value.trim();
      const entryDate = event.target.entryDate.value;
      const returnDate = event.target.returnDate.value;

      console.log('📋 Form values:', { name, email, phone, service, entryDate, returnDate });

      // Basic client-side validation
      if (!name || !phone || !service || !entryDate) {
        alert('Please fill in all required fields (Name, Phone, Service, Entry Date).');
        return; // Stop execution if validation fails
      }

      // Date validation
      if (returnDate) {
        if (new Date(returnDate) < new Date(entryDate)) {
          alert('Return Date cannot be before Entry Date.');
          return;
        }
        // Optional: 30-day limit validation (as per previous discussion)
        const msInDay = 1000 * 60 * 60 * 24;
        const diffDays = (new Date(returnDate) - new Date(entryDate)) / msInDay;
        if (diffDays > 30) {
          alert('Return Date should be within 30 days of Entry Date (optional validation).');
          // return; // Uncomment to make this a hard validation
        }
      }

      // Insert data into Supabase
      console.log('💾 Saving to Supabase...');
      const { data, error } = await supabase
        .from('customers') // Target the 'customers' table
        .insert([{
          name: name,
          email: email || null, // Store as null if empty
          phone: phone,
          service: service,
          entry_date: entryDate, // Matches Supabase column name (snake_case)
          return_date: returnDate || null, // Matches Supabase column name
          created_at: new Date().toISOString() // Timestamp for record creation
        }]);

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error; // Throw to be caught by the outer catch block
      }

      console.log('✅ Entry saved successfully:', data);
      
      // Reset the form fields
      event.target.reset();
      
      // Reload customer list to show the new entry (data will also come via real-time)
      await loadCustomers(); // This ensures immediate update even before real-time event
      
      alert('Entry added successfully!'); // User feedback

    } catch (error) {
      console.error('❌ Error in form submission:', error);
      alert('Error saving data: ' + error.message); // General error message for user
    } finally {
      // Always reset button state
      submitButton.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  });

  // Search input event listener for live filtering
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.trim().toLowerCase();
    
    if (!searchTerm) {
      filteredCustomers = [...customers]; // Show all if search box is empty
    } else {
      filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
        customer.phone.toLowerCase().includes(searchTerm) ||
        customer.service.toLowerCase().includes(searchTerm)
      );
    }
    
    updateCustomerTable(); // Re-render table with filtered data
  });

  // Refresh button functionality
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.textContent = '🔄 Refreshing...';
    refreshBtn.disabled = true;
    
    await loadCustomers(); // Force a full reload from DB
    
    refreshBtn.textContent = '🔄 Refresh';
    refreshBtn.disabled = false;
  });

  // Print button functionality
  printBtn.addEventListener('click', () => {
    window.print(); // Triggers the browser's print dialog
  });
}

// --- Customer Data Management Functions ---

// Renders the customer data into the HTML table
function updateCustomerTable() {
  customerTableBody.innerHTML = ''; // Clear existing rows
  
  if (filteredCustomers.length === 0) {
    customerTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No records found.</td></tr>';
  }

  filteredCustomers.forEach(customer => {
    // Format dates for display
    const entryDate = customer.entry_date ? new Date(customer.entry_date).toLocaleDateString() : '';
    const returnDate = customer.return_date ? new Date(customer.return_date).toLocaleDateString() : '';
    
    // Display email or a placeholder if empty
    const emailDisplay = customer.email ? escapeHTML(customer.email) : '-';
    
    // Create table row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(customer.name)}</td>
      <td>${emailDisplay}</td>
      <td>${escapeHTML(customer.phone)}</td>
      <td>${escapeHTML(customer.service)}</td>
      <td>${entryDate}</td>
      <td>${returnDate}</td>
      <td><button class="delete-btn" onclick="deleteCustomer(${customer.id})">Delete</button></td>
    `;
    customerTableBody.appendChild(row);
  });
  
  // Update record count display
  recordCount.textContent = filteredCustomers.length;
}

// Loads customer data from Supabase and sets up real-time subscription
async function loadCustomersRealtime() {
  try {
    console.log('🔄 Loading initial customer data from Supabase...');
    
    // Fetch initial data
    const { data, error } = await supabase
      .from('customers')
      .select('*') // Select all columns
      .order('entry_date', { ascending: false }); // Order by entry date descending

    if (error) {
      console.error('❌ Error fetching initial customer data:', error);
      throw error;
    }

    customers = data || []; // Update local cache
    filteredCustomers = [...customers]; // Initialize filtered list
    updateCustomerTable(); // Render the table

    console.log(`✅ Loaded ${customers.length} customer records. Setting up real-time subscription...`);

    // Setup real-time subscription for instant updates
    supabase
      .channel('public:customers') // Channel name, targeting 'customers' table in 'public' schema
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' }, // Listen to all changes in 'customers' table
        (payload) => {
          console.log('🔔 Real-time update received:', payload);
          // Reload data or apply changes directly based on payload
          loadCustomers(); // Reload all data to ensure consistency
        }
      )
      .subscribe(); // Activate the subscription

  } catch (error) {
    console.error('❌ Fatal error loading customers:', error);
    alert('Failed to load customer data. Please check console for details.');
  }
}

// Forces a full reload of customer data from Supabase (used by refresh button, after add/delete)
async function loadCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) throw error; // Propagate error for outer catch

    customers = data || [];
    // Re-apply current search filter after reload
    const currentSearchTerm = searchInput.value.trim().toLowerCase();
    if (currentSearchTerm) {
      filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(currentSearchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(currentSearchTerm)) ||
        customer.phone.toLowerCase().includes(currentSearchTerm) ||
        customer.service.toLowerCase().includes(currentSearchTerm)
      );
    } else {
      filteredCustomers = [...customers];
    }
    updateCustomerTable(); // Re-render table
  } catch (error) {
    console.error('Error reloading customers:', error);
    alert('Error reloading data: ' + error.message);
  }
}

// Deletes a customer record from Supabase by ID
window.deleteCustomer = async function(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return; // Confirmation dialog
  
  try {
    console.log(`🗑️ Deleting customer with ID: ${id}`);
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id); // Match by ID

    if (error) throw error; // Propagate error

    console.log('✅ Customer entry deleted successfully');
    await loadCustomers(); // Reload data after deletion
  } catch (error) {
    console.error('❌ Error deleting entry:', error);
    alert('Error deleting entry: ' + error.message);
  }
};

// --- Utility Functions ---

// Safely escapes HTML characters to prevent XSS vulnerabilities
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Tests initial connection to Supabase
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('customers').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('✅ Supabase client connection established.');
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    alert('Initial database connection test failed. Please check your Supabase configuration and network.');
  }
}

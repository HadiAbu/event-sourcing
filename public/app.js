// Frontend JavaScript for Event Sourcing demo

const socket = io();

// DOM elements
const createUserForm = document.getElementById("createUserForm");
const userNameInput = document.getElementById("userName");
const userEmailInput = document.getElementById("userEmail");
const accountIdInput = document.getElementById("accountId");
const amountInput = document.getElementById("amount");
const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const closeAccountBtn = document.getElementById("closeAccountBtn");
const refreshAccountsBtn = document.getElementById("refreshAccountsBtn");
const accountsList = document.getElementById("accountsList");
const eventLog = document.getElementById("eventLog");

// Event listeners
createUserForm.addEventListener("submit", handleCreateUser);
depositBtn.addEventListener("click", () => handleTransaction("deposit"));
withdrawBtn.addEventListener("click", () => handleTransaction("withdraw"));
closeAccountBtn.addEventListener("click", handleCloseAccount);
refreshAccountsBtn.addEventListener("click", loadAccounts);

// Socket.io event listener for real-time events
socket.on("events", (events) => {
  events.forEach((event) => addEventToLog(event));
  loadAccounts(); // Refresh accounts when new events arrive
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadAccounts();
});

// API functions
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

async function handleCreateUser(e) {
  e.preventDefault();

  const name = userNameInput.value.trim();
  const email = userEmailInput.value.trim();

  if (!name || !email) return;

  try {
    const result = await apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify({ name, email }),
    });

    alert(`User created! Account ID: ${result.accountId}`);
    userNameInput.value = "";
    userEmailInput.value = "";
    accountIdInput.value = result.accountId; // Auto-fill account ID
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function handleTransaction(type) {
  const accountId = accountIdInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!accountId || isNaN(amount) || amount <= 0) {
    alert("Please enter valid account ID and amount");
    return;
  }

  try {
    const endpoint = `/api/accounts/${accountId}/${type}`;
    await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify({ amount, currency: "USD" }),
    });

    amountInput.value = "";
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function handleCloseAccount() {
  const accountId = accountIdInput.value.trim();

  if (!accountId) {
    alert("Please enter account ID");
    return;
  }

  if (!confirm("Are you sure you want to close this account?")) return;

  try {
    await apiRequest(`/api/accounts/${accountId}/close`, {
      method: "POST",
      body: JSON.stringify({ reason: "Closed by user" }),
    });

    alert("Account closed successfully");
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function loadAccounts() {
  try {
    const result = await apiRequest("/api/accounts");
    displayAccounts(result.accounts);
  } catch (error) {
    console.error("Error loading accounts:", error);
  }
}

function displayAccounts(accounts) {
  accountsList.innerHTML = "";

  if (accounts.length === 0) {
    accountsList.innerHTML = "<p>No accounts found.</p>";
    return;
  }

  accounts.forEach((account) => {
    const accountCard = document.createElement("div");
    accountCard.className = `account-card ${account.isClosed ? "closed" : ""}`;

    accountCard.innerHTML = `
            <h3>${account.name || "Unknown User"}</h3>
            <p><strong>Account ID:</strong> ${account.aggregateId}</p>
            <p><strong>Email:</strong> ${account.email || "N/A"}</p>
            <p class="balance"><strong>Balance:</strong> $${account.balance.toFixed(
              2
            )} ${account.currency}</p>
            <p><strong>Status:</strong> ${
              account.isClosed ? "Closed" : "Active"
            }</p>
            <p><strong>Last Activity:</strong> ${new Date(
              account.lastActivity
            ).toLocaleString()}</p>
        `;

    accountsList.appendChild(accountCard);
  });
}

function addEventToLog(event) {
  const eventItem = document.createElement("div");
  eventItem.className = "event-item";

  eventItem.innerHTML = `
        <div class="event-type">${event.eventType}</div>
        <div class="timestamp">${new Date(
          event.timestamp
        ).toLocaleString()}</div>
        <div class="data">${JSON.stringify(event.data, null, 2)}</div>
    `;

  eventLog.appendChild(eventItem);
  eventLog.scrollTop = eventLog.scrollHeight; // Auto-scroll to bottom
}

// Load initial events
async function loadInitialEvents() {
  try {
    // Get all accounts and load their events
    const result = await apiRequest("/api/accounts");
    for (const account of result.accounts) {
      const eventsResult = await apiRequest(
        `/api/accounts/${account.aggregateId}/events`
      );
      eventsResult.events.forEach((event) => addEventToLog(event));
    }
  } catch (error) {
    console.error("Error loading initial events:", error);
  }
}

// Load initial events on page load
loadInitialEvents();

document.addEventListener('DOMContentLoaded', () => {
    const creationDropdown = document.getElementById('due_date');
    populateDueDateDropdown(creationDropdown);
    const form = document.getElementById('taxPaymentForm');
    const paymentTable = document.getElementById('paymentTableBody');
    const filterDueDate = document.getElementById('filterDueDate');    
    populateDueDateDropdown(filterDueDate);
    const clearButton = document.getElementById('clearButton');

    function fetchTaxPayments() {
        fetch('/tax-payments')
            .then(response => response.json())
            .then(payments => {
                paymentTable.innerHTML = '';
                payments.forEach(payment => addPaymentToTable(payment));
            });
    }

    function addPaymentToTable(payment) {
        const row = paymentTable.insertRow();
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${payment.company}</td>
            <td>$${payment.amount.toFixed(2)}</td>
            <td>${payment.payment_date || 'NA'}</td>
            <td>${payment.status}</td>
            <td>${payment.due_date}</td>
            <td>
                <button onclick="editPayment(${payment.id})">Edit</button>
                <button onclick="deletePayment(${payment.id})">Delete</button>
            </td>
        `;
    }

    function submitPayment(event) {
        event.preventDefault();
        const formData = {
            id: document.getElementById('paymentId').value,
            company: document.getElementById('company').value,
            amount: document.getElementById('amount').value,
            payment_date: document.getElementById('paymentDate').value || 'NA',
            status: document.getElementById('status').value,
            due_date: document.getElementById('due_date').value
        };

        const url = formData.id ? `/tax-payments/${formData.id}` : '/tax-payments';
        const method = formData.id ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(() => {
            location.reload();
            fetchTaxPayments();
            form.reset();              
        });
    }
    
    function populateDueDateDropdown(dropdownElement, selectedDate = null) {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
    
        // Clear existing options
        dropdownElement.innerHTML = '';
    
        // Add default option
        const defaultOption = new Option("Select Due Date", "");
        dropdownElement.add(defaultOption);
    
        // Due dates for the current and next year
        const dueDates = [
            `04/15/${currentYear}`,
            `06/15/${currentYear}`,
            `09/15/${currentYear}`,
            `01/15/${nextYear}`
        ];
    
        // Populate dropdown with due dates
        dueDates.forEach(date => {
            const option = new Option(date, date); // Use the same value for text and value
            if (selectedDate === date) {
                option.selected = true; // Pre-select if matching selectedDate
            }
            dropdownElement.add(option);
        });
    
        console.log("Dropdown populated with values in MM/DD/YYYY format:", dueDates);
    }
   

    function filterPaymentsByDueDate(event) {
        const dueDate = event.target.value;
        const summaryTableBody = document.getElementById('summaryTableBody');
        const paymentTableBody = document.getElementById('filteredpaymentTable'); // Add reference to the main table body        

        // Fetch filtered payments by due date
        fetch(`/tax-payments/filter?due_date=${dueDate}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch payments");
                }
                return response.json();
            })
            .then(payments => {
                // Clear and repopulate the main table
                paymentTableBody.innerHTML = '';
                if (payments.length === 0) {
                    // No records found: Empty table with just headers
                    paymentTableBody.innerHTML = `<tr><td colspan="6">No records found.</td></tr>`;
                    summaryTableBody.innerHTML = '';
                    return; // Do not show totals
                }

                payments.forEach(payment => {
                    const row = paymentTableBody.insertRow();
                    row.innerHTML = `
                        <td>${payment.id}</td>
                        <td>${payment.company}</td>
                        <td>$${payment.amount.toFixed(2)}</td>
                        <td>${payment.payment_date || 'NA'}</td>
                        <td>${payment.status}</td>
                        <td>${payment.due_date}</td>                        
                    `;
                });
    
                // Calculate total amount for the summary table
                let totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
                // Populate the summary table
                summaryTableBody.innerHTML = `                    
                    <tr>
                       <td colspan="5" class="custom-bold">Total Amount</td>
                       <td>$${totalAmount.toFixed(2)}</td>
                    </tr> 
                    <tr>
                       <td colspan="5" class="custom-bold">Tax Rate:</td>
                       <td contenteditable="true" id="editableTaxRate">0.06</td>
                    </tr>
                    <tr>
                       <td colspan="5" class="custom-bold">Tax Due:</td>
                       <td id="calculatedTaxDue">$${(totalAmount * 0.06).toFixed(2)}</td>
                    </tr>                
                `;
    
                // Add event listener to the editable Tax Rate cell
                const taxRateCell = document.getElementById('editableTaxRate');
                const taxDueCell = document.getElementById('calculatedTaxDue');
    
                taxRateCell.addEventListener('input', () => {
                    const taxRate = parseFloat(taxRateCell.textContent) || 0;
                    const taxDue = totalAmount * taxRate;    
                    // Update the Tax Due cell
                    taxDueCell.textContent = `$${taxDue.toFixed(2)}`;
                });
            })
            .catch(error => {
                console.error("Error fetching filtered payments:", error);
    
                // Handle error gracefully
                paymentTableBody.innerHTML = `<tr><td colspan="6">No payments match the filter.</td></tr>`;
                summaryTableBody.innerHTML = `
                    <tr>
                        <td colspan="3">Error fetching payments. Please try again later.</td>
                    </tr>
                `;
            });
    }    

    window.editPayment = function (id) {
        fetch(`/tax-payments`)
            .then((response) => response.json())
            .then((payments) => {
                const payment = payments.find((p) => p.id === id);
                if (payment) {
                    openEditModal(payment);
                } else {
                    alert('Payment not found!');
                }
            })
            .catch((error) => console.error("Error fetching payment details:", error));
    };

    function openEditModal(payment) {
        document.getElementById('editPaymentId').value = payment.id;
        document.getElementById('editCompany').value = payment.company;
        document.getElementById('editAmount').value = payment.amount;
        document.getElementById('editPaymentDate').value = payment.payment_date || '';
        document.getElementById('editStatus').value = payment.status;        
        const editDropdown = document.getElementById('editDueDate');
        populateDueDateDropdown(editDropdown, payment.due_date);
        document.getElementById('editModal').style.display = 'block';
    }

    window.closeEditModal = function () {
        document.getElementById('editModal').style.display = 'none';
    };
    

    // Handle Save Action for Edit
    document.getElementById('editPaymentForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = {
            id: document.getElementById('editPaymentId').value,
            company: document.getElementById('editCompany').value,
            amount: parseFloat(document.getElementById('editAmount').value),
            payment_date: document.getElementById('editPaymentDate').value || 'NA',
            status: document.getElementById('editStatus').value,
            due_date: document.getElementById('editDueDate').value,
        };

        fetch(`/tax-payments/${formData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
            .then((response) => {
                if (response.ok) {
                    fetchTaxPayments();
                    closeEditModal();
                } else {
                    alert('Failed to save payment!');
                }
            })
            .catch((error) => console.error("Error updating payment:", error));
    });

    window.deletePayment = function(id) {
        if (confirm('Are you sure you want to delete this payment?')) {
            fetch(`/tax-payments/${id}`, { method: 'DELETE' })
                .then(() => fetchTaxPayments());
        }
    }

    clearButton.addEventListener('click', () => form.reset());
    form.addEventListener('submit', submitPayment);
    filterDueDate.addEventListener('change', filterPaymentsByDueDate);

    fetchTaxPayments();
});
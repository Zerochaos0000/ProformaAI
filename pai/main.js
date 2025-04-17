
document.addEventListener("DOMContentLoaded", function() {

  document.getElementById('calculate').addEventListener('click', calculateProforma);
  document.getElementById('exportPdf').addEventListener('click', () => window.print());
  document.getElementById('exportXls').addEventListener('click', exportToExcel);
  document.getElementById('autofillDemo').addEventListener('click', autofillDemo);
  document.getElementById('resetInputs').addEventListener('click', resetInputs);

  function parseCurrency(val) {
    return Number(val.replace(/[^0-9.-]+/g, "")) || 0;
  }

  let decisionText = '';

  function calculateProforma() {
    const units = [
      { count: parseCurrency(document.getElementById('oneBedUnits').value), rent: parseCurrency(document.getElementById('rent1Bed').value) },
      { count: parseCurrency(document.getElementById('twoBedUnits').value), rent: parseCurrency(document.getElementById('rent2Bed').value) },
      { count: parseCurrency(document.getElementById('threeBedUnits').value), rent: parseCurrency(document.getElementById('rent3Bed').value) }
    ];

    const otherIncome = parseCurrency(document.getElementById('otherIncome').value);
    const vacancyRate = parseFloat(document.getElementById('vacancyRate').value) / 100;

    const grossPotentialRent = units.reduce((sum, u) => sum + (u.count * u.rent * 12), 0);
    const vacancyLoss = grossPotentialRent * vacancyRate;
    const effectiveGrossIncome = grossPotentialRent + otherIncome - vacancyLoss;

    const expenses = ['propertyTaxes','insurance','utilities','maintenance','management','supplies','staff','misc']
      .map(id => parseCurrency(document.getElementById(id).value));
    const totalExpenses = expenses.reduce((a, b) => a + b, 0);

    const NOI = effectiveGrossIncome - totalExpenses;

    const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
    const loanTerm = parseInt(document.getElementById('loanTerm').value);
    const monthlyRate = interestRate / 12;
    const monthlyPayment = loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTerm * 12));
    const annualDebtService = monthlyPayment * 12;

    const cashFlowBeforeTax = NOI - annualDebtService;
    const purchasePrice = parseCurrency(document.getElementById('purchasePrice').value);
    const initialEquity = purchasePrice - loanAmount;
    const cashOnCash = (cashFlowBeforeTax / initialEquity) * 100;

    if (cashOnCash >= 12) {
      decisionText = `✅ This appears to be a strong investment opportunity (CoC: ${cashOnCash.toFixed(2)}%)`;
    } else if (cashOnCash >= 8) {
      decisionText = `⚠️ Moderate returns. Consider refining assumptions (CoC: ${cashOnCash.toFixed(2)}%)`;
    } else {
      decisionText = `❌ Low investment return. Proceed with caution (CoC: ${cashOnCash.toFixed(2)}%)`;
    }

    const resultsHTML = `
      <table class="w-full text-left border-collapse">
        <tr><td>Total Potential Rent</td><td>$${grossPotentialRent.toLocaleString()}</td></tr>
        <tr><td>Vacancy Loss</td><td>$${vacancyLoss.toLocaleString()}</td></tr>
        <tr><td>Effective Gross Income</td><td>$${effectiveGrossIncome.toLocaleString()}</td></tr>
        <tr><td>Operating Expenses</td><td>$${totalExpenses.toLocaleString()}</td></tr>
        <tr><td>Net Operating Income (NOI)</td><td>$${NOI.toLocaleString()}</td></tr>
        <tr><td>Annual Debt Service</td><td>$${annualDebtService.toLocaleString()}</td></tr>
        <tr class="font-bold"><td>Cash Flow Before Tax</td><td>$${cashFlowBeforeTax.toLocaleString()}</td></tr>
        <tr><td>Cash-on-Cash Return</td><td>${cashOnCash.toFixed(2)}%</td></tr>
      </table>
      <p class="mt-4 font-semibold">${decisionText}</p>
    `;
    document.getElementById('results').innerHTML = resultsHTML;

    renderCharts(effectiveGrossIncome, NOI, totalExpenses);
    render5YearProforma(effectiveGrossIncome, totalExpenses, annualDebtService);
  }

  function renderCharts(egi, noi, expenses) {
    const incomeCtx = document.getElementById('incomeChart').getContext('2d');
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    new Chart(incomeCtx, {
      type: 'bar',
      data: {
        labels: ['EGI', 'NOI'],
        datasets: [{ data: [egi, noi], backgroundColor: ['#3b82f6','#22c55e'] }]
      }
    });
    new Chart(expenseCtx, {
      type: 'pie',
      data: {
        labels: ['Expenses', 'NOI'],
        datasets: [{ data: [expenses, noi], backgroundColor: ['#ef4444','#22c55e'] }]
      }
    });
  }



    inputSheet["A1"].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };
    inputSheet["A3"] = { t: "s", v: "Category", s: { font: { bold: true } } };
    inputSheet["B3"] = { t: "s", v: "Field", s: { font: { bold: true } } };
    inputSheet["C3"] = { t: "s", v: "Value", s: { font: { bold: true } } };

    XLSX.utils.book_append_sheet(wb, inputSheet, "Inputs");

    // Export Results
    const resultsTable = document.querySelector('#results table');
    if (resultsTable) {
      const summarySheet = XLSX.utils.table_to_sheet(resultsTable);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Results");
    }

    // Export 5-Year Projection
    const fiveYearTable = document.querySelector('#fiveYearTable table');
    if (fiveYearTable) {
      const projSheet = XLSX.utils.table_to_sheet(fiveYearTable);
      XLSX.utils.book_append_sheet(wb, projSheet, "5-Year Projection");
    }

    XLSX.writeFile(wb, "Multifamily_Proforma_Export.xlsx");
  }

  // Reset
  function resetInputs() {
    document.querySelectorAll('input').forEach(input => input.value = '');
  }

  // Autofill Demo
  function autofillDemo() {
    document.getElementById('oneBedUnits').value = 20;
    document.getElementById('rent1Bed').value = 1200;
    document.getElementById('twoBedUnits').value = 35;
    document.getElementById('rent2Bed').value = 1500;
    document.getElementById('threeBedUnits').value = 15;
    document.getElementById('rent3Bed').value = 1800;

    document.getElementById('otherIncome').value = 25000;
    document.getElementById('vacancyRate').value = 5;

    document.getElementById('propertyTaxes').value = 40000;
    document.getElementById('insurance').value = 12000;
    document.getElementById('utilities').value = 25000;
    document.getElementById('maintenance').value = 15000;
    document.getElementById('management').value = 20000;
    document.getElementById('supplies').value = 5000;
    document.getElementById('staff').value = 30000;
    document.getElementById('misc').value = 8000;

    document.getElementById('purchasePrice').value = 5000000;
    document.getElementById('loanAmount').value = 3500000;
    document.getElementById('interestRate').value = 5;
    document.getElementById('loanTerm').value = 25;
  }


  // Modified version of render5YearProforma with accurate inflation-based projection
  function render5YearProforma(income, expenses, debtService) {
    const rentGrowth = [0, 0.05, 0.02, 0.02, 0.02];
    const otherGrowth = [0, 0.03, 0.02, 0.02, 0.02];
    const expenseGrowth = [0, 0.02, 0.02, 0.02, 0.02];
    const vacancyRate = 0.05;

    const baseOtherIncome = parseCurrency(document.getElementById('otherIncome').value);
    const baseRentIncome = income + (vacancyRate * income) - baseOtherIncome;

    let table = '<table class="w-full text-left"><tr><th>Year</th><th>Potential Rental Income</th><th>Total Other Income</th><th>Potential Gross Income</th><th>Vacancy Loss</th><th>EGI</th><th>Operating Expenses</th><th>NOI</th><th>Operating Margin</th><th>Debt Service</th><th>Cash Flow</th></tr>';

    for (let y = 0; y < 5; y++) {
      const rental = baseRentIncome * (1 + rentGrowth.slice(0, y + 1).reduce((a, b) => a + b, 0));
      const other = baseOtherIncome * (1 + otherGrowth.slice(0, y + 1).reduce((a, b) => a + b, 0));
      const gross = rental + other;
      const vacancy = gross * vacancyRate;
      const egi = gross - vacancy;
      const yearlyExpenses = expenses * Math.pow(1.02, y);
      const noi = egi - yearlyExpenses;
      const margin = (noi / egi) * 100;
      const cf = noi - debtService;

      table += `<tr>
        <td>Year ${y + 1}</td>
        <td>$${rental.toFixed(0)}</td>
        <td>$${other.toFixed(0)}</td>
        <td>$${gross.toFixed(0)}</td>
        <td>$${vacancy.toFixed(0)}</td>
        <td>$${egi.toFixed(0)}</td>
        <td>$${yearlyExpenses.toFixed(0)}</td>
        <td>$${noi.toFixed(0)}</td>
        <td>${margin.toFixed(1)}%</td>
        <td>$${debtService.toFixed(0)}</td>
        <td>$${cf.toFixed(0)}</td>
      </tr>`;
    }

    // Future Sale Calculation at Year 5
    const exitCapRate = 0.06;
    const year5NOI = (baseRentIncome * Math.pow(1.02, 4) + baseOtherIncome * Math.pow(1.02, 4)) * (1 - vacancyRate) - expenses * Math.pow(1.02, 4);
    const saleValue = year5NOI / exitCapRate;
    const costOfSale = saleValue * 0.03;
    const loanTerm = parseInt(document.getElementById('loanTerm').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
    const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
    const monthlyRate = interestRate / 12;
    const loanBalance = loanAmount * Math.pow(1 + monthlyRate, loanTerm * 12 - 60) - (loanAmount * monthlyRate * ((Math.pow(1 + monthlyRate, loanTerm * 12 - 60) - 1) / monthlyRate));

    const netProceeds = saleValue - costOfSale - loanBalance;

    table += `<tr><td colspan="11"><strong>Future Sale Value</strong>: $${saleValue.toFixed(0)}</td></tr>`;
    table += `<tr><td colspan="11"><strong>Less: Cost of Sale (3%)</strong>: $${costOfSale.toFixed(0)}</td></tr>`;
    table += `<tr><td colspan="11"><strong>Less: Loan Balance (Year 5)</strong>: $${loanBalance.toFixed(0)}</td></tr>`;
    table += `<tr><td colspan="11"><strong>Net Sale Proceeds</strong>: $${netProceeds.toFixed(0)}</td></tr>`;

    table += '</table>';
    document.getElementById('fiveYearTable').innerHTML = table;
  }


  function exportToExcel() {
    const wb = XLSX.utils.book_new();

    const title = [["REProforma - Multifamily Acquisition Proforma"]];
    const spacer = [[""]];

    const inputData = [
      ["Category", "Field", "Value"],
      ["Rental Mix", "1-Bed Units", document.getElementById('oneBedUnits').value],
      ["Rental Mix", "Rent per 1-Bed", document.getElementById('rent1Bed').value],
      ["Rental Mix", "2-Bed Units", document.getElementById('twoBedUnits').value],
      ["Rental Mix", "Rent per 2-Bed", document.getElementById('rent2Bed').value],
      ["Rental Mix", "3-Bed Units", document.getElementById('threeBedUnits').value],
      ["Rental Mix", "Rent per 3-Bed", document.getElementById('rent3Bed').value],
      spacer[0],
      ["Income", "Other Income", document.getElementById('otherIncome').value],
      ["Income", "Vacancy Rate (%)", document.getElementById('vacancyRate').value],
      spacer[0],
      ["Expenses", "Property Taxes", document.getElementById('propertyTaxes').value],
      ["Expenses", "Insurance", document.getElementById('insurance').value],
      ["Expenses", "Utilities", document.getElementById('utilities').value],
      ["Expenses", "Maintenance", document.getElementById('maintenance').value],
      ["Expenses", "Management", document.getElementById('management').value],
      ["Expenses", "Supplies", document.getElementById('supplies').value],
      ["Expenses", "Staff", document.getElementById('staff').value],
      ["Expenses", "Misc & Reserves", document.getElementById('misc').value],
      spacer[0],
      ["Financing", "Purchase Price", document.getElementById('purchasePrice').value],
      ["Financing", "Loan Amount", document.getElementById('loanAmount').value],
      ["Financing", "Interest Rate (%)", document.getElementById('interestRate').value],
      ["Financing", "Loan Term (Years)", document.getElementById('loanTerm').value],
    ];

    const inputSheet = XLSX.utils.aoa_to_sheet([...title, [], ...inputData]);
    XLSX.utils.book_append_sheet(wb, inputSheet, "Inputs");

    const resultsTable = document.querySelector('#results table');
    if (resultsTable) {
      const summarySheet = XLSX.utils.table_to_sheet(resultsTable);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Results");
    }

    const fiveYearTable = document.querySelector('#fiveYearTable table');
    if (fiveYearTable) {
      const projSheet = XLSX.utils.table_to_sheet(fiveYearTable);
      XLSX.utils.book_append_sheet(wb, projSheet, "5-Year Projection + Sale");
    }

    XLSX.writeFile(wb, "Multifamily_Proforma_Export.xlsx");
  }
});

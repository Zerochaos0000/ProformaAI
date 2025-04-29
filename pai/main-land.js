document.addEventListener('DOMContentLoaded', () => {

  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => {
        btn.classList.remove('border-[#6941C6]', 'text-[#6941C6]');
        btn.classList.add('border-transparent', 'text-gray-500');
      });
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.remove('border-transparent', 'text-gray-500');
      button.classList.add('border-[#6941C6]', 'text-[#6941C6]');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });

  // Helper function to parse input values
  const parse = (id) => {
    const element = document.getElementById(id);
    if (!element) return 0;
    
    const value = element.value.trim().replace(/,/g, '');
    return parseFloat(value) || 0;
  };

  // Initialize summary cards
  initializeSummaryCards();
  
  // Initialize charts
  initCharts();

  // Calculate button event listener
  document.getElementById('calculate').addEventListener('click', calculateProforma);

  // Demo data button event listener
  document.getElementById('autofillDemo').addEventListener('click', autofillDemoData);

  // Reset inputs button event listener
  document.getElementById('resetInputs').addEventListener('click', resetInputs);

  // Main calculation function
  function calculateProforma() {
  // Get lot mix values
  const sfdCount = parse('sfdCount');
  const sfdPrice = parse('sfdPrice');
  const twinCount = parse('twinCount');
  const twinPrice = parse('twinPrice');
  const sfaCount = parse('sfaCount');
  const sfaPrice = parse('sfaPrice');

  // Calculate land costs
  const land = parse('landCost');
  const closingRate = parse('closingCost') / 100;
  const closing = land * closingRate;

  // Development costs
  const devCosts = [
    parse('onsiteDev'), parse('consulting'), parse('delmarva'),
    parse('landscaping'), parse('mailboxes'), parse('monuments'),
    parse('dedication'), parse('escalation'), parse('contingency')
  ];
  const totalDev = devCosts.reduce((a, b) => a + b, 0);

  // Soft costs
  const transferTaxRate = parse('transferTax') / 100;
  const propertyTax = parse('propertyTax');
  const bondingRate = parse('bonding') / 100;
  const transferTax = transferTaxRate * ((sfdCount * sfdPrice) + (twinCount * twinPrice) + (sfaCount * sfaPrice));
  const propertyTaxTotal = propertyTax * (sfdCount + twinCount + sfaCount);
  const bondingCost = bondingRate * totalDev;
  const softCosts = transferTax + propertyTaxTotal + parse('hoaSubsidy') + parse('dueDiligence') + parse('legalTax') + bondingCost;

  // Revenue and costs
  const totalRevenue = (sfdCount * sfdPrice) + (twinCount * twinPrice) + (sfaCount * sfaPrice);
  const totalCost = land + closing + totalDev + softCosts;
  const profit = totalRevenue - totalCost;
  const margin = (profit / totalRevenue) * 100;

  // Financing calculations
  const loanToCostRate = parse('loanToCost') / 100;
  const interestRate = parse('interestRate') / 100;
  const loanFeesRate = parse('loanFees') / 100;
  const loanAmount = totalCost * loanToCostRate;
  const loanInterest = loanAmount * interestRate;
  const loanFees = loanAmount * loanFeesRate;

  // IRR (simplified)
  const irr = ((profit / totalCost) * 100).toFixed(1);

  // Update UI
  updateSummaryCards(totalRevenue, totalCost, profit, margin, irr);
  updateSensitivityTables(totalRevenue, totalCost);

  // Update charts
  updateProjectionChart(sfdCount, twinCount, sfaCount, sfdPrice, twinPrice, sfaPrice, parse('sfdEscalation')/100, parse('twinEscalation')/100, parse('sfaEscalation')/100);
  updateLotAbsorptionChart(sfdCount, twinCount, sfaCount);
  updateRevenueBreakdownChart(sfdCount, twinCount, sfaCount, sfdPrice, twinPrice, sfaPrice);
  updateCostBreakdownChart(land, closing, totalDev, softCosts, loanInterest + loanFees);
  updateMonthlyCashFlowChart(totalRevenue, totalCost);
  updateCumulativeReturnChart(totalRevenue, totalCost);

  // Switch to results tab
  document.querySelector('[data-tab="results-tab"]').click();
}

  // Initialize summary cards
  function initializeSummaryCards() {
    const summaryCards = document.getElementById('summary-cards');
    summaryCards.innerHTML = `
      <div class="bg-[#f9f5ff] p-4 rounded border border-[#e9d7fe]">
        <p class="text-sm text-[#6941C6] font-medium">Total Revenue</p>
        <p class="text-2xl font-bold text-[#42307d]">$0</p>
      </div>
      <div class="bg-[#f0f9ff] p-4 rounded border border-[#b9e6fe]">
        <p class="text-sm text-[#0056b3] font-medium">Total Costs</p>
        <p class="text-2xl font-bold text-[#043959]">$0</p>
      </div>
      <div class="bg-[#ecfdf3] p-4 rounded border border-[#a6f4c5]">
        <p class="text-sm text-[#027a48] font-medium">Developer Profit</p>
        <p class="text-2xl font-bold text-[#054f31]">$0</p>
      </div>
      <div class="bg-[#fef3f2] p-4 rounded border border-[#fee4e2]">
        <p class="text-sm text-[#b42318] font-medium">IRR (Unlevered)</p>
        <p class="text-2xl font-bold text-[#7a271a]">0%</p>
      </div>
    `;
  }

  // Update summary cards with calculated values
  function updateSummaryCards(totalRevenue, totalCost, profit, margin, irr) {
    const summaryCards = document.getElementById('summary-cards');
    
    // Format the IRR value
    const irrValue = parseFloat(irr);
    const irrClass = irrValue >= 15 ? 'bg-[#ecfdf3] border-[#a6f4c5] text-[#054f31]' : 'bg-[#fef3f2] border-[#fee4e2] text-[#7a271a]';
    const irrTextClass = irrValue >= 15 ? 'text-[#027a48]' : 'text-[#b42318]';
    
    // Format the profit value
    const profitClass = profit >= 0 ? 'bg-[#ecfdf3] border-[#a6f4c5] text-[#054f31]' : 'bg-[#fef3f2] border-[#fee4e2] text-[#7a271a]';
    const profitTextClass = profit >= 0 ? 'text-[#027a48]' : 'text-[#b42318]';

    summaryCards.innerHTML = `
      <div class="bg-[#f9f5ff] p-4 rounded border border-[#e9d7fe]">
        <p class="text-sm text-[#6941C6] font-medium">Total Revenue</p>
        <p class="text-2xl font-bold text-[#42307d]">$${totalRevenue.toLocaleString()}</p>
      </div>
      <div class="bg-[#f0f9ff] p-4 rounded border border-[#b9e6fe]">
        <p class="text-sm text-[#0056b3] font-medium">Total Costs</p>
        <p class="text-2xl font-bold text-[#043959]">$${totalCost.toLocaleString()}</p>
      </div>
      <div class="${profitClass} p-4 rounded border">
        <p class="text-sm ${profitTextClass} font-medium">Developer Profit</p>
        <p class="text-2xl font-bold">$${profit.toLocaleString()}</p>
        <p class="text-xs mt-1">${margin.toFixed(1)}% margin</p>
      </div>
      <div class="${irrClass} p-4 rounded border">
        <p class="text-sm ${irrTextClass} font-medium">IRR (Unlevered)</p>
        <p class="text-2xl font-bold">${irr}%</p>
      </div>
    `;
  }

  // Autofill demo data
  function autofillDemoData() {
    const autofillValues = {
      sfdCount: 100,
      sfdPrice: 200000,
      sfdEscalation: 3.5,
      twinCount: 50,
      twinPrice: 150000,
      twinEscalation: 3.8,
      sfaCount: 50,
      sfaPrice: 125000,
      sfaEscalation: 3.0,
      landCost: 5500000,
      closingCost: 3.0,
      onsiteDev: 8500000,
      consulting: 250000,
      delmarva: 500000,
      landscaping: 500000,
      mailboxes: 50000,
      monuments: 125000,
      dedication: 250000,
      escalation: 250000,
      contingency: 1500000,
      transferTax: 2.1,
      propertyTax: 500,
      bonding: 2.0,
      hoaSubsidy: 25000,
      dueDiligence: 50000,
      legalTax: 150000,
      loanToCost: 70,
      interestRate: 8.0,
      loanFees: 2.0,
      payoffRate: 80
    };
    
    Object.entries(autofillValues).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
    
    // Trigger a calculation to update the results
    calculateProforma();
  }

  // Reset inputs
  function resetInputs() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
    
    // Reset summary cards
    initializeSummaryCards();
    
    // Reset charts
    initCharts();
    
    // Switch back to input tab
    document.querySelector('[data-tab="input-tab"]').click();
  }

  // Chart initialization functions
  function initCharts() {
// Only clear canvases, no real chart creation here
const chartIds = [
  'projectionGraph', 'irrCurve', 'lotAbsorption',
  'revenueBreakdown', 'costBreakdown', 'monthlyCashFlow', 'cumulativeReturn'
];
chartIds.forEach(id => {
  const canvas = document.getElementById(id);
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});

    // Projection Chart
    const projectionCtx = document.getElementById('projectionGraph');
    if (projectionCtx) {
      new Chart(projectionCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
          datasets: [{
            label: 'Projected Cash Flow',
            data: [100000, 250000, 350000, 450000, 600000],
            borderColor: 'rgba(105, 65, 198, 0.7)',
            backgroundColor: 'rgba(105, 65, 198, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // IRR Curve Chart
    const irrCtx = document.getElementById('irrCurve');
    if (irrCtx) {
      new Chart(irrCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['5%', '10%', '15%', '20%', '25%'],
          datasets: [{
            label: 'IRR Curve',
            data: [0.5, 1.2, 2.1, 3.5, 5.0],
            borderColor: 'rgba(22, 163, 74, 0.7)',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Lot Absorption Chart
    const lotAbsorptionCtx = document.getElementById('lotAbsorption');
    if (lotAbsorptionCtx) {
      new Chart(lotAbsorptionCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Lot Absorption',
            data: [25, 35, 40, 50],
            backgroundColor: 'rgba(105, 65, 198, 0.7)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Revenue Breakdown Chart
    const revenueCtx = document.getElementById('revenueBreakdown');
    if (revenueCtx) {
      new Chart(revenueCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['SFD', 'Twin', 'SFA'],
          datasets: [{
            data: [60, 25, 15],
            backgroundColor: [
              'rgba(105, 65, 198, 0.7)',
              'rgba(14, 165, 233, 0.7)', 
              'rgba(245, 158, 11, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Cost Breakdown Chart
    const costCtx = document.getElementById('costBreakdown');
    if (costCtx) {
      new Chart(costCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Land', 'Development', 'Soft Costs', 'Financing'],
          datasets: [{
            data: [35, 40, 15, 10],
            backgroundColor: [
              'rgba(234, 88, 12, 0.7)',
              'rgba(22, 163, 74, 0.7)',
              'rgba(71, 85, 105, 0.7)',
              'rgba(0, 86, 179, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Monthly Cash Flow Chart
    const cashFlowCtx = document.getElementById('monthlyCashFlow');
    if (cashFlowCtx) {
      new Chart(cashFlowCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
          datasets: [{
            label: 'Net Cash Flow',
            data: [-1800000, -700000, 330000, 880000, 1170000, 770000, 500000, 225000],
            backgroundColor: function(context) {
              const value = context.dataset.data[context.dataIndex];
              return value < 0 ? 'rgba(229, 62, 62, 0.7)' : 'rgba(16, 185, 129, 0.7)';
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Cumulative Return Chart
    const cumulativeCtx = document.getElementById('cumulativeReturn');
    if (cumulativeCtx) {
      new Chart(cumulativeCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Initial', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
          datasets: [{
            label: 'Cumulative Return',
            data: [-100, -80, -30, 50, 130, 180],
            borderColor: '#6941C6',
            backgroundColor: 'rgba(105, 65, 198, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }

  // Chart update functions
  function updateProjectionChart(sfdCount, twinCount, sfaCount, sfdPrice, twinPrice, sfaPrice, 
    sfdEscalation, twinEscalation, sfaEscalation) {
    const sfdTotal = sfdCount * sfdPrice;
    const twinTotal = twinCount * twinPrice;
    const sfaTotal = sfaCount * sfaPrice;
    const totalRevenue = sfdTotal + twinTotal + sfaTotal;
    
    const quarters = 8;
    const revenueData = [];
    const expensesData = [];
    
    const revenueDistribution = [0, 0.1, 0.2, 0.25, 0.2, 0.15, 0.07, 0.03];
    const expenseDistribution = [0.3, 0.25, 0.15, 0.1, 0.07, 0.05, 0.05, 0.03];
    
    for (let i = 0; i < quarters; i++) {
      revenueData.push(totalRevenue * revenueDistribution[i]);
      expensesData.push(totalRevenue * 0.7 * expenseDistribution[i]);
    }
    
    const netCashFlow = revenueData.map((rev, i) => rev - expensesData[i]);
    const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'];
    
    const canvas = document.getElementById('projectionGraph');
if (window.projectionChartInstance) window.projectionChartInstance.destroy();
const ctx = canvas.getContext('2d');
    window.projectionChartInstance = window.lotAbsorptionChartInstance = window.revenueBreakdownChartInstance = window.costBreakdownChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            backgroundColor: 'rgba(105, 65, 198, 0.7)'
          },
          {
            label: 'Expenses',
            data: expensesData,
            backgroundColor: 'rgba(229, 62, 62, 0.7)'
          },
          {
            label: 'Net Cash Flow',
            type: 'line',
            data: netCashFlow,
            borderColor: 'rgba(22, 163, 74, 1)',
            borderWidth: 2,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: {
              display: true,
              text: 'Amount ($)'
            }
          }
        }
      }
    });
  }

  function updateLotAbsorptionChart(sfdCount, twinCount, sfaCount) {
    const totalLots = sfdCount + twinCount + sfaCount;
    const absorptionData = [
      Math.round(totalLots * 0.2),
      Math.round(totalLots * 0.25),
      Math.round(totalLots * 0.25),
      Math.round(totalLots * 0.2),
      Math.round(totalLots * 0.1)
    ];
    
    const canvas = document.getElementById('lotAbsorption');
if (window.lotAbsorptionChartInstance) window.lotAbsorptionChartInstance.destroy();
const ctx = canvas.getContext('2d');
    window.projectionChartInstance = window.lotAbsorptionChartInstance = window.revenueBreakdownChartInstance = window.costBreakdownChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
        datasets: [{
          label: 'Lots Absorbed',
          data: absorptionData,
          backgroundColor: 'rgba(16, 185, 129, 0.7)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: {
              display: true,
              text: 'Number of Lots'
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  function updateRevenueBreakdownChart(sfdCount, twinCount, sfaCount, sfdPrice, twinPrice, sfaPrice) {
    const sfdTotal = sfdCount * sfdPrice;
    const twinTotal = twinCount * twinPrice;
    const sfaTotal = sfaCount * sfaPrice;
    const totalRevenue = sfdTotal + twinTotal + sfaTotal;
    
    const sfdPercentage = Math.round((sfdTotal / totalRevenue) * 100);
    const twinPercentage = Math.round((twinTotal / totalRevenue) * 100);
    const sfaPercentage = 100 - sfdPercentage - twinPercentage;
    
    const canvas = document.getElementById('revenueBreakdown');
if (window.revenueBreakdownChartInstance) window.revenueBreakdownChartInstance.destroy();
const ctx = canvas.getContext('2d');
    window.projectionChartInstance = window.lotAbsorptionChartInstance = window.revenueBreakdownChartInstance = window.costBreakdownChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['SFD', 'Twin', 'SFA'],
        datasets: [{
          data: [sfdPercentage, twinPercentage, sfaPercentage],
          backgroundColor: [
            'rgba(105, 65, 198, 0.7)',
            'rgba(14, 165, 233, 0.7)', 
            'rgba(245, 158, 11, 0.7)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function updateCostBreakdownChart(land, closing, totalDev, softCosts, financeCosts) {
    const landTotal = land + closing;
    const totalCosts = landTotal + totalDev + softCosts + financeCosts;
    
    const landPercentage = Math.round((landTotal / totalCosts) * 100);
    const devPercentage = Math.round((totalDev / totalCosts) * 100);
    const softPercentage = Math.round((softCosts / totalCosts) * 100);
    const financePercentage = 100 - landPercentage - devPercentage - softPercentage;
    
    const canvas = document.getElementById('costBreakdown');
if (window.costBreakdownChartInstance) window.costBreakdownChartInstance.destroy();
const ctx = canvas.getContext('2d');
    window.projectionChartInstance = window.lotAbsorptionChartInstance = window.revenueBreakdownChartInstance = window.costBreakdownChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Land', 'Development', 'Soft Costs', 'Financing'],
        datasets: [{
          data: [landPercentage, devPercentage, softPercentage, financePercentage],
          backgroundColor: [
            'rgba(234, 88, 12, 0.7)',
            'rgba(22, 163, 74, 0.7)',
            'rgba(71, 85, 105, 0.7)',
            'rgba(0, 86, 179, 0.7)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
});

function updateSensitivityTables(totalRevenue, totalCost) {
  // Interest Rate Sensitivity
  const interestTable = document.getElementById('interest-sensitivity');
  interestTable.innerHTML = '<tr><th>Rate Change</th><th>Profit</th></tr>';
  const rates = [0, 1, 2];
  rates.forEach(rate => {
    const newCost = totalCost + (rate / 100) * totalCost * 0.5;
    const profit = totalRevenue - newCost;
    const rowColor = profit >= 0 ? 'bg-green-100' : 'bg-red-100';
    interestTable.innerHTML += `<tr class="${rowColor}"><td>+${rate}%</td><td>$${profit.toLocaleString()}</td></tr>`;
  });

  // Price Sensitivity
  const priceTable = document.getElementById('price-sensitivity');
  priceTable.innerHTML = '<tr><th>Price Change</th><th>Profit</th></tr>';
  const changes = [5, -5];
  changes.forEach(change => {
    const newRevenue = totalRevenue * (1 + (change / 100));
    const profit = newRevenue - totalCost;
    const rowColor = profit >= 0 ? 'bg-green-100' : 'bg-red-100';
    priceTable.innerHTML += `<tr class="${rowColor}"><td>${change > 0 ? '+' : ''}${change}%</td><td>$${profit.toLocaleString()}</td></tr>`;
  });

  // Absorption Sensitivity
  const absorptionTable = document.getElementById('absorption-sensitivity');
  absorptionTable.innerHTML = '<tr><th>Absorption</th><th>Profit</th></tr>';
  const scenarios = ['Fast', 'Slow'];
  const multipliers = [0.95, 1.05];
  scenarios.forEach((scenario, idx) => {
    const adjCost = totalCost * multipliers[idx];
    const profit = totalRevenue - adjCost;
    const rowColor = profit >= 0 ? 'bg-green-100' : 'bg-red-100';
    absorptionTable.innerHTML += `<tr class="${rowColor}"><td>${scenario}</td><td>$${profit.toLocaleString()}</td></tr>`;
  });
}

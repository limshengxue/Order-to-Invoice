// BEGIN EDITS ////////////////////////////////////////////////////////////////////////////////

// GROUP NAME    : Wantanmee
// DATE CREATED  : 23 JULY 2024
// DATE MODIFIED : 24 JULY 2024
// DESCRIPTION   : SALES ORDER TO INVOICE FUNCRIONS

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO EXTRACT SALES ORDER DETAILS FROM DOC
function orderDetailsExtract() {

  // docId = '15dp6r3AA7oehFXaOlfSnZkSBmips9YtzAJNv1FukCLE';

  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody().getText();

  const extractValue = (placeholder) => {
    const regex = new RegExp(`${placeholder}\\s*:\\s*(.+)`);
    const match = body.match(regex);
    return match ? match[1].trim() : null;
    
  };

  const details = {
    order_no: extractValue('ORDER NO'),
    customer_address:extractValue('ADDRESS'),
    customer_email: extractValue('CUSTOMER EMAIL'),
    customer_name: extractValue('BILL TO'),
    delivery_address:extractValue('SHIP TO'),
    fulfillment_date: extractValue('FULFILLMENT DATE'),
    issued_date: extractValue('ISSUED DATE'),
    ordered_by: extractValue('ORDERED BY'),
    special_notes: extractValue('Special Notes & Terms'),
    subtotal: parseFloat(extractValue('SUB TOTAL')),
    discount: parseFloat(extractValue('DISCOUNT')),
    tax: parseFloat(extractValue('TAX')),
    total: parseFloat(extractValue('TOTAL'))
  };

  // Log the extracted details
  Logger.log('Extracted Details: %s', JSON.stringify(details));

  return details;
}

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO EXTRACT ORDER ITEMS FROM DOC
function orderItemsExtract() {
  
  const doc = DocumentApp.getActiveDocument()
  const body = doc.getBody();

  // Find the table that contains the items
  const tables = body.getTables();
  let itemsTable = null;

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    // Logger.log('Checking table %d', i);
    if (table.getCell(0, 0).getText() === "Items") {
      itemsTable = table;
      break;
    }
  }

  if (!itemsTable) {
    Logger.log('Items table not found.');
    return null;
  }

  Logger.log('Items table found.');

  const items = [];
  const numRows = itemsTable.getNumRows();
  // Logger.log('Number of rows in the items table: %d', numRows);

  for (let i = 1; i < numRows; i++) { // Start from 1 to skip header
    const row = itemsTable.getRow(i);
    const numCells = row.getNumCells();
    // Logger.log('Number of cells in row %d: %d', i, numCells);

    // Ensure there are enough cells before accessing them
    if (numCells >= 4) {
      const qty = parseInt(row.getCell(0).getText().trim(), 10);
      const description = row.getCell(1).getText().trim();
      const unitCost = parseFloat(row.getCell(2).getText().trim());
      
      // CALCULATE NEW TOTAL 
      const total = qty * unitCost;

      if (!isNaN(qty) && description && !isNaN(unitCost)) {
        items.push({
          qty: qty,
          description: description,
          unit_cost: unitCost,
          total: total
        });
      } else {
        Logger.log('Skipping row %d due to invalid data.', i);
      }
    } else {
      Logger.log('Skipping row %d due to insufficient cells.', i);
    }
  }

  Logger.log('Extracted Items: %s', JSON.stringify(items));

  return items;
}

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO RECALCULATE TOTAL
function recalculateTotals(items) {
  
  let subtotal = 0;
  
  items.forEach(item => {
    subtotal += item.total;
  });

  const discount = subtotal * 0.05; // 5% discount
  const tax = (subtotal - discount) * 0.06; // 6% tax
  const overallTotal = subtotal - discount + tax;

  return {
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    tax: tax.toFixed(2),
    overallTotal: overallTotal.toFixed(2)
  };
}

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO UPDATE DOCUMENT
function updateDocs(items, totals) {
  
  const doc = DocumentApp.getActiveDocument()
  const body = doc.getBody();
  const tables = body.getTables();

  // UPDATE ISSUED DATE
  const currentDate = getCurrentDate();
  body.replaceText('{{issued_date}}', currentDate);

  let itemsTable = null;
  let totalsTable = null;

  for (let i = 0; i < tables.length; i++) {
    
    const table = tables[i];
    
    if (table.getCell(0, 0).getText().includes("Items")) {
      
      itemsTable = table;
      
      break;
    }
  }

  if (!itemsTable) {
    Logger.log('Items table not found.');
    
    return;

  } else {
    
    // Update item totals in the table
    for (let i = 1; i < itemsTable.getNumRows(); i++) { // Start from 1 to skip header
      
      const row = itemsTable.getRow(i);
      const item = items[i - 2]; // Adjust index because table row starts at 2

      if (item) {
        
        row.getCell(3).setText(item.total.toFixed(2)); // Update total cell

      }
    }
  }

  // Update totals in the document
  // body.replaceText(/SUB TOTAL\s*:\s*\d+\.\d{2}/, `SUB TOTAL ${totals.subtotal}`);
  // body.replaceText(/DISCOUNT\s*:\s*\d+\.\d{2}/, `DISCOUNT ${totals.discount}`);
  // body.replaceText(/TAX\s*:\s*\d+\.\d{2}/, `TAX ${totals.tax}`);
  // body.replaceText(/TOTAL\s*:\s*\d+\.\d{2}/, `TOTAL ${totals.overallTotal}`);

  
  for (let i = 0; i < tables.length; i++) {
    
    const table = tables[i];
    
    if (table.getCell(0, 0).getText().includes("SUB TOTAL  :")) {
      
      totalsTable = table;
      
      break;
    }
  }


  if (!totalsTable) {
    Logger.log('Totals table not found.');

    return;

  } else {

    // Update totals in the document
    totalsTable.getRow(0).getCell(1).setText(totals.subtotal); // Update SUB TOTAL
    totalsTable.getRow(1).getCell(1).setText(totals.discount); // Update DISCOUNT
    totalsTable.getRow(2).getCell(1).setText(totals.tax);      // Update TAX
    totalsTable.getRow(3).getCell(1).setText(totals.overallTotal); // Update TOTAL
  }

  doc.saveAndClose();

}
///////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////////////
// END EDITS //////////////////////////////////////////////////////////////////////////////////

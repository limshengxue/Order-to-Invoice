// BEGIN EDITS ////////////////////////////////////////////////////////////////////////////////

// GROUP NAME    : Wantanmee
// DATE CREATED  : 18 JULY 2024
// DATE MODIFIED : 23 JULY 2024
// DESCRIPTION   : SALES ORDER FUNCTIONS 

///////////////////////////////////////////////////////////////////////////////////////////////

// DISCOUNT AND TAX RATE
const discountRate = 0.05;
const taxRate = 0.06;

// // DEFINING GOOGLE TOOLS
const SALES_ORDER_TEMPLATE_ID = '1rLvclAFAwEGiA6lxRKOep1mPMawGQHwtwH-jHAe5irU'; 
const ORDER_FOLDER_ID = '1vBKvbuSb4gQCbZ2fQ_Pqg81aDNNESX65'; 

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO CREATE SALES ORDER FROM DOCS
function generateOrderFromTemplate(order, SALES_ORDER_TEMPLATE_ID, ORDER_FOLDER_ID) {
  
  // // DEBUG
  // Logger.log('Template ID: %s', INVOICE_TEMPLATE_ID);
  // Logger.log('Folder ID: %s', FOLDER_ID);

  // // Check if invoice object has required properties
  // if (!invoice || !invoice.customer_name || !invoice.customer_address) {
  //   Logger.log('Error: Invoice object is missing required properties.');
  //   return;
  // }

  const template = DriveApp.getFileById(SALES_ORDER_TEMPLATE_ID);
  const folder = DriveApp.getFolderById(ORDER_FOLDER_ID);

  // MAKE A COPY OF THE TEMPLATE 
  const copy = template.makeCopy(folder);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();

  // DEFINE PLACEHOLDERS
  const placeholders = {
    order_number: order.order_number,
    customer_address: order.customer_address,
    customer_name: order.customer_name,
    delivery_address: order.delivery_address,
    fulfillment_date: order.fulfillment_date,
    issued_date: order.issued_date,
    special_notes: order.special_notes,
    customer_email : order.customer_email,
    ordered_by : order.ordered_by
  };

  replacePlaceHolders(body, placeholders);

  // PLACEHOLDER FOR ITEMS
  const subtotal = replaceItemsPlaceholders(order.items, body);

  // Replace the subtotal placeholder
  const subtotalPlaceholder = '{{sub_total}}';
  Logger.log('Replacing %s with %s', subtotalPlaceholder, subtotal.toFixed(2));
  body.replaceText(subtotalPlaceholder, subtotal.toFixed(2));


  // CALCULATE OVERALL TOTAL
  const totals = calculateTotals(subtotal, discountRate, taxRate);
  
  // Replace discount, tax, and overall total placeholders
  const discountPlaceholder = '{{discount}}';
  const taxPlaceholder = '{{tax}}';
  const overallTotalPlaceholder = '{{overall_total}}';
  
  Logger.log('Replacing %s with %s', discountPlaceholder, totals.discount);
  Logger.log('Replacing %s with %s', taxPlaceholder, totals.tax);
  Logger.log('Replacing %s with %s', overallTotalPlaceholder, totals.overallTotal);
  
  body.replaceText(discountPlaceholder, totals.discount);
  body.replaceText(taxPlaceholder, totals.tax);
  body.replaceText(overallTotalPlaceholder, totals.overallTotal);
  
  

  // SET SALES ORDER FILE NAME
  const orderName = `Sales Order _ ${order.order_number} _ ${order.customer_name}`;
  doc.setName(orderName);

  doc.saveAndClose();
  
  Logger.log(`Invoice generated for ${order.order_number}`);

  return copy.getId();

}

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO REPLACE PLACEHOLDER
function replacePlaceHolders(body, placeholders) {
  for (const [key, value] of Object.entries(placeholders)) {
    if (key == "issued_date"){
      // Skip issued date
      continue;
    }
    const placeholder = `{{${key}}}`;
    Logger.log('Replacing %s with %s', placeholder, value);
    body.replaceText(placeholder, value ? value : ''); // Replace with empty string if value is undefined or null
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO REPLACE ITEMS PLACEHOLDER
function replaceItemsPlaceholders(data, body) {
  // Get the table that contains the items
  const table = body.getTables().find(tb => tb.getCell(0,0).getText() == "Items");
  let subtotal = 0;
  
  // Insert data into the existing table
  for (let i = 0; i < data.length; i++) {
    let item = data[i]
    // Calculate total price for the item
    const totalPrice = item ? (item.price * item.quantity).toFixed(2) : '';

    // append data
    var tr = table.appendTableRow();
    tr.appendTableCell(item["quantity"].toFixed());
    tr.appendTableCell(item["name"]);    
    tr.appendTableCell(item["price"].toFixed(2));    
    tr.appendTableCell(totalPrice);    

    // update subtotal
    subtotal += item ? parseFloat(totalPrice) : 0;
  }
  return subtotal
}


///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO CALCULATE OVERALL TOTAL
function calculateTotals(subtotal, discountRate, taxRate) {
  const discount = subtotal * discountRate;
  const tax = (subtotal - discountRate) * taxRate;
  const overallTotal = subtotal - discount + tax;

  return {
    discount: discount.toFixed(2),
    tax: tax.toFixed(2),
    overallTotal: overallTotal.toFixed(2)
  };
}



///////////////////////////////////////////////////////////////////////////////////////////////
// END EDITS //////////////////////////////////////////////////////////////////////////////////
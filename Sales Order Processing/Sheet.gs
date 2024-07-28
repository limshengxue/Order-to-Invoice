const sheetId = '1i_3lOLtnWG44debRB1vBdpVrfLK1QNG96ry3PQ-qd8c';
const customerSheetName = "Customer"
const invalidOrdersSheetName = 'InvalidOrders';
const inventorySheetName = "Inventory";

function appendFlattenedData(order, reason) {  
  // Open the spreadsheet by ID and get the specific sheet by name
  var spreadsheet = SpreadsheetApp.openById(sheetId);
  var sheet = spreadsheet.getSheetByName(invalidOrdersSheetName);
  
  // Define the header
  var header = [
    'ID',
    'Customer Name',
    'Customer Address',
    'Delivery Address',
    'Special Notes',
    'Fulfillment Date',
    'Item Quantity',
    'Item Price',
    'Item Name',
    'Reason'
  ];

  // Get the current data range in the sheet
  var existingData = sheet.getDataRange().getValues();
  
  // Determine the starting row for appending new data
  var startRow = existingData.length + 1;
  
  // If the sheet is empty, write the header first
  if (existingData.length === 1 && existingData[0].length === 1 && existingData[0][0] === '') {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    startRow = 2;
  } else if (existingData.length === 1) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    startRow = 2;
  } else if (existingData[0][0] !== 'ID') {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    startRow = existingData.length + 1;
  }

  // Flatten the orders data
  var flattenedData = [];
    order.items.forEach(function(item) {
      flattenedData.push([
        order.id,
        order.customer_name,
        order.customer_address,
        order.delivery_address,
        order.special_notes,
        order.fulfillment_date,
        item.quantity,
        item.price,
        item.name,
        reason
      ]);
    });
  
  // Write flattened data to the sheet
  sheet.getRange(startRow, 1, flattenedData.length, header.length).setValues(flattenedData);
}

function getInventoryFromSheet(){    
  // Open the spreadsheet by ID and get the specific sheet by name
  var spreadsheet = SpreadsheetApp.openById(sheetId);
  var sheet = spreadsheet.getSheetByName(inventorySheetName);
  
  // Get all data from the sheet
  var data = sheet.getDataRange().getValues();
  var items = []
  // Log the data or process it further
  for (var i = 1; i < data.length; i++) {
    var name = data[i][0];
    var quantity = data[i][1];
    var price = data[i][2];
    
    let item = {
      "name" : name,
      "quantity" : quantity,
      "price" : price
    }
    items = items.concat(item)
  }
  return items
}

function getCustomerFromSheet(){    
  // Open the spreadsheet by ID and get the specific sheet by name
  var spreadsheet = SpreadsheetApp.openById(sheetId);
  var sheet = spreadsheet.getSheetByName(customerSheetName);
  
  // Get all data from the sheet
  var data = sheet.getDataRange().getValues();
  var customers = []
  // Log the data or process it further
  for (var i = 1; i < data.length; i++) {
    var name = data[i][0];
    var address = data[i][1];
    var deliveryAddress = data[i][2];
    
    let customer = {
      "name" : name,
      "address" : address,
      "delivery_address" : deliveryAddress
    }
    customers = customers.concat(customer)
  }
  return customers
}
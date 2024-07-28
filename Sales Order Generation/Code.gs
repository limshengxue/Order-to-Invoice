// BEGIN EDITS ////////////////////////////////////////////////////////////////////////////////

// GROUP NAME    : Wantanmee
// DATE CREATED  : 18 JULY 2024
// DATE MODIFIED : 23 JULY 2024
// DESCRIPTION   : MAIN SCRIPT TO RUN

///////////////////////////////////////////////////////////////////////////////////////////////

// GENERATE SALES ORDER DOCUMENT
function generateOrders() {
  
  const orders = fetchOrderData();
  
  if (!orders || orders.length === 0) {
    Logger.log('No orders found.');
    return;
  } else {
    orders.forEach(order => {
    
      Logger.log('Processing order: %s', JSON.stringify(order));
    
      const docID = generateOrderFromTemplate(order, SALES_ORDER_TEMPLATE_ID, ORDER_FOLDER_ID);

      Logger.log('Generated order document ID: %s', docID);
    
      markOrderAsGenerated(order.order_number);

    });
    
  }
}


// RUNNING FUNCTION
function run() {
  generateOrders();
}


// END EDITS //////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Retrieve Firebase (Firestore) Data and Export to Google Sheet a
// - For data visualization in Looker Studio which linked to Google Sheet 
//
function test(){
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);
  const documents = firestore.query("order").Execute();

  const targetSheetName = 'test_wtm';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(targetSheetName);
  if (!targetSheet) {
      // Create the target sheet if it doesn't exist
      ss.insertSheet(targetSheetName);
    } else {
      targetSheet.clear(); 
  }

   // Define headers for the target sheet
   // Retrieve necessary variables 
  const headers = ['Order Number','Approved','Converted','Customer Name', 'Fulfillment Date', 'Item Name', 'Item Quantity', 'Item Price', 'Total Amount'];
  targetSheet.appendRow(headers);

  try {
    const orders = documents.map(doc => {
      const order = {
        order_number: doc["path"].split("/")[1],
        ...doc["obj"]
      };
      return order;
    });
    
    if (orders.length > 1) {
      console.log('Fetched orders: %s', JSON.stringify(orders));
      
      // Iterate over each order to check items length
      orders.forEach(order => {
        const items = order.items;
        
        for (var counter = 0; counter < items.length; counter = counter + 1) {
          const total_amount = order.items[counter].price * order.items[counter].quantity;
          nextData = [order.order_number, order.approved,order.converted,order.customer_name,order.fulfillment_date, order.items[counter].name, order.items[counter].quantity, order.items[counter].price, total_amount]
          targetSheet.appendRow(nextData);
        }

      });
      return orders;

    } else {
      Logger.log('All sales orders have been generated');
      return null;
    }

  } 
  catch (error) {
    Logger.log('Error fetching order data: ' + error.message);
    return null;
  }

}
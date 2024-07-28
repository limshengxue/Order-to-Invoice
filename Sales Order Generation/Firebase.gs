const EMAIL = 'firebase-adminsdk-yj1t9@order-to-invoice-automation.iam.gserviceaccount.com';
const PROJECT_ID = "order-to-invoice-automation"

// // DEFINING FIREBASE
const ORDER_COLLECTION_NAME = 'SalesOrder';

///////////////////////////////////////////////////////////////////////////////////////////////

// UPDATE FIREBASE AFTER SALES ORDER GENERATED
function markOrderAsGenerated(orderNumber) {
  const FIRESTORE = FirestoreApp.getFirestore(EMAIL, KEY, PROJECT_ID)

  const documentPath = `${ORDER_COLLECTION_NAME}/${orderNumber}`;
  FIRESTORE.updateDocument(documentPath, { generated: true }, true);

  try {
    FIRESTORE.updateDocument(documentPath, { generated: true }, true);
    
    Logger.log(`Updated generated field for document: ${orderNumber}`);

  } catch (error) {
    
    Logger.log('Error updating generated field: ' + error.message);

  }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// FUNCTION TO FETCH SALES ORDER DATA FROM FIREBASE
function fetchOrderData() {
  const FIRESTORE = FirestoreApp.getFirestore(EMAIL, KEY, PROJECT_ID)

  const documents = FIRESTORE.query(ORDER_COLLECTION_NAME).Where("generated", "==", false).Execute();
  
  try {
    const orders = documents
    .map(doc => {
    const order = {
      order_number: doc["path"].split("/")[1],
      ...doc["obj"]
    };
    return order;
    
  });
    
    if (orders.length > 0) {
      Logger.log('Fetched orders: %s', JSON.stringify(orders));
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
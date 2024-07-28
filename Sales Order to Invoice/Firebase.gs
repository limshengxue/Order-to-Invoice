let salesOrderCollectionName = "SalesOrder";
const email = 'firebase-adminsdk-yj1t9@order-to-invoice-automation.iam.gserviceaccount.com';
const project_id = "order-to-invoice-automation"
const invoiceCollectionName = "Invoice";

function updateConvertedToFirebase(docID){
  
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  firestore.updateDocument(`${salesOrderCollectionName}/${docID}`, {"converted": true}, ["converted"]);
}

function convertOrderDocumentToInvoiceDocument(document){
  let invoice = document.obj
  delete invoice.approved
  delete invoice.converted
  delete invoice.generated
  delete invoice.fulfillment_date
  delete invoice.task_id

  invoice["issued_date"] = getCurrentDate()

  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  let invoiceDocument = firestore.createDocument(invoiceCollectionName, invoice);

  return [invoiceDocument.obj , invoiceDocument.path]
}

function updateTaskIDToFirebase(docID, taskID){
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  firestore.updateDocument(`${salesOrderCollectionName}/${docID}`, {"task_id": taskID}, ["task_id"]);
}

function getDocumentFromFirebase(orderNo){
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  const document = firestore.getDocument(salesOrderCollectionName + "/" + orderNo);
  return document
}

///////////////////////////////////////////////////////////////////////////////////////////////

// UPDATE FIREBASE
function updateFirebase() {
  
  const details = orderDetailsExtract();
  const items = orderItemsExtract();

  if (!details || !items) {
    Logger.log('Failed to extract details or items.');
    return;
  }

  const orderId = details.order_no; 

  const orderData = {
    
    // SET APPROVED TO
    approved: true,

    customer_address: details.customer_address,
    customer_name: details.customer_name,
    delivery_address: details.delivery_address,
    fulfillment_date: details.fulfillment_date,
    issued_date: details.issued_date,
    special_notes: details.special_notes,
    items: items.map(item => ({
      name: item.description,
      quantity: item.qty,
      price: item.unit_cost
    }))
  };

  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  firestore.updateDocument(`${salesOrderCollectionName}/${orderId}`, orderData, true);
  Logger.log('Updated Firestore document with ID: %s', orderId);
}
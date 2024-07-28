// Save data to Firestore
const email = 'firebase-adminsdk-yj1t9@order-to-invoice-automation.iam.gserviceaccount.com';
const project_id = "order-to-invoice-automation"
const raw_order_collection_name = "SalesOrder_Raw"

function saveOrderToFirestore(data){
  const myFirestore = FirestoreApp.getFirestore(email, private_key, project_id);
  myFirestore.createDocument(raw_order_collection_name, data);
}

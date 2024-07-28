const email = 'firebase-adminsdk-yj1t9@order-to-invoice-automation.iam.gserviceaccount.com';
const project_id = "order-to-invoice-automation"
const raw_sales_order_collection = "SalesOrder_Raw"
const sales_order_collection = "SalesOrder"

function getSalesOrderFromFirestore(){
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  return firestore.query(raw_sales_order_collection).Where("processed", "==", false).Execute(); 
}


function saveOrderToFirestore(data){
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  data["approved"] = false
  data["converted"] = false
  data["generated"] = false
  data["issued_date"] = null

  delete data.id
  delete data.processed
  firestore.createDocument(sales_order_collection, data);

}

function updateProcessedFlag(data, path){
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);

  data["processed"] = true
 
  firestore.updateDocument(path, data);

}
/**
 */
var SIDEBAR_TITLE = 'Order-to-Invoice';

/**
 * Adds a custom menu with items to show the sidebar and dialog.
 *
 * @param {Object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu().addItem("Order-to-Invoice" , "showSidebar").addToUi()
}

/**
 * Runs when the add-on is installed; calls onOpen() to ensure menu creation and
 * any other initializion work is done immediately.
 *
 * @param {Object} e The event parameter for a simple onInstall trigger.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar. The sidebar structure is described in the Sidebar.html
 * project file.
 */
function showSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(SIDEBAR_TITLE)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  DocumentApp.getUi().showSidebar(ui);
}

function approveSalesOrder() {
  // TODO : Process Sales Order
  processSalesOrder()

  // Send email
  let orderNo = getOrderNumber()
  const document = getDocumentFromFirebase(orderNo)
  const order = document.obj;
  const id = document.path.split("/")[1]

  sendSalesOrderEmail(order, id, DocumentApp.getActiveDocument().getId())

  // Create Record on Tasks
  createTask(order, id)

  // Add Header & Footer : Approved
  changeHeaderAndFooter("Approved")
}

function fulfillSalesOrder(){
  // Get Order Data from Firebase
  let orderNo = getOrderNumber()
  let document = getDocumentFromFirebase(orderNo)
  let salesOrderDocID = document.path.split("/")[1];
  // Create Invoice 
  let [invoice, invoicePath] = convertOrderDocumentToInvoiceDocument(document)
  let invoiceID = invoicePath.split("/")[1];

  // Create Invoice Document
  let [invDocID, invDocURL] = createInvoiceDocument(invoice, invoiceID, orderNo)
  
  // Send Email
  sendInvoiceEmail(invoice, invoiceID, invDocID)

  // Update Tasks Status
  updateTaskStatus(document.obj["task_id"])

  // Change Header & Footer
  changeHeaderAndFooter("Fulfilled")

  // TODO update firebase
  updateConvertedToFirebase(salesOrderDocID)

  // Show created Invoice URL
  return invDocURL
}


function updateTaskStatus(taskID){
  const taskListId = getOrCreateSalesOrderTaskList();
  var task = Tasks.Tasks.get(taskListId, taskID);
  
  // Update the task status to "completed"
  task.status = 'completed';
  task.completed = new Date().toISOString();
  
  // Make a request to update the task
  Tasks.Tasks.update(task, taskListId, taskID);
}

function createInvoiceDocument(invoice, invoiceID, orderNo){
  // Copy Sales Order
  let salesorderNo = getOrderNumber()

  let salesOrderDocId = DocumentApp.getActiveDocument().getId()
  let invoiceFile = DriveApp.getFileById(salesOrderDocId).makeCopy();
  const invoiceName = `Invoice _ ${invoiceID} _ ${invoice.customer_name}`;
  invoiceFile.setName(invoiceName);
  const invoiceDoc = DocumentApp.openById(invoiceFile.getId())

  //Replace the title
    invoiceDoc.getBody().replaceText("SALES ORDER", "INVOICE")

  // Replace Issue Date
  replaceIssueDate(invoiceDoc.getBody(), invoice)

  // Replace Order Number and Insert Reference Number
  replaceOrderNumber(invoiceDoc.getBody(), invoiceID, salesorderNo)


  // Remove header and footer
  invoiceDoc.getHeader().clear()
  invoiceDoc.getFooter().clear()

  invoiceDoc.saveAndClose()

  return [invoiceFile.getId(), invoiceFile.getUrl()]
}

function replaceOrderNumber(body, invoiceNo, salesOrderNo){
  // Find the table with first cell with text start with "ORDER NO"
  const table = body.getTables().find(tb => tb.getCell(0,0).getText().startsWith("ORDER NO"));

  // Replace the first cell with text 
  table.getCell(0,0).setText("INVOICE NO: " + invoiceNo)
  table.getCell(0,0).setFontFamily('Arial');
  // Add a row above with text
  table.getCell(1,0).setText("REF. SALES ORDER: " );
  table.getCell(2,0).setText(salesOrderNo)

  var numRows = table.getNumRows();
  var numCols = table.getRow(0).getNumCells();
  
  var labelsToBold = ["INVOICE NO:", "ISSUED DATE:", "REF. SALES ORDER:", "ORDERED BY:", "CUSTOMER EMAIL:"];

  // Iterate over each cell in the table
  for (var i = 0; i < numRows; i++) {
    for (var j = 0; j < numCols; j++) {
      var cell = table.getCell(i, j);
      // Set the font weight of the cell to normal (not bold)
      cell.getChild(0).editAsText().setBold(false);
      var text = cell.getText();

      for (var k = 0; k < labelsToBold.length; k++) {
          var label = labelsToBold[k];
          if (text.startsWith(label)) {
            // Bold the label part of the text
            var editText = cell.editAsText();
            editText.setBold(0, label.length - 1, true);
          }
        }
    }
  }
}

function replaceIssueDate(body, invoice){
  // Find the table with first cell with text start with "ORDER NO"
  const table = body.getTables().find(tb => tb.getCell(0,1).getText().includes("ISSUED DATE"));

  // Replace the first cell with text 
  table.getCell(0,1).setText("ISSUED DATE: " + invoice["issued_date"])
  table.getCell(1,1).setText("ORDERED BY: " + invoice["ordered_by"])
  table.getCell(2,1).setText("CUSTOMER EMAIL: " + invoice["customer_email"])
  table.getCell(3,1).clear()
}





// FUNCTION TO GET CURRENT DATE
function getCurrentDate() {
  const date = new Date();
  const options = { year: 'numeric', month: 'short', day: '2-digit' };
  const formattedDate = date.toLocaleDateString('en-GB', options);
  return formattedDate.replace(/ /g, ' ');
}



function createTask(order, id) {
  const documentURL = DocumentApp.getActiveDocument().getUrl()
  const taskListId = getOrCreateSalesOrderTaskList();
  const taskTitle = `Fulfill Sales Order for ${order["customer_name"]} #${id}`;
  const taskNotes = `Fulfill the sales order - ${documentURL}`;
  const dueDate = convertToRFC3339(order["fulfillment_date"])

  // Create the task object
  const task = {
    title: taskTitle,
    notes: taskNotes,
    due: dueDate
  };

  // Insert the task into the "Sales Order" task list
  const result = Tasks.Tasks.insert(task, taskListId);

  updateTaskIDToFirebase(id, result.id)
}

function convertToRFC3339(dateStr) {
  // Split the input date string
  const [day, monthStr, year] = dateStr.split(' ');

  // Create a mapping of month abbreviations to month numbers
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  // Get the month number from the month abbreviation
  const month = months[monthStr];

  // Create a Date object using the year, month, and day
  const date = new Date(Date.UTC(year, month, day));

  // Convert the date to an RFC 3339 timestamp
  const rfc3339Timestamp = date.toISOString();
  
  return rfc3339Timestamp;
}

function getOrCreateSalesOrderTaskList(){
  const taskListName = 'Sales Order';
  
  // Fetch all task lists
  const taskLists = Tasks.Tasklists.list().items;

  // Check if the "Sales Order" task list exists
  let salesOrderTaskList = taskLists.find(taskList => taskList.title === taskListName);

  if (salesOrderTaskList) {
    return salesOrderTaskList.id
  } else {
    // If not found, create a new task list
    const newTaskList = {
      title: taskListName
    };
    salesOrderTaskList = Tasks.Tasklists.insert(newTaskList);
  }

  return salesOrderTaskList.id;
}

function sendSalesOrderEmail(order, order_no){
  const email = order.customer_email; // Ensure your Firestore data contains the customer's email
  
  const subject = `Sales Order #${order_no}`;
  const messageBody = 
  `Hi ${order.ordered_by},\n
  \nPlease find attached the sales order #${order_no}.\n
  \nThank you.`;

  const doc = DriveApp.getFileById(DocumentApp.getActiveDocument().getId());
  const pdf = doc.getAs(MimeType.PDF);

  GmailApp.sendEmail(email, subject, messageBody, {
    attachments: [pdf]
  });
}

function sendInvoiceEmail(invoice, invoice_no, invoice_doc_id){
  const email = invoice.customer_email; // Ensure your Firestore data contains the customer's email
  
  const subject = `Invoice #${invoice_no}`;
  const messageBody = 
  `Hi ${invoice.ordered_by},\n
  \nPlease find attached the invoice #${invoice_no}.\n
  \nThank you.`;

  const doc = DriveApp.getFileById(invoice_doc_id);
  const pdf = doc.getAs(MimeType.PDF);

  GmailApp.sendEmail(email, subject, messageBody, {
    attachments: [pdf]
  });
}

function changeHeaderAndFooter(msg) {
  const doc = DocumentApp.getActiveDocument();
  
  // Check if the document already has a header
  let header = doc.getHeader();
  if (!header) {
    // If no header exists, add a new header
    header = doc.addHeader();
  } else {
    // If a header exists, clear its content
    header.clear();
  }
  
  // Add content to the header
  header.appendParagraph(msg + ' Sales Order');
  
  // Check if the document already has a footer
  let footer = doc.getFooter();
  if (!footer) {
    // If no footer exists, add a new footer
    footer = doc.addFooter();
  } else {
    // If a footer exists, clear its content
    footer.clear();
  }
  
  // Add content to the footer
  footer.appendParagraph(msg + ' Sales Order');

}


function checkOrderStatus(){
  let orderNo = getOrderNumber()
  
  const document = getDocumentFromFirebase(orderNo)
  const order = document.obj;

  return {"approved" : order["approved"], "converted" : order["converted"] }
}




function getOrderNumber(){
  let document = DocumentApp.getActiveDocument().getBody().getText();
  let orderNo = extractValue(document, "ORDER NO")
  return orderNo
}

function extractValue (document, placeholder) {
  const regex = new RegExp(`${placeholder}\\s*:\\s*(.+)`);
  const match = document.match(regex);
  return match ? match[1].trim() : null;
};

// RUNNING FUNCTION
function processSalesOrder() {

  // EXTRACT ORDER DETAILS
  const details = orderDetailsExtract();
  if(!details) {
    Logger.log('Failed to extract order details.');
    return;
  }

  // EXTRACT ORDER ITEMS
  const items = orderItemsExtract();
  if (!items) {
    Logger.log('Failed to extract order items.');
    return;
  }

  // RECALCULATE TOTALS
  const totals = recalculateTotals(items);
  if(!totals){
    Logger.log('Recalculated Totals: %s', JSON.stringify(totals));
    return;
  }
  
  // UPDATE GOOGLE DOCS
  updateDocs(items, totals);

  // UPDATE FIREBASE
  updateFirebase()

}


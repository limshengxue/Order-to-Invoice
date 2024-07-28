function loadAddOn(event) {
  var accessToken = event.gmail.accessToken;
  var messageId = event.gmail.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var mailMessage = GmailApp.getMessageById(messageId);
  var from = mailMessage.getFrom();
  var threadID = mailMessage.getThread().getId();
  
  var action = CardService.newAction().setParameters({"threadID" : threadID}).setFunctionName("extractInfo")

  var openDocButton = CardService.newTextButton()
      .setText("Extract")
      .setOnClickAction(action)

  var card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Extract Sales Information for Automated Creation of Sales Order"))
      .addSection(CardService.newCardSection()
          .addWidget(openDocButton))
      .build();

  return [card];
}

async function extractInfo(e){
  var accessToken = e.gmail.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  let thread = GmailApp.getThreadById(e.parameters.threadID)
  let [messages, attachments] = extractMessagesFromThread(thread)
  let input = JSON.stringify(messages);
  let response = await extractWithLLM(input)
  let order = await postprocessResponse(response, attachments, input)
  if(order != null) {
    order = augmentInfo(order)
    order["processed"] = false
    saveOrderToFirestore(order)
  }
  return renderResult(order != null)
}

// Augment Infomation into corresponding fields
function augmentInfo(order) {
  let [sender, email] = extractNameAndEmail(order["sender"])
  order["ordered_by"] = sender
  order["customer_email"] = email
  if(order["customer_name"] == null) {
    order["customer_name"] = sender
  }
  delete order.sender
  return order
}

// Render Result to GUI
function renderResult(extractSuccess){
  let message = ""
  if(extractSuccess){
    message = "Information extracted successfully. Sales order will be created soon"
  }else{
    message = "No sales information found. Please review the email or proceed manually"
  }

  let text = CardService.newTextParagraph().setText(message) 

  var card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Extract Sales Information for Automated Creation of Sales Order"))
      .addSection(CardService.newCardSection()
          .addWidget(text))
      .build();

  return [card];
}


function extractMessagesFromThread(thread){
  let messages = thread.getMessages();
  let procMessages = []
  let attachments = {}
  for(let i = 0; i < messages.length; i++){
    let message = {
      "from" : messages[i].getFrom(),
      "subject" : messages[i].getSubject(),
      "body" : messages[i].getPlainBody(),
      "message_id" : messages[i].getId()
    }
    procMessages = procMessages.concat(message)
    attachments[messages[i].getId()] = messages[i].getAttachments()
  }
  return [procMessages, attachments]
}

function extractNameAndEmail(text) {
  // Regular expression to match the name and email
  const pattern = /^(.+)\s<([^>]+)>$/;
  
  // Execute the regular expression on the text
  const match = text.match(pattern);
  
  // Create the dictionary if a match is found
  if (match) {
    const name = match[1].trim();
    const email = match[2].trim();
    return [name, email];
  } else {
    return null;
  }
}

// Postprocess Response of LLM
async function postprocessResponse(response, attachments, input){
  if(response == "None"){
    // Not an Order Email
    return null
  }
  if(isJsonString(response)){
    // Order Information Extracted
    let order = JSON.parse(response)
    return order

  }else{
    // Processing of attachment required, LLM return email id
    let attachmentKey = response

    let relevantAttachments = attachments[attachmentKey]
    let llmFiles = attachmentPreprocess(relevantAttachments)
    console.log(llmFiles)
    let result = await processAttachmentAndMessageWithLLM(input, llmFiles)
    console.log(result)
    if(result == "None"){
      return null
    }else{
      return JSON.parse(result)
    }
  }
}

function isJsonString(str) {
    try {
        const obj = JSON.parse(str);
        return obj && typeof obj === 'object' && !Array.isArray(obj);
    } catch (e) {
        return false;
    }
}


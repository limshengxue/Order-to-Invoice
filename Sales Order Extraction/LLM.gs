// BEGIN EDITS ////////////////////////////////////////////////////////////////////////////////

// GROUP NAME    : Wantanmee
// DESCRIPTION   : Function related to LLM

///////////////////////////////////////////////////////////////////////////////////////////////

const generationConfig = {
  temperature: 0,
};

async function processAttachmentAndMessageWithLLM(emailInput, attachmentInput) {
  const genAI = new GeminiApp(gemini_key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash",generationConfig });

  const prompt = 'From the given documents and email, identify if the documents and email are related to making an order. If yes, produce an output in the format of {"sender": <sender_of_the_email>, "customer_name" : <customer_name> ,"customer_address": <address_of_customer>, "delivery_address" : <delivery_address_of_the_order>, "fulfillment_date" : <on_which_date_the_order_should_be_fulfilled_in_the_format_dd MMM yyyy>, "items" : [{"name" : <name_of_item_ordered> , "quantity" : <quantity_ordered>, "price" : <price_of_item>}], "special_notes" : <any_special_note_received_from_the_customer>} , when some piece of information is missing, put the value null ,please do not make up any information, if the messages is not related to order return a None in string format. The email is provided as such : ' + emailInput;

  const result = await model.generateContent([prompt, ...attachmentInput]);
  const response = await result.response;

  let text = response.text();


  return cleanLLMResponse(text)
}

async function extractWithLLM(input){
  const genAI = new GeminiApp(gemini_key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash",generationConfig });

  const prompt = 'From the given information about email messages, identify if the messages are related to making an order. If yes, produce an output in the format of {"sender": <sender_of_the_email>, "customer_name" : <customer_name>,"customer_address": <address_of_customer>, "delivery_address" : <delivery_address_of_the_order>, "fulfillment_date" : <on_which_date_the_order_should_be_fulfilled_in_the_format_dd MMM yyyy>, "items" : [{"name" : <name_of_item_ordered> , "quantity" : <quantity_ordered>, "price" : <price_of_item>}], "special_notes" : <any_special_note_received_from_the_customer>} , when some piece of information is missing, put the value null, please do not make up any information, if the messages is not related to order return a None in string format, if the email mentioned the order is in attachment do not return the json output but return the message ID in string format which contains the attachment only (IMPORTANT). The email is provided as such : ' + input;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  let text = response.text();
  console.log(text)
  
  return cleanLLMResponse(text)
}


function cleanLLMResponse(text){
  text = removeMarkdownSyntax(text)
  text = removeQuotes(text)
  return text
}

function removeMarkdownSyntax(text) {
    return text
        .replace(/```json\s*([\s\S]*?)\s*```/g, '$1') 
}

function removeQuotes(str) {
  str = str.trim()
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

// Preprocess Attachment
function attachmentPreprocess(attachments){
  // Get PDF attachment
  let pdfAttachments = attachments.filter(el => el.getContentType() == 'application/pdf')
  // Convert attachment to PNG
  let pngFiles = pdfToPng(pdfAttachments)
  let files = pngFiles.map(el => fileToGenerativePart(el))
  // Convert PNG to LLM acceptable format
  return files
}


// Convert Attachment to Format Acceptable by LLM
function fileToGenerativePart(file) {
  return {
    inlineData: {
      data: file["FileData"],
      mimeType: "image/png"
    },
  };
}

// To convert PDF File to Png Files
function pdfToPng(attachments){
  let pngFiles = []
  for (let i = 0; i < attachments.length; i++){
    let attachment = attachments[i]
    // Convert the PDF to Base64
    var base64PDF = Utilities.base64Encode(attachment.getBytes());
          
          // Call the ConvertAPI to convert PDF to PNG
          var response = UrlFetchApp.fetch('https://v2.convertapi.com/convert/pdf/to/png?Secret=' + pngtopdf_api_key, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({
              "Parameters": [
                {
                  "Name": "File",
                  "FileValue": {
                    "Name": attachment.getName(),
                    "Data": base64PDF
                  }
                },
                {
                  "Name": "StoreFile",
                  "Value": false
                }
              ]
            })
          });
          
    var result = JSON.parse(response.getContentText());
    pngFiles = pngFiles.concat(result["Files"])
  }
  return pngFiles;
}

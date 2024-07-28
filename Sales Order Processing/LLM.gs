const generationConfig = {
  temperature: 0,
};

async function doAlignmentWithLLM(input){
  const genAI = new GeminiApp(gemini_key);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash",generationConfig });

  const prompt = 'You will be given 2 lists in the format of {"name" : <name_of_item_ordered> , "quantity" : <quantity_ordered>, "price" : <price_of_item>}. A list will be the inventory list and another is the order list. You should try to aligh the order list with the inventory list by changing the name of the items in the order list if there is misalign. You should not change other information such as the price and quantity. Place the aligned item in result list. If the misalign is too serious to be aligned. Place the result in an invalid list. Your output will be in the form of JSON object {"result" : <items_from_order_aligned>, "invalid" : <invalid_items_which_cannot_be_fixed>}. Here are some examples for you' + few_shots  + " Your input is given as: " + input;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  text = removeMarkdownSyntax(text)
  
  return text
}

function removeMarkdownSyntax(text) {
    // Remove markdown syntax
    return text
        .replace(/```json\s*([\s\S]*?)\s*```/g, '$1') // Remove code block syntax with the word 'json' but keep the content
}

const few_shots = 'SAMPLE INPUT : {"inventory" : [ { "name": "Car Fragance (Box)", "quantity": 10, "price": 10 }, { "name": "Control Arm", "quantity": 2, "price": 111 }, { "name": "Brake Disc, Pads and Calipers", "quantity": 2, "price": 60 },{ "name": "Suspension Lift Kit", "quantity": 2, "price": 399 } ], orders : [{ "name": "Car Fragance - Box", "quantity": 1, "price": 2 },{ "name": "Brake Disc, Pads, Calipers", "quantity": 1, "price": 50 }]}, SAMPLE OUTPUT: {"orders" : [{ "name": "Car Fragance (Box)", "quantity": 1, "price": 2 },{ "name": "Brake Disc, Pads and Calipers", "quantity": 1, "price": 50 }] , "invalid" : []}' + 
'SAMPLE INPUT : {"inventory" : [ { "name": "Car Fragance (Box)", "quantity": 10, "price": 10 }, { "name": "Control Arm", "quantity": 2, "price": 111 }, { "name": "Brake Disc, Pads and Calipers", "quantity": 2, "price": 60 },{ "name": "Suspension Lift Kit", "quantity": 2, "price": 399 } ], orders : [{ "name": "Car Fragance - Box", "quantity": 1, "price": 2 },{ "name": "Car Emergency Kit", "quantity": 1, "price": 50 }]}, SAMPLE OUTPUT: {"orders" : [{ "name": "Car Fragance (Box)", "quantity": 1, "price": 2 }] , "invalid" : [{ "name": "Car Emergency Kit", "quantity": 1, "price": 50 }]}' +
'SAMPLE INPUT : {"inventory" : [ { "name": "Car Fragance (Box)", "quantity": 10, "price": 10 }, { "name": "Control Arm", "quantity": 2, "price": 111 }, { "name": "Brake Disc, Pads and Calipers", "quantity": 2, "price": 60 },{ "name": "Suspension Lift Kit", "quantity": 2, "price": 399 } ], orders : [{ "name": "Fried Chicken", "quantity": 1, "price": 2 },{ "name": "Beef Burger", "quantity": 1, "price": 50 }]}, SAMPLE OUTPUT: {"orders" : [] , "invalid" : [{ "name": "Fried Chicken", "quantity": 1, "price": 2 },{ "name": "Beef Burger", "quantity": 1, "price": 50 }]}'
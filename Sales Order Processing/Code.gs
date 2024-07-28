async function main() {
  // Get Raw Sales Order From Firestore
  let salesOrders = getSalesOrderFromFirestore()
  let itemValidOrders = await processItems(salesOrders)
  let procOrders = processAddress(itemValidOrders)
  procOrders.forEach(el => saveOrderToFirestore(el))
}

function processAddress(orders){
  let customers = getCustomerFromSheet()
  let procOrders = []
  for (let i = 0; i < orders.length; i++){
    let order = orders[i]
    let deliveryAddress = order["delivery_address"]
    let customerAddress = order["customer_address"]

    let customer = customers.find(el => el["name"] == order["customer_name"])

    if (deliveryAddress == null){
      if(customer != null){
        deliveryAddress = customer["delivery_address"]
      }else{
        if(customerAddress != null){
          deliveryAddress = customerAddress
        }
      }
    }

    if(deliveryAddress == null || deliveryAddress.trim() == ""){
      appendFlattenedData(order,  "Missing delivery address")
      continue;
    }

    if (customerAddress == null){
      if(customer != null){
        customerAddress = customer["address"]
      }else{
        if(customerAddress != null){
          customerAddress = deliveryAddress
        }
      }
    }

    order["delivery_address"] = cleanText(deliveryAddress)
    order["customer_address"] = cleanText(customerAddress)
    procOrders = procOrders.concat(order)
  }
  return procOrders
}

function cleanText(text) {
  // Remove newline, tab, and other special characters
  const cleanedText = text.replace(/[\n\t\r]/g, ' ');

  // Trim any leading or trailing spaces
  return cleanedText.trim();
}

async function processItems(orders){
  // Get inventory items
  let inventoryItems = getInventoryFromSheet()
  let validOrders = []
  for (let i  = 0 ; i < orders.length ;i++){
    let order = orders[i].obj
    let items = order["items"]
    let id = orders[i].path.split("/")[1]

    updateProcessedFlag(order, orders[i].path)

    order["id"] = id

    let input = {
      "inventory" : inventoryItems,
      "orders" : items
    }
    // Do alignment using LLM

    let output = await doAlignmentWithLLM(JSON.stringify(input))
    let result = JSON.parse(output)

    // Check for invalid
    if (result["invalid"].length > 0){
      // If invalid store in spreadsheet
      appendFlattenedData(order,  "Invalid Item")
    }else{
      // VALID  ORDER can proceed
      let newItems = fillUpItemsPrice(inventoryItems, result["result"])
      order["items"] = newItems
      validOrders = validOrders.concat(order)
    }
  }
  return validOrders
}

function fillUpItemsPrice(inventory, items){
  let newItems = []
  for(let i  = 0 ; i < items.length ;i++){
    let item = items[i]
    if(item["price"] == null){
      let inventoryItem = inventory.find(el => el["name"] == item["name"])
      item["price"] = inventoryItem["price"]
    }
    newItems = newItems.concat(item)
  }
  return newItems;
}







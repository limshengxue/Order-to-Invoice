///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Generate Sample Data and Save to Firebase
//
function generateAndSaveSampleOrders() {
  const firestore = FirestoreApp.getFirestore(email, private_key, project_id);
  const sampleOrders = [];
  
  const startDate = new Date('2024-07-01');
  const endDate = new Date('2024-7-31');
  
  for (let i = 0; i < 20; i++) {
    // Generate a random date within the range
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const formattedDate = formatDate(randomDate); 
    const approved = Math.random() > 0.5;
    const issuedDate = approved ? formattedDate : null; // Set issued_date to null if not approved
    const sampleItems = generateSampleOrder();

    // Randomize the order data
    sampleOrders.push({
      approved: approved,
      converted: Math.random() > 0.5,
      customer_address: `Address ${i + 1}, City ${i + 1}`,
      customer_name: `Customer ${i + 1}`,
      delivery_address: `Street ${i + 1}, City ${i + 1}`,
      fulfillment_date: formattedDate,
      generated: Math.random() > 0.5,
      issued_date: issuedDate,
      items: sampleItems,
      special_notes: `Note for order ${i + 1}`
    });
  }

  // Save each order to Firestore
  sampleOrders.forEach(order => {
    firestore.createDocument('order', order);
  });
  
  console.log(sampleOrders[1]);
  console.log(sampleOrders[3]);
}
  // Function to get a random item from the array
function getRandomItem(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Function to generate a sample order
function generateSampleOrder() {
  const numberOfItems = Math.floor(Math.random() * 5) + 1; // Random number of items between 1 and 5
  items = [];

  for (let i = 0; i < numberOfItems; i++) {
    const part = getRandomItem(carPartsWithPrices);
    const quantity = Math.floor(Math.random() * 100) + 1; // Random quantity between 1 and 3
    items.push({
      name: part.name,
      price: part.price,
      quantity: quantity
    });
  }
  return items
}

function formatDate(date) {
  // Array of month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Extract the day, month, and year
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  // Format the date in 'DD MMMM YYYY' format
  return `${day} ${month} ${year}`;
}
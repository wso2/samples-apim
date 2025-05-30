const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let products = [
  { id: 'p123', name: 'Smartphone', description: 'Latest model smartphone with 128GB storage', price: 499.99, available: true }
];

// List all products
app.get('/products', (req, res) => {
  res.json(products);
});

// Add a new product
app.post('/products', (req, res) => {
  const newProduct = req.body;
  if (!newProduct.id || !newProduct.name || newProduct.price === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Get a product by ID
app.get('/products/:productId', (req, res) => {
  const product = products.find(p => p.id === req.params.productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

app.listen(port, () => {
  console.log(`Product Catalog API running on port ${port}`);
});

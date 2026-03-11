const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ADD PRODUCT
router.post("/add-product", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ message: "Product Added" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET PRODUCTS
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE PRODUCT
router.delete("/delete-product/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/update-product/:id", async(req,res)=>{

await Product.findByIdAndUpdate(req.params.id,req.body);

res.json({message:"Product Updated"});

});

module.exports = router;
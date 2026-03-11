const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

description:String,

price:{
type:Number,
required:true
},

category:String,

stock:{
type:Number,
default:0
},

image:String

});

module.exports = mongoose.models.Product || mongoose.model("Product", ProductSchema);
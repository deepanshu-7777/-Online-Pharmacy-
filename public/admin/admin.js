const form = document.getElementById("productForm");

form.addEventListener("submit",async(e)=>{

e.preventDefault();

const product={

name:document.getElementById("name").value,
description:document.getElementById("desc").value,
price:document.getElementById("price").value,
stock:document.getElementById("stock").value,
category:document.getElementById("category").value,
image:document.getElementById("image").value

};

await fetch("/api/admin/add-product",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(product)

});

alert("Product Added");

loadProducts();

});


async function loadProducts(){

const res=await fetch("/api/admin/products");

const products=await res.json();

const table=document.getElementById("productTable");

table.innerHTML="";

products.forEach(p=>{

table.innerHTML+=`

<tr>

<td><img src="${p.image}"/></td>

<td>${p.name}</td>

<td>$${p.price}</td>

<td>${p.stock}</td>

<td>${p.category}</td>

<td>

<button class="edit-btn" onclick="editProduct('${p._id}')">Edit</button>

<button class="delete-btn" onclick="deleteProduct('${p._id}')">Delete</button>

</td>

</tr>

`;

});

}

loadProducts();



async function deleteProduct(id){

await fetch("/api/admin/delete-product/"+id,{
method:"DELETE"
});

loadProducts();

}



async function editProduct(id){

const newPrice=prompt("Enter new price");

await fetch("/api/admin/update-product/"+id,{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({price:newPrice})

});

loadProducts();

}
let editId = null;
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

editId = id;

const res = await fetch("/api/admin/products");
const products = await res.json();

const product = products.find(p => p._id === id);

document.getElementById("editName").value = product.name;
document.getElementById("editDesc").value = product.description;
document.getElementById("editPrice").value = product.price;
document.getElementById("editStock").value = product.stock;
document.getElementById("editCategory").value = product.category;
document.getElementById("editImage").value = product.image;

document.getElementById("editModal").style.display = "flex";

}
async function updateProduct(){

const updatedProduct = {

name: document.getElementById("editName").value,
description: document.getElementById("editDesc").value,
price: document.getElementById("editPrice").value,
stock: document.getElementById("editStock").value,
category: document.getElementById("editCategory").value,
image: document.getElementById("editImage").value

};

await fetch("/api/admin/update-product/" + editId, {

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(updatedProduct)

});

closeModal();

loadProducts();

}
function closeModal(){
document.getElementById("editModal").style.display="none";
}
const token = localStorage.getItem("token");
const apiUrl = "http://127.0.0.1:8000/products";

// Redirige al login si no hay sesión activa
if (!token && window.location.pathname.includes("index.html")) {
  window.location.href = "login.html";
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Tu sesión actual se cerrará.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
      }
    });
  });
}

// Cargar productos
async function loadProducts() {
  const res = await fetch(apiUrl);
  const data = await res.json();

  const productList = document.getElementById("productList");
  productList.innerHTML = "";

  if (data.length === 0) {
    productList.innerHTML =
      '<p class="text-gray-500 text-center">No hay productos registrados aún.</p>';
    return;
  }

  data.forEach((p) => {
    const div = document.createElement("div");
    div.className =
      "flex justify-between items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 hover:shadow-sm";
    div.innerHTML = `
      <div>
        <p class="font-semibold text-gray-700">${p.name}</p>
        <p class="text-gray-500 text-sm">${p.description}</p>
        <p class="text-sm text-gray-600 mt-1">💰 ${p.price}€ — 📦 ${p.quantity} unidades</p>
      </div>
      <div class="space-x-2">
        <button onclick="editProduct(${p.id}, '${p.name}', '${p.description}', ${p.price}, ${p.quantity})"
          class="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded-md text-white">✏️</button>
        <button onclick="deleteProduct(${p.id})"
          class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-white">🗑️</button>
      </div>
    `;
    productList.appendChild(div);
  });
}

// Crear producto
const productForm = document.getElementById("productForm");
if (productForm) {
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    const price = parseFloat(document.getElementById("price").value);
    const quantity = parseInt(document.getElementById("quantity").value);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description, price, quantity }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "¡Producto creado!",
        showConfirmButton: false,
        timer: 1000,
      });
      productForm.reset();
      loadProducts();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el producto",
      });
    }
  });
}

// Editar producto
async function editProduct(id, currentName, currentDescription, currentPrice, currentQuantity) {
  const { value: formValues } = await Swal.fire({
    title: "Editar producto",
    html: `
      <input id="swal-name" class="swal2-input" placeholder="Nombre" value="${currentName}">
      <input id="swal-desc" class="swal2-input" placeholder="Descripción" value="${currentDescription}">
      <input id="swal-price" type="number" class="swal2-input" placeholder="Precio (€)" value="${currentPrice}">
      <input id="swal-quantity" type="number" class="swal2-input" placeholder="Cantidad (unidades)" value="${currentQuantity}">
    `,
    confirmButtonText: "Guardar cambios",
    confirmButtonColor: "#2563eb",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const name = document.getElementById("swal-name").value;
      const description = document.getElementById("swal-desc").value;
      const price = parseFloat(document.getElementById("swal-price").value);
      const quantity = parseInt(document.getElementById("swal-quantity").value);

      if (!name || !description || isNaN(price) || isNaN(quantity)) {
        Swal.showValidationMessage("⚠️ Todos los campos son obligatorios");
        return false;
      }
      return { name, description, price, quantity };
    },
  });

  if (!formValues) return;

  const response = await fetch(`${apiUrl}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formValues),
  });

  if (response.ok) {
    Swal.fire({
      icon: "success",
      title: "Producto actualizado",
      showConfirmButton: false,
      timer: 1000,
    });
    loadProducts();
  } else {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar el producto",
    });
  }
}

// Eliminar producto
async function deleteProduct(id) {
  const result = await Swal.fire({
    title: "¿Eliminar producto?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#2563eb",
  });

  if (result.isConfirmed) {
    await fetch(`${apiUrl}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    Swal.fire({
      icon: "success",
      title: "Producto eliminado",
      showConfirmButton: false,
      timer: 1000,
    });
    loadProducts();
  }
}

// Cargar al iniciar
loadProducts();

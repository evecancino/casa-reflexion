// ===========================
//  CASA REFLEXIÓN – app.js
// ===========================
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://casa-reflexion.onrender.com/api';

let carrito = 0;

// ── CARRITO ──
async function agregarCarrito(btn, productoId, nombreProducto, precioProducto, emojiProducto, fondoProducto) {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const res = await fetch(`${API}/carrito`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ producto_id: productoId })
      });
      if (res.ok) {
        animarCarrito(btn);
        actualizarContadorCarrito();
      }
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
    }
  } else {
    let carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
    const existe = carritoLocal.find(i => i.id === productoId);
    if (existe) {
      existe.cantidad++;
    } else {
      carritoLocal.push({
        id: productoId,
        nombre: nombreProducto,
        precio: precioProducto,
        emoji: emojiProducto,
        color_fondo: fondoProducto,
        cantidad: 1
      });
    }
    localStorage.setItem('carritoLocal', JSON.stringify(carritoLocal));
    animarCarrito(btn);
    actualizarContadorLocal();
  }
}

function animarCarrito(btn) {
  const emoji = btn.closest('.producto-card').querySelector('.producto-emoji');
  const carritoIcon = document.querySelector('.nav-cart');

  if (emoji) {
    const emojiRect = emoji.getBoundingClientRect();
    const carritoRect = carritoIcon.getBoundingClientRect();
    const volador = document.createElement('div');
    volador.className = 'volar-emoji';
    volador.textContent = emoji.textContent;
    volador.style.left = emojiRect.left + 'px';
    volador.style.top = emojiRect.top + 'px';
    document.body.appendChild(volador);
    setTimeout(() => {
      volador.style.left = carritoRect.left + 'px';
      volador.style.top = carritoRect.top + 'px';
      volador.style.fontSize = '0.8rem';
      volador.style.opacity = '0';
    }, 50);
    setTimeout(() => volador.remove(), 900);
  }

  btn.textContent = '✓ Agregado';
  btn.classList.add('agregado');
  setTimeout(() => {
    btn.textContent = '+ Agregar';
    btn.classList.remove('agregado');
  }, 2000);
}

function actualizarContadorLocal() {
  const carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
  const total = carritoLocal.reduce((s, i) => s + i.cantidad, 0);
  document.querySelector('.cart-count').textContent = total;
}

async function actualizarContadorCarrito() {
  const token = localStorage.getItem('token');
  if (!token) {
    actualizarContadorLocal();
    return;
  }
  try {
    const res = await fetch(`${API}/carrito`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const totalItems = data.items.reduce((sum, item) => sum + item.cantidad, 0);
    document.querySelector('.cart-count').textContent = totalItems;
  } catch (err) {
    console.error('Error al obtener carrito:', err);
  }
}

// ── FORMULARIO CONTACTO ──
function enviarFormulario(e) {
  e.preventDefault();
  const form = e.target;
  const exito = document.getElementById('form-exito');
  form.style.display = 'none';
  exito.style.display = 'block';
}

// ── BUSCADOR ──
let timeoutBusqueda = null;

function buscarProductos() {
  clearTimeout(timeoutBusqueda);
  timeoutBusqueda = setTimeout(async () => {
    const buscar = document.getElementById('buscador')?.value || '';
    const orden = document.getElementById('orden')?.value || '';
    const categoria = document.getElementById('categoria-filtro')?.value || '';

    if (!buscar && !orden && !categoria) {
      mostrarPaginaCompleta();
      return;
    }

    let url = `${API}/productos?`;
    if (buscar) url += `buscar=${encodeURIComponent(buscar)}&`;
    if (orden) url += `orden=${orden}&`;
    if (categoria) url += `categoria=${categoria}&`;

    try {
      const res = await fetch(url);
      const productos = await res.json();
      ocultarPaginaCompleta();
      renderizarProductos(productos);
    } catch (err) {
      console.error('Error al buscar productos:', err);
    }
  }, 300);
}

function ocultarPaginaCompleta() {
  document.querySelector('.hero').style.display = 'none';
  document.querySelector('.categorias').style.display = 'none';
  document.querySelector('.banner-medio').style.display = 'none';
  document.querySelector('.nosotros').style.display = 'none';
  document.querySelector('.contacto').style.display = 'none';
  document.querySelector('.productos').style.paddingTop = '6rem';
  document.querySelector('.section-header').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarPaginaCompleta() {
  document.getElementById('buscador').value = '';
  document.querySelector('.hero').style.display = '';
  document.querySelector('.categorias').style.display = '';
  document.querySelector('.banner-medio').style.display = '';
  document.querySelector('.nosotros').style.display = '';
  document.querySelector('.contacto').style.display = '';
  document.querySelector('.productos').style.paddingTop = '';
  document.querySelector('.section-header').style.display = '';
  cargarProductos();
}

function renderizarProductos(productos) {
  const grid = document.querySelector('.productos-grid');
  if (!grid) return;

  if (productos.length === 0) {
    grid.innerHTML = '<p class="sin-resultados">😕 No encontramos productos con ese criterio.</p>';
    return;
  }

  grid.innerHTML = productos.map(p => `
    <div class="producto-card ${p.destacado ? 'destacado' : ''}">
      ${p.destacado ? '<div class="badge">Popular</div>' : ''}
      <div class="producto-img" style="background:${p.color_fondo};">
        ${p.foto
          ? `<img src="${p.foto}" style="width:100%;height:100%;object-fit:cover;" />`
          : `<span class="producto-emoji">${p.emoji}</span>`
        }
      </div>
      <div class="producto-info">
        <p class="producto-categoria">${p.categoria}</p>
        <h3>${p.nombre}</h3>
        <p class="producto-desc">${p.descripcion}</p>
        <div class="producto-footer">
          <span class="producto-precio">$${p.precio.toLocaleString('es-CL')}</span>
          <button class="btn-agregar" onclick="agregarCarrito(this, ${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio}, '${p.emoji}', '${p.color_fondo}')">+ Agregar</button>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.producto-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 50);
  });
}

// ── CARGAR PRODUCTOS AL INICIO ──
async function cargarProductos() {
  try {
    const res = await fetch(`${API}/productos`);
    const productos = await res.json();
    renderizarProductos(productos);
  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
}

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── INICIAR ──
document.addEventListener('DOMContentLoaded', async () => {
  const categoriaGuardada = sessionStorage.getItem('categoria');
  const seccionGuardada = sessionStorage.getItem('seccion');

  if (categoriaGuardada) {
    sessionStorage.removeItem('categoria');
    setTimeout(async () => {
      await filtrarCategoria(categoriaGuardada);
    }, 100);
  } else if (seccionGuardada) {
    sessionStorage.removeItem('seccion');
    setTimeout(() => {
      const seccion = document.getElementById(seccionGuardada);
      if (seccion) seccion.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  } else {
    cargarProductos();
  }
});

async function filtrarCategoria(categoria) {
  try {
    const res = await fetch(`${API}/productos?categoria=${categoria}`);
    const productos = await res.json();
    ocultarPaginaCompleta();
    renderizarProductos(productos);
    document.getElementById('buscador').value = categoria;
  } catch (err) {
    console.error('Error al filtrar categoria:', err);
  }
}

// ── SESIÓN ──
function actualizarNavbar() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const btnLogin = document.querySelector('.btn-login');
  if (!btnLogin) return;

  if (usuario) {
    btnLogin.textContent = `👤 Hola, ${usuario.nombre}`;
    btnLogin.href = 'javascript:void(0)';
    btnLogin.onclick = () => {
      const menu = document.getElementById('menu-usuario');
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    };

    btnLogin.insertAdjacentHTML('afterend', `
      <div id="menu-usuario" style="display:none; position:absolute; right:6vw; top:70px; background:var(--blanco); border:1px solid var(--arena); border-radius:var(--radius); box-shadow:0 8px 32px rgba(42,37,32,0.12); min-width:180px; z-index:200;">
        <a href="javascript:void(0)" onclick="cerrarSesion()" style="display:block; padding:0.85rem 1.2rem; font-size:0.85rem; color:var(--terracota); text-decoration:none;">Cerrar sesión</a>
      </div>
    `);

    document.addEventListener('click', (e) => {
      if (!btnLogin.contains(e.target)) {
        const menu = document.getElementById('menu-usuario');
        if (menu) menu.style.display = 'none';
      }
    });

    actualizarContadorCarrito();
  } else {
    actualizarContadorLocal();
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.reload();
}

actualizarNavbar();

// ── MENÚ MÓVIL ──
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('abierto');
}
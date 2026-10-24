const orders = [
  { id: "CC-1048", customer: "Mariana López", phone: "55 1234 9081", product: "Pastel de vainilla", date: daysFromNow(0, 16), people: 20, price: 1250, status: "En producción", paid: 600, notes: "Flores en tonos rosa" },
  { id: "CC-1047", customer: "Sofía Ramírez", phone: "55 7788 1204", product: "Pastel de chocolate", date: daysFromNow(1, 11), people: 12, price: 890, status: "Confirmado", paid: 300, notes: "Decoración de fresas" },
  { id: "CC-1046", customer: "Diego Hernández", phone: "55 3301 8290", product: "Caja de galletas", date: daysFromNow(2, 13), people: 8, price: 420, status: "Listo", paid: 420, notes: "Sin nueces" },
  { id: "CC-1045", customer: "Lucía Torres", phone: "55 2233 8175", product: "Pay de limón", date: daysFromNow(3, 10), people: 10, price: 560, status: "Pendiente", paid: 0, notes: "Mensaje: Feliz cumpleaños" },
];

const products = [
  ["Pastel de vainilla", "Pasteles", "12 porciones", "$890.00", "6 insumos"],
  ["Pastel de chocolate", "Pasteles", "12 porciones", "$950.00", "8 insumos"],
  ["Pay de limón", "Pays", "10 porciones", "$560.00", "5 insumos"],
  ["Caja de galletas", "Galletas", "12 piezas", "$420.00", "7 insumos"],
  ["Roles de canela", "Roles", "8 piezas", "$380.00", "6 insumos"],
  ["Gelatina mosaico", "Gelatinas", "12 porciones", "$450.00", "5 insumos"],
  ["Flan napolitano", "Flanes", "10 porciones", "$490.00", "6 insumos"],
  ["Rosca de Reyes", "Rosca de Reyes", "15 porciones", "$780.00", "9 insumos"],
];

const ingredients = [
  ["Harina de trigo", "kg", "$28.50", "Actualizado hoy", "Normal"],
  ["Mantequilla sin sal", "kg", "$198.00", "Actualizado ayer", "Normal"],
  ["Chocolate semiamargo", "kg", "$245.00", "Actualizado hace 2 días", "Normal"],
  ["Fresas", "kg", "$95.00", "Actualizado hace 8 días", "Revisar precio"],
  ["Crema para batir", "L", "$132.00", "Actualizado hace 3 días", "Normal"],
];

const customers = [
  ["Mariana López", "55 1234 9081", "4 pedidos", "Último pedido: hoy"],
  ["Sofía Ramírez", "55 7788 1204", "2 pedidos", "Último pedido: 8 oct"],
  ["Diego Hernández", "55 3301 8290", "6 pedidos", "Último pedido: 9 oct"],
  ["Lucía Torres", "55 2233 8175", "1 pedido", "Cliente desde: sep 2026"],
];

const pageTitles = {
  inicio: "Inicio",
  pedidos: "Pedidos",
  catalogo: "Catálogo",
  insumos: "Insumos",
  clientes: "Clientes",
  pagos: "Pagos",
  configuracion: "Configuración",
};

const main = document.querySelector("#main-content");
const searchInput = document.querySelector("#global-search");
const sidebar = document.querySelector("#sidebar");
const dialog = document.querySelector("#order-dialog");
let activeView = "inicio";
let query = "";
let toastTimer;

function daysFromNow(days, hour) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function money(value) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

function shortDate(value, options = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("es-MX", options).format(new Date(value));
}

function timeOf(value) {
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function statusClass(status) {
  return ({
    "En producción": "production",
    Confirmado: "pending",
    Listo: "ready",
    Pendiente: "pending",
    Entregado: "delivered",
  })[status] || "";
}

function statusBadge(status) {
  return `<span class="status ${statusClass(status)}">${escapeHtml(status)}</span>`;
}

function orderRow(order) {
  return `<tr>
    <td><strong>${escapeHtml(order.id)}</strong></td>
    <td><div class="customer-cell"><span class="customer-initial">${escapeHtml(order.customer.charAt(0))}</span><span class="customer-meta"><strong>${escapeHtml(order.customer)}</strong><small>${escapeHtml(order.phone || "Sin teléfono")}</small></span></div></td>
    <td class="product-cell">${escapeHtml(order.product)}</td>
    <td>${shortDate(order.date)} · ${timeOf(order.date)}</td>
    <td>${statusBadge(order.status)}</td>
    <td>${money(order.price)}</td>
    <td><button class="text-link order-detail" data-order="${escapeHtml(order.id)}">Ver</button></td>
  </tr>`;
}

function orderTable(rows) {
  if (!rows.length) return `<div class="empty-state"><strong>No hay pedidos para mostrar</strong>Prueba con otra búsqueda o crea un pedido nuevo.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>PRODUCTO</th><th>ENTREGA</th><th>ESTATUS</th><th>TOTAL</th><th></th></tr></thead>
    <tbody>${rows.map(orderRow).join("")}</tbody>
  </table></div>`;
}

function matchingOrders() {
  const normalized = query.trim().toLocaleLowerCase("es-MX");
  if (!normalized) return orders;
  return orders.filter((order) => [order.id, order.customer, order.product, order.status]
    .some((value) => value.toLocaleLowerCase("es-MX").includes(normalized)));
}

function pageHeading(eyebrow, title, subtitle, action = "") {
  return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`;
}

function newOrderButton(label = "＋ Nuevo pedido") {
  return `<button class="button button-primary" data-action="new-order">${label}</button>`;
}

function renderDashboard() {
  const upcoming = [...orders].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);
  const due = orders.filter((order) => order.paid < order.price).reduce((sum, order) => sum + order.price - order.paid, 0);
  const today = orders.filter((order) => new Date(order.date).toDateString() === new Date().toDateString()).length;
  const reminders = upcoming.slice(0, 3);
  return `${pageHeading("DOMINGO, 11 DE OCTUBRE", "¡Buenos días, Karina! ✿", "Aquí tienes el resumen de tu repostería para hoy.", newOrderButton())}
    <section class="stats-grid" aria-label="Resumen del negocio">
      <article class="stat-card"><div class="stat-top"><span>Pedidos activos</span><span class="stat-icon">▤</span></div><p class="stat-value">${orders.length.toString().padStart(2, "0")}</p><span class="stat-foot">${today ? `${today} entrega${today === 1 ? "" : "s"} para hoy` : "Todos tus pedidos en orden"}</span></article>
      <article class="stat-card"><div class="stat-top"><span>Por cobrar</span><span class="stat-icon">＄</span></div><p class="stat-value">${money(due)}</p><span class="stat-foot">Saldo pendiente de pedidos</span></article>
      <article class="stat-card"><div class="stat-top"><span>Próxima entrega</span><span class="stat-icon">◷</span></div><p class="stat-value">${upcoming[0] ? shortDate(upcoming[0].date) : "—"}</p><span class="stat-foot">${upcoming[0] ? `${timeOf(upcoming[0].date)} · ${escapeHtml(upcoming[0].customer)}` : "Sin entregas próximas"}</span></article>
      <article class="stat-card"><div class="stat-top"><span>Productos activos</span><span class="stat-icon">♡</span></div><p class="stat-value">${products.length.toString().padStart(2, "0")}</p><span class="stat-foot">En tu catálogo</span></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-heading"><div><h2>Pedidos próximos</h2><p>Organiza lo que viene en tu agenda</p></div><button class="text-link" data-view="pedidos">Ver todos →</button></div>
        ${orderTable(upcoming)}
      </article>
      <div class="side-stack">
        <article class="panel reminder-panel">
          <div class="panel-heading"><div><h2>Recordatorios</h2><p>No dejes escapar ningún detalle</p></div><span class="stat-icon">◷</span></div>
          <div class="reminder-intro"><span class="reminder-icon">✦</span><div><strong>Producción a la vista</strong><p>Pedidos con entrega próxima. Prepara ingredientes y revisa personalizaciones.</p></div></div>
          ${reminders.map((order) => `<div class="reminder-item"><span class="date-tile"><strong>${shortDate(order.date, { day: "numeric" })}</strong><small>${shortDate(order.date, { month: "short" })}</small></span><span class="reminder-copy"><strong>${escapeHtml(order.customer)}</strong><small>${escapeHtml(order.product)}</small></span><span class="reminder-time">${timeOf(order.date)}</span></div>`).join("")}
        </article>
        <article class="panel stock-panel">
          <div class="panel-heading"><div><h2>Atención a insumos</h2><p>Revisa estos precios pronto</p></div><button class="text-link" data-view="insumos">Ver lista</button></div>
          <div class="stock-row"><span>Fresas</span><span class="stock-low">Precio por actualizar</span></div>
          <div class="stock-row"><span>Harina de trigo</span><span class="stock-ok">Al día ✓</span></div>
        </article>
      </div>
    </section>`;
}

function renderOrders() {
  const rows = matchingOrders();
  return `${pageHeading("ORGANIZA TU TRABAJO", "Todos los pedidos", "Cada detalle especial, en un solo lugar.", newOrderButton())}
    <div class="section-toolbar"><span class="page-subtitle">${rows.length} pedido${rows.length === 1 ? "" : "s"} registrados</span><select class="filter-select" id="order-filter" aria-label="Filtrar pedidos"><option value="Todos">Todos los estatus</option><option>Pendiente</option><option>Confirmado</option><option>En producción</option><option>Listo</option><option>Entregado</option></select></div>
    <section class="panel full-panel" id="orders-table">${orderTable(rows)}</section>`;
}

function renderCatalog() {
  const filtered = products.filter((item) => item.join(" ").toLocaleLowerCase("es-MX").includes(query.toLocaleLowerCase("es-MX")));
  return `${pageHeading("TUS CREACIONES", "Catálogo de productos", "Recetas, porciones y precios sugeridos.", `<button class="button button-primary" data-action="demo-product">＋ Agregar producto</button>`)}
    <div class="info-grid" style="margin-bottom:17px"><article class="panel info-card"><h3>Precio basado en costos</h3><p>Los precios sugeridos reflejan el costo actual de los insumos y el margen configurado.</p></article><article class="panel info-card"><h3>Porciones flexibles</h3><p>Configura presentaciones para que el tamaño sugerido cubra a todas las personas.</p></article><article class="panel info-card"><h3>8 categorías</h3><p>Pasteles, pays, roles, galletas, gelatinas, flanes y panes de temporada.</p></article></div>
    <section class="panel"><div class="panel-heading"><div><h2>Productos y presentaciones</h2><p>Vista de demostración del catálogo</p></div></div><div class="table-wrap"><table><thead><tr><th>PRODUCTO</th><th>CATEGORÍA</th><th>PRESENTACIÓN</th><th>PRECIO SUGERIDO</th><th>RECETA</th></tr></thead><tbody>${filtered.map((item) => `<tr><td class="product-cell">${escapeHtml(item[0])}</td><td>${escapeHtml(item[1])}</td><td>${escapeHtml(item[2])}</td><td>${item[3]}</td><td>${item[4]}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderIngredients() {
  const filtered = ingredients.filter((item) => item.join(" ").toLocaleLowerCase("es-MX").includes(query.toLocaleLowerCase("es-MX")));
  return `${pageHeading("CUIDA TUS COSTOS", "Insumos y materias primas", "Mantén al día los precios para proteger tus ganancias.", `<button class="button button-primary" data-action="demo-ingredient">＋ Registrar insumo</button>`)}
    <section class="panel"><div class="panel-heading"><div><h2>Lista de insumos</h2><p>El costo actualizado recalcula el precio sugerido de tus productos.</p></div></div><div class="table-wrap"><table><thead><tr><th>INSUMO</th><th>UNIDAD</th><th>COSTO UNITARIO</th><th>ACTUALIZACIÓN</th><th>ESTADO</th></tr></thead><tbody>${filtered.map((item) => `<tr><td class="product-cell">${escapeHtml(item[0])}</td><td>${escapeHtml(item[1])}</td><td>${item[2]}</td><td>${escapeHtml(item[3])}</td><td>${item[4] === "Normal" ? `<span class="status ready">Al día</span>` : `<span class="status pending">${escapeHtml(item[4])}</span>`}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderCustomers() {
  const filtered = customers.filter((item) => item.join(" ").toLocaleLowerCase("es-MX").includes(query.toLocaleLowerCase("es-MX")));
  return `${pageHeading("RELACIONES BONITAS", "Tus clientes", "Un registro de quienes confían en tus creaciones.", `<button class="button button-primary" data-action="demo-customer">＋ Nuevo cliente</button>`)}
    <section class="panel"><div class="panel-heading"><div><h2>Directorio de clientes</h2><p>Datos e historial de pedidos</p></div></div><div class="table-wrap"><table><thead><tr><th>CLIENTE</th><th>TELÉFONO</th><th>HISTORIAL</th><th>ACTIVIDAD</th></tr></thead><tbody>${filtered.map((item) => `<tr><td><div class="customer-cell"><span class="customer-initial">${escapeHtml(item[0].charAt(0))}</span><span class="customer-meta"><strong>${escapeHtml(item[0])}</strong></span></div></td><td>${escapeHtml(item[1])}</td><td>${escapeHtml(item[2])}</td><td>${escapeHtml(item[3])}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderPayments() {
  const pendingOrders = orders.filter((order) => order.paid < order.price);
  return `${pageHeading("CUENTAS CLARAS", "Pagos y anticipos", "Consulta lo recibido y los saldos por liquidar.")}
    <section class="stats-grid"><article class="stat-card"><div class="stat-top"><span>Por cobrar</span><span class="stat-icon">＄</span></div><p class="stat-value">${money(pendingOrders.reduce((sum, order) => sum + order.price - order.paid, 0))}</p><span class="stat-foot">Saldo de pedidos activos</span></article><article class="stat-card"><div class="stat-top"><span>Anticipos recibidos</span><span class="stat-icon">✓</span></div><p class="stat-value">${pendingOrders.filter((order) => order.paid > 0).length}</p><span class="stat-foot">Pedidos con pago parcial</span></article></section>
    <section class="panel"><div class="panel-heading"><div><h2>Pagos pendientes</h2><p>El estado se calcula con los pagos registrados y el total del pedido.</p></div></div>${orderTable(pendingOrders)}</section>`;
}

function renderSettings() {
  return `${pageHeading("TU FORMA DE TRABAJAR", "Configuración", "Ajusta recordatorios y reglas de operación.")}
    <section class="panel" style="max-width:760px"><div class="panel-heading"><div><h2>Recordatorios de producción</h2><p>Alertas internas antes de la fecha acordada de entrega.</p></div></div><div class="settings-list">
      <label class="setting-row"><span><strong>Anticipación de recordatorio</strong><small>Cuánto antes aparecerá el pedido en tus alertas.</small></span><select id="reminder-setting"><option>24 horas antes</option><option selected>48 horas antes</option></select></label>
      <label class="setting-row"><span><strong>Canal de notificación</strong><small>Por ahora, los avisos aparecen dentro del panel.</small></span><select><option>Notificación en la aplicación</option></select></label>
    </div><div class="panel-heading"><div><h2>Recargo por recolección tardía</h2><p>La propuesta requiere aprobación antes de sumarse al pedido.</p></div></div><div class="settings-list">
      <label class="setting-row"><span><strong>Aplicar recargo</strong><small>Configura tolerancia y monto antes de activar esta regla.</small></span><select id="surcharge-setting"><option>No activo</option><option>Activo</option></select></label>
      <label class="setting-row"><span><strong>Tolerancia</strong><small>Tiempo permitido después de la hora acordada.</small></span><select><option>30 minutos</option><option>1 hora</option><option>2 horas</option></select></label>
    </div></section>`;
}

function render() {
  const pages = {
    inicio: renderDashboard,
    pedidos: renderOrders,
    catalogo: renderCatalog,
    insumos: renderIngredients,
    clientes: renderCustomers,
    pagos: renderPayments,
    configuracion: renderSettings,
  };
  document.querySelector("#breadcrumb-current").textContent = pageTitles[activeView];
  document.querySelector("#nav-order-count").textContent = orders.length;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === activeView));
  main.innerHTML = pages[activeView]();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3000);
}

function openOrderDialog() {
  const form = document.querySelector("#order-form");
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
  form.elements.date.value = defaultDate.toISOString().slice(0, 16);
  dialog.showModal();
}

function showOrderDetail(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;
  showToast(`${order.customer} · ${order.product} · ${order.people} personas · ${order.notes}`);
}

document.querySelectorAll(".nav-item, .brand").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    activeView = item.dataset.view;
    sidebar.classList.remove("open");
    render();
    main.focus({ preventScroll: true });
  });
});

document.querySelector("#mobile-menu").addEventListener("click", () => sidebar.classList.toggle("open"));
document.querySelector("#notification-button").addEventListener("click", () => {
  activeView = "inicio";
  render();
  showToast("Tienes recordatorios de producción para tus próximos pedidos.");
});
searchInput.addEventListener("input", () => {
  query = searchInput.value;
  if (["pedidos", "catalogo", "insumos", "clientes"].includes(activeView)) render();
});
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    searchInput.value = "";
    query = "";
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
});

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton && !viewButton.classList.contains("nav-item") && !viewButton.classList.contains("brand")) {
    activeView = viewButton.dataset.view;
    render();
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "new-order") openOrderDialog();
  if (action === "demo-product") showToast("El formulario de catálogo se conectará al módulo de productos.");
  if (action === "demo-ingredient") showToast("El formulario de insumos se conectará al esquema de costos.");
  if (action === "demo-customer") showToast("El formulario de clientes se conectará al directorio.");
  const orderLink = event.target.closest(".order-detail");
  if (orderLink) showOrderDetail(orderLink.dataset.order);
});

document.addEventListener("change", (event) => {
  if (event.target.id !== "order-filter") return;
  const filtered = event.target.value === "Todos"
    ? matchingOrders()
    : matchingOrders().filter((order) => order.status === event.target.value);
  document.querySelector("#orders-table").innerHTML = orderTable(filtered);
});

document.querySelector("#order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const price = Number(values.get("price")) || 0;
  const newId = `CC-${1049 + orders.length - 4}`;
  orders.unshift({
    id: newId,
    customer: values.get("customer").trim(),
    phone: values.get("phone").trim() || "Sin teléfono",
    product: values.get("product"),
    date: new Date(values.get("date")).toISOString(),
    people: Number(values.get("people")),
    price,
    status: "Pendiente",
    paid: 0,
    notes: values.get("notes").trim() || "Sin notas",
    photo: values.get("photo").trim(),
  });
  dialog.close();
  form.reset();
  query = "";
  searchInput.value = "";
  activeView = "pedidos";
  render();
  showToast(`Pedido ${newId} guardado en esta sesión de demostración.`);
});

document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

render();

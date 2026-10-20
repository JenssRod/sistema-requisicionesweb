import { useState, useEffect } from "react";
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1f2937', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#34d399' }}>
  <span>Tasa BCV (Bs):</span>
  <input 
    type="number"
    value={tasaBcv}
    onChange={(e) => setTasaBcv(e.target.value)}
    style={{ padding: '4px', fontSize: '13px', width: '80px', textAlign: 'center', borderRadius: '4px', border: '1px solid #4b5563', background: '#111827', color: '#fff' }}
  />
  <button 
    onClick={() => {
      localStorage.setItem("falcon_tasa_bcv", JSON.stringify(tasaBcv));
      alert("¡Tasa BCV guardada con éxito!");
    }}
    style={{ padding: '4px 10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
  >
    Guardar
  </button>
</div>
export default function PanelAdmin({
  usuarioActual,
  listaRequisiciones,
  setListaRequisiciones,
  nuevaAlertaAdmin,
  setNuevaAlertaAdmin,
  productosCatalogo,
  setProductosCatalogo,
  usuarios,
  setUsuarios,
  tasaDia,
  setTasaDia,
  onVolver
}) {
  const [tab, setTab] = useState("requisiciones");
  const [alertaTasa, setAlertaTasa] = useState(false);

  // ============================
  // TASA AUTOMÁTICA DESDE SERVIDOR BCV
  // ============================
  const obtenerTasaBCV = async () => {
    try {
      const res = await fetch("http://localhost:3001/tasa-bcv");
      const data = await res.json();

      if (data.tasa && data.tasa !== tasaDia) {
        setTasaDia(data.tasa);
        setAlertaTasa(true);
        setTimeout(() => setAlertaTasa(false), 5000);
      }
    } catch (error) {
      console.log("Error obteniendo tasa BCV:", error);
    }
  };

  useEffect(() => {
    obtenerTasaBCV();
    const intervalo = setInterval(obtenerTasaBCV, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const totalRequisiciones = listaRequisiciones.length;
  const procesadas = listaRequisiciones.filter(r => r.estado === "Procesada").length;
  const pendientes = listaRequisiciones.filter(r => r.estado !== "Procesada").length;
  const ultima = listaRequisiciones[listaRequisiciones.length - 1];

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroSucursal, setFiltroSucursal] = useState("");

  const requisicionesFiltradas = listaRequisiciones.filter(req => {
    if (filtroEstado !== "todos" && req.estado !== filtroEstado) return false;
    if (filtroSucursal && !req.sucursal.toLowerCase().includes(filtroSucursal.toLowerCase())) return false;
    return true;
  });

  const marcarComoProcesada = (idReq) => {
    const actualizado = listaRequisiciones.map(req =>
      req.id === idReq ? { ...req, estado: "Procesada" } : req
    );
    setListaRequisiciones(actualizado);
  };

  const imprimirRequisicion = (req) => {
    const contenido = `
FALCON CREST - REQUISICIÓN
Sucursal: ${req.sucursal}
Fecha: ${req.fecha}
Estado: ${req.estado}

Items:
${req.items.map(item =>
  `- ${item.nombre} | Cant: ${item.cantidad} | Precio: $${item.precio} | Subtotal: $${item.subtotal}`
).join("\n")}
    `;
    const ventana = window.open("", "_blank");
    ventana.document.write(`<pre>${contenido}</pre>`);
    ventana.print();
  };

  const [nuevoNombreProd, setNuevoNombreProd] = useState("");
  const [nuevoPrecioProd, setNuevoPrecioProd] = useState("");

  const crearProducto = () => {
    if (!nuevoNombreProd || !nuevoPrecioProd) return;
    const nuevo = {
      id: productosCatalogo.length + 1,
      nombre: nuevoNombreProd,
      precio: parseFloat(nuevoPrecioProd)
    };
    setProductosCatalogo([...productosCatalogo, nuevo]);
    setNuevoNombreProd("");
    setNuevoPrecioProd("");
  };

  const cambiarPrecioProducto = (id, nuevoPrecio) => {
    const actualizado = productosCatalogo.map(p =>
      p.id === id ? { ...p, precio: parseFloat(nuevoPrecio) } : p
    );
    setProductosCatalogo(actualizado);
  };

  const [nuevoNombreUsuario, setNuevoNombreUsuario] = useState("");
  const [nuevoRolUsuario, setNuevoRolUsuario] = useState("Sucursal");
  const [nuevaClaveUsuario, setNuevaClaveUsuario] = useState("");

  const crearUsuario = () => {
    if (!nuevoNombreUsuario || !nuevaClaveUsuario) return;
    const nuevo = {
      id: usuarios.length + 1,
      nombre: nuevoNombreUsuario,
      rol: nuevoRolUsuario,
      clave: nuevaClaveUsuario
    };
    setUsuarios([...usuarios, nuevo]);
    setNuevoNombreUsuario("");
    setNuevaClaveUsuario("");
    setNuevoRolUsuario("Sucursal");
  };

  return (
    <div className="table-card">
      <h2 className="table-title">Panel Administrativo</h2>
      <p className="table-subtitle">
        Gestión de sistema — Usuario: <strong>{usuarioActual}</strong>
      </p>

      {alertaTasa && (
        <div style={{
          background: "#00A8FF",
          color: "white",
          padding: "14px",
          borderRadius: "10px",
          marginBottom: "20px",
          fontWeight: "700",
          boxShadow: "0 0 20px rgba(0,168,255,0.6)",
          animation: "pulse 1s infinite"
        }}>
          ⚡ Tasa del día actualizada automáticamente: {tasaDia.toFixed(2)} Bs
        </div>
      )}

      <div
        style={{
          background: "#1a3c6e",
          color: "white",
          padding: "14px",
          borderRadius: "10px",
          marginBottom: "20px",
          fontWeight: "700",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
      >
        💱 Tasa BCV actual: {tasaDia.toFixed(2)} Bs
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <button className="btn btn-print" style={{ background: tab === "requisiciones" ? "#0066cc" : "#5f6c7b" }} onClick={() => setTab("requisiciones")}>Requisiciones</button>
        <button className="btn btn-print" style={{ background: tab === "productos" ? "#0066cc" : "#5f6c7b" }} onClick={() => setTab("productos")}>Productos</button>
        <button className="btn btn-print" style={{ background: tab === "usuarios" ? "#0066cc" : "#5f6c7b" }} onClick={() => setTab("usuarios")}>Usuarios</button>
        <button className="btn btn-print" style={{ background: tab === "config" ? "#0066cc" : "#5f6c7b" }} onClick={() => setTab("config")}>Configuración</button>
      </div>

      {tab === "requisiciones" && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "30px"
          }}>
            <div style={{
              background: "#1a3c6e",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
            }}>
              <h3>Total Requisiciones</h3>
              <p style={{ fontSize: "2.2rem", fontWeight: "700" }}>{totalRequisiciones}</p>
            </div>

            <div style={{
              background: "#00994d",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
            }}>
              <h3>Procesadas</h3>
              <p style={{ fontSize: "2.2rem", fontWeight: "700" }}>{procesadas}</p>
            </div>

            <div style={{
              background: "#d35400",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
            }}>
              <h3>Pendientes</h3>
              <p style={{ fontSize: "2.2rem", fontWeight: "700" }}>{pendientes}</p>
            </div>

            <div
              style={{
                background: "#00A8FF",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Tasa BCV</h3>
              <p
                style={{
                  fontSize: "2.2rem",
                  fontWeight: "700",
                  marginTop: "10px"
                }}
              >
                {tasaDia.toFixed(2)}
              </p>
            </div>
          </div>

          {ultima && (
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              marginBottom: "30px",
              borderLeft: "6px solid #1a3c6e"
            }}>
              <h3>Última Requisición</h3>
              <p>
                <strong>ID:</strong> {ultima.id}<br />
                <strong>Sucursal:</strong> {ultima.sucursal}<br />
                <strong>Fecha:</strong> {ultima.fecha}<br />
                <strong>Estado:</strong> {ultima.estado}
              </p>
            </div>
          )}

          <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Procesada">Procesada</option>
            </select>

            <input
              type="text"
              placeholder="Filtrar por sucursal"
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
            />
          </div>

          {requisicionesFiltradas.length === 0 ? (
            <p className="table-subtitle">No hay requisiciones con esos filtros.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sucursal</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {requisicionesFiltradas.map(req => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.sucursal}</td>
                    <td>{req.fecha}</td>
                    <td>
                      <span style={{
                        background: req.estado === "Procesada" ? "#00994d" : "#d35400",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        fontWeight: "600"
                      }}>
                        {req.estado}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-print" onClick={() => imprimirRequisicion(req)} style={{ marginRight: 8 }}>
                        Imprimir
                      </button>
                      {req.estado !== "Procesada" && (
                        <button className="btn btn-process" onClick={() => marcarComoProcesada(req.id)}>
                          Procesar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "productos" && (
        <>
          <h3 className="table-title">Gestión de productos</h3>
          <p className="table-subtitle">Cambios de precios y creación de nuevos productos.</p>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Nuevo precio</th>
              </tr>
            </thead>
            <tbody>
              {productosCatalogo.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>${p.precio.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      onBlur={(e) => cambiarPrecioProducto(p.id, e.target.value)}
                      placeholder="Nuevo precio"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <h4>Crear nuevo producto</h4>
            <input
              type="text"
              placeholder="Nombre"
              value={nuevoNombreProd}
              onChange={(e) => setNuevoNombreProd(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={nuevoPrecioProd}
              onChange={(e) => setNuevoPrecioProd(e.target.value)}
            />
            <button className="btn btn-process" style={{ marginLeft: 10 }} onClick={crearProducto}>
              Crear producto
            </button>
          </div>
        </>
      )}

      {tab === "usuarios" && (
        <>
          <h3 className="table-title">Gestión de usuarios</h3>
          <p className="table-subtitle">Usuarios, roles y claves internas del sistema.</p>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Clave</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nombre}</td>
                  <td>{u.rol}</td>
                  <td>{u.clave}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <h4>Crear nuevo usuario</h4>
            <input
              type="text"
              placeholder="Nombre"
              value={nuevoNombreUsuario}
              onChange={(e) => setNuevoNombreUsuario(e.target.value)}
            />
            <select
              value={nuevoRolUsuario}
              onChange={(e) => setNuevoRolUsuario(e.target.value)}
            >
              <option value="Sucursal">Sucursal</option>
              <option value="Admin">Admin</option>
            </select>
            <input
              type="text"
              placeholder="Clave"
              value={nuevaClaveUsuario}
              onChange={(e) => setNuevaClaveUsuario(e.target.value)}
            />
            <button className="btn btn-process" style={{ marginLeft: 10 }} onClick={crearUsuario}>
              Crear usuario
            </button>
          </div>
        </>
      )}

      {tab === "config" && (
        <>
          <h3 className="table-title">Configuración del sistema</h3>
          <p className="table-subtitle">Parámetros generales, incluyendo tasa del día.</p>

          <div style={{ marginTop: 10 }}>
            <label>
              Tasa del día (BCV):{" "}
              <input
                type="number"
                step="0.01"
                value={tasaDia}
                onChange={(e) => setTasaDia(parseFloat(e.target.value))}
              />
            </label>
          </div>
        </>
      )}

      <button className="btn btn-back" onClick={onVolver}>
        Volver al menú
      </button>
    </div>
  );
}

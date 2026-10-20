import { useState } from "react";

export default function SistemaRequisiciones({
  usuarioActual,
  productosCatalogo,
  listaRequisiciones,
  setListaRequisiciones,
  setNuevaAlertaAdmin,
  onVolver
}) {
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
  const [sucursal] = useState(usuarioActual || "Sucursal Sambil");

  const agregarItem = (producto) => {
    const existe = itemsSeleccionados.find((i) => i.id === producto.id);
    if (existe) {
      setItemsSeleccionados(
        itemsSeleccionados.map((i) =>
          i.id === producto.id
            ? {
                ...i,
                cantidad: i.cantidad + 1,
                subtotal: (i.cantidad + 1) * i.precio
              }
            : i
        )
      );
    } else {
      setItemsSeleccionados([
        ...itemsSeleccionados,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          subtotal: producto.precio
        }
      ]);
    }
  };

  const enviarRequisicion = () => {
    if (itemsSeleccionados.length === 0) return;

    const nuevaReq = {
      id: listaRequisiciones.length + 1,
      sucursal,
      fecha: new Date().toLocaleString(),
      estado: "Pendiente",
      items: itemsSeleccionados
    };

    setListaRequisiciones([...listaRequisiciones, nuevaReq]);
    setNuevaAlertaAdmin(true);
    setItemsSeleccionados([]);

    alert("Requisición enviada al Admin.");
  };

  return (
    <div className="table-card">
      <h2 className="table-title">Sucursal — {sucursal}</h2>
      <p className="table-subtitle">
        Seleccione productos y genere una requisición corporativa.
      </p>

      {/* TARJETA CORPORATIVA DE ESTADO */}
      <div
        style={{
          background: "#1a3c6e",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
        }}
      >
        <h3 style={{ margin: 0 }}>Resumen de la requisición</h3>
        <p style={{ marginTop: "10px", fontSize: "1.1rem" }}>
          <strong>Items seleccionados:</strong> {itemsSeleccionados.length}
        </p>
      </div>

      {/* CATÁLOGO CORPORATIVO */}
      <h3 style={{ color: "#1a3c6e", marginBottom: "10px" }}>
        Catálogo de productos
      </h3>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productosCatalogo.map((prod) => (
            <tr key={prod.id}>
              <td>{prod.nombre}</td>
              <td>${prod.precio.toFixed(2)}</td>
              <td>
                <button
                  className="btn btn-print"
                  onClick={() => agregarItem(prod)}
                >
                  Agregar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ITEMS SELECCIONADOS */}
      <h3 style={{ marginTop: 30, color: "#1a3c6e" }}>
        Items seleccionados
      </h3>

      {itemsSeleccionados.length === 0 ? (
        <p className="table-subtitle">No hay productos seleccionados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itemsSeleccionados.map((item) => (
              <tr key={item.id}>
                <td>{item.nombre}</td>
                <td>{item.cantidad}</td>
                <td>${item.precio.toFixed(2)}</td>
                <td>${item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* BOTONES CORPORATIVOS */}
      <div style={{ marginTop: 25 }}>
        <button
          className="btn btn-process"
          style={{ marginRight: 10 }}
          onClick={enviarRequisicion}
        >
          Enviar requisición
        </button>

        <button className="btn btn-back" onClick={onVolver}>
          Volver al menú
        </button>
      </div>
    </div>
  );
}

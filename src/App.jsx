import React, { useState, useEffect } from 'react';
import logoFalcon from './assets/logo.jpg';
const URL_LOGO = logoFalcon;
import { supabase } from './supabaseClient';

export default function App() {
  const [modo, setModo] = useState('menu'); 
  const [usuarioActual, setUsuarioActual] = useState('sucursal');
  const [claveAdminInput, setClaveAdminInput] = useState('');
  const [nuevaAlertaAdmin, setNuevaAlertaAdmin] = useState(false);

  // --- CATÁLOGO DE PRODUCTOS DESDE SUPABASE ---
  const [productosCatalogo, setProductosCatalogo] = useState([]);

  const cargarProductosDeSupabase = async () => {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) {
      console.error('Error al cargar productos:', error);
    } else if (data) {
      const formateados = data.map(p => ({
        ...p,
        precio: parseFloat(p.precio) || 0
      }));
      setProductosCatalogo(formateados);
    }
  };

  useEffect(() => {
    cargarProductosDeSupabase();
  }, []);

  // --- REQUISICIONES REALTIME + POLLING AUTOMÁTICO DE RESPALDO ---
  const [listaRequisiciones, setListaRequisiciones] = useState([]);
  const [conteoAnterior, setConteoAnterior] = useState(0);

  const cargarRequisicionesDeSupabase = async () => {
    const { data, error } = await supabase
      .from('requisiciones')
      .select('*');

    if (error) {
      console.error('Error al cargar requisiciones:', error);
    } else if (data) {
      if (conteoAnterior > 0 && data.length > conteoAnterior) {
        setNuevaAlertaAdmin(true); // Activa el banner rojo si hay una orden nueva
      }
      setConteoAnterior(data.length);

      setListaRequisiciones(data.map(item => ({
        ...item.datos,
        supabase_db_id: item.id
      })));
    }
  };

  useEffect(() => {
    cargarRequisicionesDeSupabase();

    // 1. Canal Realtime instantáneo (gracias a que ya lo activaste en Supabase)
    const canalRequisiciones = supabase
      .channel('canal-alertas-definitivo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requisiciones' },
        (payload) => {
          cargarRequisicionesDeSupabase();
          setNuevaAlertaAdmin(true);
        }
      )
      .subscribe();

    // 2. Respaldo de verificación cada 2 segundos (Infallible)
    const intervalo = setInterval(() => {
      cargarRequisicionesDeSupabase();
    }, 2000);

    return () => {
      supabase.removeChannel(canalRequisiciones);
      clearInterval(intervalo);
    };
  }, [conteoAnterior]);

  // --- TASA BCV DESDE SUPABASE Y ACTUALIZACIÓN AUTOMÁTICA ---
  const [tasaBcv, setTasaBcv] = useState(() => {
    const guardada = localStorage.getItem('falcon_tasa_bcv');
    return guardada ? parseFloat(guardada) : 30.50;
  });
  const [cargandoTasa, setCargandoTasa] = useState(false);

  const cargarTasaDeSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('tasa_bcv')
        .select('*')
        .limit(1);

      if (!error && data && data.length > 0 && data[0].valor) {
        const val = parseFloat(data[0].valor);
        if (!isNaN(val) && val > 0) {
          setTasaBcv(val);
          localStorage.setItem('falcon_tasa_bcv', val.toString());
        }
      }
    } catch (e) {
      console.error("Error al cargar la tasa:", e);
    }
  };

  useEffect(() => {
    cargarTasaDeSupabase();
  }, []);

  const guardarTasaEnSupabase = async (nuevoValor) => {
    const valorNumerico = parseFloat(nuevoValor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) return;

    localStorage.setItem('falcon_tasa_bcv', valorNumerico.toString());

    try {
      const { data: updateData, error: updateError } = await supabase
        .from('tasa_bcv')
        .update({ valor: valorNumerico })
        .neq('id', 0)
        .select();

      if (updateError || !updateData || updateData.length === 0) {
        await supabase
          .from('tasa_bcv')
          .insert([{ id: 1, valor: valorNumerico }]);
      }
    } catch (e) {
      console.error("Error al guardar la tasa en la nube:", e);
    }
  };

  const obtenerTasaBcvAutomatica = async () => {
    setCargandoTasa(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      if (data && data.promedio) {
        const valorOficial = parseFloat(data.promedio);
        setTasaBcv(valorOficial);
        await guardarTasaEnSupabase(valorOficial);
        alert(`✅ Tasa BCV actualizada automáticamente: ${valorOficial} Bs.`);
      } else {
        alert("⚠️ No se pudo obtener la tasa automática. Puedes ingresarla manualmente.");
      }
    } catch (err) {
      console.error("Error consultando la API del BCV:", err);
      alert("❌ Error de conexión al consultar la tasa automática.");
    } finally {
      setCargandoTasa(false);
    }
  };

  const [listaAdmins, setListaAdmins] = useState([]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*');

      if (error) {
        console.error("Error cargando usuarios:", error);
      } else if (data) {
        setListaAdmins(data);
      }
    };

    cargarUsuarios();
  }, []);

  const ingresarComoAdmin = (e) => {
    e.preventDefault();
    const adminEncontrado = listaAdmins.find(a => a.usuario === usuarioActual && a.clave === claveAdminInput);
    if (adminEncontrado || (usuarioActual === 'admin' && claveAdminInput === 'falcon2026')) {
      setModo('admin');
      setClaveAdminInput('');
      setNuevaAlertaAdmin(false);
    } else {
      alert("❌ Contraseña de Administrador incorrecta.");
    }
  };

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>

      {modo === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b', marginBottom: '20px' }} />
            <h1 style={{ color: '#f59e0b', fontSize: '24px', margin: '0 0 5px 0' }}>FALCON CREST</h1>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '30px' }}>Sistema de Requisiciones y Control — Sambil Punto Fijo</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => setModo('sucursal')} 
                style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                🏪 Ingresar Sucursal (Cafetín Sambil)
              </button>

              <div style={{ borderTop: '1px solid #374151', margin: '10px 0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '10px' }}>🔑 Acceso Administrativo (Planta)</h3>
                <form onSubmit={ingresarComoAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select 
                    value={usuarioActual} 
                    onChange={e => setUsuarioActual(e.target.value)}
                    style={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
                  >
                    {listaAdmins.length > 0 ? (
                      listaAdmins.map(a => (
                        <option key={a.usuario} value={a.usuario}>Administrador: {a.usuario}</option>
                      ))
                    ) : (
                      <option value="admin">Administrador: admin</option>
                    )}
                  </select>
                  <input 
                    type="password" 
                    placeholder="Contraseña de Administrador" 
                    value={claveAdminInput}
                    onChange={e => setClaveAdminInput(e.target.value)}
                    style={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
                  />
                  <button 
                    type="submit" 
                    style={{ backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    🔓 Entrar al Panel de Control
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {modo === 'sucursal' && (
        <VistaSucursal 
          onVolverAlMenu={() => setModo('menu')}
          productosCatalogo={productosCatalogo}
          listaRequisiciones={listaRequisiciones}
          setListaRequisiciones={setListaRequisiciones}
          tasaBcv={tasaBcv}
          setTasaBcv={setTasaBcv}
          guardarTasaEnSupabase={guardarTasaEnSupabase}
          obtenerTasaBcvAutomatica={obtenerTasaBcvAutomatica}
          cargandoTasa={cargandoTasa}
          cargarRequisicionesDeSupabase={cargarRequisicionesDeSupabase}
        />
      )}

      {modo === 'admin' && (
        <PanelAdmin 
          usuarioActual={usuarioActual}
          onVolverAlMenu={() => setModo('menu')}
          listaRequisiciones={listaRequisiciones}
          setListaRequisiciones={setListaRequisiciones}
          listaAdmins={listaAdmins}
          setListaAdmins={setListaAdmins}
          nuevaAlertaAdmin={nuevaAlertaAdmin}
          setNuevaAlertaAdmin={setNuevaAlertaAdmin}
          productosCatalogo={productosCatalogo}
          cargarProductosDeSupabase={cargarProductosDeSupabase}
          tasaBcv={tasaBcv}
          setTasaBcv={setTasaBcv}
          guardarTasaEnSupabase={guardarTasaEnSupabase}
          obtenerTasaBcvAutomatica={obtenerTasaBcvAutomatica}
          cargandoTasa={cargandoTasa}
          cargarRequisicionesDeSupabase={cargarRequisicionesDeSupabase}
        />
      )}

      {/* BANNER ROJO GIGANTE INELUDIBLE */}
      <BannerNuevaRequisicion 
        nuevaAlertaAdmin={nuevaAlertaAdmin} 
        setNuevaAlertaAdmin={setNuevaAlertaAdmin} 
        setModo={setModo}
      />
    </div>
  );
}

function VistaSucursal({ onVolverAlMenu, productosCatalogo, setListaRequisiciones, tasaBcv, setTasaBcv, guardarTasaEnSupabase, obtenerTasaBcvAutomatica, cargandoTasa, cargarRequisicionesDeSupabase }) {
  const [requisicion, setRequisicion] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODOS');
  
  const [prioridad, setPrioridad] = useState('Normal');
  const [observaciones, setObservaciones] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const categorias = [
    'TODOS', 
    'Panadería', 
    'Pastelería', 
    'Bebidas', 
    'Golosinas y Chocolates', 
    'Galletas y Snacks', 
    'Lácteos y Cafés', 
    'Empaques y Descartables', 
    'Cigarrillos y Varios'
  ];

  const agregarAlCarrito = (producto) => {
    setRequisicion(prev => {
      const actual = prev[producto.id] ? parseFloat(prev[producto.id].cantidad) || 0 : 0;
      return {
        ...prev,
        [producto.id]: { 
          ...producto, 
          precio: parseFloat(producto.precio) || 0,
          cantidad: actual + 1 
        }
      };
    });
  };

  const actualizarCantidad = (id, cantidadStr) => {
    const cantidad = parseFloat(cantidadStr) || 0;
    setRequisicion(prev => {
      const copia = { ...prev };
      if (cantidad <= 0) {
        delete copia[id];
      } else {
        copia[id].cantidad = cantidad;
      }
      return copia;
    });
  };

  const totalItems = Object.values(requisicion).reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0), 0);
  
  const totalUSD = Object.values(requisicion).reduce((acc, item) => {
    const precioNum = parseFloat(item.precio) || 0;
    const cantNum = parseFloat(item.cantidad) || 0;
    return acc + (precioNum * cantNum);
  }, 0);

  const totalBS = totalUSD * (parseFloat(tasaBcv) || 1);

  const enviarRequisicionAPlanta = async () => {
    if (Object.keys(requisicion).length === 0) {
      alert("⚠️ La requisición está vacía. Seleccione al menos un producto.");
      return;
    }

    const nuevaOrden = {
      id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
      sucursal: 'Cafetín Sambil',
      fecha: new Date().toLocaleString(),
      prioridad,
      observaciones,
      items: Object.values(requisicion),
      totalUSD,
      totalBS,
      tasaBcvAplicada: Number(tasaBcv) || 1,
      estatus: 'Pendiente ⏳'
    };

    await guardarRequisicionEnNube(nuevaOrden);
    await cargarRequisicionesDeSupabase();

    setMensajeExito("¡Requisición enviada con éxito a Planta / Producción!");
    setTimeout(() => setMensajeExito(''), 4000);
    setRequisicion({});
    setObservaciones('');
  };

  const productosFiltrados = productosCatalogo.filter(p => {
    const coincideCat = categoriaSeleccionada === 'TODOS' || (p.categoria && p.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase());
    const coincideBusq = p.nombre && p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideBusq;
  });

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '15px 25px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #f59e0b' }} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>FALCON CREST</h1>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sucursal Sambil Punto Fijo | Usuario: <strong style={{ color: '#34d399' }}>Sucursal Única</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1f2937', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#34d399', border: '1px solid #374151' }}>
            <span>Tasa BCV (Bs):</span>
            <input 
              type="number"
              step="0.01"
              value={tasaBcv}
              onChange={(e) => {
                const nuevoVal = parseFloat(e.target.value) || 0;
                setTasaBcv(nuevoVal);
                guardarTasaEnSupabase(nuevoVal);
              }}
              style={{ padding: '4px', fontSize: '13px', width: '90px', textAlign: 'center', borderRadius: '4px', border: '1px solid #4b5563', background: '#111827', color: '#fff', fontWeight: 'bold' }}
            />
            <button 
              onClick={obtenerTasaBcvAutomatica} 
              disabled={cargandoTasa}
              title="Obtener Tasa Oficial BCV Automática"
              style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 9px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
            >
              {cargandoTasa ? '⌛' : '🔄 Auto'}
            </button>
          </div>

          <button onClick={onVolverAlMenu} style={{ backgroundColor: '#374151', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏠 Menú Principal</button>
        </div>
      </div>

      {mensajeExito && (
        <div style={{ backgroundColor: '#059669', color: '#fff', padding: '14px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          {mensajeExito}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        <div>
          <div style={{ marginBottom: '15px' }}>
            <input 
              type="text" 
              placeholder="🔍 Buscar artículo..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', borderRadius: '8px', color: '#fff', outline: 'none' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {categorias.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoriaSeleccionada(cat)} 
                style={{ padding: '8px 16px', backgroundColor: categoriaSeleccionada === cat ? '#f59e0b' : '#111827', color: categoriaSeleccionada === cat ? '#000' : '#d1d5db', border: '1px solid', borderColor: categoriaSeleccionada === cat ? '#f59e0b' : '#374151', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', maxHeight: '58vh', overflowY: 'auto' }}>
            {productosFiltrados.length === 0 ? (
              <p style={{ color: '#9ca3af', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No hay artículos registrados. Ve al Panel Admin para importar tu carga masiva.</p>
            ) : (
              productosFiltrados.map(prod => (
                <div key={prod.id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold' }}>
                      {prod.categoria}
                    </span>
                    <h4 style={{ fontSize: '14px', margin: '8px 0', color: '#fff' }}>{prod.nombre}</h4>
                    <p style={{ fontSize: '14px', color: '#34d399', margin: '0 0 14px 0', fontWeight: 'bold' }}>
                      ${(parseFloat(prod.precio) || 0).toFixed(2)} <span style={{ fontSize: '11px', color: '#9ca3af' }}>/ {prod.unidad}</span>
                    </p>
                  </div>
                  <button onClick={() => agregarAlCarrito(prod)} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '9px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Agregar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #374151', paddingBottom: '10px', marginBottom: '12px', color: '#f59e0b' }}>
            🛒 Requisición Actual ({totalItems})
          </h3>

          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px', borderTop: '1px solid #1f2937', paddingTop: '8px' }}>
            {Object.keys(requisicion).length === 0 ? (
              <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: '15px 0' }}>No hay artículos seleccionados</p>
            ) : (
              Object.values(requisicion).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</span>
                  <input type="number" min="0.1" step="any" value={item.cantidad} onChange={(e) => actualizarCantidad(item.id, e.target.value)} style={{ width: '45px', textAlign: 'center', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px' }} />
                  <span style={{ marginLeft: '8px', color: '#34d399', width: '55px', textAlign: 'right', fontWeight: 'bold' }}>
                    ${((parseFloat(item.precio) || 0) * (parseFloat(item.cantidad) || 0)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid #374151', paddingTop: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}><span>Total USD:</span><span style={{ color: '#34d399' }}>${totalUSD.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}><span>Total BS:</span><span style={{ color: '#f59e0b' }}>Bs. {totalBS.toFixed(2)}</span></div>
          </div>

          <button onClick={enviarRequisicionAPlanta} style={{ width: '100%', backgroundColor: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            🚀 Enviar Requisición a Planta
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelAdmin({ usuarioActual, onVolverAlMenu, listaRequisiciones, setListaRequisiciones, listaAdmins, setListaAdmins, nuevaAlertaAdmin, setNuevaAlertaAdmin, productosCatalogo, cargarProductosDeSupabase, tasaBcv, setTasaBcv, guardarTasaEnSupabase, obtenerTasaBcvAutomatica, cargandoTasa, cargarRequisicionesDeSupabase }) {
  const [pestana, setPestana] = useState('requisiciones');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const [userSeleccionado, setUserSeleccionado] = useState(listaAdmins[0]?.usuario || 'admin');
  const [nuevaClave, setNuevaClave] = useState('');
  const [msgClave, setMsgClave] = useState('');
  const [alertaAdminMsg, setAlertaAdminMsg] = useState('');

  const [busqAdmin, setBusqAdmin] = useState('');
  const [productoEditandoId, setProductoEditandoId] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({ nombre: '', categoria: '', unidad: '', precio: '' });

  const categoriasDisponibles = [
    'Panadería', 'Pastelería', 'Bebidas', 'Golosinas y Chocolates', 
    'Galletas y Snacks', 'Lácteos y Cafés', 'Empaques y Descartables', 'Cigarrillos y Varios'
  ];
  const unidadesDisponibles = ['Unidad', 'Kg', 'Paquete', 'Litro', 'Porción', 'Bobina'];

  const cambiarPestana = (nombrePestana) => {
    setPestana(nombrePestana);
    if (nombrePestana === 'requisiciones') {
      setNuevaAlertaAdmin(false);
    }
  };

  const cambiarEstatusOrden = async (orden, nuevoEstatus) => {
    setListaRequisiciones(prev => prev.map(o => o.id === orden.id ? { ...o, estatus: nuevoEstatus } : o));
    if (ordenSeleccionada && ordenSeleccionada.id === orden.id) {
      setOrdenSeleccionada(prev => ({ ...prev, estatus: nuevoEstatus }));
    }

    try {
      if (orden.supabase_db_id) {
        await supabase
          .from('requisiciones')
          .update({ datos: { ...orden, estatus: nuevoEstatus } })
          .eq('id', orden.supabase_db_id);
      }
    } catch (e) {
      console.error("Error al actualizar estatus en Supabase:", e);
    }
  };

  const eliminarOrden = async (orden) => {
    if (window.confirm(`⚠️ ¿Estás seguro de eliminar permanentemente la orden ${orden.id}?`)) {
      setListaRequisiciones(prev => prev.filter(o => o.id !== orden.id));
      if (ordenSeleccionada?.id === orden.id) setOrdenSeleccionada(null);

      try {
        if (orden.supabase_db_id) {
          await supabase.from('requisiciones').delete().eq('id', orden.supabase_db_id);
        }
        setAlertaAdminMsg(`🗑️ Orden ${orden.id} eliminada.`);
      } catch (err) {
        console.error("Error al borrar en Supabase:", err);
      }
      setTimeout(() => setAlertaAdminMsg(''), 4000);
    }
  };

  const imprimirOrden = (orden) => {
    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Nota de Entrega / Requisición - ${orden.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; }
            h2, h4 { margin: 0 0 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border-bottom: 1px solid #ccc; padding: 6px; text-align: left; font-size: 12px; }
            .total { font-weight: bold; margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>FALCON CREST - PLANTA / PRODUCCIÓN</h2>
          <p><b>Requisición:</b> ${orden.id}</p>
          <p><b>Sucursal:</b> ${orden.sucursal}</p>
          <p><b>Fecha:</b> ${orden.fecha}</p>
          <p><b>Prioridad:</b> ${orden.prioridad}</p>
          <p><b>Observaciones:</b> ${orden.observaciones || 'Ninguna'}</p>
          <table>
            <thead>
              <tr><th>Cant.</th><th>Artículo</th><th>Presentación</th><th>Subtotal ($)</th></tr>
            </thead>
            <tbody>
              ${orden.items.map(i => `<tr><td>${i.cantidad}</td><td>${i.nombre}</td><td>${i.unidad}</td><td>$${((parseFloat(i.precio) || 0) * (parseFloat(i.cantidad) || 0)).toFixed(2)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total USD: $${(parseFloat(orden.totalUSD) || 0).toFixed(2)}</p>
            <p>Total BS (Tasa ${orden.tasaBcvAplicada || tasaBcv}): Bs. ${(parseFloat(orden.totalBS) || 0).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => ventanaImpresion.print(), 500);
  };

  const handleActualizarClave = async (e) => {
    e.preventDefault();
    if (!nuevaClave.trim()) {
      alert("⚠️ La contraseña no puede estar vacía.");
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios_sistema')
        .update({ clave: nuevaClave })
        .eq('usuario', userSeleccionado);

      if (error) {
        alert("❌ Hubo un error al guardar la clave en la nube.");
        return;
      }

      setListaAdmins(prev => prev.map(a => a.usuario === userSeleccionado ? { ...a, clave: nuevaClave } : a));
      setMsgClave(`✅ ¡Contraseña actualizada para [${userSeleccionado}]!`);
      setNuevaClave('');
      setTimeout(() => setMsgClave(''), 4000);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const vaciarTodosLosArticulos = async () => {
    if (window.confirm("🚨 ¿ESTÁS SEGURO? Se eliminarán TODOS los artículos de Supabase.")) {
      try {
        const { error } = await supabase.from('productos').delete().neq('id', '');
        if (error) {
          console.error("Error al borrar productos:", error);
        }
        await cargarProductosDeSupabase();
        setAlertaAdminMsg("🗑️ Catálogo vaciado en la nube con éxito.");
      } catch (err) {
        console.error("Error:", err);
      }
      setTimeout(() => setAlertaAdminMsg(''), 4000);
    }
  };

  const eliminarArticuloUnico = async (id, nombre) => {
    if (window.confirm(`¿Eliminar "${nombre}" del catálogo en la nube?`)) {
      try {
        await supabase.from('productos').delete().eq('id', id);
        await cargarProductosDeSupabase();
        setAlertaAdminMsg(`🗑️ Producto "${nombre}" eliminado.`);
      } catch (err) {
        console.error("Error:", err);
      }
      setTimeout(() => setAlertaAdminMsg(''), 3000);
    }
  };

  const iniciarEdicionProducto = (p) => {
    setProductoEditandoId(p.id);
    setDatosEdicion({
      nombre: p.nombre || '',
      categoria: p.categoria || 'Panadería',
      unidad: p.unidad || 'Unidad',
      precio: p.precio || 0
    });
  };

  const guardarEdicionProducto = async (id) => {
    if (!datosEdicion.nombre.trim() || isNaN(parseFloat(datosEdicion.precio))) {
      alert("⚠️ Nombre y precio válidos requeridos.");
      return;
    }

    try {
      const { error } = await supabase
        .from('productos')
        .update({
          nombre: datosEdicion.nombre.trim().toUpperCase(),
          categoria: datosEdicion.categoria,
          unidad: datosEdicion.unidad,
          precio: parseFloat(datosEdicion.precio)
        })
        .eq('id', id);

      if (error) {
        alert("❌ Error al actualizar en Supabase.");
        return;
      }

      await cargarProductosDeSupabase();
      setProductoEditandoId(null);
      setAlertaAdminMsg(`✅ Artículo actualizado en la nube con éxito.`);
    } catch (err) {
      console.error("Error:", err);
    }
    setTimeout(() => setAlertaAdminMsg(''), 3000);
  };

  const handleCargaMasiva = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lineas = text.split(/\r\n|\n/);
        const nuevosProductos = [];

        lineas.forEach((linea, index) => {
          if (!linea.trim() || (index === 0 && linea.toLowerCase().includes('nombre'))) return;
          
          const cols = linea.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
          
          if (cols.length >= 2) {
            const nombre = cols[0].toUpperCase();
            const precio = parseFloat(cols[1].replace('$', '').replace(',', '.'));
            const categoria = cols[2] || 'Panadería';
            const unidad = cols[3] || 'Unidad';

            if (nombre && !isNaN(precio)) {
              nuevosProductos.push({
                id: 'p-excel-' + Date.now() + '-' + index,
                nombre,
                precio,
                categoria,
                unidad
              });
            }
          }
        });

        if (nuevosProductos.length > 0) {
          const { error } = await supabase.from('productos').upsert(nuevosProductos);
          if (error) {
            console.error("Error al insertar en Supabase:", error);
            alert("❌ Hubo un error al guardar en la base de datos.");
            return;
          }

          await cargarProductosDeSupabase();
          setAlertaAdminMsg(`📊 ¡Se han cargado ${nuevosProductos.length} artículos a Supabase con éxito!`);
          setTimeout(() => setAlertaAdminMsg(''), 5000);
        } else {
          alert("⚠️ El archivo no contiene un formato CSV/TXT válido.");
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const productosAdminFiltrados = productosCatalogo.filter(p => p.nombre && p.nombre.toLowerCase().includes(busqAdmin.toLowerCase()));

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#fff', minHeight: '100vh', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '15px 25px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f59e0b' }} />
          <div>
            <h2 style={{ color: '#f59e0b', fontSize: '20px', margin: 0 }}>FALCON CREST - Panel Planta y Control</h2>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Sesión Admin: <strong style={{ color: '#34d399' }}>{usuarioActual}</strong></span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ backgroundColor: '#1f2937', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#34d399', border: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Tasa BCV (Bs):</span>
            <input 
              type="number" 
              step="0.01" 
              value={tasaBcv} 
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setTasaBcv(val);
                guardarTasaEnSupabase(val);
              }} 
              style={{ width: '90px', backgroundColor: '#111827', color: '#34d399', border: '1px solid #4b5563', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' }} 
            />
            <button 
              onClick={obtenerTasaBcvAutomatica} 
              disabled={cargandoTasa}
              title="Obtener Tasa Oficial BCV Automática"
              style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 9px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
            >
              {cargandoTasa ? '⌛' : '🔄 Auto'}
            </button>
          </div>

          <button onClick={onVolverAlMenu} style={{ padding: '10px 20px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏠 Menú Principal</button>
        </div>
      </div>

      {alertaAdminMsg && (
        <div style={{ backgroundColor: '#059669', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
          {alertaAdminMsg}
        </div>
      )}

      {/* BOTONES DE PESTAÑAS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => cambiarPestana('requisiciones')} style={{ padding: '10px 20px', backgroundColor: pestana === 'requisiciones' ? '#f59e0b' : '#111827', color: pestana === 'requisiciones' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}>
          📦 Requisiciones y Notas ({listaRequisiciones.length})
          {nuevaAlertaAdmin && <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #111827' }}></span>}
        </button>

        <button onClick={() => cambiarPestana('precios')} style={{ padding: '10px 20px', backgroundColor: pestana === 'precios' ? '#f59e0b' : '#111827', color: pestana === 'precios' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          💰 Modificar Precios / Artículos ({productosCatalogo.length})
        </button>

        <button onClick={() => cambiarPestana('crear_producto')} style={{ padding: '10px 20px', backgroundColor: pestana === 'crear_producto' ? '#f59e0b' : '#111827', color: pestana === 'crear_producto' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          ➕ Carga Masiva y Nuevo Artículo
        </button>

        <button onClick={() => cambiarPestana('seguridad')} style={{ padding: '10px 20px', backgroundColor: pestana === 'seguridad' ? '#f59e0b' : '#111827', color: pestana === 'seguridad' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          🔐 Claves Admin
        </button>
        
        <button onClick={vaciarTodosLosArticulos} style={{ marginLeft: 'auto', backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          🗑️ Borrar Todos los Artículos ({productosCatalogo.length})
        </button>
      </div>

      {/* CONTENIDO DE REQUISICIONES */}
      {pestana === 'requisiciones' && (
        <div style={{ display: 'grid', gridTemplateColumns: ordenSeleccionada ? '1fr 400px' : '1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>Control de Órdenes y Salida de Insumos</h3>
            {listaRequisiciones.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #374151', borderRadius: '8px', color: '#6b7280' }}>
                No hay requisiciones registradas por la sucursal todavía.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                      <th style={{ padding: '10px' }}>ID Orden</th>
                      <th style={{ padding: '10px' }}>Fecha</th>
                      <th style={{ padding: '10px' }}>Prioridad</th>
                      <th style={{ padding: '10px' }}>Total ($)</th>
                      <th style={{ padding: '10px' }}>Estatus</th>
                      <th style={{ padding: '10px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaRequisiciones.map(ord => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #1f2937', backgroundColor: ordenSeleccionada?.id === ord.id ? '#1f2937' : 'transparent' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{ord.id}</td>
                        <td style={{ padding: '10px', color: '#9ca3af', fontSize: '12px' }}>{ord.fecha}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: ord.prioridad?.includes('Urgente') ? '#7f1d1d' : '#374151', color: '#fff' }}>
                            {ord.prioridad}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#34d399', fontWeight: 'bold' }}>${(parseFloat(ord.totalUSD) || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{ord.estatus}</td>
                        <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                          <button onClick={() => setOrdenSeleccionada(ord)} style={{ background: '#374151', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Ver</button>
                          <button onClick={() => imprimirOrden(ord)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🖨️</button>
                          <button onClick={() => eliminarOrden(ord)} style={{ backgroundColor: '#7f1d1d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {ordenSeleccionada && (
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #374151', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ color: '#f59e0b', margin: 0 }}>Detalle: {ordenSeleccionada.id}</h4>
                <button onClick={() => setOrdenSeleccionada(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '5px 0' }}><strong>Sucursal:</strong> {ordenSeleccionada.sucursal}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '5px 0' }}><strong>Fecha:</strong> {ordenSeleccionada.fecha}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '5px 0' }}><strong>Observaciones:</strong> {ordenSeleccionada.observaciones || 'Ninguna'}</p>
              
              <div style={{ margin: '15px 0' }}>
                <label style={{ fontSize: '12px', color: '#f59e0b', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ACTUALIZAR ESTATUS</label>
                <select 
                  value={ordenSeleccionada.estatus} 
                  onChange={(e) => cambiarEstatusOrden(ordenSeleccionada, e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '8px', borderRadius: '6px', outline: 'none', fontWeight: 'bold' }}
                >
                  <option value="Pendiente ⏳">Pendiente ⏳</option>
                  <option value="En Proceso 🔄">En Proceso 🔄</option>
                  <option value="Aprobado / Despachado ✅">Aprobado / Despachado ✅</option>
                  <option value="Cancelado ❌">Cancelado ❌</option>
                </select>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', borderTop: '1px solid #1f2937', paddingTop: '10px', marginBottom: '15px' }}>
                {ordenSeleccionada.items && ordenSeleccionada.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span>{it.cantidad} {it.unidad} - {it.nombre}</span>
                    <span style={{ color: '#34d399' }}>${((parseFloat(it.precio) || 0) * (parseFloat(it.cantidad) || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #374151', paddingTop: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}><span>Total USD:</span><span style={{ color: '#34d399' }}>${(parseFloat(ordenSeleccionada.totalUSD) || 0).toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}><span>Total BS:</span><span style={{ color: '#f59e0b' }}>Bs. ${(parseFloat(ordenSeleccionada.totalBS) || 0).toFixed(2)}</span></div>
              </div>

              <button onClick={() => imprimirOrden(ordenSeleccionada)} style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🖨️ Imprimir Nota de Despacho
              </button>
            </div>
          )}
        </div>
      )}

      {pestana === 'precios' && (
        <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>Gestión y Edición Completa de Artículos / Precios</h3>
          <div style={{ marginBottom: '15px' }}>
            <input type="text" placeholder="🔍 Buscar producto por nombre para editar..." value={busqAdmin} onChange={(e) => setBusqAdmin(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                  <th style={{ padding: '10px' }}>Artículo</th>
                  <th style={{ padding: '10px' }}>Categoría</th>
                  <th style={{ padding: '10px' }}>Unidad</th>
                  <th style={{ padding: '10px' }}>Precio ($)</th>
                  <th style={{ padding: '10px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosAdminFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                      No hay artículos. Sube tu archivo CSV en la pestaña "Carga Masiva".
                    </td>
                  </tr>
                ) : (
                  productosAdminFiltrados.map(p => {
                    const esEditando = productoEditandoId === p.id;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1f2937', backgroundColor: esEditando ? '#1f2937' : 'transparent' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>
                          {esEditando ? (
                            <input 
                              type="text" 
                              value={datosEdicion.nombre} 
                              onChange={(e) => setDatosEdicion({ ...datosEdicion, nombre: e.target.value })}
                              style={{ width: '100%', backgroundColor: '#111827', color: '#fff', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px' }}
                            />
                          ) : p.nombre}
                        </td>

                        <td style={{ padding: '10px', color: '#9ca3af' }}>
                          {esEditando ? (
                            <select 
                              value={datosEdicion.categoria}
                              onChange={(e) => setDatosEdicion({ ...datosEdicion, categoria: e.target.value })}
                              style={{ backgroundColor: '#111827', color: '#fff', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px' }}
                            >
                              {categoriasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : p.categoria}
                        </td>

                        <td style={{ padding: '10px', color: '#38bdf8' }}>
                          {esEditando ? (
                            <select 
                              value={datosEdicion.unidad}
                              onChange={(e) => setDatosEdicion({ ...datosEdicion, unidad: e.target.value })}
                              style={{ backgroundColor: '#111827', color: '#fff', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px' }}
                            >
                              {unidadesDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          ) : p.unidad}
                        </td>

                        <td style={{ padding: '10px', color: '#34d399', fontWeight: 'bold' }}>
                          {esEditando ? (
                            <input 
                              type="number" 
                              step="0.01" 
                              value={datosEdicion.precio}
                              onChange={(e) => setDatosEdicion({ ...datosEdicion, precio: e.target.value })}
                              style={{ width: '80px', backgroundColor: '#111827', color: '#34d399', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px', fontWeight: 'bold' }}
                            />
                          ) : `$${(parseFloat(p.precio) || 0).toFixed(2)}`}
                        </td>

                        <td style={{ padding: '10px' }}>
                          {esEditando ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => guardarEdicionProducto(p.id)} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Guardar</button>
                              <button onClick={() => setProductoEditandoId(null)} style={{ backgroundColor: '#4b5563', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => iniciarEdicionProducto(p)} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Editar</button>
                              <button onClick={() => eliminarArticuloUnico(p.id, p.nombre)} style={{ backgroundColor: '#7f1d1d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestana === 'crear_producto' && (
        <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937', maxWidth: '600px' }}>
          <h3 style={{ color: '#38bdf8', margin: '0 0 10px 0' }}>📊 Carga Masiva desde Excel / CSV</h3>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '15px' }}>
            Selecciona tu archivo <strong>.csv</strong> generado con la lista de precios:<br/>
            <code>Nombre, Precio, Categoría, Unidad</code>
          </p>

          <div style={{ border: '2px dashed #007bff', padding: '25px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#111827', marginBottom: '15px' }}>
            <input 
              type="file" 
              accept=".csv, .txt" 
              onChange={handleCargaMasiva}
              style={{ display: 'none' }}
              id="excelInput"
            />
            <label htmlFor="excelInput" style={{ backgroundColor: '#007bff', color: '#fff', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}>
              📁 Cargar Archivo CSV / TXT
            </label>
          </div>
        </div>
      )}

      {pestana === 'seguridad' && (
        <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937', maxWidth: '500px' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>🔐 Cambio de Claves de Administradores</h3>
          {msgClave && <div style={{ backgroundColor: '#059669', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontWeight: 'bold' }}>{msgClave}</div>}
          <form onSubmit={handleActualizarClave}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>SELECCIONAR ADMINISTRADOR</label>
              <select value={userSeleccionado} onChange={(e) => setUserSeleccionado(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff' }}>
                {listaAdmins.length > 0 ? (
                  listaAdmins.map(a => (
                    <option key={a.usuario} value={a.usuario}>{a.usuario}</option>
                  ))
                ) : (
                  <option value="admin">admin</option>
                )}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NUEVA CONTRASEÑA</label>
              <input type="password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} placeholder="Escribe la nueva contraseña..." style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff' }} />
            </div>
            <button type="submit" style={{ width: '100%', backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Actualizar Contraseña
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const guardarRequisicionEnNube = async (detallesRequisicion) => {
  try {
    const { error } = await supabase
      .from('requisiciones')
      .insert([{ datos: detallesRequisicion }]);
    if (error) console.error("Error al guardar en Supabase:", error);
  } catch (err) {
    console.error("Error inesperado:", err);
  }
};

function BannerNuevaRequisicion({ nuevaAlertaAdmin, setNuevaAlertaAdmin, setModo }) {
  if (!nuevaAlertaAdmin) return null;
  return (
    <div
      onClick={() => {
        setNuevaAlertaAdmin(false);
        setModo('admin');
      }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '25px',
        backgroundColor: '#DC2626',
        color: '#fff',
        padding: '24px 35px',
        borderRadius: '16px',
        fontSize: '18px',
        fontWeight: 'bold',
        zIndex: 999999,
        cursor: 'pointer',
        boxShadow: '0 15px 35px rgba(220, 38, 38, 0.9)',
        border: '4px solid #FEF08A'
      }}
    >
      🚨 ¡NUEVA REQUISICIÓN ENVIADA DESDE EL SAMBIL! 🚨<br/>
      <span style={{ fontSize: '14px', textDecoration: 'underline', color: '#FEF08A' }}>Haz clic aquí para ver la orden de inmediato</span>
    </div>
  );
}
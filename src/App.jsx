import React, { useState, useEffect, useRef } from 'react';
import logoFalcon from './assets/logo.jpg';
const URL_LOGO = logoFalcon;
import { supabase } from './supabaseClient';

// --- SISTEMA DE AUDIO REFORZADO ---
let audioCtxGlobal = null;

const inicializarAudioContext = () => {
  if (!audioCtxGlobal) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtxGlobal = new AudioContext();
    }
  }
  if (audioCtxGlobal && audioCtxGlobal.state === 'suspended') {
    audioCtxGlobal.resume();
  }
};

const reproducirAlertaSonora = () => {
  try {
    inicializarAudioContext();
    if (!audioCtxGlobal) return;

    const reproducirBeep = (freq, duracion, delay) => {
      setTimeout(() => {
        try {
          const osc = audioCtxGlobal.createOscillator();
          const gain = audioCtxGlobal.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audioCtxGlobal.currentTime);
          gain.gain.setValueAtTime(0.4, audioCtxGlobal.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxGlobal.currentTime + duracion);
          osc.connect(gain);
          gain.connect(audioCtxGlobal.destination);
          osc.start();
          osc.stop(audioCtxGlobal.currentTime + duracion);
        } catch (e) {
          console.error("Error reproducir beep:", e);
        }
      }, delay);
    };

    reproducirBeep(880, 0.2, 0);
    reproducirBeep(1100, 0.2, 250);
    reproducirBeep(880, 0.2, 500);
    reproducirBeep(1320, 0.4, 750);
  } catch (e) {
    console.error("Error general de audio:", e);
  }
};

export default function App() {
  const [modo, setModo] = useState('menu'); 
  const [usuarioActual, setUsuarioActual] = useState('sucursal');
  const [claveAdminInput, setClaveAdminInput] = useState('');
  const [nuevaAlertaAdmin, setNuevaAlertaAdmin] = useState(false);

  useEffect(() => {
    const habilitarAudio = () => {
      inicializarAudioContext();
      window.removeEventListener('click', habilitarAudio);
      window.removeEventListener('keydown', habilitarAudio);
    };
    window.addEventListener('click', habilitarAudio);
    window.addEventListener('keydown', habilitarAudio);
    return () => {
      window.removeEventListener('click', habilitarAudio);
      window.removeEventListener('keydown', habilitarAudio);
    };
  }, []);

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

  const [listaRequisiciones, setListaRequisiciones] = useState([]);
  const conteoRef = useRef(0);

  const cargarRequisicionesDeSupabase = async (esEventoRealtime = false) => {
    const { data, error } = await supabase
      .from('requisiciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar requisiciones:', error);
    } else if (data) {
      if (esEventoRealtime || (conteoRef.current > 0 && data.length > conteoRef.current)) {
        setNuevaAlertaAdmin(true);
        reproducirAlertaSonora();
      }
      conteoRef.current = data.length;

      setListaRequisiciones(data.map(item => ({
        ...item.datos,
        supabase_db_id: item.id
      })));
    }
  };

  useEffect(() => {
    cargarRequisicionesDeSupabase();

    const canalRequisiciones = supabase
      .channel('canal-alertas-global-v8')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requisiciones' },
        (payload) => {
          cargarRequisicionesDeSupabase(true);
        }
      )
      .subscribe();

    const intervalo = setInterval(() => {
      cargarRequisicionesDeSupabase(false);
    }, 2000);

    return () => {
      supabase.removeChannel(canalRequisiciones);
      clearInterval(intervalo);
    };
  }, []);

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
        alert("⚠️ No se pudo obtener la tasa automática.");
      }
    } catch (err) {
      console.error("Error consultando API BCV:", err);
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
    <div style={{ 
      backgroundColor: '#351c12', 
      backgroundImage: 'radial-gradient(circle at 50% 50%, #4a2717 0%, #29140c 100%)',
      minHeight: '100vh', 
      color: '#f3f4f6', 
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        fontSize: '70px',
        lineHeight: '2.2',
        wordSpacing: '100px',
        letterSpacing: '50px',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 1,
        transform: 'rotate(-12deg)',
        userSelect: 'none'
      }}>
        🥖 🥐 ☕ 🍞 🥨 🌾 🍩 ☕ 🥖 🥐 🍞 🌾 🥨 ☕ 🥐 🥖 🥐 🥖 ☕ 🍞 🥨 🌾 🍩
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        {modo === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
            <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', border: '1px solid #7c4a32', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.7)' }}>
              <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b', marginBottom: '20px' }} />
              <h1 style={{ color: '#f59e0b', fontSize: '24px', margin: '0 0 5px 0' }}>FALCON CREST</h1>
              <p style={{ color: '#d1d5db', fontSize: '13px', marginBottom: '30px' }}>Sistema de Requisiciones y Control — Sambil Punto Fijo</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button 
                  onClick={() => setModo('sucursal')} 
                  style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  🏪 Ingresar Sucursal (Cafetín Sambil)
                </button>

                <div style={{ borderTop: '1px solid #5c3a2a', margin: '10px 0', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', color: '#f3f4f6', marginBottom: '10px' }}>🔑 Acceso Administrativo (Planta)</h3>
                  <form onSubmit={ingresarComoAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select 
                      value={usuarioActual} 
                      onChange={e => setUsuarioActual(e.target.value)}
                      style={{ backgroundColor: '#1c0f0a', color: '#fff', border: '1px solid #7c4a32', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
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
                      style={{ backgroundColor: '#1c0f0a', color: '#fff', border: '1px solid #7c4a32', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
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

        <BannerNuevaRequisicion 
          nuevaAlertaAdmin={nuevaAlertaAdmin} 
          setNuevaAlertaAdmin={setNuevaAlertaAdmin} 
          modo={modo}
        />
      </div>
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
    'TODOS', 'Panadería', 'Pastelería', 'Bebidas', 'Golosinas y Chocolates', 
    'Galletas y Snacks', 'Lácteos y Cafés', 'Empaques y Descartables', 'Cigarrillos y Varios'
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
    await cargarRequisicionesDeSupabase(true);

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
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(38, 20, 13, 0.95)', padding: '15px 25px', borderRadius: '12px', border: '1px solid #7c4a32', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #f59e0b' }} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>FALCON CREST</h1>
            <span style={{ fontSize: '12px', color: '#d1d5db' }}>Sucursal Sambil Punto Fijo | Usuario: <strong style={{ color: '#34d399' }}>Sucursal Única</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1c0f0a', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#34d399', border: '1px solid #5c3a2a' }}>
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
              style={{ padding: '4px', fontSize: '13px', width: '90px', textAlign: 'center', borderRadius: '4px', border: '1px solid #7c4a32', background: '#0a0503', color: '#fff', fontWeight: 'bold' }}
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

          <button onClick={onVolverAlMenu} style={{ backgroundColor: '#4a2717', color: '#fff', border: '1px solid #7c4a32', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏠 Menú Principal</button>
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
              style={{ width: '100%', backgroundColor: 'rgba(38, 20, 13, 0.95)', border: '1px solid #7c4a32', padding: '12px', borderRadius: '8px', color: '#fff', outline: 'none' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {categorias.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoriaSeleccionada(cat)} 
                style={{ padding: '8px 16px', backgroundColor: categoriaSeleccionada === cat ? '#f59e0b' : 'rgba(38, 20, 13, 0.95)', color: categoriaSeleccionada === cat ? '#000' : '#d1d5db', border: '1px solid', borderColor: categoriaSeleccionada === cat ? '#f59e0b' : '#7c4a32', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', maxHeight: '58vh', overflowY: 'auto' }}>
            {productosFiltrados.length === 0 ? (
              <p style={{ color: '#d1d5db', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No hay artículos registrados. Ve al Panel Admin para importar tu carga masiva.</p>
            ) : (
              productosFiltrados.map(prod => (
                <div key={prod.id} style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', border: '1px solid #7c4a32', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 'bold' }}>
                      {prod.categoria}
                    </span>
                    <h4 style={{ fontSize: '14px', margin: '8px 0', color: '#fff' }}>{prod.nombre}</h4>
                    <p style={{ fontSize: '14px', color: '#34d399', margin: '0 0 14px 0', fontWeight: 'bold' }}>
                      ${(parseFloat(prod.precio) || 0).toFixed(2)} <span style={{ fontSize: '11px', color: '#d1d5db' }}>/ {prod.unidad}</span>
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

        <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', border: '1px solid #7c4a32', borderRadius: '12px', padding: '20px', height: 'fit-content', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #5c3a2a', paddingBottom: '10px', marginBottom: '12px', color: '#f59e0b' }}>
            🛒 Requisición Actual ({totalItems})
          </h3>

          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px', borderTop: '1px solid #5c3a2a', paddingTop: '8px' }}>
            {Object.keys(requisicion).length === 0 ? (
              <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: '15px 0' }}>No hay artículos seleccionados</p>
            ) : (
              Object.values(requisicion).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</span>
                  <input type="number" min="0.1" step="any" value={item.cantidad} onChange={(e) => actualizarCantidad(item.id, e.target.value)} style={{ width: '45px', textAlign: 'center', backgroundColor: '#1c0f0a', color: '#fff', border: '1px solid #5c3a2a', borderRadius: '4px', padding: '2px' }} />
                  <span style={{ marginLeft: '8px', color: '#34d399', width: '55px', textAlign: 'right', fontWeight: 'bold' }}>
                    ${((parseFloat(item.precio) || 0) * (parseFloat(item.cantidad) || 0)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid #5c3a2a', paddingTop: '10px', marginBottom: '12px' }}>
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

  // MÓDULO CXC (ESTADO)
  const [listaCxc, setListaCxc] = useState([]);
  const [estatusCxcTemporal, setEstatusCxcTemporal] = useState({});
  // Filas en las que el usuario habilitó la edición explícitamente
  const [filasEditables, setFilasEditables] = useState({});

  const cargarCxcDeSupabase = async () => {
    const { data, error } = await supabase.from('cxc').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setListaCxc(data);
      const temps = {};
      data.forEach(item => {
        temps[item.id] = item.estatus_pago;
      });
      setEstatusCxcTemporal(temps);
    }
  };

  useEffect(() => {
    cargarCxcDeSupabase();
  }, []);

  const registrarEnCxc = async (orden) => {
    try {
      const { data: existe } = await supabase.from('cxc').select('*').eq('id_orden', orden.id);
      if (existe && existe.length > 0) return;

      const nuevaDeuda = {
        id_orden: orden.id,
        sucursal: orden.sucursal || 'Cafetín Sambil',
        fecha: orden.fecha,
        totalUSD: parseFloat(orden.totalUSD) || 0,
        totalBS: parseFloat(orden.totalBS) || 0,
        estatus_pago: 'Pendiente 💳'
      };

      await supabase.from('cxc').insert([nuevaDeuda]);
      cargarCxcDeSupabase();
    } catch (e) {
      console.error("Error registrando CxC:", e);
    }
  };

  const guardarEstatusPagoCxc = async (idDb) => {
    const nuevoEstatus = estatusCxcTemporal[idDb];
    if (!nuevoEstatus) return;

    const { error } = await supabase.from('cxc').update({ estatus_pago: nuevoEstatus }).eq('id', idDb);
    if (error) {
      alert("❌ Error al guardar el estatus en la nube.");
    } else {
      cargarCxcDeSupabase();
      // Bloquear nuevamente la fila al guardar
      setFilasEditables(prev => ({ ...prev, [idDb]: false }));
      setAlertaAdminMsg(`✅ Estatus guardado y bloqueado correctamente: [${nuevoEstatus}]`);
      setTimeout(() => setAlertaAdminMsg(''), 4000);
    }
  };

  const habilitarEdicionCxc = (idDb) => {
    setFilasEditables(prev => ({ ...prev, [idDb]: true }));
  };

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

  const actualizarCantidadItemOrden = (indexItem, nuevaCant) => {
    if (!ordenSeleccionada) return;
    const cantNum = parseFloat(nuevaCant) || 0;
    
    const itemsActualizados = ordenSeleccionada.items.map((it, idx) => {
      if (idx === indexItem) {
        return { ...it, cantidad: cantNum };
      }
      return it;
    });

    const nuevoTotalUSD = itemsActualizados.reduce((acc, i) => acc + ((parseFloat(i.precio) || 0) * (parseFloat(i.cantidad) || 0)), 0);
    const nuevoTotalBS = nuevoTotalUSD * (parseFloat(tasaBcv) || 1);

    const ordenModificada = {
      ...ordenSeleccionada,
      items: itemsActualizados,
      totalUSD: nuevoTotalUSD,
      totalBS: nuevoTotalBS
    };

    setOrdenSeleccionada(ordenModificada);
  };

  const guardarCambiosParcialesOrden = async () => {
    if (!ordenSeleccionada) return;

    setListaRequisiciones(prev => prev.map(o => o.id === ordenSeleccionada.id ? ordenSeleccionada : o));

    try {
      if (ordenSeleccionada.supabase_db_id) {
        await supabase
          .from('requisiciones')
          .update({ datos: ordenSeleccionada })
          .eq('id', ordenSeleccionada.supabase_db_id);
      }

      if (ordenSeleccionada.estatus.includes('Aprobado') || ordenSeleccionada.estatus.includes('Despachado')) {
        await registrarEnCxc(ordenSeleccionada);
      }

      setAlertaAdminMsg("✅ Cantidades parciales guardadas y totales recalculados.");
      setTimeout(() => setAlertaAdminMsg(''), 4000);
    } catch (e) {
      console.error("Error al actualizar orden parcial:", e);
    }
  };

  const cambiarEstatusOrden = async (orden, nuevoEstatus) => {
    const ordenActualizada = { ...orden, estatus: nuevoEstatus };
    setListaRequisiciones(prev => prev.map(o => o.id === orden.id ? ordenActualizada : o));
    if (ordenSeleccionada && ordenSeleccionada.id === orden.id) {
      setOrdenSeleccionada(ordenActualizada);
    }

    try {
      if (orden.supabase_db_id) {
        await supabase
          .from('requisiciones')
          .update({ datos: ordenActualizada })
          .eq('id', orden.supabase_db_id);
      }

      if (nuevoEstatus.includes('Aprobado') || nuevoEstatus.includes('Despachado')) {
        await registrarEnCxc(ordenActualizada);
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
        await supabase.from('productos').delete().neq('id', '');
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
      await supabase
        .from('productos')
        .update({
          nombre: datosEdicion.nombre.trim().toUpperCase(),
          categoria: datosEdicion.categoria,
          unidad: datosEdicion.unidad,
          precio: parseFloat(datosEdicion.precio)
        })
        .eq('id', id);

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
          await supabase.from('productos').upsert(nuevosProductos);
          await cargarProductosDeSupabase();
          setAlertaAdminMsg(`📊 ¡Se han cargado ${nuevosProductos.length} artículos a Supabase con éxito!`);
          setTimeout(() => setAlertaAdminMsg(''), 5000);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const productosAdminFiltrados = productosCatalogo.filter(p => p.nombre && p.nombre.toLowerCase().includes(busqAdmin.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(38, 20, 13, 0.95)', padding: '15px 25px', borderRadius: '12px', border: '1px solid #7c4a32', marginBottom: '25px', flexWrap: 'wrap', gap: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f59e0b' }} />
          <div>
            <h2 style={{ color: '#f59e0b', fontSize: '20px', margin: 0 }}>FALCON CREST - Panel Planta y Control</h2>
            <span style={{ fontSize: '13px', color: '#d1d5db' }}>Sesión Admin: <strong style={{ color: '#34d399' }}>{usuarioActual}</strong></span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#1c0f0a', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#34d399', border: '1px solid #5c3a2a', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              style={{ width: '90px', backgroundColor: '#0a0503', color: '#34d399', border: '1px solid #7c4a32', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' }} 
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

          <button onClick={onVolverAlMenu} style={{ padding: '10px 20px', backgroundColor: '#4a2717', color: '#fff', border: '1px solid #7c4a32', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏠 Menú Principal</button>
        </div>
      </div>

      {alertaAdminMsg && (
        <div style={{ backgroundColor: '#059669', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
          {alertaAdminMsg}
        </div>
      )}

      {/* BOTONES DE PESTAÑAS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => cambiarPestana('requisiciones')} style={{ padding: '10px 20px', backgroundColor: pestana === 'requisiciones' ? '#f59e0b' : 'rgba(38, 20, 13, 0.95)', color: pestana === 'requisiciones' ? '#000' : '#fff', border: '1px solid #7c4a32', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}>
          📦 Requisiciones y Notas ({listaRequisiciones.length})
          {nuevaAlertaAdmin && <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #111827' }}></span>}
        </button>

        <button onClick={() => cambiarPestana('cxc')} style={{ padding: '10px 20px', backgroundColor: pestana === 'cxc' ? '#f59e0b' : 'rgba(38, 20, 13, 0.95)', color: pestana === 'cxc' ? '#000' : '#fff', border: '1px solid #7c4a32', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          💳 Cuentas por Cobrar (CxC) ({listaCxc.length})
        </button>

        <button onClick={() => cambiarPestana('precios')} style={{ padding: '10px 20px', backgroundColor: pestana === 'precios' ? '#f59e0b' : 'rgba(38, 20, 13, 0.95)', color: pestana === 'precios' ? '#000' : '#fff', border: '1px solid #7c4a32', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          💰 Catálogo / Precios ({productosCatalogo.length})
        </button>

        <button onClick={() => cambiarPestana('crear_producto')} style={{ padding: '10px 20px', backgroundColor: pestana === 'crear_producto' ? '#f59e0b' : 'rgba(38, 20, 13, 0.95)', color: pestana === 'crear_producto' ? '#000' : '#fff', border: '1px solid #7c4a32', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          ➕ Carga Masiva
        </button>

        <button onClick={() => cambiarPestana('seguridad')} style={{ padding: '10px 20px', backgroundColor: pestana === 'seguridad' ? '#f59e0b' : 'rgba(38, 20, 13, 0.95)', color: pestana === 'seguridad' ? '#000' : '#fff', border: '1px solid #7c4a32', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          🔐 Claves
        </button>
      </div>

      {/* CONTENIDO DE REQUISICIONES */}
      {pestana === 'requisiciones' && (
        <div style={{ display: 'grid', gridTemplateColumns: ordenSeleccionada ? '1fr 440px' : '1fr', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', padding: '20px', borderRadius: '12px', border: '1px solid #7c4a32', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>Control de Órdenes y Despachos (Parciales o Totales)</h3>
            {listaRequisiciones.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #5c3a2a', borderRadius: '8px', color: '#9ca3af' }}>
                No hay requisiciones registradas por la sucursal todavía.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #5c3a2a', color: '#d1d5db' }}>
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
                      <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: ordenSeleccionada?.id === ord.id ? '#2e1911' : 'transparent' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{ord.id}</td>
                        <td style={{ padding: '10px', color: '#d1d5db', fontSize: '12px' }}>{ord.fecha}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: ord.prioridad?.includes('Urgente') ? '#7f1d1d' : '#4a2717', color: '#fff' }}>
                            {ord.prioridad}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#34d399', fontWeight: 'bold' }}>${(parseFloat(ord.totalUSD) || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{ord.estatus}</td>
                        <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                          <button onClick={() => setOrdenSeleccionada(ord)} style={{ background: '#4a2717', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Revisar / Ajustar</button>
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
            <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.98)', padding: '20px', borderRadius: '12px', border: '1px solid #7c4a32', height: 'fit-content', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #5c3a2a', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ color: '#f59e0b', margin: 0 }}>Despacho y Ajuste: {ordenSeleccionada.id}</h4>
                <button onClick={() => setOrdenSeleccionada(null)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
              </div>
              <p style={{ fontSize: '12px', color: '#d1d5db', margin: '5px 0' }}><strong>Sucursal:</strong> {ordenSeleccionada.sucursal}</p>
              <p style={{ fontSize: '12px', color: '#d1d5db', margin: '5px 0' }}><strong>Observaciones:</strong> {ordenSeleccionada.observaciones || 'Ninguna'}</p>
              
              <div style={{ margin: '15px 0' }}>
                <label style={{ fontSize: '12px', color: '#f59e0b', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ESTATUS DE LA ORDEN</label>
                <select 
                  value={ordenSeleccionada.estatus} 
                  onChange={(e) => cambiarEstatusOrden(ordenSeleccionada, e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1c0f0a', color: '#fff', border: '1px solid #5c3a2a', padding: '8px', borderRadius: '6px', outline: 'none', fontWeight: 'bold' }}
                >
                  <option value="Pendiente ⏳">Pendiente ⏳</option>
                  <option value="En Proceso 🔄">En Proceso 🔄</option>
                  <option value="Aprobado / Despachado ✅">Aprobado / Despachado ✅ (Pasa a CxC)</option>
                  <option value="Cancelado ❌">Cancelado ❌</option>
                </select>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #5c3a2a', paddingTop: '10px', marginBottom: '15px' }}>
                {ordenSeleccionada.items && ordenSeleccionada.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ flex: 1, marginRight: '10px' }}>{it.nombre}</span>
                    <input 
                      type="number" 
                      min="0" 
                      step="any"
                      value={it.cantidad} 
                      onChange={(e) => actualizarCantidadItemOrden(idx, e.target.value)}
                      style={{ width: '55px', textAlign: 'center', backgroundColor: '#1c0f0a', color: '#34d399', border: '1px solid #7c4a32', borderRadius: '4px', padding: '4px', fontWeight: 'bold' }} 
                    />
                    <span style={{ marginLeft: '10px', color: '#34d399', width: '60px', textAlign: 'right', fontWeight: 'bold' }}>
                      ${((parseFloat(it.precio) || 0) * (parseFloat(it.cantidad) || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={guardarCambiosParcialesOrden} style={{ width: '100%', backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginBottom: '10px' }}>
                💾 Guardar Cambios de Despacho Parcial
              </button>

              <div style={{ borderTop: '1px solid #5c3a2a', paddingTop: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}><span>Total USD:</span><span style={{ color: '#34d399' }}>${(parseFloat(ordenSeleccionada.totalUSD) || 0).toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}><span>Total BS:</span><span style={{ color: '#f59e0b' }}>Bs. ${(parseFloat(ordenSeleccionada.totalBS) || 0).toFixed(2)}</span></div>
              </div>

              <button onClick={() => imprimirOrden(ordenSeleccionada)} style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🖨️ Imprimir Nota Ajustada
              </button>
            </div>
          )}
        </div>
      )}

      {/* MÓDULO CUENTAS POR COBRAR (CxC) CON BLOQUEO TRAS GUARDAR */}
      {pestana === 'cxc' && (
        <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', padding: '20px', borderRadius: '12px', border: '1px solid #7c4a32', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>💳 Módulo de Cuentas por Cobrar (CxC) - Sucursales</h3>
          <p style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '20px' }}>
            Las cuentas guardadas como <strong>Pagado Total ✅</strong> se bloquean automáticamente para proteger la auditoría.
          </p>
          
          {listaCxc.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #5c3a2a', borderRadius: '8px', color: '#9ca3af' }}>
              No hay cuentas por cobrar registradas todavía en la nube.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #5c3a2a', color: '#d1d5db' }}>
                    <th style={{ padding: '10px' }}>ID Orden</th>
                    <th style={{ padding: '10px' }}>Sucursal</th>
                    <th style={{ padding: '10px' }}>Fecha</th>
                    <th style={{ padding: '10px' }}>Monto ($)</th>
                    <th style={{ padding: '10px' }}>Monto (Bs)</th>
                    <th style={{ padding: '10px' }}>Estatus de Pago</th>
                    <th style={{ padding: '10px' }}>Acción / Guardar</th>
                  </tr>
                </thead>
                <tbody>
                  {listaCxc.map(cxc => {
                    const esPagadoTotal = cxc.estatus_pago === 'Pagado Total ✅';
                    const estaHabilitadoEdicion = filasEditables[cxc.id];
                    const estaBloqueado = esPagadoTotal && !estaHabilitadoEdicion;

                    return (
                      <tr key={cxc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{cxc.id_orden}</td>
                        <td style={{ padding: '10px', color: '#fff' }}>{cxc.sucursal}</td>
                        <td style={{ padding: '10px', color: '#d1d5db', fontSize: '12px' }}>{cxc.fecha}</td>
                        <td style={{ padding: '10px', color: '#34d399', fontWeight: 'bold' }}>${(parseFloat(cxc.totalUSD) || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px', color: '#f59e0b', fontWeight: 'bold' }}>Bs. ${(parseFloat(cxc.totalBS) || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: esPagadoTotal ? '#34d399' : '#38bdf8' }}>
                          {cxc.estatus_pago}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select 
                              disabled={estaBloqueado}
                              value={estatusCxcTemporal[cxc.id] || cxc.estatus_pago}
                              onChange={(e) => setEstatusCxcTemporal({ ...estatusCxcTemporal, [cxc.id]: e.target.value })}
                              style={{ 
                                backgroundColor: estaBloqueado ? '#0f172a' : '#1c0f0a', 
                                color: estaBloqueado ? '#94a3b8' : '#fff', 
                                border: '1px solid #5c3a2a', 
                                padding: '6px', 
                                borderRadius: '6px', 
                                fontWeight: 'bold', 
                                fontSize: '12px',
                                cursor: estaBloqueado ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <option value="Pendiente 💳">Pendiente 💳</option>
                              <option value="Pagado Parcial 🟡">Pagado Parcial 🟡</option>
                              <option value="Pagado Total ✅">Pagado Total ✅</option>
                            </select>
                            
                            {estaBloqueado ? (
                              <button 
                                onClick={() => habilitarEdicionCxc(cxc.id)}
                                title="Desbloquear para modificar el estatus"
                                style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                              >
                                🔓 Editar
                              </button>
                            ) : (
                              <button 
                                onClick={() => guardarEstatusPagoCxc(cxc.id)}
                                style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                              >
                                💾 Guardar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pestana === 'precios' && (
        <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', padding: '20px', borderRadius: '12px', border: '1px solid #7c4a32', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>Gestión de Artículos / Precios</h3>
          <div style={{ marginBottom: '15px' }}>
            <input type="text" placeholder="🔍 Buscar producto..." value={busqAdmin} onChange={(e) => setBusqAdmin(e.target.value)} style={{ width: '100%', backgroundColor: '#1c0f0a', border: '1px solid #5c3a2a', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #5c3a2a', color: '#d1d5db' }}>
                  <th style={{ padding: '10px' }}>Artículo</th>
                  <th style={{ padding: '10px' }}>Categoría</th>
                  <th style={{ padding: '10px' }}>Unidad</th>
                  <th style={{ padding: '10px' }}>Precio ($)</th>
                  <th style={{ padding: '10px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosAdminFiltrados.map(p => {
                  const esEditando = productoEditandoId === p.id;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: esEditando ? '#2e1911' : 'transparent' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>
                        {esEditando ? (
                          <input type="text" value={datosEdicion.nombre} onChange={(e) => setDatosEdicion({ ...datosEdicion, nombre: e.target.value })} style={{ width: '100%', backgroundColor: '#0a0503', color: '#fff', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px' }} />
                        ) : p.nombre}
                      </td>
                      <td style={{ padding: '10px', color: '#d1d5db' }}>
                        {esEditando ? (
                          <select value={datosEdicion.categoria} onChange={(e) => setDatosEdicion({ ...datosEdicion, categoria: e.target.value })} style={{ backgroundColor: '#0a0503', color: '#fff', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px' }}>
                            {categoriasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : p.categoria}
                      </td>
                      <td style={{ padding: '10px', color: '#38bdf8' }}>
                        {esEditando ? (
                          <select value={datosEdicion.unidad} onChange={(e) => setDatosEdicion({ ...datosEdicion, unidad: e.target.value })} style={{ backgroundColor: '#0a0503', color: '#fff', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px' }}>
                            {unidadesDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        ) : p.unidad}
                      </td>
                      <td style={{ padding: '10px', color: '#34d399', fontWeight: 'bold' }}>
                        {esEditando ? (
                          <input type="number" step="0.01" value={datosEdicion.precio} onChange={(e) => setDatosEdicion({ ...datosEdicion, precio: e.target.value })} style={{ width: '80px', backgroundColor: '#0a0503', color: '#34d399', border: '1px solid #f59e0b', padding: '5px', borderRadius: '4px', fontWeight: 'bold' }} />
                        ) : `$${(parseFloat(p.precio) || 0).toFixed(2)}`}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {esEditando ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => guardarEdicionProducto(p.id)} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Guardar</button>
                            <button onClick={() => setProductoEditandoId(null)} style={{ backgroundColor: '#4a2717', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => iniciarEdicionProducto(p)} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => eliminarArticuloUnico(p.id, p.nombre)} style={{ backgroundColor: '#7f1d1d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestana === 'crear_producto' && (
        <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', padding: '25px', borderRadius: '12px', border: '1px solid #7c4a32', maxWidth: '600px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#38bdf8', margin: '0 0 10px 0' }}>📊 Carga Masiva desde Excel / CSV</h3>
          <div style={{ border: '2px dashed #7c4a32', padding: '25px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#0a0503', marginBottom: '15px' }}>
            <input type="file" accept=".csv, .txt" onChange={handleCargaMasiva} style={{ display: 'none' }} id="excelInput" />
            <label htmlFor="excelInput" style={{ backgroundColor: '#007bff', color: '#fff', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}>
              📁 Cargar Archivo CSV / TXT
            </label>
          </div>
        </div>
      )}

      {pestana === 'seguridad' && (
        <div style={{ backgroundColor: 'rgba(38, 20, 13, 0.95)', padding: '25px', borderRadius: '12px', border: '1px solid #7c4a32', maxWidth: '500px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>🔐 Cambio de Claves de Administradores</h3>
          {msgClave && <div style={{ backgroundColor: '#059669', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontWeight: 'bold' }}>{msgClave}</div>}
          <form onSubmit={handleActualizarClave}>
            <div style={{ marginBottom: '15px' }}>
              <select value={userSeleccionado} onChange={(e) => setUserSeleccionado(e.target.value)} style={{ width: '100%', backgroundColor: '#1c0f0a', border: '1px solid #5c3a2a', padding: '10px', borderRadius: '8px', color: '#fff' }}>
                {listaAdmins.map(a => <option key={a.usuario} value={a.usuario}>{a.usuario}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <input type="password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} placeholder="Nueva contraseña..." style={{ width: '100%', backgroundColor: '#1c0f0a', border: '1px solid #5c3a2a', padding: '10px', borderRadius: '8px', color: '#fff' }} />
            </div>
            <button type="submit" style={{ width: '100%', backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Actualizar</button>
          </form>
        </div>
      )}
    </div>
  );
}

const guardarRequisicionEnNube = async (detallesRequisicion) => {
  try {
    await supabase.from('requisiciones').insert([{ datos: detallesRequisicion }]);
  } catch (err) {
    console.error("Error:", err);
  }
};

function BannerNuevaRequisicion({ nuevaAlertaAdmin, setNuevaAlertaAdmin, modo }) {
  if (!nuevaAlertaAdmin || modo === 'sucursal') return null;

  return (
    <div onClick={() => setNuevaAlertaAdmin(false)} style={{ position: 'fixed', top: '20px', right: '25px', backgroundColor: '#DC2626', color: '#fff', padding: '20px 30px', borderRadius: '16px', fontSize: '18px', fontWeight: 'bold', zIndex: 999999, cursor: 'pointer', boxShadow: '0 15px 35px rgba(220, 38, 38, 0.9)', border: '4px solid #FEF08A' }}>
      🚨 ¡NUEVA REQUISICIÓN ENVIADA DESDE EL SAMBIL! 🚨
    </div>
  );
}
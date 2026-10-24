const handleCargaMasiva = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lineas = text.split(/\r\n|\n/);
        const productosAGuardar = [];

        lineas.forEach((linea, index) => {
          if (!linea.trim() || (index === 0 && linea.toLowerCase().includes('nombre'))) return;
          const cols = linea.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
          
          if (cols.length >= 2) {
            const nombre = cols[0].toUpperCase();
            const precio = parseFloat(cols[1].replace('$', '').replace(',', '.'));
            const categoria = cols[2] || 'Panadería';
            const unidad = cols[3] || 'Bulto';

            if (nombre && !isNaN(precio)) {
              // Buscar si ya existe en el catálogo actual por nombre exacto
              const existente = productosCatalogo.find(p => p.nombre.trim().toUpperCase() === nombre);

              productosAGuardar.push({
                id: existente ? existente.id : ('p-excel-' + Date.now() + '-' + index),
                nombre,
                precio,
                categoria,
                unidad
              });
            }
          }
        });

        if (productosAGuardar.length > 0) {
          // Reemplaza o inserta según corresponda el ID
          await supabase.from('productos').upsert(productosAGuardar);
          await cargarProductosDeSupabase();
          setAlertaAdminMsg(`📊 ¡Se han actualizado/cargado ${productosAGuardar.length} artículos sin duplicar!`);
          setTimeout(() => setAlertaAdminMsg(''), 5000);
        }
      } catch (err) {
        console.error("Error en carga masiva:", err);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };
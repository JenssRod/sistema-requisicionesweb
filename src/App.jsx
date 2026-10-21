if (nuevosProductos.length > 0) {
          // GUARDAR DIRECTAMENTE EN SUPABASE
          const { error } = await supabase.from('productos').upsert(nuevosProductos);
          
          if (error) {
            console.error("Error al subir a Supabase:", error);
            alert("❌ Error al guardar en la base de datos.");
            return;
          }

          // Recargar desde Supabase para actualizar la interfaz
          await cargarProductosDeSupabase();
          
          setAlertaAdminMsg(`📊 ¡Se han cargado ${nuevosProductos.length} artículos a Supabase con éxito!`);
          setTimeout(() => setAlertaAdminMsg(''), 5000);
        }
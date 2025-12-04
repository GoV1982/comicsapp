const { getOne, runQuery, getAll } = require('../config/database');

class Configuracion {
  // Configuración por cliente (favoritos, etc.)
  static async getConfiguracion(clienteId) {
    try {
      const row = await getOne('SELECT * FROM configuracion_cliente WHERE cliente_id = ?', [clienteId]);

      if (!row) {
        const defaultConfig = {
          cliente_id: clienteId,
          notificaciones_email: true,
          notificaciones_push: true,
          notificaciones_whatsapp: false,
          notificaciones_similares: true,
          mostrar_favoritos: true,
          privacidad_perfil: 'publico',
          tema: 'light',
          idioma: 'es'
        };

        await runQuery(
          'INSERT INTO configuracion_cliente (cliente_id, notificaciones_email, notificaciones_push, notificaciones_whatsapp, notificaciones_similares, mostrar_favoritos, privacidad_perfil, tema, idioma) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [clienteId, true, true, false, true, true, 'publico', 'light', 'es']
        );

        return defaultConfig;
      }

      return row;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      throw error;
    }
  }

  static async updateConfiguracion(clienteId, updates) {
    try {
      const fields = Object.keys(updates);
      const values = Object.values(updates).map(val => {
        if (typeof val === 'boolean') return val ? 1 : 0;
        return val;
      });

      if (fields.length === 0) throw new Error('No hay campos para actualizar');

      const setClause = fields.map(field => `${field} = ?`).join(', ');

      await runQuery(
        `UPDATE configuracion_cliente SET ${setClause} WHERE cliente_id = ?`,
        [...values, clienteId]
      );

      return this.getConfiguracion(clienteId);
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  }

  static async addTituloFavorito(clienteId, comicId) {
    try {
      await runQuery(
        'INSERT OR IGNORE INTO titulos_favoritos (cliente_id, comic_id) VALUES (?, ?)',
        [clienteId, comicId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error al agregar título favorito:', error);
      throw error;
    }
  }

  static async removeTituloFavorito(clienteId, comicId) {
    try {
      await runQuery(
        'DELETE FROM titulos_favoritos WHERE cliente_id = ? AND comic_id = ?',
        [clienteId, comicId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error al remover título favorito:', error);
      throw error;
    }
  }

  static async getTitulosFavoritos(clienteId) {
    try {
      return await getAll(
        'SELECT c.* FROM comics c INNER JOIN titulos_favoritos tf ON c.id = tf.comic_id WHERE tf.cliente_id = ? ORDER BY c.titulo',
        [clienteId]
      );
    } catch (error) {
      console.error('Error al obtener títulos favoritos:', error);
      throw error;
    }
  }

  // Configuración global (admin)
  static async getConfiguracionGlobal() {
    try {
      const row = await getOne('SELECT * FROM configuracion_global WHERE id = 1');

      if (!row) {
        const defaultConfig = {
          whatsapp_numero: '5491234567890',
          tienda_nombre: 'Comics Store',
          email_contacto: 'contacto@comicsstore.com',
          moneda: 'ARS',
          zona_horaria: 'America/Argentina/Buenos_Aires'
        };

        await runQuery(
          'INSERT OR IGNORE INTO configuracion_global (id, whatsapp_numero, tienda_nombre, email_contacto, moneda, zona_horaria) VALUES (1, ?, ?, ?, ?, ?)',
          [
            defaultConfig.whatsapp_numero,
            defaultConfig.tienda_nombre,
            defaultConfig.email_contacto,
            defaultConfig.moneda,
            defaultConfig.zona_horaria
          ]
        );
        return { id: 1, ...defaultConfig };
      }

      return row;
    } catch (error) {
      console.error('Error al obtener configuración global:', error);
      throw error;
    }
  }

  static async updateConfiguracionGlobal(updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) throw new Error('No hay campos para actualizar');

    // Map social media fields for DB columns
    const socialMappings = {
      facebook_url: 'facebook',
      instagram_url: 'instagram',
      twitter_url: 'twitter',
      logo_url: 'logo_url'
    };

    const normalFields = [];
    const normalValues = [];
    const socialFields = {};

    Object.entries(updates).forEach(([key, val]) => {
      if (socialMappings[key]) {
        socialFields[socialMappings[key]] = val;
      } else {
        normalFields.push(key);
        normalValues.push(val);
      }
    });

    const setClauseNormal = normalFields.map(field => `${field} = ?`).join(', ');
    const socialFieldClauses = Object.keys(socialFields).map(field => `${field} = ?`);
    const allFieldsToSet = [];
    const allValues = [];

    if (setClauseNormal.length > 0) {
      allFieldsToSet.push(setClauseNormal);
      allValues.push(...normalValues);
    }
    if (socialFieldClauses.length > 0) {
      allFieldsToSet.push(socialFieldClauses.join(', '));
      allValues.push(...Object.values(socialFields));
    }

    if (allFieldsToSet.length === 0) throw new Error('No hay campos para actualizar');

    const finalSetClause = allFieldsToSet.join(', ');

    console.log('DEBUG updateConfiguracionGlobal - finalSetClause:', finalSetClause);
    console.log('DEBUG updateConfiguracionGlobal - allValues:', allValues);

    try {
      await runQuery(
        `UPDATE configuracion_global SET ${finalSetClause} WHERE id = 1`,
        allValues
      );
    } catch (error) {
      console.error('Error SQL during updateConfiguracionGlobal:');
      console.error('SQL:', `UPDATE configuracion_global SET ${finalSetClause} WHERE id = 1`);
      console.error('Values:', allValues);
      console.error(error);
      throw error;
    }

    return module.exports.getConfiguracionGlobal();
  }
}

module.exports = {
  getConfiguracion: Configuracion.getConfiguracion,
  updateConfiguracion: Configuracion.updateConfiguracion,
  addTituloFavorito: Configuracion.addTituloFavorito,
  removeTituloFavorito: Configuracion.removeTituloFavorito,
  getTitulosFavoritos: Configuracion.getTitulosFavoritos,
  getConfiguracionGlobal: Configuracion.getConfiguracionGlobal,
  updateConfiguracionGlobal: Configuracion.updateConfiguracionGlobal
};

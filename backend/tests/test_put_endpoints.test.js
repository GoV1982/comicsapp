const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../server'); // Adjust if your server app entry point differs

chai.use(chaiHttp);

describe('PUT Endpoints API Robustness Tests', () => {
  let authToken = '';  // Assume you have a valid token setup method or mock
  let clienteToken = '';
  before(async () => {
    // Setup: authenticate and get tokens required for protected endpoints here
    // Example (adapt to your auth flow):
    /*
    const res = await chai.request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'adminpass' });
    authToken = res.body.token;

    const resCliente = await chai.request(app)
      .post('/auth-cliente/login')
      .send({ email: 'cliente@example.com', password: 'password' });
    clienteToken = resCliente.body.token;
    */
  });

  describe('PUT /configuracion', () => {
    it('should update client configuration with valid data', async () => {
      const res = await chai.request(app)
        .put('/configuracion')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ notificaciones: true, notificaciones_similares: false, titulos_favoritos: [1, 2] });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
    });

    it('should reject update with invalid data', async () => {
      const res = await chai.request(app)
        .put('/configuracion')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ notificaciones: 'invalid', titulos_favoritos: ['abc'] });
      expect(res).to.have.status(400);
    });

    it('should reject update without authentication', async () => {
      const res = await chai.request(app)
        .put('/configuracion')
        .send({ notificaciones: true });
      expect(res).to.have.status(401);
    });
  });

  describe('PUT /configuracion/global', () => {
    it('should update global configuration with valid data', async () => {
      const res = await chai.request(app)
        .put('/configuracion/global')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tienda_nombre: 'New Shop', email_contacto: 'contact@example.com' });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
    });
  });

  describe('PUT /comics/:id', () => {
    it('should update comic with valid data', async () => {
      // Prepare a valid comic ID before testing, or mock
      const comicId = 1;
      const res = await chai.request(app)
        .put(`/comics/${comicId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titulo: 'Updated Comic Title',
          numero_edicion: '5',
          editorial_id: 1,
          precio: 12.99,
          genero: 'Aventura',
          estado: 'Disponible'
        });
      expect(res).to.have.status(200);
      expect(res.body.message).to.include('actualizado');
    });

    it('should 404 update comic with non-existent id', async () => {
      const res = await chai.request(app)
        .put('/comics/9999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titulo: 'Non existent',
          numero_edicion: '1',
          editorial_id: 1,
          precio: 0,
          genero: 'Otro',
          estado: 'Disponible'
        });
      expect(res).to.have.status(404).or.to.have.status(500);
    });
  });

  describe('PUT /perfil', () => {
    it('should update profile with valid data', async () => {
      const res = await chai.request(app)
        .put('/perfil')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          nombre: 'Test User',
          telefono: '123456789',
          direccion: '123 Test St',
          notas: 'Test notes'
        });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
    });

    it('should reject update profile with no data', async () => {
      const res = await chai.request(app)
        .put('/perfil')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({});
      expect(res).to.have.status(400);
    });
  });

  describe('PUT /clientes/:id', () => {
    it('should update client with valid data', async () => {
      const clientId = 1;
      const res = await chai.request(app)
        .put(`/clientes/${clientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Updated Client',
          email: 'client@example.com',
          telefono: '987654321'
        });
      expect(res).to.have.status(200);
    });
  });

});

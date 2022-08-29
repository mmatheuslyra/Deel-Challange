const request = require('supertest');
const app = require('../src/app');
const { Profile, Contract, Job } = require('../src/model');

describe('Balances', () => {
  describe('/balances/deposit/:userId', () => {
    beforeEach(async () => {
      await Profile.sync({ force: true });
      await Contract.sync({ force: true });
      await Job.sync({ force: true });

      await Promise.all([
        Profile.create({
          id: 1,
          firstName: 'Matheus',
          lastName: 'Silva',
          profession: 'Backend Engineer',
          balance: 1150,
          type: 'client',
        }),
        Profile.create({
          id: 5,
          firstName: 'Michael',
          lastName: 'Jackson',
          profession: 'Musician',
          balance: 150,
          type: 'contractor',
        }),
        Contract.create({
          id: 1,
          terms: 'bla bla bla',
          status: 'in_progress',
          ClientId: 1,
          ContractorId: 5,
        }),
        Job.create({
          id: 1,
          description: 'work 1',
          price: 200,
          ContractId: 1,
          paid: true,
          paymentDate: '2021-08-15T19:11:26.737Z',
        }),
        Job.create({
          id: 2,
          description: 'work 2',
          price: 110,
          ContractId: 1,
          paid: false,
        }),
        Job.create({
          id: 3,
          description: 'work 3',
          price: 300,
          ContractId: 1,
          paid: false,
        }),
      ]);
    });

    it('should return 400 if deposit exceeds the threshold of 0.25 of unpaid jobs sum', async () => {
      const { statusCode, body } = await request(app)
        .post('/balances/deposit/1')
        .send({ amount: 102.6 });

      expect(statusCode).toEqual(400);
      expect(body.error).toEqual('Deposit exceeds the threshold');
    });

    it('should return 404 if client is not found', async () => {
      const { statusCode } = await request(app)
        .post('/balances/deposit/12')
        .send({ amount: 100 });

      expect(statusCode).toEqual(404);
    });

    it('should return 404 if given user is not a client', async () => {
      const { statusCode } = await request(app)
        .post('/balances/deposit/5')
        .send({ amount: 100 });

      expect(statusCode).toEqual(404);
    });
  });
});
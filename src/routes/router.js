const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const { getProfile } = require('../middleware/getProfile');
const { getNonTerminatedUserContracts, getContractById } = require('./contracts');
const { getUserUnpaidJobs, payJob } = require('./jobs');
const { depositMoney } = require('./balances');
const { getBestClients, getBestProfession } = require('./admin');

const router = new Router();

router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

router.get('/contracts/:id',
  getProfile,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.profile.id;

    const contract = await getContractById(id, userId);

    if (!contract) {
      return res.status(404).end();
    }

    res.json(contract);
  })
);

router.get('/contracts',
  getProfile,
  asyncHandler(async (req, res) => {
    const userId = req.profile.id;
    const contracts = await getNonTerminatedUserContracts(userId);

    res.json(contracts);
  })
);

router.get('/jobs/unpaid',
  getProfile,
  asyncHandler(async (req, res) => {
    const userId = req.profile.id;
    const jobs = await getUserUnpaidJobs(userId);

    res.json(jobs);
  })
);

router.post('/jobs/:id/pay',
  getProfile,
  asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    const clientId = req.profile.id;

    const updatedJob = await payJob(jobId, clientId);

    if (!updatedJob) {
      return res.status(404).end();
    }

    res.json(updatedJob);
  })
);

router.post('/balances/deposit/:userId',
  asyncHandler(async (req, res) => {
    const clientId = req.params.userId;
    const { amount } = req.body;

    const profile = await depositMoney(clientId, amount);

    res.json(profile);
  })
);

router.get('/admin/best-profession',
  asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const bestProfession = await getBestProfession(start, end);

    res.json(bestProfession);
  })
);

router.get('/admin/best-clients',
  asyncHandler(async (req, res) => {
    const { start, end, limit } = req.query;
    const bestClients = await getBestClients(start, end, limit);

    res.json(bestClients);
  })
);

module.exports = router;
const { Contract, Job, Profile, sequelize } = require('../model');
const HttpError = require('../httpError');

async function getClientUnpaidJobsSum(clientId) {
  return Job.sum('price', {
    where: {
      paid: false,
    },
    include: [
      {
        model: Contract,
        required: true,
        attributes: [],
        where: {
          status: 'in_progress', // assume that contracts are not terminated if some jobs are unpaid
          ClientId: clientId,
        },
      },
    ],
  });
}

async function depositMoney(clientId, amount) {
  const result = await sequelize.transaction(async (t) => {
    const client = await Profile.findByPk(clientId, { transaction: t });

    if (!client || client.type !== 'client') {
      throw new HttpError(404, 'Client not found')
    }

    const unpaidSum = await getClientUnpaidJobsSum(clientId);
    const depositThreshold = unpaidSum * 0.25;

    if (amount > depositThreshold) {
      throw new HttpError(400, 'Deposit exceeds the threshold');
    }

    // drop floating fractions
    client.balance = parseFloat((client.balance + amount).toFixed(2));

    await client.save({ transaction: t });

    return client;
  });

  return result;
}

module.exports = {
  depositMoney,
};

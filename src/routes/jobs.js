const { Op } = require('sequelize');
const { Contract, Job, Profile, sequelize } = require('../model');
const HttpError = require('../httpError');

async function getUserUnpaidJobs(userId) {
  return Job.findAll({
    where: {
      [Op.or]: [
        {
          paid: null,
        },
        {
          paid: false,
        },
      ],
    },
    include: [
      {
        model: Contract,
        required: true,
        attributes: ['status'],
        where: {
          [Op.or]: [
            {
              ClientId: userId,
            },
            {
              ContractorId: userId,
            },
          ],
          status: 'in_progress',
        },
      },
    ],
  });
}

async function payJob(jobId, clientId) {
  // this is managed Sequelize transaction, will auto commit and rollback in case of error
  const result = await sequelize.transaction(async (t) => {
    const jobWithDetails = await Job.findOne(
      {
        where: {
          id: jobId,
        },
        include: [
          {
            model: Contract,
            required: true,
            attributes: ['ContractorId'],
            where: {
              ClientId: clientId,
            },
          },
        ],
      },
      { transaction: t }
    );

    if (!jobWithDetails) {
      throw new HttpError(404, 'Job not found');
    }

    if (jobWithDetails.paid) {
      throw new HttpError(409, 'Job is already paid');
    }

    const [client, contractor] = await Promise.all([
      Profile.findByPk(clientId, { transaction: t }),
      Profile.findByPk(jobWithDetails.Contract.ContractorId, {
        transaction: t,
      }),
    ]);

    if (client.balance < jobWithDetails.price) {
      throw new HttpError(400, 'Insufficient funds');
    }

    // move the money and mark as paid
    client.balance = client.balance - jobWithDetails.price;
    contractor.balance = contractor.balance + jobWithDetails.price;
    jobWithDetails.paid = true;
    jobWithDetails.paymentDate = new Date().toISOString();

    await Promise.all([
      client.save({ transaction: t }),
      contractor.save({ transaction: t }),
      jobWithDetails.save({ transaction: t }),
    ]);

    return jobWithDetails;
  });

  return result;
}

module.exports = {
  getUserUnpaidJobs,
  payJob,
};

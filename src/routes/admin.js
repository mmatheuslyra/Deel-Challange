const { Op } = require('sequelize');
const { Contract, Job, Profile, sequelize } = require('../model');

async function getBestProfession(startDate, endDate) {
  const jobs = await Job.findAll({
    attributes: [[sequelize.fn('sum', sequelize.col('price')), 'totalPaid']],
    order: [[sequelize.fn('sum', sequelize.col('price')), 'DESC']],
    group: ['Contract.Contractor.profession'],
    limit: 1,
    where: {
      paid: true,
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: Contract,
        attributes: ['createdAt'],
        include: [
          {
            model: Profile,
            as: 'Contractor',
            where: { type: 'contractor' },
            attributes: ['profession'],
          },
        ],
      },
    ],
  });

  if (!jobs.length) {
    return null;
  }

  const result = jobs[0].get({ plain: true });

  return {
    profession: result.Contract.Contractor.profession,
    totalPaid: result.totalPaid,
  };
}

async function getBestClients(startDate, endDate, limit = 2) {
  const results = await Job.findAll({
    attributes: [[sequelize.fn('sum', sequelize.col('price')), 'paid']],
    order: [[sequelize.fn('sum', sequelize.col('price')), 'DESC']],
    group: ['Contract.Client.id'],
    limit,
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: Contract,
        attributes: ['id'],
        include: [
          {
            model: Profile,
            as: 'Client',
            where: { type: 'client' },
            attributes: ['id', 'firstName', 'lastName'],
          },
        ],
      },
    ],
  });

  return results.map((groupedJobs) => ({
    paid: groupedJobs.paid,
    id: groupedJobs.Contract.Client.id,
    fullName: `${groupedJobs.Contract.Client.firstName} ${groupedJobs.Contract.Client.lastName}`,
  }));
}

module.exports = {
  getBestProfession,
  getBestClients,
};
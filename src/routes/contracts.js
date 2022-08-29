const { Op } = require('sequelize');
const { Contract } = require('../model');

async function getContractById(id, userId) {
  return Contract.findOne({
    where: {
      id,
      [Op.or]: [
        {
          ClientId: userId,
        },
        {
          ContractorId: userId,
        },
      ],
    },
  });
}

async function getNonTerminatedUserContracts(userId) {
  return Contract.findAll({
    where: {
      [Op.or]: [
        {
          ClientId: userId,
        },
        {
          ContractorId: userId,
        },
      ],
      status: { [Op.ne]: 'terminated' },
    },
  });
}

module.exports = {
  getNonTerminatedUserContracts,
  getContractById,
};

// backend/middleware/checkAbility.js

const { defineAbilityForUser } = require('../abilities/defineAbility');

const checkAbility = (action, subject) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required for authorization check.' });
  }

  const userAbility = defineAbilityForUser(req.user);

  if (userAbility.can(action, subject)) {
    return next();
  }

  return res.status(403).json({ message: `Forbidden: You are not authorized to ${action} ${subject}.` });
};

module.exports = checkAbility;

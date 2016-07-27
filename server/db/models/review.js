var Sequelize = require('sequelize');

var db = require('../_db');

module.exports = db.define('review', {
  stars: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  content: {
    type: Sequelize.TEXT,
    validate: {len: 20}
  }
},{})

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d' // MongoDB cancellerà automaticamente questo documento dopo 7 giorni
    }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
// in genreModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const genreSchema = new Schema({
    tmdbId: { 
        type: Number, 
        required: true, 
        unique: true 
    },

    name: { 
        type: String, 
        required: true, 
        unique: true 
    }
});

module.exports = mongoose.model('Genre', genreSchema);